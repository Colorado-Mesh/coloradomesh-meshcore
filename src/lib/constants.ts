const DEFAULT_BASE_URL = 'https://meshcore.coloradomesh.org';

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export const RUNTIME_ENV = {
  SITE_URL: 'NEXT_PUBLIC_SITE_URL',
  MAP_TILE_URL: 'MESHCORE_MAP_TILE_URL',
  LEGACY_PUBLIC_MAP_TILE_URL: 'NEXT_PUBLIC_MAP_TILE_URL',
  MAP_TILE_ATTRIBUTION: 'MESHCORE_MAP_TILE_ATTRIBUTION',
  MAP_DEFAULT_LATITUDE: 'MESHCORE_MAP_DEFAULT_LATITUDE',
  MAP_DEFAULT_LONGITUDE: 'MESHCORE_MAP_DEFAULT_LONGITUDE',
  MAP_DEFAULT_ZOOM: 'MESHCORE_MAP_DEFAULT_ZOOM',
  MAP_DEMO_MODE: 'MESHCORE_MAP_DEMO_MODE',
  LIVE_MAP_API_URL: 'MESHCORE_LIVE_MAP_API_URL',
  LIVE_MAP_API_TOKEN: 'MESHCORE_LIVE_MAP_API_TOKEN',
  LIVE_MAP_API_REFRESH_SECONDS: 'MESHCORE_LIVE_MAP_API_REFRESH_SECONDS',
  MQTT_URL: 'MESHCORE_MQTT_URL',
  MQTT_USERNAME: 'MESHCORE_MQTT_USERNAME',
  MQTT_PASSWORD: 'MESHCORE_MQTT_PASSWORD',
  MQTT_TOPIC: 'MESHCORE_MQTT_TOPIC',
  MQTT_CLIENT_ID: 'MESHCORE_MQTT_CLIENT_ID',
  MAP_HISTORY_ENABLED: 'MESHCORE_MAP_HISTORY_ENABLED',
  MAP_SAMPLE_DATA: 'MESHCORE_MAP_SAMPLE_DATA',
} as const;

export const BRAND = {
  communityName: 'Colorado Mesh',
  siteName: 'Colorado MeshCore',
  siteTitle: 'Colorado MeshCore Community Platform',
  tagline: "Colorado's decentralized MeshCore network community",
  description:
    "Join Colorado MeshCore's growing mesh network community. Connect with fellow MeshCore operators, share knowledge, and help build resilient off-grid communication infrastructure across Colorado.",
  baseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_BASE_URL),
  discordInviteUrl: 'https://discord.gg/Tuuv9hGPnX',
  meshcoreDocsUrl: 'https://meshcore.co',
  letsMeshUrl: 'https://letsmesh.net',
  githubOrgUrl: 'https://github.com/Colorado-Mesh',
  logoPath: '/brand/linux/256x256.png',
  iconPath: '/brand/win/colorado-mesh.ico',
} as const;

// =============================================================================
// Site Information
// =============================================================================

export const BASE_URL = BRAND.baseUrl;
export const SITE_NAME = BRAND.siteName;
export const SITE_TITLE = BRAND.siteTitle;
export const COMMUNITY_NAME = BRAND.communityName;
export const SITE_TAGLINE = BRAND.tagline;
export const SITE_DESCRIPTION = BRAND.description;
export const SITE_LOGO_PATH = BRAND.logoPath;

// =============================================================================
// External Links
// =============================================================================

export const DISCORD_INVITE_URL = BRAND.discordInviteUrl;
export const MESHCORE_DOCS_URL = BRAND.meshcoreDocsUrl;
export const LETSMESH_URL = BRAND.letsMeshUrl;
export const GITHUB_ORG_URL = BRAND.githubOrgUrl;

// =============================================================================
// API Configuration
// =============================================================================

export const API_ROUTES = {
  MAP_SNAPSHOT: '/api/map/snapshot',
  MAP_RUNTIME: '/api/map/runtime',
  MAP_NODES: '/api/map/nodes',
  MAP_STATS: '/api/map/stats',
  MAP_STREAM: '/api/map/stream',
  LIVE_MAP_STATUS: '/api/live-map/status',
  LIVE_MAP_SNAPSHOT: '/api/live-map/snapshot',
  LIVE_MAP_STATS: '/api/live-map/stats',
  LIVE_MAP_NODES: '/api/live-map/nodes',
  LIVE_MAP_COVERAGE: '/api/live-map/coverage',
  LIVE_MAP_LOS: '/api/live-map/los',
  LIVE_MAP_LOS_ELEVATIONS: '/api/live-map/los/elevations',
  LIVE_MAP_WEATHER_RADAR_COUNTRY_BOUNDS: '/api/live-map/weather/radar/country-bounds',
} as const;

// =============================================================================
// Network Configuration
// =============================================================================

export const ONLINE_THRESHOLD_MS = 15 * 60 * 1000;
export const REPEATER_ONLINE_THRESHOLD_MS = 12 * 60 * 60 * 1000;
export const MAP_VISIBILITY_THRESHOLD_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_REFRESH_INTERVAL = 60000;

// =============================================================================
// UI Constants
// =============================================================================

export const NODE_TYPES = ['node', 'companion', 'repeater', 'room_server', 'router', 'gateway'] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  node: 'Node',
  companion: 'Companion',
  repeater: 'Repeater',
  room_server: 'Room Server',
  router: 'Router',
  gateway: 'Gateway',
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  node: 'text-sunset-500 bg-sunset-500/20',
  companion: 'text-mountain-500 bg-mountain-500/20',
  repeater: 'text-forest-500 bg-forest-500/20',
  room_server: 'text-mesh bg-mesh/20',
  router: 'text-mountain-500 bg-mountain-500/20',
  gateway: 'text-mesh bg-mesh/20',
};

// =============================================================================
// Pagination
// =============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// Validation
// =============================================================================

export const PUBLIC_KEY_LENGTH = 64;
export const MIN_NODE_NAME_LENGTH = 1;
export const MAX_NODE_NAME_LENGTH = 50;
