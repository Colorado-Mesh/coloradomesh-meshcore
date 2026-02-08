import { createClient } from '@libsql/client';
import type {
  Node,
  Packet,
  NodeStatsDaily,
  NodeWithStats,
  CommunityStats,
  NetworkHealth,
  NetworkStatusState,
  HealthStatus,
  CreatePacketInput,
} from '../types';
import { isNodeOnline } from '../utils';

// =============================================================================
// Database Client Initialization
// =============================================================================

/**
 * Validate required environment variables for database connection.
 * Throws descriptive errors to help with configuration issues.
 */
function validateEnv(): void {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error(
      'TURSO_DATABASE_URL environment variable is required. ' +
        'Set it in .env.local or your environment. ' +
        'Example: TURSO_DATABASE_URL=libsql://your-database.turso.io'
    );
  }
  if (!process.env.TURSO_AUTH_TOKEN) {
    console.warn(
      'Warning: TURSO_AUTH_TOKEN not set. ' +
        'Database connections may fail in production. ' +
        'Set it in .env.local or your environment.'
    );
  }
}

/**
 * Lazy-initialized database client instance.
 * Created on first access to allow for environment validation.
 */
let _db: ReturnType<typeof createClient> | null = null;

/**
 * Get the database client, initializing it on first access.
 * Validates environment variables before creating the connection.
 */
export function getDb(): ReturnType<typeof createClient> {
  if (!_db) {
    validateEnv();
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

// Type alias for the Turso client
type TursoClient = ReturnType<typeof createClient>;

/**
 * Database client with lazy initialization.
 * Provides backwards compatibility with direct db.execute() calls
 * while ensuring environment validation occurs before any query.
 */
export const db: Pick<TursoClient, 'execute'> = {
  execute: (...args: Parameters<TursoClient['execute']>) =>
    getDb().execute(...args),
};

// =============================================================================
// Helper Functions
// =============================================================================

/** Tiered data retention periods */
const RETENTION = {
  PACKETS_DAYS: 14,
  DAILY_STATS_DAYS: 90,
  QUERY_WINDOW_DAYS: 30,
} as const;

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the ISO timestamp for N days ago
 */
function getRetentionCutoff(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Map a database row to a Node object with all fields
 */
function mapRowToNode(row: Record<string, unknown>): Node {
  return {
    id: row.id as string,
    public_key: row.public_key as string,
    name: row.name as string | null,
    owner_discord_id: row.owner_discord_id as string | null,
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    node_type: (row.node_type as Node['node_type']) || 'node',
    firmware_version: row.firmware_version as string | null,
    created_at: row.created_at as string,
    last_seen: row.last_seen as string | null,
    // Hardware info from status messages
    model: row.model as string | null,
    hardware_version: row.hardware_version as string | null,
    radio_config: row.radio_config as string | null,
    client_version: row.client_version as string | null,
    // Live status metrics
    battery_mv: row.battery_mv as number | null,
    noise_floor: row.noise_floor as number | null,
    uptime_secs: row.uptime_secs as number | null,
    error_count: row.error_count as number | null,
    queue_len: row.queue_len as number | null,
    tx_air_secs: row.tx_air_secs as number | null,
    rx_air_secs: row.rx_air_secs as number | null,
  };
}

/**
 * Map a database row to a Packet object with all fields
 */
function mapRowToPacket(row: Record<string, unknown>): Packet {
  return {
    id: Number(row.id),
    node_id: row.node_id as string | null,
    packet_type: row.packet_type as string | null,
    raw_data: row.raw_data as string | null,
    snr: row.snr as number | null,
    rssi: row.rssi as number | null,
    hop_count: row.hop_count as number | null,
    timestamp: row.timestamp as string,
    origin_key: row.origin_key as string | null,
    // Extended packet fields
    score: row.score as number | null,
    duration: row.duration as number | null,
    route: row.route as string | null,
    len: row.len as number | null,
    payload_len: row.payload_len as number | null,
    direction: row.direction as 'rx' | 'tx' | null,
  };
}

// =============================================================================
// Node Queries
// =============================================================================

/**
 * Get all nodes from the database
 */
export async function getAllNodes(): Promise<Node[]> {
  const result = await db.execute('SELECT * FROM nodes ORDER BY last_seen DESC NULLS LAST');
  return result.rows.map((row) => mapRowToNode(row as Record<string, unknown>));
}

/**
 * Get a node by its ID
 */
export async function getNodeById(id: string): Promise<Node | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM nodes WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return mapRowToNode(result.rows[0] as Record<string, unknown>);
}

/**
 * Get a node by its public key
 */
export async function getNodeByPublicKey(publicKey: string): Promise<Node | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM nodes WHERE public_key = ?',
    args: [publicKey],
  });

  if (result.rows.length === 0) return null;
  return mapRowToNode(result.rows[0] as Record<string, unknown>);
}

/**
 * Get all nodes with their computed statistics (30-day window)
 */
export async function getNodesWithStats(): Promise<NodeWithStats[]> {
  const thirtyDaysAgo = getRetentionCutoff(RETENTION.QUERY_WINDOW_DAYS);

  const result = await db.execute({
    sql: `
      SELECT
        n.*,
        COALESCE((
          SELECT COUNT(*) FROM packets p
          WHERE p.node_id = n.id AND p.timestamp >= ?
        ), 0) as packets_30d,
        COALESCE((
          SELECT COUNT(*) FROM packets p
          WHERE p.node_id = n.id
        ), 0) as packets_total
      FROM nodes n
      ORDER BY n.last_seen DESC NULLS LAST
    `,
    args: [thirtyDaysAgo],
  });

  return result.rows.map((row) => {
    const r = row as Record<string, unknown>;
    const node = mapRowToNode(r);
    return {
      ...node,
      packets_today: Number(r.packets_30d) || 0, // Keep field name for compatibility
      packets_total: Number(r.packets_total) || 0,
      is_online: isNodeOnline(r.last_seen as string | null, node.node_type),
    };
  });
}

/**
 * Insert or update a node (upsert)
 */
export async function upsertNode(node: Partial<Node> & { id: string; public_key: string }): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO nodes (id, public_key, name, owner_discord_id, latitude, longitude, node_type, firmware_version, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        public_key = COALESCE(excluded.public_key, nodes.public_key),
        name = COALESCE(excluded.name, nodes.name),
        owner_discord_id = COALESCE(excluded.owner_discord_id, nodes.owner_discord_id),
        latitude = COALESCE(excluded.latitude, nodes.latitude),
        longitude = COALESCE(excluded.longitude, nodes.longitude),
        node_type = COALESCE(excluded.node_type, nodes.node_type),
        firmware_version = COALESCE(excluded.firmware_version, nodes.firmware_version),
        last_seen = COALESCE(excluded.last_seen, nodes.last_seen)
    `,
    args: [
      node.id,
      node.public_key,
      node.name ?? null,
      node.owner_discord_id ?? null,
      node.latitude ?? null,
      node.longitude ?? null,
      node.node_type ?? 'node',
      node.firmware_version ?? null,
      node.last_seen ?? new Date().toISOString(),
    ],
  });
}

/**
 * Update a node's last_seen timestamp to now
 */
export async function updateNodeLastSeen(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE nodes SET last_seen = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  });
}

// =============================================================================
// Packet Queries
// =============================================================================

/**
 * Get recent packets, optionally limited
 */
export async function getRecentPackets(limit: number = 100): Promise<Packet[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM packets ORDER BY timestamp DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((row) => mapRowToPacket(row as Record<string, unknown>));
}

/**
 * Get packets for a specific node
 */
export async function getPacketsByNodeId(nodeId: string, limit: number = 100): Promise<Packet[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM packets WHERE node_id = ? ORDER BY timestamp DESC LIMIT ?',
    args: [nodeId, limit],
  });

  return result.rows.map((row) => mapRowToPacket(row as Record<string, unknown>));
}

/**
 * Insert a new packet
 */
export async function insertPacket(packet: CreatePacketInput): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO packets (node_id, packet_type, raw_data, snr, rssi, hop_count, origin_key, score, duration, route, len, payload_len, direction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      packet.node_id ?? null,
      packet.packet_type ?? null,
      packet.raw_data ?? null,
      packet.snr ?? null,
      packet.rssi ?? null,
      packet.hop_count ?? null,
      packet.origin_key ?? null,
      packet.score ?? null,
      packet.duration ?? null,
      packet.route ?? null,
      packet.len ?? null,
      packet.payload_len ?? null,
      packet.direction ?? null,
    ],
  });
}

/**
 * Get the count of packets received in the last 30 days
 */
export async function getPacketCount30Days(): Promise<number> {
  const thirtyDaysAgo = getRetentionCutoff(RETENTION.QUERY_WINDOW_DAYS);

  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM packets WHERE timestamp >= ?',
    args: [thirtyDaysAgo],
  });

  return Number(result.rows[0]?.count) || 0;
}

/**
 * Get total packet count
 */
export async function getPacketCountTotal(): Promise<number> {
  const result = await db.execute('SELECT COUNT(*) as count FROM packets');
  return Number(result.rows[0]?.count) || 0;
}

// =============================================================================
// Stats Queries
// =============================================================================

/**
 * Get community-wide aggregated statistics (30-day window)
 * Uses a single CTE query to reduce database round trips (5 queries -> 1)
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const thirtyDaysAgo = getRetentionCutoff(RETENTION.QUERY_WINDOW_DAYS);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const result = await db.execute({
    sql: `
      WITH node_counts AS (
        SELECT
          COUNT(*) as total_nodes,
          SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END) as active_nodes
        FROM nodes
      ),
      packet_counts AS (
        SELECT
          COUNT(*) as packets_total,
          SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) as packets_30d
        FROM packets
      ),
      snr_avg AS (
        SELECT AVG(snr) as avg_snr
        FROM packets
        WHERE snr IS NOT NULL AND timestamp >= ?
      )
      SELECT
        nc.total_nodes, nc.active_nodes,
        pc.packets_total, pc.packets_30d,
        sa.avg_snr
      FROM node_counts nc, packet_counts pc, snr_avg sa
    `,
    args: [fifteenMinutesAgo, thirtyDaysAgo, thirtyDaysAgo],
  });

  const row = result.rows[0];
  const avgSnr = row?.avg_snr as number | null;

  return {
    active_nodes: Number(row?.active_nodes) || 0,
    total_nodes: Number(row?.total_nodes) || 0,
    packets_today: Number(row?.packets_30d) || 0, // Keep field name for compatibility
    packets_total: Number(row?.packets_total) || 0,
    avg_snr: avgSnr ? Number(avgSnr.toFixed(2)) : null,
  };
}

/**
 * Get network health status information (30-day window for signal metrics)
 * Enhanced with signal metrics, noise floor, and error tracking
 */
export async function getNetworkHealth(): Promise<NetworkHealth> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const thirtyDaysAgo = getRetentionCutoff(RETENTION.QUERY_WINDOW_DAYS);

  const result = await db.execute({
    sql: `
      WITH node_counts AS (
        SELECT
          COUNT(*) as total_nodes,
          SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END) as active_nodes,
          SUM(COALESCE(error_count, 0)) as total_errors,
          AVG(noise_floor) as avg_noise_floor
        FROM nodes
      ),
      signal_avg AS (
        SELECT
          AVG(snr) as avg_snr,
          AVG(rssi) as avg_rssi
        FROM packets
        WHERE timestamp >= ?
      ),
      last_packet AS (
        SELECT timestamp as last_packet_at
        FROM packets
        ORDER BY timestamp DESC
        LIMIT 1
      )
      SELECT
        nc.total_nodes, nc.active_nodes, nc.total_errors, nc.avg_noise_floor,
        sa.avg_snr, sa.avg_rssi,
        lp.last_packet_at
      FROM node_counts nc, signal_avg sa
      LEFT JOIN last_packet lp ON 1=1
    `,
    args: [fifteenMinutesAgo, thirtyDaysAgo],
  });

  const row = result.rows[0];
  const activeNodes = Number(row?.active_nodes) || 0;
  const totalNodes = Number(row?.total_nodes) || 0;
  const totalErrors = Number(row?.total_errors) || 0;
  const avgSnr = row?.avg_snr as number | null;
  const avgRssi = row?.avg_rssi as number | null;
  const avgNoiseFloor = row?.avg_noise_floor as number | null;
  const lastPacketAt = (row?.last_packet_at as string) || null;

  // Calculate uptime percentage (active/total)
  const uptimePct = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;

  // Determine health status based on multiple factors
  let status: NetworkHealth['status'];
  if (activeNodes === 0 || !lastPacketAt) {
    status = 'offline';
  } else if (uptimePct < 50 || totalErrors > 10) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    uptime_pct: uptimePct,
    active_nodes: activeNodes,
    total_nodes: totalNodes,
    avg_snr: avgSnr ? Number(avgSnr.toFixed(2)) : null,
    avg_rssi: avgRssi ? Number(avgRssi.toFixed(2)) : null,
    avg_noise_floor: avgNoiseFloor ? Number(avgNoiseFloor.toFixed(2)) : null,
    total_errors: totalErrors,
    last_packet_at: lastPacketAt,
  };
}

/**
 * Get daily statistics for a specific node
 */
export async function getDailyStats(nodeId: string, days: number = 7): Promise<NodeStatsDaily[]> {
  const result = await db.execute({
    sql: `
      SELECT * FROM node_stats_daily
      WHERE node_id = ?
      ORDER BY date DESC
      LIMIT ?
    `,
    args: [nodeId, days],
  });

  return result.rows.map((row) => ({
    id: Number(row.id),
    node_id: row.node_id as string | null,
    date: row.date as string,
    packets_rx: Number(row.packets_rx) || 0,
    packets_tx: Number(row.packets_tx) || 0,
    uptime_pct: row.uptime_pct as number | null,
    avg_snr: row.avg_snr as number | null,
  }));
}

/**
 * Upsert daily stats for a node
 * Uses INSERT ... ON CONFLICT with the idx_stats_node_date_unique unique index
 */
export async function upsertDailyStats(
  nodeId: string,
  date: string,
  stats: Partial<Omit<NodeStatsDaily, 'id' | 'node_id' | 'date'>>
): Promise<void> {
  await db.execute({
    sql: `
      INSERT INTO node_stats_daily (node_id, date, packets_rx, packets_tx, uptime_pct, avg_snr)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(node_id, date) DO UPDATE SET
        packets_rx = COALESCE(excluded.packets_rx, node_stats_daily.packets_rx),
        packets_tx = COALESCE(excluded.packets_tx, node_stats_daily.packets_tx),
        uptime_pct = COALESCE(excluded.uptime_pct, node_stats_daily.uptime_pct),
        avg_snr = COALESCE(excluded.avg_snr, node_stats_daily.avg_snr)
    `,
    args: [
      nodeId,
      date,
      stats.packets_rx ?? 0,
      stats.packets_tx ?? 0,
      stats.uptime_pct ?? null,
      stats.avg_snr ?? null,
    ],
  });
}

/**
 * Increment packet count for today's stats
 * Uses INSERT ... ON CONFLICT with the idx_stats_node_date_unique unique index
 */
export async function incrementDailyPacketCount(
  nodeId: string,
  type: 'rx' | 'tx' = 'rx'
): Promise<void> {
  const today = getTodayDateString();
  const rxIncrement = type === 'rx' ? 1 : 0;
  const txIncrement = type === 'tx' ? 1 : 0;

  await db.execute({
    sql: `
      INSERT INTO node_stats_daily (node_id, date, packets_rx, packets_tx)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(node_id, date) DO UPDATE SET
        packets_rx = node_stats_daily.packets_rx + ?,
        packets_tx = node_stats_daily.packets_tx + ?
    `,
    args: [nodeId, today, rxIncrement, txIncrement, rxIncrement, txIncrement],
  });
}

// =============================================================================
// Data Cleanup Functions
// =============================================================================

/**
 * Delete packets older than 14 days
 */
export async function cleanupOldPackets(): Promise<number> {
  const cutoffDate = getRetentionCutoff(RETENTION.PACKETS_DAYS);

  const result = await db.execute({
    sql: 'DELETE FROM packets WHERE timestamp < ?',
    args: [cutoffDate],
  });

  return result.rowsAffected;
}

/**
 * Delete daily stats older than 90 days
 */
export async function cleanupOldDailyStats(): Promise<number> {
  const cutoffDate = getRetentionCutoff(RETENTION.DAILY_STATS_DAYS).split('T')[0];

  const result = await db.execute({
    sql: 'DELETE FROM node_stats_daily WHERE date < ?',
    args: [cutoffDate],
  });

  return result.rowsAffected;
}

/**
 * Delete health history snapshots older than 90 days
 */
export async function cleanupOldHealthDaily(): Promise<number> {
  const cutoffDate = getRetentionCutoff(RETENTION.DAILY_STATS_DAYS).split('T')[0];

  const result = await db.execute({
    sql: 'DELETE FROM network_health_daily WHERE date < ?',
    args: [cutoffDate],
  });

  return result.rowsAffected;
}

/**
 * Count nodes not seen in 90+ days (or never seen)
 */
export async function getStaleNodeCount(): Promise<number> {
  const cutoff = getRetentionCutoff(RETENTION.DAILY_STATS_DAYS);

  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM nodes WHERE last_seen < ? OR last_seen IS NULL',
    args: [cutoff],
  });

  return Number(result.rows[0]?.count) || 0;
}

/**
 * Upsert a daily network health snapshot
 */
export async function upsertNetworkHealthDaily(data: {
  score: number;
  status: string;
  active_nodes: number;
  total_nodes: number;
  avg_snr?: number | null;
  messages_24h?: number | null;
  max_hop_count?: number | null;
  unique_contributors?: number | null;
  geo_spread_km?: number | null;
  score_breakdown?: Record<string, number> | null;
}): Promise<void> {
  const today = getTodayDateString();

  await db.execute({
    sql: `
      INSERT INTO network_health_daily (
        date, score, status, active_nodes, total_nodes,
        avg_snr, messages_24h, max_hop_count, unique_contributors, geo_spread_km,
        score_status, score_signal, score_recency, score_activity,
        score_reach, score_diversity, score_geo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        score = excluded.score,
        status = excluded.status,
        active_nodes = excluded.active_nodes,
        total_nodes = excluded.total_nodes,
        avg_snr = excluded.avg_snr,
        messages_24h = excluded.messages_24h,
        max_hop_count = excluded.max_hop_count,
        unique_contributors = excluded.unique_contributors,
        geo_spread_km = excluded.geo_spread_km,
        score_status = excluded.score_status,
        score_signal = excluded.score_signal,
        score_recency = excluded.score_recency,
        score_activity = excluded.score_activity,
        score_reach = excluded.score_reach,
        score_diversity = excluded.score_diversity,
        score_geo = excluded.score_geo
    `,
    args: [
      today,
      data.score,
      data.status,
      data.active_nodes,
      data.total_nodes,
      data.avg_snr ?? null,
      data.messages_24h ?? null,
      data.max_hop_count ?? null,
      data.unique_contributors ?? null,
      data.geo_spread_km ?? null,
      data.score_breakdown?.status ?? 0,
      data.score_breakdown?.signal ?? 0,
      data.score_breakdown?.recency ?? 0,
      data.score_breakdown?.activity ?? 0,
      data.score_breakdown?.reach ?? 0,
      data.score_breakdown?.diversity ?? 0,
      data.score_breakdown?.geo_coverage ?? 0,
    ],
  });
}

/**
 * Get network health history for the last N days
 */
export async function getNetworkHealthHistory(days: number = 30): Promise<Array<{
  date: string;
  score: number;
  status: string;
  active_nodes: number;
  total_nodes: number;
  avg_snr: number | null;
  messages_24h: number | null;
  max_hop_count: number | null;
  unique_contributors: number | null;
  geo_spread_km: number | null;
  score_status: number;
  score_signal: number;
  score_recency: number;
  score_activity: number;
  score_reach: number;
  score_diversity: number;
  score_geo: number;
}>> {
  const result = await db.execute({
    sql: 'SELECT * FROM network_health_daily ORDER BY date DESC LIMIT ?',
    args: [days],
  });

  return result.rows.map((row) => ({
    date: row.date as string,
    score: Number(row.score),
    status: row.status as string,
    active_nodes: Number(row.active_nodes),
    total_nodes: Number(row.total_nodes),
    avg_snr: row.avg_snr as number | null,
    messages_24h: row.messages_24h as number | null,
    max_hop_count: row.max_hop_count as number | null,
    unique_contributors: row.unique_contributors as number | null,
    geo_spread_km: row.geo_spread_km as number | null,
    score_status: Number(row.score_status) || 0,
    score_signal: Number(row.score_signal) || 0,
    score_recency: Number(row.score_recency) || 0,
    score_activity: Number(row.score_activity) || 0,
    score_reach: Number(row.score_reach) || 0,
    score_diversity: Number(row.score_diversity) || 0,
    score_geo: Number(row.score_geo) || 0,
  }));
}

/**
 * Run all cleanup tasks to enforce tiered data retention policy
 */
export async function runDataCleanup(): Promise<{
  packetsDeleted: number;
  dailyStatsDeleted: number;
  healthSnapshotsDeleted: number;
  staleNodes: number;
  packetRetentionDays: number;
  statsRetentionDays: number;
}> {
  const [packetsDeleted, dailyStatsDeleted, healthSnapshotsDeleted, staleNodes] = await Promise.all([
    cleanupOldPackets(),
    cleanupOldDailyStats(),
    cleanupOldHealthDaily(),
    getStaleNodeCount(),
  ]);

  return {
    packetsDeleted,
    dailyStatsDeleted,
    healthSnapshotsDeleted,
    staleNodes,
    packetRetentionDays: RETENTION.PACKETS_DAYS,
    statsRetentionDays: RETENTION.DAILY_STATS_DAYS,
  };
}

// =============================================================================
// Discord State Tracking Functions
// =============================================================================

/**
 * Ensure the network_status_state table exists
 */
export async function ensureNetworkStatusStateTable(): Promise<void> {
  await db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS network_status_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'offline')),
        network_score INTEGER NOT NULL DEFAULT 0,
        active_nodes INTEGER NOT NULL DEFAULT 0,
        last_updated TEXT NOT NULL,
        last_alert_sent TEXT
      )
    `,
    args: [],
  });
}

/**
 * Get the last known network status state for Discord alert tracking
 */
export async function getNetworkStatusState(): Promise<NetworkStatusState | null> {
  try {
    await ensureNetworkStatusStateTable();

    const result = await db.execute({
      sql: 'SELECT * FROM network_status_state WHERE id = 1',
      args: [],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      status: row.status as HealthStatus,
      network_score: Number(row.network_score),
      active_nodes: Number(row.active_nodes),
      last_updated: row.last_updated as string,
      last_alert_sent: (row.last_alert_sent as string) || null,
    };
  } catch {
    return null;
  }
}

/**
 * Update the network status state for Discord alert tracking
 */
export async function updateNetworkStatusState(
  status: HealthStatus,
  networkScore: number,
  activeNodes: number,
  alertSent: boolean = false
): Promise<void> {
  await ensureNetworkStatusStateTable();

  const now = new Date().toISOString();

  if (alertSent) {
    await db.execute({
      sql: `
        INSERT INTO network_status_state (id, status, network_score, active_nodes, last_updated, last_alert_sent)
        VALUES (1, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          network_score = excluded.network_score,
          active_nodes = excluded.active_nodes,
          last_updated = excluded.last_updated,
          last_alert_sent = excluded.last_alert_sent
      `,
      args: [status, networkScore, activeNodes, now, now],
    });
  } else {
    await db.execute({
      sql: `
        INSERT INTO network_status_state (id, status, network_score, active_nodes, last_updated)
        VALUES (1, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          network_score = excluded.network_score,
          active_nodes = excluded.active_nodes,
          last_updated = excluded.last_updated
      `,
      args: [status, networkScore, activeNodes, now],
    });
  }
}
