import { getMapRuntimeConfig } from './config';
import { buildMapStats } from './normalize';
import { buildSampleMapSnapshot } from './sample-data';
import type { MapConnectionStatus, MapNode, MapSnapshot, MapSnapshotSource, MapStats } from './types';

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

function buildConfiguredMapSnapshot(now = new Date()): MapSnapshot {
  const config = getMapRuntimeConfig();
  const source: MapSnapshotSource = {
    type: 'mqtt',
    label: 'MQTT map data is configured',
    lastUpdated: null,
  };

  const connection: MapConnectionStatus = {
    state: 'configured',
    configured: true,
    sampleData: false,
    historyEnabled: config.historyEnabled,
    topic: config.mqttTopic,
    lastConnectedAt: null,
    lastMessageAt: null,
    message: 'MQTT runtime configuration is present; live ingestion will attach to this contract in the map implementation step.',
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

export async function getMapSnapshot(): Promise<MapSnapshot> {
  const config = getMapRuntimeConfig();

  if (config.sampleData) {
    return buildSampleMapSnapshot();
  }

  if (config.mqttConfigured) {
    return buildConfiguredMapSnapshot();
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
