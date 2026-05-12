import { RUNTIME_ENV } from '@/lib/constants';

import type { MapAdvancedFeature, MapRuntimePublicConfig, MapSnapshotWarning } from './types';

export interface MapRuntimeConfig {
  liveMapApiUrl: string | null;
  liveMapApiToken: string | null;
  liveMapApiRefreshSeconds: number;
  liveMapApiConfigured: boolean;
  mqttUrl: string | null;
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttTopic: string;
  mqttClientId: string;
  mapTileUrl: string;
  mapTileAttribution: string;
  mapDefaultLatitude: number;
  mapDefaultLongitude: number;
  mapDefaultZoom: number;
  historyEnabled: boolean;
  sampleData: boolean;
  demoMode: boolean;
  mqttConfigured: boolean;
}

const DEFAULT_LIVE_MAP_API_REFRESH_SECONDS = 30;
const DEFAULT_MQTT_TOPIC = 'meshcore/#';
const DEFAULT_MQTT_CLIENT_ID = 'colorado-meshcore-site';
const DEFAULT_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_MAP_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_MAP_LATITUDE = 39.5501;
const DEFAULT_MAP_LONGITUDE = -105.7821;
const DEFAULT_MAP_ZOOM = 7;

function readOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;

  return defaultValue;
}

function readNumberEnv(name: string, defaultValue: number): number {
  const value = process.env[name]?.trim();
  if (!value) return defaultValue;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function normalizeTileUrl(value: string): string {
  const probe = value
    .replaceAll('{s}', 'a')
    .replaceAll('{z}', '0')
    .replaceAll('{x}', '0')
    .replaceAll('{y}', '0')
    .replaceAll('{r}', '');

  try {
    const url = new URL(probe);
    if (!['http:', 'https:'].includes(url.protocol)) return DEFAULT_MAP_TILE_URL;
    if (url.username || url.password) return DEFAULT_MAP_TILE_URL;
    return value;
  } catch {
    return DEFAULT_MAP_TILE_URL;
  }
}

function normalizeTileAttribution(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('<script') || lower.includes('javascript:')) return DEFAULT_MAP_TILE_ATTRIBUTION;
  if (/\son[a-z]+\s*=/.test(lower)) return DEFAULT_MAP_TILE_ATTRIBUTION;

  const withoutAllowedLinks = value.replace(/<a\s+href\s*=\s*(?:"https?:\/\/[^">]+"|'https?:\/\/[^'>]+'|https?:\/\/[^\s>]+)\s*>|<\/a>/gi, '');
  if (/[<>]/.test(withoutAllowedLinks)) return DEFAULT_MAP_TILE_ATTRIBUTION;

  return value;
}

function buildMapWarnings(config: Pick<MapRuntimeConfig, 'demoMode' | 'sampleData'>): MapSnapshotWarning[] {
  if (!config.sampleData) return [];
  if (config.demoMode) {
    return [
      {
        id: 'map-demo-data',
        severity: 'info',
        message: 'Demo map data is enabled intentionally.',
      },
    ];
  }

  if (process.env.NODE_ENV === 'production') {
    return [
      {
        id: 'map-production-sample-data',
        severity: 'warning',
        message: 'Sample map data is active in production because no live map source is configured.',
      },
    ];
  }

  return [
    {
      id: 'map-sample-data',
      severity: 'info',
      message: 'Sample map data is active until a live map source is configured.',
    },
  ];
}

function isAnalyzerNodeFeed(config: Pick<MapRuntimeConfig, 'liveMapApiUrl'>): boolean {
  if (!config.liveMapApiUrl) return false;

  try {
    const url = new URL(config.liveMapApiUrl);
    return url.pathname.endsWith('/api/nodes');
  } catch {
    return false;
  }
}

function liveMapSourceLabel(config: Pick<MapRuntimeConfig, 'liveMapApiConfigured' | 'liveMapApiUrl'>): string {
  if (!config.liveMapApiConfigured) return 'No map source configured';
  return isAnalyzerNodeFeed(config) ? 'Colorado Mesh analyzer node API' : 'meshcore-mqtt-live-map API';
}

function buildMapFeatures(config: Pick<MapRuntimeConfig, 'liveMapApiConfigured'>): MapAdvancedFeature[] {
  return [
    {
      id: 'live-map-snapshot',
      label: 'Live map snapshot',
      status: config.liveMapApiConfigured ? 'available' : 'unavailable',
      message: config.liveMapApiConfigured
        ? 'Live map API snapshot data is configured.'
        : 'Configure the live-map upstream on the server to enable live map snapshot data.',
    },
    {
      id: 'advanced-live-map-proxy',
      label: 'Advanced live-map operator endpoints',
      status: config.liveMapApiConfigured ? 'available' : 'unavailable',
      message: config.liveMapApiConfigured
        ? 'Operator endpoints are available from the configured map source with local fallbacks when upstream only provides node data.'
        : 'Configure a live-map upstream to enable operator endpoints with local fallbacks.',
    },
  ];
}

export function getMapWarnings(config: Pick<MapRuntimeConfig, 'demoMode' | 'sampleData'>): MapSnapshotWarning[] {
  return buildMapWarnings(config);
}

export function getMapFeatures(config: Pick<MapRuntimeConfig, 'liveMapApiConfigured' | 'liveMapApiUrl'>): MapAdvancedFeature[] {
  return buildMapFeatures(config);
}

export function getMapPublicRuntimeConfig(config = getMapRuntimeConfig()): MapRuntimePublicConfig {
  return {
    tileUrl: config.mapTileUrl,
    tileAttribution: config.mapTileAttribution,
    defaultCenter: {
      latitude: config.mapDefaultLatitude,
      longitude: config.mapDefaultLongitude,
      altitudeMeters: null,
    },
    defaultZoom: config.mapDefaultZoom,
    sampleData: config.sampleData,
    demoMode: config.demoMode,
    sourceLabel: config.sampleData
      ? config.demoMode
        ? 'Demo map data'
        : 'Sample map data'
      : config.liveMapApiConfigured
        ? liveMapSourceLabel(config)
        : config.mqttConfigured
          ? 'MQTT map data'
          : 'No map source configured',
    warnings: buildMapWarnings(config),
    features: buildMapFeatures(config),
  };
}

export function getMapRuntimeConfig(): MapRuntimeConfig {
  const liveMapApiUrl = readOptionalEnv(RUNTIME_ENV.LIVE_MAP_API_URL);
  const liveMapApiToken = readOptionalEnv(RUNTIME_ENV.LIVE_MAP_API_TOKEN);
  const liveMapApiRefreshSeconds = Math.max(
    5,
    readNumberEnv(RUNTIME_ENV.LIVE_MAP_API_REFRESH_SECONDS, DEFAULT_LIVE_MAP_API_REFRESH_SECONDS)
  );
  const mqttUrl = readOptionalEnv(RUNTIME_ENV.MQTT_URL);
  const mqttUsername = readOptionalEnv(RUNTIME_ENV.MQTT_USERNAME);
  const mqttPassword = readOptionalEnv(RUNTIME_ENV.MQTT_PASSWORD);
  const mqttTopic = readOptionalEnv(RUNTIME_ENV.MQTT_TOPIC) ?? DEFAULT_MQTT_TOPIC;
  const mqttClientId = readOptionalEnv(RUNTIME_ENV.MQTT_CLIENT_ID) ?? DEFAULT_MQTT_CLIENT_ID;
  const mapTileUrl = normalizeTileUrl(
    readOptionalEnv(RUNTIME_ENV.MAP_TILE_URL)
      ?? readOptionalEnv(RUNTIME_ENV.LEGACY_PUBLIC_MAP_TILE_URL)
      ?? DEFAULT_MAP_TILE_URL
  );
  const mapTileAttribution = normalizeTileAttribution(
    readOptionalEnv(RUNTIME_ENV.MAP_TILE_ATTRIBUTION) ?? DEFAULT_MAP_TILE_ATTRIBUTION
  );
  const mapDefaultLatitude = readNumberEnv(RUNTIME_ENV.MAP_DEFAULT_LATITUDE, DEFAULT_MAP_LATITUDE);
  const mapDefaultLongitude = readNumberEnv(RUNTIME_ENV.MAP_DEFAULT_LONGITUDE, DEFAULT_MAP_LONGITUDE);
  const mapDefaultZoom = Math.max(1, Math.min(18, Math.round(readNumberEnv(RUNTIME_ENV.MAP_DEFAULT_ZOOM, DEFAULT_MAP_ZOOM))));
  const historyEnabled = readBooleanEnv(RUNTIME_ENV.MAP_HISTORY_ENABLED, false);
  const liveMapApiConfigured = Boolean(liveMapApiUrl);
  const mqttConfigured = Boolean(mqttUrl);
  const sampleData = !liveMapApiConfigured && !mqttConfigured && readBooleanEnv(RUNTIME_ENV.MAP_SAMPLE_DATA, false);
  const demoMode = readBooleanEnv(RUNTIME_ENV.MAP_DEMO_MODE, false);

  return {
    liveMapApiUrl,
    liveMapApiToken,
    liveMapApiRefreshSeconds,
    liveMapApiConfigured,
    mqttUrl,
    mqttUsername,
    mqttPassword,
    mqttTopic,
    mqttClientId,
    mapTileUrl,
    mapTileAttribution,
    mapDefaultLatitude,
    mapDefaultLongitude,
    mapDefaultZoom,
    historyEnabled,
    sampleData,
    demoMode,
    mqttConfigured,
  };
}
