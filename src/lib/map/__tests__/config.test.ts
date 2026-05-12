import { afterEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = [
  'MESHCORE_LIVE_MAP_API_URL',
  'MESHCORE_LIVE_MAP_API_TOKEN',
  'MESHCORE_LIVE_MAP_API_REFRESH_SECONDS',
  'MESHCORE_MQTT_URL',
  'MESHCORE_MQTT_USERNAME',
  'MESHCORE_MQTT_PASSWORD',
  'MESHCORE_MQTT_TOPIC',
  'MESHCORE_MQTT_CLIENT_ID',
  'MESHCORE_MAP_TILE_URL',
  'NEXT_PUBLIC_MAP_TILE_URL',
  'MESHCORE_MAP_TILE_ATTRIBUTION',
  'MESHCORE_MAP_DEFAULT_LATITUDE',
  'MESHCORE_MAP_DEFAULT_LONGITUDE',
  'MESHCORE_MAP_DEFAULT_ZOOM',
  'MESHCORE_MAP_HISTORY_ENABLED',
  'MESHCORE_MAP_SAMPLE_DATA',
  'MESHCORE_MAP_DEMO_MODE',
] as const;

async function loadConfigModule() {
  vi.resetModules();
  return import('../config');
}

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  vi.unstubAllEnvs();
});

describe('map runtime config', () => {
  it('returns only browser-safe public runtime config fields', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/api/nodes';
    process.env.MESHCORE_LIVE_MAP_API_TOKEN = 'secret-token';
    process.env.MESHCORE_MAP_TILE_URL = 'https://tiles.example.test/{z}/{x}/{y}.png';
    process.env.MESHCORE_MAP_TILE_ATTRIBUTION = 'Tiles Example';
    process.env.MESHCORE_MAP_DEFAULT_LATITUDE = '39.7';
    process.env.MESHCORE_MAP_DEFAULT_LONGITUDE = '-104.9';
    process.env.MESHCORE_MAP_DEFAULT_ZOOM = '9';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig).toEqual(
      expect.objectContaining({
        tileUrl: 'https://tiles.example.test/{z}/{x}/{y}.png',
        tileAttribution: 'Tiles Example',
        defaultCenter: { latitude: 39.7, longitude: -104.9, altitudeMeters: null },
        defaultZoom: 9,
        sampleData: false,
        sourceLabel: 'Colorado Mesh analyzer node API',
      })
    );
    expect(JSON.stringify(runtimeConfig)).not.toContain('secret-token');
  });

  it('falls back to legacy public tile URL for existing deployments', async () => {
    process.env.NEXT_PUBLIC_MAP_TILE_URL = 'https://legacy.example.test/{z}/{x}/{y}.png';

    const { getMapRuntimeConfig } = await loadConfigModule();

    expect(getMapRuntimeConfig().mapTileUrl).toBe('https://legacy.example.test/{z}/{x}/{y}.png');
  });

  it('falls back from unsafe public runtime config values', async () => {
    process.env.MESHCORE_MAP_TILE_URL = 'javascript:alert(1)';
    process.env.MESHCORE_MAP_TILE_ATTRIBUTION = '<a href=data:text/html,alert(1)>Bad Tiles</a>';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig.tileUrl).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(runtimeConfig.tileAttribution).toBe(
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    );
  });

  it('allows plain text and http tile attribution links only', async () => {
    process.env.MESHCORE_MAP_TILE_ATTRIBUTION = 'Tiles by <a href="https://tiles.example.test/legal">Example</a>';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    expect(getMapPublicRuntimeConfig().tileAttribution).toBe('Tiles by <a href="https://tiles.example.test/legal">Example</a>');
  });

  it('uses the configured analyzer API without sample data in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://analyzer.meshcore.coloradomesh.org/api/nodes';

    const { getMapRuntimeConfig, getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapRuntimeConfig();
    const publicRuntimeConfig = getMapPublicRuntimeConfig(runtimeConfig);

    expect(runtimeConfig.liveMapApiConfigured).toBe(true);
    expect(publicRuntimeConfig.sampleData).toBe(false);
    expect(publicRuntimeConfig.sourceLabel).toBe('Colorado Mesh analyzer node API');
    expect(publicRuntimeConfig.warnings).toEqual([]);
    expect(publicRuntimeConfig.features).toContainEqual(
      expect.objectContaining({
        id: 'advanced-live-map-proxy',
        status: 'available',
      })
    );
  });

  it('labels sidecar live-map sources separately from analyzer node feeds', async () => {
    process.env.MESHCORE_LIVE_MAP_API_URL = 'https://live-map.example.test/snapshot';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();

    expect(getMapPublicRuntimeConfig().sourceLabel).toBe('meshcore-mqtt-live-map API');
  });

  it('does not label advanced live-map operator features available without a configured source', async () => {
    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig.features).toContainEqual(
      expect.objectContaining({
        id: 'advanced-live-map-proxy',
        status: 'unavailable',
      })
    );
  });

  it('does not enable sample data when no source is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig.sampleData).toBe(false);
    expect(runtimeConfig.sourceLabel).toBe('No map source configured');
    expect(runtimeConfig.warnings).toEqual([]);
  });

  it('warns when sample data is explicitly enabled in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'true';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig.sampleData).toBe(true);
    expect(runtimeConfig.warnings).toContainEqual(
      expect.objectContaining({
        id: 'map-production-sample-data',
        severity: 'warning',
      })
    );
  });

  it('uses informational warning for explicit demo mode', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.MESHCORE_MAP_SAMPLE_DATA = 'true';
    process.env.MESHCORE_MAP_DEMO_MODE = 'true';

    const { getMapPublicRuntimeConfig } = await loadConfigModule();
    const runtimeConfig = getMapPublicRuntimeConfig();

    expect(runtimeConfig.warnings).toContainEqual(
      expect.objectContaining({
        id: 'map-demo-data',
        severity: 'info',
      })
    );
  });
});
