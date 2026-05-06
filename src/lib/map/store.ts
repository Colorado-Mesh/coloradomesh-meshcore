import mqtt, { type MqttClient } from 'mqtt';
import { getMapRuntimeConfig, type MapRuntimeConfig } from './config';
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
    label: 'MQTT map data is not configured',
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
    message: 'Set MQTT runtime environment variables to enable live map data.',
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
  };
}

function mqttConfigKey(config: MapRuntimeConfig): string {
  return [config.mqttUrl, config.mqttUsername, config.mqttPassword, config.mqttTopic, config.mqttClientId].join('|');
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
  if (record.data && typeof record.data === 'object') return readRecordArray(record.data);

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

function applyMqttPayload(payload: unknown) {
  const now = new Date();
  const nodes = uniqueMapNodes(
    readPayloadNodes(payload)
      .map((entry) => normalizeLiveMapNode(entry, now))
      .filter((node): node is MapNode => node !== null)
  );

  if (isFullSnapshotPayload(payload)) {
    mqttState.nodes = nodes;
  } else if (nodes.length > 0) {
    mergeMqttNodes(nodes);
  }

  if (hasPayloadKey(payload, 'links')) mqttState.links = readLinks(payload, 'links') as MapLink[];
  if (hasPayloadKey(payload, 'routes')) mqttState.routes = readLinks(payload, 'routes') as MapRoute[];
  mqttState.lastMessageAt = now.toISOString();
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
  };
}

export async function getMapSnapshot(): Promise<MapSnapshot> {
  const config = getMapRuntimeConfig();

  if (config.sampleData) {
    return buildSampleMapSnapshot();
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
