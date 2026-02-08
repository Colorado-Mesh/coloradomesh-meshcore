/**
 * TypeScript types for MeshCore MQTT packets
 */

/**
 * Raw MQTT packet from MeshCore observer
 * Based on the meshcoretomqtt format
 */
export interface MqttPacket {
  origin: string; // Original sender node name
  origin_id?: string; // Public key of the origin node
  observer?: string; // Observer/repeater name that reported this packet
  observer_id?: string; // Public key of the observer node
  timestamp: string; // ISO timestamp
  type: string; // PACKET, STATUS, etc.
  direction?: 'rx' | 'tx';
  time?: string;
  date?: string;
  len?: string; // Packet length in bytes
  packet_type?: string; // Numeric packet type
  route?: string; // D (direct) or F (flood)
  payload_len?: string;
  raw?: string; // Raw hex data
  SNR?: string; // Signal-to-noise ratio
  RSSI?: string; // Signal strength in dBm
  score?: string; // Packet score
  duration?: string; // Duration in ms
  hash?: string; // Unique packet identifier
  path?: string; // Route through mesh (e.g., "C2 -> E2")
}

/**
 * Status message from observer/repeater
 */
export interface MqttStatus {
  status: 'online' | 'offline';
  origin: string;
  origin_id: string; // Public key
  timestamp?: string;
  radio?: string; // "frequency,bandwidth,sf,power" e.g., "910.5250244,62.5,7,5"
  model?: string; // Hardware model e.g., "Heltec V3"
  firmware_version?: string; // e.g., "1.11.0-letsmesh.net-6d32193"
  client_version?: string; // e.g., "meshcoretomqtt/1.0.6.4"
  stats?: {
    battery_mv: number;
    uptime_secs: number;
    errors?: number;
    debug_flags?: number;
    queue_len: number;
    noise_floor: number;
    tx_air_secs: number;
    rx_air_secs: number;
    recv_errors?: number;
  };
}

/**
 * Parsed packet ready for database storage
 */
export interface ParsedPacket {
  nodeId: string | null;
  packetType: string | null;
  rawData: string;
  snr: number | null;
  rssi: number | null;
  hopCount: number | null;
  originKey: string | null;
  timestamp: string;
  // New fields
  score: number | null;
  duration: number | null;
  route: string | null;
  len: number | null;
  payloadLen: number | null;
  direction: 'rx' | 'tx' | null;
}

/**
 * Node data for upsert
 */
export interface NodeData {
  id: string;
  publicKey: string;
  name: string | null;
  nodeType: 'node' | 'companion' | 'repeater' | 'room_server' | 'router' | 'gateway';
  lastSeen: string;
  // Location fields from meshcore-bot API
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  // Hardware fields from status messages
  model?: string | null;
  hardwareVersion?: string | null;
  radioConfig?: string | null;
  clientVersion?: string | null;
}

/**
 * Contact data from meshcore-bot API
 */
export interface MeshcoreBotContact {
  user_id: string;
  username: string;
  role: string;
  device_type: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  last_seen: string;
  first_heard: string;
  advert_count: number;
  hop_count: number | null;
  snr: number | null;
  signal_strength: number | null;
}

/**
 * Node status update from STATUS messages
 */
export interface NodeStatusUpdate {
  nodeId: string;
  batteryMv: number | null;
  noiseFloor: number | null;
  uptimeSecs: number | null;
  errorCount: number | null;
  queueLen: number | null;
  txAirSecs: number | null;
  rxAirSecs: number | null;
}

/**
 * MQTT connection configuration
 */
export interface MqttConfig {
  brokerUrl: string;
  port: number;
  username: string;
  password: string;
  clientId: string;
}

/**
 * Environment variables required by the collector
 */
export interface EnvConfig {
  mqtt: MqttConfig;
  turso: {
    databaseUrl: string;
    authToken: string;
  };
}
