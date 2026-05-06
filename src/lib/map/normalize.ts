import {
  MAP_VISIBILITY_THRESHOLD_MS,
  ONLINE_THRESHOLD_MS,
  REPEATER_ONLINE_THRESHOLD_MS,
} from '@/lib/constants';
import type { NodeWithStats } from '@/lib/types';
import type {
  MapCoordinates,
  MapLink,
  MapNode,
  MapNodeRole,
  MapNodeStatus,
  MapRoute,
  MapSnapshotSource,
  MapStats,
  MapConnectionState,
} from './types';

const ROLE_ALIASES: Record<string, MapNodeRole> = {
  node: 'node',
  client: 'node',
  companion: 'companion',
  repeater: 'repeater',
  room: 'room_server',
  room_server: 'room_server',
  roomserver: 'room_server',
  router: 'router',
  gateway: 'gateway',
};

type LiveMapPayload = Record<string, unknown>;

function isObject(value: unknown): value is LiveMapPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(payload: LiveMapPayload, keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return null;
}

function readNumber(payload: LiveMapPayload, keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function readStringArray(payload: LiveMapPayload, keys: string[]): string[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
        .map(String)
        .filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value.split(/[>,\s]+/).map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
}

export function normalizeMapNodeRole(value: unknown): MapNodeRole {
  if (typeof value !== 'string') return 'unknown';
  return ROLE_ALIASES[value.trim().toLowerCase()] ?? 'unknown';
}

function timestampToIso(timestamp: number): string | null {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeTimestamp(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const timestamp = value > 10_000_000_000 ? value : value * 1000;
    return timestampToIso(timestamp);
  }

  if (typeof value !== 'string' || !value.trim()) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestampToIso(timestamp);
}

export function normalizeCoordinates(
  latitude: unknown,
  longitude: unknown,
  altitudeMeters?: unknown
): MapCoordinates | null {
  const lat = typeof latitude === 'string' ? Number(latitude) : latitude;
  const lon = typeof longitude === 'string' ? Number(longitude) : longitude;

  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  const altitude = typeof altitudeMeters === 'string' ? Number(altitudeMeters) : altitudeMeters;

  return {
    latitude: lat,
    longitude: lon,
    altitudeMeters: typeof altitude === 'number' && Number.isFinite(altitude) ? altitude : null,
  };
}

export function deriveMapNodeStatus(
  lastHeardAt: string | null,
  role: MapNodeRole,
  now = new Date()
): MapNodeStatus {
  if (!lastHeardAt) return 'unknown';

  const timestamp = Date.parse(lastHeardAt);
  if (Number.isNaN(timestamp)) return 'unknown';

  const ageMs = now.getTime() - timestamp;
  const onlineThreshold = role === 'repeater' ? REPEATER_ONLINE_THRESHOLD_MS : ONLINE_THRESHOLD_MS;

  if (ageMs <= onlineThreshold) return 'online';
  if (ageMs <= MAP_VISIBILITY_THRESHOLD_MS) return 'stale';

  return 'offline';
}

function batteryPercentageFromMillivolts(millivolts: number | null): number | null {
  if (millivolts === null) return null;

  const percentage = ((millivolts - 3300) / (4200 - 3300)) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

export function normalizeLegacyNode(node: NodeWithStats, now = new Date()): MapNode {
  const role = normalizeMapNodeRole(node.node_type);
  const lastHeardAt = normalizeTimestamp(node.last_seen);
  const status = node.is_online ? 'online' : deriveMapNodeStatus(lastHeardAt, role, now);

  return {
    id: node.id,
    publicKey: node.public_key,
    name: node.name || node.id,
    role,
    coordinates: normalizeCoordinates(node.latitude, node.longitude),
    lastHeardAt,
    status,
    isOnline: status === 'online',
    model: node.model,
    firmwareVersion: node.firmware_version,
    hardwareVersion: node.hardware_version,
    clientVersion: node.client_version,
    battery: node.battery_mv === null ? null : {
      millivolts: node.battery_mv,
      percentage: batteryPercentageFromMillivolts(node.battery_mv),
    },
    radio: {
      noiseFloor: node.noise_floor,
    },
    uptimeSeconds: node.uptime_secs,
    metadata: {
      packetsToday: node.packets_today,
      packetsTotal: node.packets_total,
      errorCount: node.error_count,
      queueLength: node.queue_len,
      txAirSeconds: node.tx_air_secs,
      rxAirSeconds: node.rx_air_secs,
    },
  };
}

export function normalizeLiveMapNode(input: unknown, now = new Date()): MapNode | null {
  if (!isObject(input)) return null;

  const publicKey = readString(input, ['publicKey', 'public_key', 'pubkey', 'id', 'node_id']);
  if (!publicKey) return null;

  const id = readString(input, ['id', 'nodeId', 'node_id']) ?? publicKey;
  const role = normalizeMapNodeRole(readString(input, ['role', 'type', 'nodeType', 'node_type', 'mode']));
  const lastHeardAt = normalizeTimestamp(
    input.lastHeardAt ?? input.last_heard_at ?? input.lastSeen ?? input.last_seen ?? input.updatedAt ?? input.timestamp
  );
  const status = deriveMapNodeStatus(lastHeardAt, role, now);
  const batteryMv = readNumber(input, ['batteryMv', 'battery_mv', 'batteryMillivolts']);
  const batteryPercent = readNumber(input, ['batteryPercent', 'battery_percentage', 'battery']);

  return {
    id,
    publicKey,
    name: readString(input, ['name', 'shortName', 'short_name', 'callsign']) ?? id,
    role,
    coordinates: normalizeCoordinates(
      readNumber(input, ['latitude', 'lat']),
      readNumber(input, ['longitude', 'lon', 'lng']),
      readNumber(input, ['altitudeMeters', 'altitude_meters', 'altitude'])
    ),
    lastHeardAt,
    status,
    isOnline: status === 'online',
    model: readString(input, ['model', 'hardwareModel', 'hardware_model']),
    firmwareVersion: readString(input, ['firmwareVersion', 'firmware_version']),
    hardwareVersion: readString(input, ['hardwareVersion', 'hardware_version']),
    clientVersion: readString(input, ['clientVersion', 'client_version']),
    battery: batteryMv === null && batteryPercent === null ? null : {
      millivolts: batteryMv,
      percentage: batteryPercent ?? batteryPercentageFromMillivolts(batteryMv),
    },
    radio: {
      frequency: readNumber(input, ['frequency']),
      bandwidth: readNumber(input, ['bandwidth']),
      spreadingFactor: readNumber(input, ['spreadingFactor', 'spreading_factor', 'sf']),
      power: readNumber(input, ['power', 'txPower', 'tx_power']),
      noiseFloor: readNumber(input, ['noiseFloor', 'noise_floor']),
      snr: readNumber(input, ['snr']),
      rssi: readNumber(input, ['rssi']),
    },
    uptimeSeconds: readNumber(input, ['uptimeSeconds', 'uptime_secs', 'uptime']),
    route: readStringArray(input, ['route', 'path']),
    neighbors: readStringArray(input, ['neighbors', 'peers']),
  };
}

export function uniqueMapNodes(nodes: MapNode[]): MapNode[] {
  const byId = new Map<string, MapNode>();

  for (const node of nodes) {
    const key = node.publicKey || node.id;
    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, node);
      continue;
    }

    const existingTime = existing.lastHeardAt ? Date.parse(existing.lastHeardAt) : 0;
    const nextTime = node.lastHeardAt ? Date.parse(node.lastHeardAt) : 0;
    if (nextTime >= existingTime) byId.set(key, node);
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildMapStats(
  nodes: MapNode[],
  links: MapLink[],
  routes: MapRoute[],
  source: MapSnapshotSource,
  connectionState: MapConnectionState
): MapStats {
  const batteryValues = nodes
    .map((node) => node.battery?.percentage)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  return {
    totalNodes: nodes.length,
    onlineNodes: nodes.filter((node) => node.status === 'online').length,
    visibleNodes: nodes.filter((node) => node.coordinates !== null && node.status !== 'offline').length,
    locatedNodes: nodes.filter((node) => node.coordinates !== null).length,
    repeaterNodes: nodes.filter((node) => node.role === 'repeater').length,
    staleNodes: nodes.filter((node) => node.status === 'stale').length,
    offlineNodes: nodes.filter((node) => node.status === 'offline').length,
    linkCount: links.length,
    routeCount: routes.length,
    averageBatteryPercent: batteryValues.length
      ? Math.round(batteryValues.reduce((sum, value) => sum + value, 0) / batteryValues.length)
      : null,
    lastUpdated: source.lastUpdated,
    source,
    connectionState,
  };
}
