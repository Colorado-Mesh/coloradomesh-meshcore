import { afterEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'MESHCORE_LIVE_MAP_API_URL',
  'MESHCORE_LIVE_MAP_API_TOKEN',
  'MESHCORE_LIVE_MAP_PROXY_TIMEOUT_MS',
  'MESHCORE_LIVE_MAP_PROXY_MAX_RESPONSE_BYTES',
  'MESHCORE_LIVE_MAP_PUBLIC_TOKEN_PROXY_ENABLED',
  'MESHCORE_LIVE_MAP_ALLOW_PRIVATE_URLS',
  'MESHCORE_MAP_SAMPLE_DATA',
  'MESHCORE_MQTT_URL',
] as const;

async function loadClientModule() {
  vi.resetModules();
  return import('../client');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('live-map proxy client', () => {
  it('proxies configured endpoints with bearer auth only when public token proxying is opted in', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://user:pass@live-map.example.test/api/nodes?token=leaky';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_LIVE_MAP_PUBLIC_TOKEN_PROXY_ENABLED = 'true';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('snapshot');

    expect(result).toEqual({ ok: true, status: 200, data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('https://live-map.example.test/snapshot');
    expect(url.toString()).not.toContain('user:pass');
    expect(url.toString()).not.toContain('token=leaky');
    expect(init.headers).toEqual(expect.objectContaining({ authorization: 'Bearer secret-token' }));
  });

  it('blocks public token-backed proxy requests by default but allows local fallback handling', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { canUseLocalLiveMapFallback, proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('stats');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toContain('Public live-map token proxying is disabled');
    }
    expect(canUseLocalLiveMapFallback(result)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects private live-map upstream URLs unless override is explicitly enabled', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'http://127.0.0.1:8080/api/nodes';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { getLiveMapBaseUrl, proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('nodes');

    expect(getLiveMapBaseUrl()).toBeNull();
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Live-map upstream is not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows private production live-map upstream URLs only with explicit override', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.MESHCORE_LIVE_MAP_API_URL = 'http://127.0.0.1:8080/api/nodes';
    process.env.MESHCORE_LIVE_MAP_ALLOW_PRIVATE_URLS = 'true';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('nodes');

    expect(result).toEqual({ ok: true, status: 200, data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('http://127.0.0.1:8080/api/nodes');
  });

  it.each([
    'http://[::1]:8080/api/nodes',
    'http://[fe80::1]:8080/api/nodes',
    'http://[fc00::1]:8080/api/nodes',
    'http://[::ffff:127.0.0.1]:8080/api/nodes',
    'http://169.254.169.254/api/nodes',
    'http://metadata.google.internal/api/nodes',
  ])('rejects private live-map upstream URL %s', async (url) => {
    process.env.MESHCORE_LIVE_MAP_API_URL = url;
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const { getLiveMapBaseUrl } = await loadClientModule();
    expect(getLiveMapBaseUrl()).toBeNull();
  });

  it('preserves upstream app base paths when deriving advanced endpoint URLs', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/livemap/api/nodes';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('coverage');

    expect(result).toEqual({ ok: true, status: 200, data: { ok: true } });
    const [url] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('https://live-map.example.test/livemap/coverage');
  });

  it('returns safe unavailable status when upstream is not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('stats');

    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Live-map upstream is not configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redacts thrown upstream errors and allows local fallback handling', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://user:pass@live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_LIVE_MAP_PUBLIC_TOKEN_PROXY_ENABLED = 'true';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Request failed for https://user:pass@live-map.example.test/api/nodes?token=secret-token');
      })
    );

    const { canUseLocalLiveMapFallback, proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('nodes');
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: 'Live-map upstream request failed',
    });
    expect(canUseLocalLiveMapFallback(result)).toBe(true);
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('user:pass');
    expect(serialized).not.toContain('live-map.example.test');
  });

  it('guards oversized upstream responses while streaming without content-length', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_PROXY_MAX_RESPONSE_BYTES = '50000';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ payload: 'x'.repeat(30_000) }).slice(0, 30_000)));
        controller.enqueue(new TextEncoder().encode('x'.repeat(30_000)));
        controller.close();
      },
    });

    vi.stubGlobal('fetch', vi.fn(async () => new Response(stream, { status: 200 })));

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('snapshot');

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: 'Live-map upstream response is too large',
    });
  });

  it('rejects upstream redirects instead of following them', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { proxyLiveMapEndpoint } = await loadClientModule();
    const result = await proxyLiveMapEndpoint('snapshot');

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: 'Live-map upstream redirects are not allowed',
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }));
  });

  it('validates and whitelists supported query parameters', async () => {
    const {
      validateElevationQuery,
      validateLosQuery,
      validateNodesQuery,
      validatePeerQuery,
      validateWeatherBoundsQuery,
    } = await loadClientModule();

    const nodes = validateNodesQuery(new URLSearchParams('mode=full&format=nested&ignored=true'));
    expect(nodes.ok && nodes.query.toString()).toBe('mode=full&format=nested');

    const peer = validatePeerQuery(new URLSearchParams('limit=8'));
    expect(peer.ok && peer.query.toString()).toBe('limit=8');
    expect(validatePeerQuery(new URLSearchParams('limit=101'))).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid live-map peer limit',
    });

    const los = validateLosQuery(new URLSearchParams('lat1=39&lon1=-105&lat2=40&lon2=-104&profile=1&h1=2'));
    expect(los.ok && los.query.toString()).toBe('lat1=39&lon1=-105&lat2=40&lon2=-104&h1=2&profile=true');
    expect(validateLosQuery(new URLSearchParams('lat1=91&lon1=-105&lat2=40&lon2=-104'))).toEqual({
      ok: false,
      status: 400,
      error: 'Missing or invalid live-map LOS coordinates',
    });
    expect(validateLosQuery(new URLSearchParams('lat1=39&lon1=-105&lat2=40&lon2=-104&h1=-1'))).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid live-map LOS antenna height',
    });

    const elevations = validateElevationQuery(new URLSearchParams('locations=39,-105|40,-104'));
    expect(elevations.ok && elevations.query.toString()).toBe('locations=39%2C-105%7C40%2C-104');
    expect(validateElevationQuery(new URLSearchParams('locations=91,-105'))).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid live-map elevation location',
    });

    const weather = validateWeatherBoundsQuery(new URLSearchParams('lat=39&lon=-105'));
    expect(weather.ok && weather.query.toString()).toBe('lat=39&lon=-105');
    expect(validateWeatherBoundsQuery(new URLSearchParams('lat=39&lon=-181'))).toEqual({
      ok: false,
      status: 400,
      error: 'Missing or invalid live-map weather coordinates',
    });
  });

  it('reports local fallback endpoint metadata without requiring an upstream', async () => {
    const { getLiveMapEndpointDefinitions } = await loadClientModule();
    const endpoints = getLiveMapEndpointDefinitions();

    for (const id of ['stats', 'peers', 'los', 'los-elevations', 'coverage', 'weather-radar-country-bounds']) {
      expect(endpoints).toContainEqual(expect.objectContaining({ id, availability: 'available' }));
    }
    expect(endpoints).toContainEqual(expect.objectContaining({ id: 'snapshot', availability: 'unavailable' }));
    expect(endpoints).toContainEqual(expect.objectContaining({ id: 'nodes', availability: 'unavailable' }));
  });

  it('reports deferred and configured endpoint metadata without upstream secrets', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://user:pass@live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const { getLiveMapEndpointDefinitions } = await loadClientModule();
    const endpoints = getLiveMapEndpointDefinitions();
    const serialized = JSON.stringify(endpoints);

    expect(endpoints).toContainEqual(expect.objectContaining({ id: 'snapshot', availability: 'available' }));
    expect(endpoints).toContainEqual(expect.objectContaining({ id: 'websocket', availability: 'deferred' }));
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('live-map.example.test');
    expect(serialized).not.toContain('user:pass');
  });
});
