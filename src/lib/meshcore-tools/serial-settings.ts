import type { SerialAction, SerialActionStep } from '@/lib/tools/serial-commands';

export interface SerialSettingsPlanSuccess {
  ok: true;
  action: SerialAction;
  warnings: string[];
  unsupportedKeys: string[];
}

export interface SerialSettingsPlanFailure {
  ok: false;
  errors: string[];
}

export type SerialSettingsPlanResult = SerialSettingsPlanSuccess | SerialSettingsPlanFailure;

type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const PRIVATE_KEY_PATTERN = /private|secret|password|prv\.key/i;

export function buildSerialSettingsPlan(input: string | unknown): SerialSettingsPlanResult {
  const parsed = parseInput(input);
  if (!parsed.ok) return parsed;

  const settings = parsed.value;
  const errors: string[] = [];
  const warnings: string[] = [];
  const unsupportedKeys: string[] = [];
  const steps: SerialActionStep[] = [];

  if (containsBlockedKey(settings)) {
    errors.push('Settings JSON includes private/secret/password fields that cannot be applied from the browser.');
  }

  const name = readString(settings.name);
  if (name !== undefined) {
    if (isSafeText(name, 23)) {
      steps.push(send(`set name ${name}`));
    } else {
      errors.push('Name must be 1–23 printable characters without control characters.');
    }
  }

  const radio = readRecord(settings.radio_settings);
  if (radio) {
    const frequency = readInteger(radio.frequency);
    if (frequency !== undefined) {
      if (frequency >= 100000 && frequency <= 1000000) {
        steps.push(send(`set freq ${frequency}`));
      } else {
        errors.push('Radio frequency must be a kHz integer in a valid LoRa range.');
      }
    }

    const bandwidth = readInteger(radio.bandwidth);
    const spreadingFactor = readInteger(radio.spreading_factor);
    const codingRate = readInteger(radio.coding_rate);
    if (bandwidth !== undefined || spreadingFactor !== undefined || codingRate !== undefined) {
      if (
        bandwidth !== undefined && bandwidth > 0 &&
        spreadingFactor !== undefined && spreadingFactor >= 5 && spreadingFactor <= 12 &&
        codingRate !== undefined && codingRate >= 5 && codingRate <= 8
      ) {
        steps.push(send(`set radio bw ${bandwidth} sf ${spreadingFactor} cr ${codingRate}`));
      } else {
        errors.push('Radio bandwidth, spreading_factor, and coding_rate must be provided together with valid values.');
      }
    }

    const txPower = readInteger(radio.tx_power);
    if (txPower !== undefined) {
      if (txPower >= 0 && txPower <= 30) {
        steps.push(send(`set tx ${txPower}`));
      } else {
        errors.push('TX power must be an integer from 0 to 30.');
      }
    }
  }

  const ownerInfo = readNullableString(settings.owner_info);
  if (ownerInfo !== undefined) {
    if (ownerInfo === null || ownerInfo.trim().length === 0) {
      warnings.push('Owner info is blank; set it manually if this repeater is public infrastructure.');
    } else if (!isSafeText(ownerInfo, 80)) {
      errors.push('Owner info must be 1–80 printable characters without control characters.');
    }
  }

  collectUnsupported(settings, '', unsupportedKeys);
  for (const applied of ['name', 'radio_settings.frequency', 'radio_settings.bandwidth', 'radio_settings.spreading_factor', 'radio_settings.coding_rate', 'radio_settings.tx_power']) {
    removeValue(unsupportedKeys, applied);
  }

  if (unsupportedKeys.length > 0) {
    warnings.push('Some settings are not applied automatically and should be reviewed manually.');
  }

  if (steps.length === 0) {
    errors.push('No supported serial settings were found.');
  }

  if (errors.length > 0) {
    return { ok: false, errors: unique(errors) };
  }

  return {
    ok: true,
    action: {
      id: 'apply-settings-json',
      label: 'Apply Settings JSON',
      description: `Previewed settings JSON will send ${steps.length} command${steps.length === 1 ? '' : 's'} to the connected device.`,
      steps,
      confirm: true,
      confirmMessage: 'Apply these settings commands to the connected MeshCore device?',
    },
    warnings: unique(warnings),
    unsupportedKeys: unsupportedKeys.sort(),
  };
}

function parseInput(input: string | unknown): { ok: true; value: JsonRecord } | SerialSettingsPlanFailure {
  let value: unknown = input;
  if (typeof input === 'string') {
    if (!input.trim()) return { ok: false, errors: ['Paste or upload settings JSON first.'] };
    try {
      value = JSON.parse(input);
    } catch {
      return { ok: false, errors: ['Settings JSON is not valid JSON.'] };
    }
  }

  if (!isRecord(value)) {
    return { ok: false, errors: ['Settings JSON must be an object.'] };
  }

  return { ok: true, value };
}

function collectUnsupported(value: JsonRecord, prefix: string, output: string[]): void {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(child)) {
      collectUnsupported(child, path, output);
    } else {
      output.push(path);
    }
  }
}

function containsBlockedKey(value: JsonValue): boolean {
  if (Array.isArray(value)) return value.some(containsBlockedKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => PRIVATE_KEY_PATTERN.test(key) || containsBlockedKey(child));
}

function readRecord(value: JsonValue | undefined): JsonRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function readString(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function readNullableString(value: JsonValue | undefined): string | null | undefined {
  if (value === null) return null;
  return readString(value);
}

function readInteger(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeText(value: string, maxLength: number): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength && !CONTROL_CHARACTER_PATTERN.test(trimmed);
}

function send(command: string): SerialActionStep {
  return { type: 'send', command };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function removeValue(values: string[], value: string): void {
  const index = values.indexOf(value);
  if (index >= 0) values.splice(index, 1);
}
