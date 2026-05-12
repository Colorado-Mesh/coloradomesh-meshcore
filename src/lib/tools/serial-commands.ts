import { UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE } from '@/lib/upstream-utilities';
import type { UpstreamSerialAction, UpstreamSerialCommandProfile } from '@/lib/upstream-utilities';

export type SerialParity = 'none' | 'even' | 'odd' | 'mark' | 'space';
export type SerialFlowControl = 'none' | 'hardware';
export type SerialLineEnding = '\n' | '\r' | '\r\n' | '';

export interface SerialPortProfile {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: SerialParity;
  flowControl: SerialFlowControl;
  defaultLineEnding: SerialLineEnding;
}

export interface SerialSendStep {
  type: 'send';
  command: string;
  lineEnding?: SerialLineEnding;
}

export interface SerialWaitStep {
  type: 'wait';
  durationMs: number;
}

export type SerialActionStep = SerialSendStep | SerialWaitStep;

export interface SerialAction {
  id: string;
  label: string;
  description: string;
  steps: SerialActionStep[];
  confirm?: boolean;
  confirmMessage?: string;
}

export interface SerialCommandProfile {
  name: string;
  description: string;
  serial: SerialPortProfile;
  actions: SerialAction[];
}

const CONFIRMATION_OVERRIDES: Record<string, string> = {
  regions: 'Inspect regions and save region home configuration?',
};

const MUTATING_ACTION_ID_PATTERN = /(?:clear|start|stop|reboot|reset|factory|region|enable|disable|sync|save|write|set|erase|gps|power)/i;
const MUTATING_COMMAND_PATTERN = /^(?!get\b)(?:set\b|clear\b|log\s+(?:start|stop)\b|reboot\b|erase\b|region\s+home\b|region\s+save\b|clock\s+sync\b|gps\s+(?:on|off|sync)\b|powersaving\s+(?:on|off)\b|save\b|write\b)/i;
const SECRET_FIELD_PATTERN = /(?:private|secret|password|prv\.key)/i;
const READ_ONLY_COMMAND_PATTERN = /^(?:get\b|ver\b|board\b|clock\b|stats\b|stats-|region$|region\s+get\b|discover\.|neighbor\b)/i;

export const DEFAULT_SERIAL_COMMAND_PROFILE: SerialCommandProfile = adaptUpstreamSerialProfile(
  UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE,
);

export const SERIAL_BAUD_RATES: readonly number[] = [
  9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
];

export function adaptUpstreamSerialProfile(
  profile: UpstreamSerialCommandProfile,
): SerialCommandProfile {
  return {
    name: profile.name,
    description: profile.description,
    serial: {
      baudRate: profile.serial.baudRate,
      dataBits: toSerialDataBits(profile.serial.dataBits),
      stopBits: toSerialStopBits(profile.serial.stopBits),
      parity: toSerialParity(profile.serial.parity),
      flowControl: toSerialFlowControl(profile.serial.flowControl),
      defaultLineEnding: toSerialLineEnding(profile.serial.defaultLineEnding),
    },
    actions: profile.actions.map(adaptUpstreamAction),
  };
}

export function lineEndingLabel(ending: SerialLineEnding): string {
  switch (ending) {
    case '\n':
      return 'LF (\\n)';
    case '\r':
      return 'CR (\\r)';
    case '\r\n':
      return 'CRLF (\\r\\n)';
    case '':
      return 'None';
  }
}

function adaptUpstreamAction(action: UpstreamSerialAction): SerialAction {
  const actionLineEnding = action.lineEnding ? toSerialLineEnding(action.lineEnding) : undefined;
  const steps = action.steps.map((step): SerialActionStep | null => {
    if (step.type === 'wait') {
      if (step.delayMs === undefined) throw new Error(`Serial action ${action.id} has a wait step without delayMs.`);
      return { type: 'wait', durationMs: step.delayMs };
    }

    if (step.command === undefined || step.command.trim().length === 0) {
      throw new Error(`Serial action ${action.id} has a send step without a command.`);
    }

    if (isBlockedSecretRead(action, step.command)) return null;

    if (isBlockedSecretWrite(step.command)) {
      throw new Error(`Serial action ${action.id} writes a private/secret/password field.`);
    }

    const lineEnding = step.lineEnding ? toSerialLineEnding(step.lineEnding) : actionLineEnding;
    return lineEnding === undefined
      ? { type: 'send', command: step.command }
      : { type: 'send', command: step.command, lineEnding };
  }).filter((step): step is SerialActionStep => step !== null);

  const confirmMessage = CONFIRMATION_OVERRIDES[action.id] ?? action.confirmMessage;
  const confirm = action.confirm || action.id in CONFIRMATION_OVERRIDES || requiresLocalConfirmation(action, steps);

  return {
    id: action.id,
    label: action.label,
    description: action.description,
    steps,
    ...(confirm ? { confirm: true, confirmMessage: confirmMessage || `Run ${action.label}?` } : {}),
  };
}

function requiresLocalConfirmation(action: UpstreamSerialAction, steps: SerialActionStep[]): boolean {
  if (MUTATING_ACTION_ID_PATTERN.test(action.id)) return true;
  return steps.some((step) => step.type === 'send' && MUTATING_COMMAND_PATTERN.test(step.command));
}

function isBlockedSecretRead(action: UpstreamSerialAction, command: string): boolean {
  return action.id !== 'reveal-secrets' && READ_ONLY_COMMAND_PATTERN.test(command) && SECRET_FIELD_PATTERN.test(command);
}

function isBlockedSecretWrite(command: string): boolean {
  return SECRET_FIELD_PATTERN.test(command) && !READ_ONLY_COMMAND_PATTERN.test(command);
}

function toSerialDataBits(value: number): 7 | 8 {
  if (value === 7 || value === 8) return value;
  throw new Error(`Unsupported serial data bits: ${value}`);
}

function toSerialStopBits(value: number): 1 | 2 {
  if (value === 1 || value === 2) return value;
  throw new Error(`Unsupported serial stop bits: ${value}`);
}

function toSerialParity(value: string): SerialParity {
  if (value === 'none' || value === 'even' || value === 'odd' || value === 'mark' || value === 'space') {
    return value;
  }
  throw new Error(`Unsupported serial parity: ${value}`);
}

function toSerialFlowControl(value: string): SerialFlowControl {
  if (value === 'none' || value === 'hardware') return value;
  throw new Error(`Unsupported serial flow control: ${value}`);
}

function toSerialLineEnding(value: string): SerialLineEnding {
  switch (value) {
    case 'CRLF':
      return '\r\n';
    case 'CR':
      return '\r';
    case 'LF':
      return '\n';
    case 'NONE':
      return '';
    default:
      throw new Error(`Unsupported serial line ending: ${value}`);
  }
}
