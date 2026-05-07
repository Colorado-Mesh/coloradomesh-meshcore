import { getMapRuntimeConfig } from '@/lib/map/config';

import type {
  LiveMapEndpointDefinition,
  LiveMapEndpointId,
  LiveMapProxiedEndpointId,
  LiveMapProxyOptions,
  LiveMapProxyResult,
  LiveMapQueryValidationResult,
} from './types';

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RESPONSE_BYTES = 2_000_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 30_000;
const MIN_RESPONSE_BYTES = 50_000;
const MAX_RESPONSE_BYTES = 10_000_000;
const MAX_ELEVATION_LOCATIONS = 200;
const MAX_ELEVATION_QUERY_LENGTH = 8_000;
const MAX_PEER_LIMIT = 100;

const PROXIED_ENDPOINTS: Record<LiveMapProxiedEndpointId, LiveMapEndpointDefinition> = {
  snapshot: {
    id: 'snapshot',
    label: 'Live-map snapshot',
    localPath: '/api/live-map/snapshot',
    upstreamPath: '/snapshot',
    availability: 'available',
    message: 'Proxy for the upstream live-map full snapshot endpoint.',
  },
  stats: {
    id: 'stats',
    label: 'Live-map stats',
    localPath: '/api/live-map/stats',
    upstreamPath: '/stats',
    availability: 'available',
    message: 'Proxy for upstream decoder and MQTT runtime statistics.',
  },
  nodes: {
    id: 'nodes',
    label: 'Live-map nodes',
    localPath: '/api/live-map/nodes',
    upstreamPath: '/api/nodes',
    availability: 'available',
    message: 'Proxy for upstream node API with mode, format, and updated_since filters.',
  },
  peers: {
    id: 'peers',
    label: 'Live-map peers',
    localPath: '/api/live-map/peers/[deviceId]',
    upstreamPath: '/peers/{deviceId}',
    availability: 'available',
    message: 'Proxy for upstream rolling peer history by device.',
  },
  los: {
    id: 'los',
    label: 'Line of sight',
    localPath: '/api/live-map/los',
    upstreamPath: '/los',
    availability: 'available',
    message: 'Proxy for upstream line-of-sight calculations.',
  },
  'los-elevations': {
    id: 'los-elevations',
    label: 'Line-of-sight elevations',
    localPath: '/api/live-map/los/elevations',
    upstreamPath: '/los/elevations',
    availability: 'available',
    message: 'Proxy for upstream elevation samples used by LOS tooling.',
  },
  coverage: {
    id: 'coverage',
    label: 'Coverage overlay',
    localPath: '/api/live-map/coverage',
    upstreamPath: '/coverage',
    availability: 'available',
    message: 'Proxy for upstream coverage overlay data when configured in the live-map service.',
  },
  'weather-radar-country-bounds': {
    id: 'weather-radar-country-bounds',
    label: 'Weather radar country bounds',
    localPath: '/api/live-map/weather/radar/country-bounds',
    upstreamPath: '/weather/radar/country-bounds',
    availability: 'available',
    message: 'Proxy for upstream weather radar country bounds lookup.',
  },
};

const DEFERRED_ENDPOINTS: Record<Exclude<LiveMapEndpointId, LiveMapProxiedEndpointId>, LiveMapEndpointDefinition> = {
  websocket: {
    id: 'websocket',
    label: 'Live-map WebSocket stream',
    localPath: '/api/live-map/ws',
    upstreamPath: '/ws',
    availability: 'deferred',
    message: 'Deferred because a browser WebSocket proxy must not expose upstream credentials.',
  },
  debug: {
    id: 'debug',
    label: 'Live-map debug endpoints',
    localPath: '/api/live-map/debug/*',
    upstreamPath: '/debug/*',
    availability: 'deferred',
    message: 'Deferred because upstream debug routes expose development/runtime internals.',
  },
  turnstile: {
    id: 'turnstile',
    label: 'Upstream Turnstile verification',
    localPath: '/api/live-map/verify-turnstile',
    upstreamPath: '/api/verify-turnstile',
    availability: 'deferred',
    message: 'Deferred because this site should not mint upstream browser auth credentials.',
  },
};

export const LIVE_MAP_ENDPOINTS: LiveMapEndpointDefinition[] = [
  ...Object.values(PROXIED_ENDPOINTS),
  ...Object.values(DEFERRED_ENDPOINTS),
];

function readNumberEnv(name: string, defaultValue: number, min: number, max: number): number {
  const value = process.env[name]?.trim();
  if (!value) return defaultValue;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function liveMapTimeoutMs() {
  return readNumberEnv('MESHCORE_LIVE_MAP_PROXY_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS);
}

function liveMapMaxResponseBytes() {
  return readNumberEnv(
    'MESHCORE_LIVE_MAP_PROXY_MAX_RESPONSE_BYTES',
    DEFAULT_MAX_RESPONSE_BYTES,
    MIN_RESPONSE_BYTES,
    MAX_RESPONSE_BYTES
  );
}

function ensureTrailingSlash(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function getLiveMapBaseUrl(): URL | null {
  const config = getMapRuntimeConfig();
  if (!config.liveMapApiUrl) return null;

  try {
    const url = new URL(config.liveMapApiUrl);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';

    if (url.pathname.endsWith('/api/nodes')) {
      url.pathname = ensureTrailingSlash(url.pathname.slice(0, -'/api/nodes'.length));
    } else if (url.pathname.endsWith('/snapshot')) {
      url.pathname = ensureTrailingSlash(url.pathname.slice(0, -'/snapshot'.length));
    } else if (url.pathname.endsWith('/stats')) {
      url.pathname = ensureTrailingSlash(url.pathname.slice(0, -'/stats'.length));
    } else {
      url.pathname = ensureTrailingSlash(url.pathname);
    }

    return url;
  } catch {
    return null;
  }
}

function getLiveMapToken(): string | null {
  return getMapRuntimeConfig().liveMapApiToken;
}

function buildQuery(query: LiveMapProxyOptions['query']): URLSearchParams {
  if (!query) return new URLSearchParams();
  if (query instanceof URLSearchParams) return new URLSearchParams(query);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  return params;
}

function buildUpstreamUrl(endpoint: LiveMapEndpointDefinition, options: LiveMapProxyOptions): URL | null {
  const baseUrl = getLiveMapBaseUrl();
  if (!baseUrl || !endpoint.upstreamPath) return null;

  let path = endpoint.upstreamPath;
  for (const [key, value] of Object.entries(options.pathParams ?? {})) {
    path = path.replaceAll(`{${key}}`, encodeURIComponent(value));
  }

  const url = new URL(path.replace(/^\/+/, ''), baseUrl);
  const query = buildQuery(options.query);
  for (const [key, value] of query) url.searchParams.set(key, value);
  return url;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function upstreamErrorMessage(status: number): string {
  if (status === 401 || status === 403) return 'Live-map upstream rejected the configured credentials';
  if (status === 404) return 'Live-map upstream endpoint is unavailable';
  if (status === 429) return 'Live-map upstream rate limit is active';
  if (status === 503) return 'Live-map upstream feature is not configured';
  return 'Live-map upstream request failed';
}

async function readJsonWithSizeGuard(response: Response): Promise<unknown> {
  const contentLength = response.headers.get('content-length');
  const maxBytes = liveMapMaxResponseBytes();

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error('live_map_response_too_large');
  }

  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error('live_map_response_too_large');
    }
    if (!text.trim()) return null;
    return JSON.parse(text) as unknown;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error('live_map_response_too_large');
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) return null;
  return JSON.parse(text) as unknown;
}

export function getLiveMapEndpointDefinitions(configured = Boolean(getLiveMapBaseUrl())): LiveMapEndpointDefinition[] {
  return LIVE_MAP_ENDPOINTS.map((endpoint) => {
    if (endpoint.availability === 'deferred') return endpoint;

    return {
      ...endpoint,
      availability: configured ? 'available' : 'unavailable',
      message: configured
        ? endpoint.message
        : 'Configure MESHCORE_LIVE_MAP_API_URL to enable this live-map proxy endpoint.',
    };
  });
}

export async function proxyLiveMapEndpoint(
  endpointId: LiveMapProxiedEndpointId,
  options: LiveMapProxyOptions = {}
): Promise<LiveMapProxyResult> {
  const endpoint = PROXIED_ENDPOINTS[endpointId];
  const url = buildUpstreamUrl(endpoint, options);

  if (!url) {
    return {
      ok: false,
      status: 503,
      error: 'Live-map upstream is not configured',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), liveMapTimeoutMs());
  const token = getLiveMapToken();

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: upstreamErrorMessage(response.status),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: await readJsonWithSizeGuard(response),
    };
  } catch (error) {
    return {
      ok: false,
      status: isAbortError(error) ? 504 : error instanceof Error && error.message === 'live_map_response_too_large' ? 502 : 502,
      error: isAbortError(error)
        ? 'Live-map upstream request timed out'
        : error instanceof Error && error.message === 'live_map_response_too_large'
          ? 'Live-map upstream response is too large'
          : 'Live-map upstream request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function appendIfPresent(input: URLSearchParams, output: URLSearchParams, key: string) {
  const value = input.get(key)?.trim();
  if (value) output.set(key, value);
}

function readFiniteNumber(input: URLSearchParams, key: string): number | null {
  const value = input.get(key);
  if (value === null || value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readRequiredFiniteNumber(input: URLSearchParams, output: URLSearchParams, key: string): boolean {
  const value = readFiniteNumber(input, key);
  if (value === null) return false;

  output.set(key, String(value));
  return true;
}

export function validateNodesQuery(input: URLSearchParams): LiveMapQueryValidationResult {
  const query = new URLSearchParams();
  appendIfPresent(input, query, 'updated_since');

  const mode = input.get('mode')?.trim().toLowerCase();
  if (mode) {
    if (!['full', 'all', 'snapshot'].includes(mode)) return { ok: false, status: 400, error: 'Invalid live-map nodes mode' };
    query.set('mode', mode);
  }

  const format = input.get('format')?.trim().toLowerCase();
  if (format) {
    if (!['nested', 'object', 'wrapped', 'v2'].includes(format)) {
      return { ok: false, status: 400, error: 'Invalid live-map nodes format' };
    }
    query.set('format', format);
  }

  return { ok: true, query };
}

export function validatePeerQuery(input: URLSearchParams): LiveMapQueryValidationResult {
  const query = new URLSearchParams();
  const rawLimit = input.get('limit')?.trim();

  if (rawLimit) {
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PEER_LIMIT) {
      return { ok: false, status: 400, error: 'Invalid live-map peer limit' };
    }
    query.set('limit', String(limit));
  }

  return { ok: true, query };
}

export function validateLosQuery(input: URLSearchParams): LiveMapQueryValidationResult {
  const query = new URLSearchParams();

  for (const key of ['lat1', 'lon1', 'lat2', 'lon2'] as const) {
    if (!readRequiredFiniteNumber(input, query, key)) {
      return { ok: false, status: 400, error: 'Missing or invalid live-map LOS coordinates' };
    }
  }

  for (const key of ['h1', 'h2'] as const) {
    const value = readFiniteNumber(input, key);
    if (value !== null) query.set(key, String(value));
  }

  const profile = input.get('profile')?.trim().toLowerCase();
  if (profile) {
    if (!['1', 'true', '0', 'false'].includes(profile)) {
      return { ok: false, status: 400, error: 'Invalid live-map LOS profile flag' };
    }
    query.set('profile', ['1', 'true'].includes(profile) ? 'true' : 'false');
  }

  return { ok: true, query };
}

export function validateElevationQuery(input: URLSearchParams): LiveMapQueryValidationResult {
  const locations = input.get('locations')?.trim();
  if (!locations) return { ok: false, status: 400, error: 'Missing live-map elevation locations' };
  if (locations.length > MAX_ELEVATION_QUERY_LENGTH) {
    return { ok: false, status: 400, error: 'Live-map elevation locations query is too large' };
  }

  const entries = locations.split('|').filter((entry) => entry.trim());
  if (!entries.length || entries.length > MAX_ELEVATION_LOCATIONS) {
    return { ok: false, status: 400, error: 'Invalid live-map elevation locations count' };
  }

  for (const entry of entries) {
    const [lat, lon, extra] = entry.split(',');
    if (extra !== undefined || !lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
      return { ok: false, status: 400, error: 'Invalid live-map elevation location' };
    }
  }

  return { ok: true, query: new URLSearchParams({ locations }) };
}

export function validateWeatherBoundsQuery(input: URLSearchParams): LiveMapQueryValidationResult {
  const query = new URLSearchParams();

  for (const key of ['lat', 'lon'] as const) {
    if (!readRequiredFiniteNumber(input, query, key)) {
      return { ok: false, status: 400, error: 'Missing or invalid live-map weather coordinates' };
    }
  }

  return { ok: true, query };
}
