/**
 * Shared utility functions for the Colorado MeshCore platform
 */

import { ONLINE_THRESHOLD_MS, REPEATER_ONLINE_THRESHOLD_MS } from './constants';

// Re-export for backwards compatibility
export { ONLINE_THRESHOLD_MS, REPEATER_ONLINE_THRESHOLD_MS } from './constants';

// =============================================================================
// Time Formatting
// =============================================================================

/**
 * Format a date to a relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

/**
 * Format a date for display (e.g., "Dec 31, 2024")
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp for display (e.g., "Dec 31, 2:30 PM")
 */
export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// String Utilities
// =============================================================================

/**
 * Truncate a public key for display
 * @param key - The full public key
 * @param prefixLength - Number of characters to show at the start (default: 6)
 * @param suffixLength - Number of characters to show at the end (default: 4)
 */
export function truncatePublicKey(
  key: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  const minLength = prefixLength + suffixLength + 3; // +3 for "..."
  if (key.length <= minLength) return key;
  return `${key.slice(0, prefixLength)}...${key.slice(-suffixLength)}`;
}

// =============================================================================
// Node Status
// =============================================================================

/**
 * Determine if a node is online based on last_seen timestamp
 * Companions: online if seen within last 15 minutes (no auto-advertise)
 * All other nodes: online if seen within last 12 hours (default advert interval)
 */
export function isNodeOnline(lastSeen: string | null, nodeType?: string): boolean {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);

  // Companions don't auto-advertise, so use shorter threshold
  // All other node types (repeater, room_server, gateway, etc.) use 12-hour threshold
  const thresholdMs = nodeType === 'companion'
    ? ONLINE_THRESHOLD_MS
    : REPEATER_ONLINE_THRESHOLD_MS;

  const threshold = new Date(Date.now() - thresholdMs);
  return lastSeenDate >= threshold;
}

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format a number with locale-specific thousands separators
 * Returns '--' for null or undefined values
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '--';
  return num.toLocaleString();
}

/**
 * Format a percentage value (0-100) with appropriate precision
 * Returns '--' for null or undefined values
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return `${value.toFixed(1)}%`;
}

/**
 * Format a hop count or similar decimal value
 * Returns '--' for null or undefined values
 */
export function formatDecimal(value: number | null | undefined, precision: number = 1): string {
  if (value === null || value === undefined) return '--';
  return value.toFixed(precision);
}
