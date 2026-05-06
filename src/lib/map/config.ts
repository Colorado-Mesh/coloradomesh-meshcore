import { RUNTIME_ENV } from '@/lib/constants';

export interface MapRuntimeConfig {
  mqttUrl: string | null;
  mqttUsername: string | null;
  mqttPassword: string | null;
  mqttTopic: string;
  mqttClientId: string;
  mapTileUrl: string;
  historyEnabled: boolean;
  sampleData: boolean;
  mqttConfigured: boolean;
}

const DEFAULT_MQTT_TOPIC = 'meshcore/#';
const DEFAULT_MQTT_CLIENT_ID = 'colorado-meshcore-site';
const DEFAULT_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

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

export function getMapRuntimeConfig(): MapRuntimeConfig {
  const mqttUrl = readOptionalEnv(RUNTIME_ENV.MQTT_URL);
  const mqttUsername = readOptionalEnv(RUNTIME_ENV.MQTT_USERNAME);
  const mqttPassword = readOptionalEnv(RUNTIME_ENV.MQTT_PASSWORD);
  const mqttTopic = readOptionalEnv(RUNTIME_ENV.MQTT_TOPIC) ?? DEFAULT_MQTT_TOPIC;
  const mqttClientId = readOptionalEnv(RUNTIME_ENV.MQTT_CLIENT_ID) ?? DEFAULT_MQTT_CLIENT_ID;
  const mapTileUrl = readOptionalEnv(RUNTIME_ENV.MAP_TILE_URL) ?? DEFAULT_MAP_TILE_URL;
  const historyEnabled = readBooleanEnv(RUNTIME_ENV.MAP_HISTORY_ENABLED, false);
  const mqttConfigured = Boolean(mqttUrl);
  const sampleData = readBooleanEnv(RUNTIME_ENV.MAP_SAMPLE_DATA, !mqttConfigured);

  return {
    mqttUrl,
    mqttUsername,
    mqttPassword,
    mqttTopic,
    mqttClientId,
    mapTileUrl,
    historyEnabled,
    sampleData,
    mqttConfigured,
  };
}
