import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'MESHCORE_LIVE_MAP_API_URL',
  'MESHCORE_LIVE_MAP_API_TOKEN',
  'MESHCORE_LIVE_MAP_ALLOW_PRIVATE_URLS',
  'MESHCORE_MAP_SAMPLE_DATA',
  'MESHCORE_MQTT_URL',
] as const;

async function loadStoreModule() {
  vi.resetModules();
  return import('../store');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('map snapshot store', () => {
  it('sends live-map API token as bearer auth, not a URL query parameter', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ nodes: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();

    expect(snapshot.source.type).toBe('live_map_api');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toContain('mode=full');
    expect(url.toString()).not.toContain('secret-token');
    expect(url.toString()).not.toContain('token=');
    expect(init.headers).toEqual(expect.objectContaining({ authorization: 'Bearer secret-token' }));
  });

  it('drops configured live-map API query parameters before fetching', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes?token=query-secret&debug=true';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ nodes: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { getMapSnapshot } = await loadStoreModule();
    await getMapSnapshot();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('https://live-map.example.test/api/nodes?mode=full');
    expect(init.headers).toEqual(expect.objectContaining({ authorization: 'Bearer secret-token' }));
  });

  it('rejects private live-map API snapshot URLs before fetching', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'http://127.0.0.1:8080/api/nodes';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();

    expect(snapshot.source.type).toBe('live_map_api');
    expect(snapshot.connection.state).toBe('error');
    expect(snapshot.connection.message).toContain('Unable to fetch live map API data');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows private production live-map API snapshot URLs with explicit override', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.MESHCORE_LIVE_MAP_API_URL = 'http://127.0.0.1:8080/api/nodes';
    process.env.MESHCORE_LIVE_MAP_ALLOW_PRIVATE_URLS = 'true';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ nodes: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();

    expect(snapshot.source.type).toBe('live_map_api');
    expect(snapshot.connection.state).toBe('connected');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the hardened live-map fetch path for direct snapshot refreshes', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    const fetchMock = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();

    expect(snapshot.source.type).toBe('live_map_api');
    expect(snapshot.connection.state).toBe('error');
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }));
  });

  it('does not return sample nodes when no real source is configured', async () => {
    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();

    expect(snapshot.source.type).toBe('empty');
    expect(snapshot.connection.sampleData).toBe(false);
    expect(snapshot.nodes).toEqual([]);
  });

  it('derives compatibility node and stat helpers from the canonical snapshot', async () => {
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'true';

    const { getMapNodes, getMapSnapshot, getMapStats } = await loadStoreModule();
    const snapshot = await getMapSnapshot();
    const nodes = await getMapNodes();
    const stats = await getMapStats();

    expect(nodes).toEqual(snapshot.nodes);
    expect(stats).toEqual(snapshot.stats);
    expect(snapshot.warnings.length).toBeGreaterThan(0);
    expect(snapshot.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'live-map-snapshot' }),
      ])
    );
  });

  it('does not expose live-map upstream URL or credentials in snapshot JSON', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://user:pass@live-map.internal.example.test/api/nodes?existing=secret';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ nodes: [] }), { status: 200 })));

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('live-map.internal.example.test');
    expect(serialized).not.toContain('user:pass');
    expect(serialized).not.toContain('existing=secret');
  });

  it('redacts live-map fetch error messages before returning snapshots', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://user:pass@live-map.internal.example.test/api/nodes?existing=secret';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'false';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Request failed for https://user:pass@live-map.internal.example.test/api/nodes?existing=secret');
      })
    );

    const { getMapSnapshot } = await loadStoreModule();
    const snapshot = await getMapSnapshot();
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.connection.message).toContain('Unable to fetch live map API data');
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('live-map.internal.example.test');
    expect(serialized).not.toContain('user:pass');
    expect(serialized).not.toContain('existing=secret');
  });
});
