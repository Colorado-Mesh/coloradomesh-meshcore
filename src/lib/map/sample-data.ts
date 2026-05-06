import type { MapConnectionStatus, MapLink, MapNode, MapRoute, MapSnapshot, MapSnapshotSource } from './types';
import { buildMapStats } from './normalize';

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

export function buildSampleMapSnapshot(now = new Date()): MapSnapshot {
  const source: MapSnapshotSource = {
    type: 'sample',
    label: 'Sample Colorado MeshCore map data',
    lastUpdated: now.toISOString(),
  };

  const connection: MapConnectionStatus = {
    state: 'sample',
    configured: false,
    sampleData: true,
    historyEnabled: false,
    topic: null,
    lastConnectedAt: null,
    lastMessageAt: null,
    message: 'Sample map data is active until MQTT runtime configuration is connected.',
  };

  const nodes: MapNode[] = [
    {
      id: 'cm-denver-gateway',
      publicKey: 'cm-denver-gateway',
      name: 'Colorado Mesh Denver Gateway',
      role: 'gateway',
      coordinates: { latitude: 39.7392, longitude: -104.9903, altitudeMeters: 1609 },
      lastHeardAt: minutesAgo(now, 4),
      status: 'online',
      isOnline: true,
      model: 'RAK4631',
      firmwareVersion: 'MeshCore 1.9',
      battery: { millivolts: 4100, percentage: 89 },
      radio: { frequency: 915, bandwidth: 125, spreadingFactor: 10, power: 22, snr: 7.4, rssi: -91 },
      neighbors: ['cm-golden-repeater', 'cm-boulder-node'],
    },
    {
      id: 'cm-golden-repeater',
      publicKey: 'cm-golden-repeater',
      name: 'Golden Ridge Repeater',
      role: 'repeater',
      coordinates: { latitude: 39.7555, longitude: -105.2211, altitudeMeters: 2042 },
      lastHeardAt: minutesAgo(now, 36),
      status: 'online',
      isOnline: true,
      model: 'Heltec Wireless Tracker',
      firmwareVersion: 'MeshCore 1.9',
      battery: { millivolts: 3980, percentage: 76 },
      radio: { frequency: 915, bandwidth: 125, spreadingFactor: 10, power: 22, snr: 9.2, rssi: -86 },
      neighbors: ['cm-denver-gateway', 'cm-boulder-node', 'cm-castle-rock-mobile'],
    },
    {
      id: 'cm-boulder-node',
      publicKey: 'cm-boulder-node',
      name: 'Boulder Field Node',
      role: 'node',
      coordinates: { latitude: 40.015, longitude: -105.2705, altitudeMeters: 1655 },
      lastHeardAt: minutesAgo(now, 96),
      status: 'stale',
      isOnline: false,
      model: 'T-Beam',
      firmwareVersion: 'MeshCore 1.8',
      battery: { millivolts: 3720, percentage: 47 },
      radio: { frequency: 915, bandwidth: 125, spreadingFactor: 11, power: 20, snr: 3.1, rssi: -103 },
      neighbors: ['cm-golden-repeater'],
    },
    {
      id: 'cm-castle-rock-mobile',
      publicKey: 'cm-castle-rock-mobile',
      name: 'Castle Rock Mobile',
      role: 'companion',
      coordinates: { latitude: 39.3722, longitude: -104.8561, altitudeMeters: 1897 },
      lastHeardAt: minutesAgo(now, 1500),
      status: 'offline',
      isOnline: false,
      model: 'Station G2',
      firmwareVersion: 'MeshCore 1.8',
      battery: { millivolts: 3410, percentage: 12 },
      radio: { frequency: 915, bandwidth: 125, spreadingFactor: 12, power: 20, snr: -1.8, rssi: -116 },
      neighbors: [],
    },
  ];

  const links: MapLink[] = [
    {
      id: 'cm-denver-gateway--cm-golden-repeater',
      source: 'cm-denver-gateway',
      target: 'cm-golden-repeater',
      quality: 0.91,
      hopCount: 1,
      lastHeardAt: minutesAgo(now, 4),
    },
    {
      id: 'cm-golden-repeater--cm-boulder-node',
      source: 'cm-golden-repeater',
      target: 'cm-boulder-node',
      quality: 0.72,
      hopCount: 1,
      lastHeardAt: minutesAgo(now, 96),
    },
  ];

  const routes: MapRoute[] = [
    {
      id: 'cm-boulder-node--cm-denver-gateway',
      source: 'cm-boulder-node',
      destination: 'cm-denver-gateway',
      path: ['cm-boulder-node', 'cm-golden-repeater', 'cm-denver-gateway'],
      hopCount: 2,
      lastHeardAt: minutesAgo(now, 96),
    },
  ];

  const stats = buildMapStats(nodes, links, routes, source, connection.state);

  return {
    generatedAt: now.toISOString(),
    nodes,
    links,
    routes,
    stats,
    connection,
    source,
  };
}
