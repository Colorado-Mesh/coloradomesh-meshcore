export type {
  MapBattery,
  MapConnectionState,
  MapConnectionStatus,
  MapCoordinates,
  MapLink,
  MapNode,
  MapNodeRole,
  MapNodeStatus,
  MapRadioMetrics,
  MapRoute,
  MapSnapshot,
  MapSnapshotSource,
  MapSnapshotSourceType,
  MapStats,
} from './map';

/**
 * TypeScript types for Colorado MeshCore Community Platform
 * These legacy types align with the Turso database schema.
 */

// =============================================================================
// Database Models
// =============================================================================

/**
 * Represents a MeshCore node in the network
 */
export interface Node {
  id: string;
  public_key: string;
  name: string | null;
  owner_discord_id: string | null;
  latitude: number | null;
  longitude: number | null;
  node_type: 'node' | 'companion' | 'repeater' | 'room_server' | 'router' | 'gateway';
  firmware_version: string | null;
  created_at: string;
  last_seen: string | null;
  // Hardware info from status messages
  model: string | null;
  hardware_version: string | null;
  radio_config: string | null;
  client_version: string | null;
  // Live status metrics
  battery_mv: number | null;
  noise_floor: number | null;
  uptime_secs: number | null;
  error_count: number | null;
  queue_len: number | null;
  tx_air_secs: number | null;
  rx_air_secs: number | null;
}

/**
 * Represents a packet transmitted through the mesh network
 */
export interface Packet {
  id: number;
  node_id: string | null;
  packet_type: string | null;
  raw_data: string | null;
  snr: number | null;
  rssi: number | null;
  hop_count: number | null;
  timestamp: string;
  origin_key: string | null;
  // Extended packet fields
  score: number | null;
  duration: number | null;
  route: string | null;
  len: number | null;
  payload_len: number | null;
  direction: 'rx' | 'tx' | null;
}

/**
 * Daily statistics for a specific node
 */
export interface NodeStatsDaily {
  id: number;
  node_id: string | null;
  date: string;
  packets_rx: number;
  packets_tx: number;
  uptime_pct: number | null;
  avg_snr: number | null;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Node data enriched with computed statistics
 */
export interface NodeWithStats extends Node {
  packets_today: number;
  packets_total: number;
  is_online: boolean;
}

/**
 * Aggregated community-wide statistics
 */
export interface CommunityStats {
  active_nodes: number;
  total_nodes: number;
  packets_today: number;
  packets_total: number;
  avg_snr: number | null;
  // Bot stats (from meshcore-bot API)
  contacts_24h?: number;
  contacts_7d?: number;
  messages_24h?: number;
  total_messages?: number;
  avg_hop_count?: number;
  max_hop_count?: number;
  bot_reply_rate_24h?: number;
  top_users?: Array<{ user: string; count: number }>;
}

/**
 * Network health status information
 *
 * Data sources:
 * - Turso DB: status, uptime_pct, active_nodes, total_nodes, avg_snr, avg_rssi,
 *   avg_noise_floor, total_errors, last_packet_at, geo_spread_km, nodes_with_location
 * - Bot API: contacts_24h (nodes heard), contacts_7d, messages_24h, avg_hop_count,
 *   max_hop_count, bot_reply_rate, unique_contributors, avg_response_time_ms
 */
export interface NetworkHealth {
  /** Determined from real signals: node availability, packet recency, error count */
  status: 'healthy' | 'degraded' | 'offline';
  /** Percentage of nodes currently online (from Turso) */
  uptime_pct: number;
  active_nodes: number;
  total_nodes: number;
  /** Average signal-to-noise ratio from MQTT packets (Turso) */
  avg_snr: number | null;
  avg_rssi: number | null;
  avg_noise_floor: number | null;
  total_errors: number;
  /** Most recent MQTT packet timestamp (Turso) */
  last_packet_at: string | null;
  /** Nodes that sent ADVERT packets in 24h (Bot API) - not human contacts */
  contacts_24h?: number;
  contacts_7d?: number;
  /** Human + bot messages in 24h (Bot API) */
  messages_24h?: number;
  avg_hop_count?: number;
  /** Best reach metric - max hops observed (Bot API) */
  max_hop_count?: number;
  /** Bot command response rate in 24h (Bot API) */
  bot_reply_rate?: number;
  /** Unique human messengers in 30d, excluding bot node (Bot API) */
  unique_contributors?: number;
  /** Max distance between any two nodes in km (Turso) */
  geo_spread_km?: number;
  nodes_with_location?: number;
  avg_response_time_ms?: number;
  packet_delivery_rate?: number;
  /** Combined health score 0-100 (7 components x 10 pts, normalized to 0-100) */
  network_score?: number;
  /** Score breakdown - 7 active components, unused slots set to 0 for compat */
  score_breakdown?: {
    /** Nodes Online: % of known nodes currently active */
    status: number;
    /** Unused (was faked from bot reply rate) - always 0 */
    uptime: number;
    /** Signal (SNR): average signal-to-noise ratio */
    signal: number;
    /** Message Activity: messages in 24h */
    activity: number;
    /** Unused (merged into Packet Freshness) - always 0 */
    responsiveness: number;
    /** Network Reach: max hop count seen */
    reach: number;
    /** Packet Freshness: time since last MQTT packet */
    recency: number;
    /** Community: unique human messengers (30d) */
    diversity: number;
    /** Geo Coverage: geographic spread in km */
    geo_coverage: number;
    /** Unused (not measurable) - always 0 */
    latency: number;
  };
}

/**
 * Radio configuration parsed from the radio_config string
 * Format: "frequency,bandwidth,sf,power"
 */
export interface RadioConfig {
  frequency: number;
  bandwidth: number;
  spreadingFactor: number;
  power: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Node type options for filtering and display
 */
export type NodeType = Node['node_type'];

/**
 * Network health status options
 */
export type HealthStatus = NetworkHealth['status'];

/**
 * Create node input (without auto-generated fields)
 */
export type CreateNodeInput = Omit<Node, 'id' | 'created_at' | 'last_seen'> & {
  id?: string;
};

/**
 * Update node input (all fields optional except id)
 */
export type UpdateNodeInput = Partial<Omit<Node, 'id' | 'created_at'>> & {
  id: string;
};

/**
 * Create packet input (without auto-generated fields)
 */
export type CreatePacketInput = Omit<Packet, 'id' | 'timestamp'>;

/**
 * Parse a radio config string into structured data
 */
export function parseRadioConfig(config: string | null): RadioConfig | null {
  if (!config) return null;
  const parts = config.split(',');
  if (parts.length !== 4) return null;
  return {
    frequency: parseFloat(parts[0]),
    bandwidth: parseFloat(parts[1]),
    spreadingFactor: parseInt(parts[2], 10),
    power: parseInt(parts[3], 10),
  };
}

/**
 * Format uptime seconds into a human-readable string
 */
export function formatUptime(seconds: number | null): string {
  if (seconds === null) return 'Unknown';
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Format battery voltage into percentage (approximate)
 * LiPo batteries: ~4200mV = 100%, ~3200mV = 0%
 */
export function formatBatteryPercent(mV: number | null): number | null {
  if (mV === null) return null;
  const min = 3200;
  const max = 4200;
  const percent = Math.round(((mV - min) / (max - min)) * 100);
  return Math.max(0, Math.min(100, percent));
}

// =============================================================================
// Discord Webhook Types
// =============================================================================

/**
 * Discord embed field structure
 */
export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Discord embed structure for webhook messages
 */
export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
}

/**
 * Discord webhook payload structure
 */
export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds: DiscordEmbed[];
}

/**
 * Network status state for Discord alert tracking
 */
export interface NetworkStatusState {
  status: HealthStatus;
  network_score: number;
  active_nodes: number;
  last_updated: string;
  last_alert_sent: string | null;
}

/**
 * Discord notification types
 */
export type DiscordNotificationType = 'scheduled' | 'status_change' | 'node_offline' | 'recovery';
