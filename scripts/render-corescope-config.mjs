#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const env = process.env;
const outputPath = process.argv[2] || path.join(env.CORESCOPE_CONFIG_DIR || process.cwd(), 'config.json');
const dbPath = env.CORESCOPE_DB_PATH || '/app/corescope/data/meshcore.db';

function text(name, fallback = '') {
  const value = env[name];
  return value == null || value === '' ? fallback : value;
}

function firstFileText(names, fallback = '') {
  for (const name of names) {
    const filePath = env[`${name}_FILE`];
    if (filePath != null && filePath !== '') {
      try {
        return readFileSync(filePath, 'utf8').trim();
      } catch (error) {
        if (error.code !== 'ENOENT') fail(`${name}_FILE could not be read: ${error.message}`);
      }
    }
    if (env[name] != null && env[name] !== '') return env[name];
  }
  return fallback;
}

function int(name, fallback) {
  const raw = env[name];
  if (raw == null || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) fail(`${name} must be an integer`);
  return value;
}

function firstInt(names, fallback) {
  for (const name of names) {
    if (env[name] != null && env[name] !== '') return int(name, fallback);
  }
  return fallback;
}

function number(name, fallback) {
  const raw = env[name];
  if (raw == null || raw === '') return fallback;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) fail(`${name} must be a number`);
  return value;
}

function firstNumber(names, fallback) {
  for (const name of names) {
    if (env[name] != null && env[name] !== '') return number(name, fallback);
  }
  return fallback;
}

function bool(name, fallback) {
  const raw = env[name];
  if (raw == null || raw === '') return fallback;
  if (/^(1|true|yes|on)$/i.test(raw)) return true;
  if (/^(0|false|no|off)$/i.test(raw)) return false;
  fail(`${name} must be true or false`);
}

function list(name, fallback = []) {
  const raw = env[name];
  if (raw == null || raw.trim() === '') return fallback;
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseJsonObject(name, raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object') {
      fail(`${name} must be a JSON object`);
    }
    return parsed;
  } catch (error) {
    fail(`${name} must be valid JSON: ${error.message}`);
  }
}

function jsonObject(name, fallback = {}) {
  const raw = env[name];
  if (raw == null || raw.trim() === '') return fallback;
  return parseJsonObject(name, raw);
}

function fileJsonObject(name, fallback = {}) {
  const raw = firstFileText([name]);
  if (raw.trim() === '') return fallback;
  return parseJsonObject(name, raw);
}

function optionalJsonObject(name) {
  const raw = env[name];
  if (raw == null || raw.trim() === '') return undefined;
  return parseJsonObject(name, raw);
}

function fail(message) {
  console.error(`CoreScope config render failed: ${message}`);
  process.exit(1);
}

function mqttBrokerFromEnv() {
  const explicitBroker = text('CORESCOPE_MQTT_BROKER', text('MESHCORE_MQTT_URL'));
  if (explicitBroker !== '') return explicitBroker;

  const server = text('CORESCOPE_MQTT_SERVER');
  if (server === '') return '';

  const transport = text('CORESCOPE_MQTT_TRANSPORT', 'mqtt').toLowerCase();
  const tlsDefault = ['mqtts', 'ssl', 'tls', 'wss'].includes(transport);
  const tlsEnabled = bool('CORESCOPE_MQTT_TLS_ENABLED', tlsDefault);
  const port = int('CORESCOPE_MQTT_PORT', tlsEnabled ? 8883 : 1883);

  let scheme;
  if (['websocket', 'websockets', 'ws', 'wss'].includes(transport)) {
    scheme = tlsEnabled ? 'wss' : 'ws';
  } else if (['mqtt', 'tcp'].includes(transport)) {
    scheme = tlsEnabled ? 'mqtts' : 'mqtt';
  } else if (['mqtts', 'ssl', 'tls'].includes(transport)) {
    scheme = 'mqtts';
  } else {
    fail('CORESCOPE_MQTT_TRANSPORT must be mqtt, mqtts, tcp, tls, websocket, websockets, ws, or wss');
  }

  return `${scheme}://${server}:${port}`;
}

function tileTemplate(name, fallback) {
  return text(name, fallback)
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')
    .replaceAll('%7b', '{')
    .replaceAll('%7d', '}');
}

const defaultRegion = text('CORESCOPE_DEFAULT_REGION', 'CO');
const defaultChannelKeys = { Public: '8b3387e9c5cdea6ac9e5edbaa115cd72' };
const regions = jsonObject('CORESCOPE_REGIONS_JSON', { [defaultRegion]: 'Colorado, US' });
const defaultTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const tileUrl = tileTemplate('CORESCOPE_TILE_URL', tileTemplate('MESHCORE_MAP_TILE_URL', defaultTileUrl));
const mqttBroker = mqttBrokerFromEnv();
const mqttTopics = list('CORESCOPE_MQTT_TOPICS', list('MESHCORE_MQTT_TOPIC', ['meshcore/#']));
const mqttSourcesJson = env.CORESCOPE_MQTT_SOURCES_JSON;

let mqttSources = [];
if (mqttSourcesJson && mqttSourcesJson.trim() !== '') {
  try {
    const parsed = JSON.parse(mqttSourcesJson);
    if (!Array.isArray(parsed)) fail('CORESCOPE_MQTT_SOURCES_JSON must be a JSON array');
    mqttSources = parsed;
  } catch (error) {
    fail(`CORESCOPE_MQTT_SOURCES_JSON must be valid JSON: ${error.message}`);
  }
} else if (mqttBroker !== '') {
  const source = {
    name: text('CORESCOPE_MQTT_SOURCE_NAME', 'colorado-mesh'),
    broker: mqttBroker,
    topics: mqttTopics,
    region: text('CORESCOPE_MQTT_REGION', defaultRegion),
    connectTimeoutSec: int('CORESCOPE_MQTT_CONNECT_TIMEOUT_SEC', 45),
  };
  const username = firstFileText(['CORESCOPE_MQTT_USERNAME', 'MESHCORE_MQTT_USERNAME']);
  const password = firstFileText(['CORESCOPE_MQTT_PASSWORD', 'MESHCORE_MQTT_PASSWORD']);
  const iataFilter = list('CORESCOPE_MQTT_IATA_FILTER');
  if (username !== '') source.username = username;
  if (password !== '') source.password = password;
  if (iataFilter.length > 0) source.iataFilter = iataFilter;
  if ('CORESCOPE_MQTT_REJECT_UNAUTHORIZED' in env) {
    source.rejectUnauthorized = bool('CORESCOPE_MQTT_REJECT_UNAUTHORIZED', true);
  }
  mqttSources = [source];
}

const config = {
  port: int('CORESCOPE_PORT', 3002),
  apiKey: text('CORESCOPE_API_KEY'),
  dbPath,
  branding: {
    siteName: text('CORESCOPE_BRAND_SITE_NAME', 'Colorado Mesh CoreScope'),
    tagline: text('CORESCOPE_BRAND_TAGLINE', 'Live Colorado Mesh network analyzer'),
    logoUrl: text('CORESCOPE_BRAND_LOGO_URL') || null,
    faviconUrl: text('CORESCOPE_BRAND_FAVICON_URL') || null,
  },
  home: {
    heroTitle: text('CORESCOPE_HOME_HERO_TITLE', 'Colorado Mesh CoreScope'),
    heroSubtitle: text('CORESCOPE_HOME_HERO_SUBTITLE', 'Live MeshCore network visibility for Colorado operators.'),
    footerLinks: [
      { label: 'Live Map', url: '#/live' },
      { label: 'Network Map', url: '#/map' },
      { label: 'Packets', url: '#/packets' },
      { label: 'Nodes', url: '#/nodes' },
    ],
  },
  defaultRegion,
  mapDefaults: {
    center: [
      firstNumber(['CORESCOPE_MAP_CENTER_LAT', 'MESHCORE_MAP_DEFAULT_LATITUDE'], 39.5501),
      firstNumber(['CORESCOPE_MAP_CENTER_LON', 'MESHCORE_MAP_DEFAULT_LONGITUDE'], -105.7821),
    ],
    zoom: firstInt(['CORESCOPE_MAP_ZOOM', 'MESHCORE_MAP_DEFAULT_ZOOM'], 7),
  },
  regions,
  tiles: {
    light: tileTemplate('CORESCOPE_TILE_LIGHT_URL', tileUrl),
    dark: tileTemplate('CORESCOPE_TILE_DARK_URL', tileUrl),
  },
  mqttSources,
  observerIATAWhitelist: list('CORESCOPE_OBSERVER_IATA_WHITELIST'),
  nodeBlacklist: list('CORESCOPE_NODE_BLACKLIST'),
  observerBlacklist: list('CORESCOPE_OBSERVER_BLACKLIST'),
  retention: {
    nodeDays: int('CORESCOPE_RETENTION_NODE_DAYS', 7),
    observerDays: int('CORESCOPE_RETENTION_OBSERVER_DAYS', 14),
    packetDays: int('CORESCOPE_RETENTION_PACKET_DAYS', 30),
    metricsDays: int('CORESCOPE_RETENTION_METRICS_DAYS', 30),
  },
  db: {
    vacuumOnStartup: bool('CORESCOPE_DB_VACUUM_ON_STARTUP', false),
    incrementalVacuumPages: int('CORESCOPE_DB_INCREMENTAL_VACUUM_PAGES', 1024),
  },
  packetStore: {
    maxMemoryMB: int('CORESCOPE_PACKET_STORE_MAX_MEMORY_MB', 256),
    retentionHours: int('CORESCOPE_PACKET_STORE_RETENTION_HOURS', 168),
  },
  liveMap: {
    propagationBufferMs: int('CORESCOPE_LIVE_MAP_PROPAGATION_BUFFER_MS', 5000),
  },
  timestamps: {
    defaultMode: text('CORESCOPE_TIMESTAMPS_DEFAULT_MODE', 'ago'),
    timezone: text('CORESCOPE_TIMESTAMPS_TIMEZONE', 'local'),
    formatPreset: text('CORESCOPE_TIMESTAMPS_FORMAT_PRESET', 'iso'),
    customFormat: text('CORESCOPE_TIMESTAMPS_CUSTOM_FORMAT'),
    allowCustomFormat: bool('CORESCOPE_TIMESTAMPS_ALLOW_CUSTOM_FORMAT', false),
  },
  healthThresholds: {
    infraDegradedHours: number('CORESCOPE_HEALTH_INFRA_DEGRADED_HOURS', 24),
    infraSilentHours: number('CORESCOPE_HEALTH_INFRA_SILENT_HOURS', 72),
    nodeDegradedHours: number('CORESCOPE_HEALTH_NODE_DEGRADED_HOURS', 1),
    nodeSilentHours: number('CORESCOPE_HEALTH_NODE_SILENT_HOURS', 24),
    relayActiveHours: number('CORESCOPE_HEALTH_RELAY_ACTIVE_HOURS', 24),
  },
  channelKeys: fileJsonObject('CORESCOPE_CHANNEL_KEYS_JSON', defaultChannelKeys),
  hashChannels: list('CORESCOPE_HASH_CHANNELS'),
};

const geoFilter = optionalJsonObject('CORESCOPE_GEO_FILTER_JSON');
if (geoFilter) config.geo_filter = geoFilter;

const foreignAdvertsMode = text('CORESCOPE_FOREIGN_ADVERTS_MODE');
if (foreignAdvertsMode !== '') config.foreignAdverts = { mode: foreignAdvertsMode };

const validateSignatures = env.CORESCOPE_VALIDATE_SIGNATURES;
if (validateSignatures != null && validateSignatures !== '') {
  config.validateSignatures = bool('CORESCOPE_VALIDATE_SIGNATURES', true);
}

writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
console.log(`CoreScope config rendered: ${outputPath} (${mqttSources.length} MQTT source${mqttSources.length === 1 ? '' : 's'})`);
