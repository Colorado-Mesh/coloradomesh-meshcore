/**
 * Packet handler for MeshCore MQTT messages
 * Parses incoming packets and stores them in the database
 */

import type { MqttPacket, MqttStatus, ParsedPacket, NodeData, NodeStatusUpdate } from './types.js';
import {
  insertPacket,
  upsertNode,
  getNodeByName,
  getNodeByPublicKey,
  incrementDailyPacketCount,
  updateNodeLastSeen,
  updateNodeStatus,
} from './db.js';

// Stats tracking
let packetsProcessed = 0;
let packetsErrors = 0;
let statusUpdates = 0;
let lastStatsLog = Date.now();
const STATS_LOG_INTERVAL = 60000; // Log stats every minute

/**
 * Parse hop count from path string
 * Example: "C6→[A1]" = 1 hop, "82→EC→47→[C4]" = 3 hops
 */
function parseHopCount(path: string | undefined): number | null {
  if (!path) return null;

  // Count arrow separators (→ or -> or >)
  const arrows = (path.match(/→|->|>/g) || []).length;
  return arrows > 0 ? arrows : null;
}

/**
 * Parse SNR from string, handling various formats
 */
function parseSnr(snr: string | undefined): number | null {
  if (!snr) return null;
  const value = parseFloat(snr);
  return isNaN(value) ? null : value;
}

/**
 * Parse RSSI from string
 */
function parseRssi(rssi: string | undefined): number | null {
  if (!rssi) return null;
  const value = parseInt(rssi, 10);
  return isNaN(value) ? null : value;
}

/**
 * Parse integer from string
 */
function parseInt32(val: string | undefined): number | null {
  if (!val) return null;
  const value = parseInt(val, 10);
  return isNaN(value) ? null : value;
}

/**
 * Generate a node ID from name (deterministic hash)
 */
function generateNodeId(name: string): string {
  // Simple hash for consistent IDs
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Determine node type from name
 */
function determineNodeType(name: string): 'node' | 'companion' | 'repeater' | 'room_server' | 'router' | 'gateway' {
  const lowerName = name.toLowerCase();
  // Check observer/gateway first (higher priority than room_server)
  // Handle both "observer" and "0bserver" (zero instead of O)
  if (lowerName.includes('observer') || lowerName.includes('0bserver') || lowerName.includes('gateway')) return 'gateway';
  if (lowerName.includes('room') || lowerName.includes('server')) return 'room_server';
  if (lowerName.includes('repeater')) return 'repeater';
  if (lowerName.includes('router')) return 'router';
  if (lowerName.includes('companion')) return 'companion';
  return 'node';
}

/**
 * Parse an MQTT packet payload into a structured format
 */
export function parsePacket(payload: string): ParsedPacket | null {
  try {
    const data: MqttPacket = JSON.parse(payload);

    // Skip non-packet messages
    if (data.type !== 'PACKET') {
      return null;
    }

    const timestamp = data.timestamp || new Date().toISOString();

    return {
      nodeId: null, // Will be set after node lookup/creation
      packetType: data.packet_type || data.route || null,
      rawData: payload,
      snr: parseSnr(data.SNR),
      rssi: parseRssi(data.RSSI),
      hopCount: parseHopCount(data.path),
      originKey: data.hash || null,
      timestamp,
      // New fields
      score: parseInt32(data.score),
      duration: parseInt32(data.duration),
      route: data.route || null,
      len: parseInt32(data.len),
      payloadLen: parseInt32(data.payload_len),
      direction: (data.direction as 'rx' | 'tx') || null,
    };
  } catch (error) {
    console.error('[PacketHandler] Failed to parse packet:', error);
    return null;
  }
}

/**
 * Extract observer public key from topic
 * Topic format: meshcore/{IATA}/{PUBLIC_KEY}/packets
 */
function extractObserverIdFromTopic(topic: string): string | null {
  const parts = topic.split('/');
  // Expected format: meshcore / IATA / PUBLIC_KEY / packets
  if (parts.length >= 4 && parts[0] === 'meshcore') {
    return parts[2]; // The public key
  }
  return null;
}

/**
 * Process and store a packet
 */
export async function handlePacket(topic: string, payload: Buffer): Promise<void> {
  const payloadStr = payload.toString();

  try {
    // Parse the MQTT message
    const data: MqttPacket = JSON.parse(payloadStr);

    // Skip non-packet messages (like status updates)
    if (data.type !== 'PACKET') {
      return;
    }

    // Extract observer ID from topic if not in payload
    const observerIdFromTopic = extractObserverIdFromTopic(topic);

    const origin = data.origin;
    if (!origin) {
      console.warn('[PacketHandler] Packet missing origin, skipping');
      return;
    }

    // Normalize public key to lowercase for consistency
    const originId = data.origin_id?.toLowerCase();

    // Find or create the node - prefer public key lookup
    let node = originId
      ? await getNodeByPublicKey(originId)
      : await getNodeByName(origin);

    if (!node) {
      // Create new node with normalized ID
      const nodeId = originId || generateNodeId(origin);
      const nodeData: NodeData = {
        id: nodeId,
        publicKey: originId || nodeId,
        name: origin,
        nodeType: determineNodeType(origin),
        lastSeen: new Date().toISOString(),
      };

      await upsertNode(nodeData);
      node = { id: nodeId };
      console.log(`[PacketHandler] Created new node: ${origin} (${nodeId.substring(0, 8)}...)`);
    }

    // Parse and store the packet
    const parsed = parsePacket(payloadStr);
    if (!parsed) return;

    parsed.nodeId = node.id;

    await insertPacket(parsed);

    // Update node last seen and increment daily count
    await updateNodeLastSeen(node.id);
    await incrementDailyPacketCount(node.id, data.direction || 'rx');

    // Also update the observer's last_seen if we know who reported this packet
    // Priority: observer_id from payload > observer name from payload > public key from topic
    const observerId = (data.observer_id || observerIdFromTopic)?.toLowerCase();
    if (observerId || data.observer) {
      let observerNode = null;

      if (observerId) {
        observerNode = await getNodeByPublicKey(observerId);
      } else if (data.observer) {
        observerNode = await getNodeByName(data.observer);
      }

      if (observerNode) {
        await updateNodeLastSeen(observerNode.id);
      }
    }

    packetsProcessed++;

    // Log stats periodically
    logStatsIfNeeded();
  } catch (error) {
    packetsErrors++;
    console.error('[PacketHandler] Error processing packet:', error);
  }
}

/**
 * Handle status messages (node online/offline with hardware info)
 */
export async function handleStatus(topic: string, payload: Buffer): Promise<void> {
  try {
    const data: MqttStatus = JSON.parse(payload.toString());

    // Debug: log full status message to see all available fields
    console.log('[PacketHandler] Raw status:', JSON.stringify(data, null, 2));

    if (!data.origin || !data.origin_id) {
      console.warn('[PacketHandler] Status missing origin info, skipping');
      return;
    }

    console.log(`[PacketHandler] Status: ${data.origin} is ${data.status}`);

    // Normalize public key to lowercase for consistency
    const normalizedOriginId = data.origin_id.toLowerCase();

    // Find or create the node by public key
    let node = await getNodeByPublicKey(normalizedOriginId);

    if (!node) {
      // Create new node with hardware info
      const nodeData: NodeData = {
        id: normalizedOriginId,
        publicKey: normalizedOriginId,
        name: data.origin,
        nodeType: determineNodeType(data.origin),
        lastSeen: new Date().toISOString(),
        model: data.model || null,
        hardwareVersion: data.firmware_version || null,
        radioConfig: data.radio || null,
        clientVersion: data.client_version || null,
      };

      await upsertNode(nodeData);
      node = { id: normalizedOriginId };
      console.log(`[PacketHandler] Created node from status: ${data.origin}`);
    } else {
      // Update existing node with hardware info if available
      if (data.model || data.firmware_version || data.radio || data.client_version) {
        const nodeData: NodeData = {
          id: node.id,
          publicKey: normalizedOriginId,
          name: data.origin,
          nodeType: determineNodeType(data.origin),
          lastSeen: new Date().toISOString(),
          model: data.model || null,
          hardwareVersion: data.firmware_version || null,
          radioConfig: data.radio || null,
          clientVersion: data.client_version || null,
        };
        await upsertNode(nodeData);
      }
    }

    // Update stats if available
    if (data.stats) {
      const statusUpdate: NodeStatusUpdate = {
        nodeId: node.id,
        batteryMv: data.stats.battery_mv ?? null,
        noiseFloor: data.stats.noise_floor ?? null,
        uptimeSecs: data.stats.uptime_secs ?? null,
        errorCount: data.stats.debug_flags ?? data.stats.errors ?? null,
        queueLen: data.stats.queue_len ?? null,
        txAirSecs: data.stats.tx_air_secs ?? null,
        rxAirSecs: data.stats.rx_air_secs ?? null,
      };

      await updateNodeStatus(statusUpdate);
      console.log(`[PacketHandler] Updated status for ${data.origin}: battery=${data.stats.battery_mv}mV, uptime=${Math.round(data.stats.uptime_secs / 3600)}h, errors=${data.stats.debug_flags ?? data.stats.errors}`);
    }

    statusUpdates++;
    logStatsIfNeeded();
  } catch (error) {
    console.error('[PacketHandler] Error processing status:', error);
  }
}

/**
 * Log stats periodically
 */
function logStatsIfNeeded(): void {
  const now = Date.now();
  if (now - lastStatsLog >= STATS_LOG_INTERVAL) {
    console.log(`[PacketHandler] Stats: ${packetsProcessed} packets, ${statusUpdates} status updates, ${packetsErrors} errors`);
    lastStatsLog = now;
  }
}

/**
 * Get current stats
 */
export function getStats(): { processed: number; errors: number; statusUpdates: number } {
  return { processed: packetsProcessed, errors: packetsErrors, statusUpdates };
}
