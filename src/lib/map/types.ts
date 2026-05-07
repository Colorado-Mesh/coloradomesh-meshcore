export type MapNodeRole =
  | 'node'
  | 'companion'
  | 'repeater'
  | 'room_server'
  | 'router'
  | 'gateway'
  | 'unknown';

export type MapNodeStatus = 'online' | 'stale' | 'offline' | 'unknown';

export type MapConnectionState =
  | 'sample'
  | 'not_configured'
  | 'configured'
  | 'connected'
  | 'disconnected'
  | 'error';

export type MapSnapshotSourceType = 'sample' | 'empty' | 'mqtt' | 'live_map_api';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  altitudeMeters?: number | null;
}

export interface MapBattery {
  millivolts?: number | null;
  percentage?: number | null;
}

export interface MapRadioMetrics {
  frequency?: number | null;
  bandwidth?: number | null;
  spreadingFactor?: number | null;
  power?: number | null;
  noiseFloor?: number | null;
  snr?: number | null;
  rssi?: number | null;
}

export interface MapNode {
  id: string;
  publicKey: string;
  name: string;
  role: MapNodeRole;
  coordinates: MapCoordinates | null;
  lastHeardAt: string | null;
  status: MapNodeStatus;
  isOnline: boolean;
  model?: string | null;
  firmwareVersion?: string | null;
  hardwareVersion?: string | null;
  clientVersion?: string | null;
  battery?: MapBattery | null;
  radio?: MapRadioMetrics | null;
  uptimeSeconds?: number | null;
  route?: string[];
  neighbors?: string[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface MapLink {
  id: string;
  source: string;
  target: string;
  quality?: number | null;
  hopCount?: number | null;
  lastHeardAt?: string | null;
}

export interface MapRoute {
  id: string;
  source: string;
  destination: string;
  path: string[];
  hopCount: number;
  lastHeardAt?: string | null;
}

export interface MapSnapshotSource {
  type: MapSnapshotSourceType;
  label: string;
  lastUpdated: string | null;
}

export interface MapConnectionStatus {
  state: MapConnectionState;
  configured: boolean;
  sampleData: boolean;
  historyEnabled: boolean;
  topic: string | null;
  lastConnectedAt: string | null;
  lastMessageAt: string | null;
  message: string;
}

export interface MapStats {
  totalNodes: number;
  onlineNodes: number;
  visibleNodes: number;
  locatedNodes: number;
  repeaterNodes: number;
  staleNodes: number;
  offlineNodes: number;
  linkCount: number;
  routeCount: number;
  averageBatteryPercent: number | null;
  lastUpdated: string | null;
  source: MapSnapshotSource;
  connectionState: MapConnectionState;
}

export interface MapSnapshot {
  generatedAt: string;
  nodes: MapNode[];
  links: MapLink[];
  routes: MapRoute[];
  stats: MapStats;
  connection: MapConnectionStatus;
  source: MapSnapshotSource;
}
