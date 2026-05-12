import mqtt, { type MqttClient } from 'mqtt';
import { fetchLiveMapJson, normalizeLiveMapSourceUrl } from '@/lib/live-map/client';
import { getMapFeatures, getMapRuntimeConfig, getMapWarnings, type MapRuntimeConfig } from './config';
import { buildMapStats, normalizeLiveMapNode, uniqueMapNodes } from './normalize';
import { buildSampleMapSnapshot } from './sample-data';
import type {
  MapConnectionStatus,
  MapLink,
  MapNode,
  MapRoute,
  MapSnapshot,
  MapSnapshotSource,
  MapStats,
} from './types';

interface LiveMapApiSnapshotState {
  configKey: string | null;
  lastFetchedAt: string | null;
  lastError: string | null;
  nodes: MapNode[];
  links: MapLink[];
  routes: MapRoute[];
}

interface MqttSnapshotState {
  client: MqttClient | null;
  configKey: string | null;
  connected: boolean;
  connecting: boolean;
  lastConnectedAt: string | null;
  lastMessageAt: string | null;
  lastError: string | null;
  nodes: MapNode[];
  links: MapLink[];
  routes: MapRoute[];
}

const liveMapApiState: LiveMapApiSnapshotState = {
  configKey: null,
  lastFetchedAt: null,
  lastError: null,
  nodes: [],
  links: [],
  routes: [],
};

const mqttState: MqttSnapshotState = {
  client: null,
  configKey: null,
  connected: false,
  connecting: false,
  lastConnectedAt: null,
  lastMessageAt: null,
  lastError: null,
  nodes: [],
  links: [],
  routes: [],
};

function buildEmptyMapSnapshot(now = new Date()): MapSnapshot {
  const source: MapSnapshotSource = {
    type: 'empty',
    label: 'Live map data is not configured',
    lastUpdated: null,
  };

  const connection: MapConnectionStatus = {
    state: 'not_configured',
    configured: false,
    sampleData: false,
    historyEnabled: false,
    topic: null,
    lastConnectedAt: null,
    lastMessageAt: null,
    message: 'Set MESHCORE_LIVE_MAP_API_URL or MESHCORE_MQTT_URL to enable live map data.',
  };

  const stats = buildMapStats([], [], [], source, connection.state);

  return {
    generatedAt: now.toISOString(),
    nodes: [],
    links: [],
    routes: [],
    stats,
    connection,
    source,
    warnings: getMapWarnings({ sampleData: false, demoMode: false }),
    features: getMapFeatures({ liveMapApiConfigured: false, liveMapApiUrl: null }),
  };
}

function liveMapApiConfigKey(config: MapRuntimeConfig): string {
  return [config.liveMapApiUrl, config.liveMapApiToken].join('|');
}

function mqttConfigKey(config: MapRuntimeConfig): string {
  return [config.mqttUrl, config.mqttUsername, config.mqttPassword, config.mqttTopic, config.mqttClientId].join('|');
}

function resetLiveMapApiState() {
  liveMapApiState.lastFetchedAt = null;
  liveMapApiState.lastError = null;
  liveMapApiState.nodes = [];
  liveMapApiState.links = [];
  liveMapApiState.routes = [];
}

function resetMqttState() {
  mqttState.connected = false;
  mqttState.connecting = false;
  mqttState.lastConnectedAt = null;
  mqttState.lastMessageAt = null;
  mqttState.lastError = null;
  mqttState.nodes = [];
  mqttState.links = [];
  mqttState.routes = [];
}

function readRecordArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>);
  }

  return [];
}

function readPayloadNodes(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.nodes)) return record.nodes;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.nodeList)) return record.nodeList;
  if (record.nodes && typeof record.nodes === 'object') return readRecordArray(record.nodes);
  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    if (Array.isArray(data.nodes)) return data.nodes;
    if (data.nodes && typeof data.nodes === 'object') return readRecordArray(data.nodes);
    return readRecordArray(data);
  }

  return [payload];
}

function isFullSnapshotPayload(payload: unknown): boolean {
  if (Array.isArray(payload)) return true;
  if (!payload || typeof payload !== 'object') return false;

  const record = payload as Record<string, unknown>;
  return Boolean(record.nodes || record.nodeList || Array.isArray(record.data) || record.links || record.routes);
}

function hasPayloadKey(payload: unknown, key: 'links' | 'routes'): boolean {
  return Boolean(payload && typeof payload === 'object' && key in payload);
}

function readLinks(payload: unknown, key: 'links' | 'routes'): MapLink[] | MapRoute[] {
  if (!payload || typeof payload !== 'object') return [];
  const value = (payload as Record<string, unknown>)[key];
  return readRecordArray(value) as MapLink[] | MapRoute[];
}

function mergeMqttNodes(nodes: MapNode[]) {
  const merged = new Map<string, MapNode>();

  for (const node of mqttState.nodes) {
    merged.set(node.publicKey || node.id, node);
  }

  for (const node of nodes) {
    merged.set(node.publicKey || node.id, node);
  }

  mqttState.nodes = uniqueMapNodes(Array.from(merged.values()));
}

function normalizePayloadNodes(payload: unknown, now = new Date()): MapNode[] {
  return uniqueMapNodes(
    readPayloadNodes(payload)
      .map((entry) => normalizeLiveMapNode(entry, now))
      .filter((node): node is MapNode => node !== null)
  );
}

function applyMqttPayload(payload: unknown) {
  const now = new Date();
  const nodes = normalizePayloadNodes(payload, now);

  if (isFullSnapshotPayload(payload)) {
    mqttState.nodes = nodes;
  } else if (nodes.length > 0) {
    mergeMqttNodes(nodes);
  }

  if (hasPayloadKey(payload, 'links')) mqttState.links = readLinks(payload, 'links') as MapLink[];
  if (hasPayloadKey(payload, 'routes')) mqttState.routes = readLinks(payload, 'routes') as MapRoute[];
  mqttState.lastMessageAt = now.toISOString();
}

function buildLiveMapApiUrl(config: MapRuntimeConfig): URL | null {
  if (!config.liveMapApiUrl) return null;

  const endpoint = normalizeLiveMapSourceUrl(config.liveMapApiUrl);
  if (!endpoint) return null;

  endpoint.searchParams.set('mode', 'full');
  return endpoint;
}

function buildLiveMapApiHeaders(config: MapRuntimeConfig): HeadersInit {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (config.liveMapApiToken) headers.authorization = `Bearer ${config.liveMapApiToken}`;
  return headers;
}

async function refreshLiveMapApiSnapshot(config: MapRuntimeConfig, now = new Date()) {
  if (!config.liveMapApiUrl) return;

  const configKey = liveMapApiConfigKey(config);
  if (liveMapApiState.configKey !== configKey) {
    resetLiveMapApiState();
    liveMapApiState.configKey = configKey;
  }

  if (liveMapApiState.lastFetchedAt) {
    const lastFetched = Date.parse(liveMapApiState.lastFetchedAt);
    const refreshMs = config.liveMapApiRefreshSeconds * 1000;
    if (!Number.isNaN(lastFetched) && now.getTime() - lastFetched < refreshMs) return;
  }

  const url = buildLiveMapApiUrl(config);
  if (!url) {
    liveMapApiState.lastFetchedAt = now.toISOString();
    liveMapApiState.lastError = 'Unable to fetch live map API data';
    return;
  }

  try {
    const result = await fetchLiveMapJson(url, buildLiveMapApiHeaders(config));
    if (!result.ok) throw new Error(result.error);

    const payload = result.data;
    liveMapApiState.nodes = normalizePayloadNodes(payload, now);
    liveMapApiState.links = hasPayloadKey(payload, 'links') ? readLinks(payload, 'links') as MapLink[] : [];
    liveMapApiState.routes = hasPayloadKey(payload, 'routes') ? readLinks(payload, 'routes') as MapRoute[] : [];
    liveMapApiState.lastFetchedAt = now.toISOString();
    liveMapApiState.lastError = null;
  } catch {
    liveMapApiState.lastFetchedAt = now.toISOString();
    liveMapApiState.lastError = 'Unable to fetch live map API data';
  }
}

async function buildLiveMapApiSnapshot(config: MapRuntimeConfig, now = new Date()): Promise<MapSnapshot> {
  await refreshLiveMapApiSnapshot(config, now);

  const source: MapSnapshotSource = {
    type: 'live_map_api',
    label: liveMapApiState.nodes.length ? 'meshcore-mqtt-live-map API data' : 'Awaiting meshcore-mqtt-live-map API data',
    lastUpdated: liveMapApiState.lastFetchedAt,
  };

  const state = liveMapApiState.lastError ? 'error' : 'connected';
  const message = liveMapApiState.lastError
    ? `Live map API error: ${liveMapApiState.lastError}`
    : liveMapApiState.nodes.length
      ? 'Live map API data is active.'
      : 'Connected to the live map API and waiting for nodes.';

  const connection: MapConnectionStatus = {
    state,
    configured: true,
    sampleData: false,
    historyEnabled: config.historyEnabled,
    topic: null,
    lastConnectedAt: liveMapApiState.lastFetchedAt,
    lastMessageAt: liveMapApiState.lastFetchedAt,
    message,
  };

  const nodes = uniqueMapNodes(liveMapApiState.nodes);
  const stats = buildMapStats(nodes, liveMapApiState.links, liveMapApiState.routes, source, connection.state);

  return {
    generatedAt: now.toISOString(),
    nodes,
    links: liveMapApiState.links,
    routes: liveMapApiState.routes,
    stats,
    connection,
    source,
    warnings: getMapWarnings(config),
    features: getMapFeatures(config),
  };
}

function ensureMqttClient(config: MapRuntimeConfig) {
  if (!config.mqttUrl) return;

  const configKey = mqttConfigKey(config);
  if (mqttState.client && mqttState.configKey === configKey) return;

  if (mqttState.client) {
    mqttState.client.end(true);
    mqttState.client = null;
  }

  resetMqttState();
  mqttState.configKey = configKey;
  mqttState.connecting = true;

  const client = mqtt.connect(config.mqttUrl, {
    username: config.mqttUsername ?? undefined,
    password: config.mqttPassword ?? undefined,
    clientId: config.mqttClientId,
    clean: true,
    reconnectPeriod: 10_000,
    connectTimeout: 15_000,
  });

  mqttState.client = client;

  client.on('connect', () => {
    mqttState.connected = true;
    mqttState.connecting = false;
    mqttState.lastConnectedAt = new Date().toISOString();
    mqttState.lastError = null;
    client.subscribe(config.mqttTopic, (error) => {
      if (error) mqttState.lastError = error.message;
    });
  });

  client.on('reconnect', () => {
    mqttState.connecting = true;
  });

  client.on('close', () => {
    mqttState.connected = false;
    mqttState.connecting = false;
  });

  client.on('error', (error) => {
    mqttState.lastError = error.message;
    mqttState.connecting = false;
  });

  client.on('message', (_topic, payload) => {
    try {
      applyMqttPayload(JSON.parse(payload.toString('utf8')));
      mqttState.lastError = null;
    } catch (error) {
      mqttState.lastError = error instanceof Error ? error.message : 'Unable to parse MQTT map payload';
    }
  });
}

function buildMqttMapSnapshot(config: MapRuntimeConfig, now = new Date()): MapSnapshot {
  ensureMqttClient(config);

  const source: MapSnapshotSource = {
    type: 'mqtt',
    label: mqttState.lastMessageAt ? 'Live MQTT map data' : 'Awaiting live MQTT map data',
    lastUpdated: mqttState.lastMessageAt,
  };

  const state = mqttState.lastError
    ? 'error'
    : mqttState.connected
      ? 'connected'
      : mqttState.connecting
        ? 'configured'
        : 'disconnected';

  const message = mqttState.lastError
    ? `MQTT map error: ${mqttState.lastError}`
    : mqttState.lastMessageAt
      ? 'Live MQTT map data is active.'
      : mqttState.connected
        ? 'Connected to MQTT and waiting for map messages.'
        : 'Connecting to configured MQTT map broker.';

  const connection: MapConnectionStatus = {
    state,
    configured: true,
    sampleData: false,
    historyEnabled: config.historyEnabled,
    topic: config.mqttTopic,
    lastConnectedAt: mqttState.lastConnectedAt,
    lastMessageAt: mqttState.lastMessageAt,
    message,
  };

  const nodes = uniqueMapNodes(mqttState.nodes);
  const stats = buildMapStats(nodes, mqttState.links, mqttState.routes, source, connection.state);

  return {
    generatedAt: now.toISOString(),
    nodes,
    links: mqttState.links,
    routes: mqttState.routes,
    stats,
    connection,
    source,
    warnings: getMapWarnings(config),
    features: getMapFeatures(config),
  };
}

export async function getMapSnapshot(): Promise<MapSnapshot> {
  const config = getMapRuntimeConfig();

  if (config.sampleData) {
    return buildSampleMapSnapshot();
  }

  if (config.liveMapApiConfigured) {
    return buildLiveMapApiSnapshot(config);
  }

  if (config.mqttConfigured) {
    return buildMqttMapSnapshot(config);
  }

  return buildEmptyMapSnapshot();
}

export async function getMapNodes(): Promise<MapNode[]> {
  const snapshot = await getMapSnapshot();
  return snapshot.nodes;
}

export async function getMapStats(): Promise<MapStats> {
  const snapshot = await getMapSnapshot();
  return snapshot.stats;
}
