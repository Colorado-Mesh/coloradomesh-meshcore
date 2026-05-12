import { describe, expect, it } from 'vitest';

import { createCompanionConfigExport, createRepeaterConfigExport, stringifySettingsJson } from '@/lib/meshcore-tools/config-export';
import { buildSerialSettingsPlan } from '@/lib/meshcore-tools/serial-settings';
import { adaptUpstreamSerialProfile, DEFAULT_SERIAL_COMMAND_PROFILE } from '@/lib/tools/serial-commands';
import { UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE, type UpstreamSerialCommandProfile } from '@/lib/upstream-utilities';

function commandsFrom(input: string | unknown): string[] {
  const result = buildSerialSettingsPlan(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return [];
  return result.action.steps.map((step) => step.type === 'send' ? step.command : `wait:${step.durationMs}`);
}

function profileWithAction(action: UpstreamSerialCommandProfile['actions'][number]): UpstreamSerialCommandProfile {
  return {
    ...UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE,
    actions: [action],
  };
}

describe('MeshCore serial settings conversion', () => {
  it('adapts the generated upstream serial command profile into the local safe profile', () => {
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.name).toBe(UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE.name);
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.serial.defaultLineEnding).toBe('\r\n');
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.map((action) => action.id)).toEqual(
      UPSTREAM_UTILITIES_SERIAL_COMMAND_PROFILE.actions.map((action) => action.id),
    );

    for (const id of [
      'sync-clock',
      'clear-stats',
      'start-packet-logging',
      'stop-packet-logging',
      'reboot',
      'factory-reset',
      'regions',
      'enable-gps',
      'disable-gps',
      'enable-power-saving',
      'disable-power-saving',
    ]) {
      expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.find((action) => action.id === id)?.confirm).toBe(true);
    }
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.find((action) => action.id === 'factory-reset')).toMatchObject({
      confirm: true,
      confirmMessage: 'Reset all settings to factory defaults?',
    });
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.find((action) => action.id === 'regions')).toMatchObject({
      confirm: true,
      confirmMessage: 'Inspect regions and save region home configuration?',
    });
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.find((action) => action.id === 'summary')?.steps).not.toContainEqual({
      type: 'send',
      command: 'get guest.password',
    });
    expect(DEFAULT_SERIAL_COMMAND_PROFILE.actions.find((action) => action.id === 'bridge-config')?.steps).not.toContainEqual({
      type: 'send',
      command: 'get bridge.secret',
    });
  });

  it('forces confirmation for generated mutating actions and blocks secret reads and writes', () => {
    const mutating = adaptUpstreamSerialProfile(profileWithAction({
      id: 'future-region-save',
      label: 'Future Region Save',
      description: 'Future upstream mutating action.',
      confirm: false,
      confirmMessage: '',
      steps: [{ type: 'send', command: 'region home', order: 1 }],
    }));
    expect(mutating.actions[0]).toMatchObject({
      confirm: true,
      confirmMessage: 'Run Future Region Save?',
    });

    const secretRead = adaptUpstreamSerialProfile(profileWithAction({
      id: 'read-secret',
      label: 'Read Secret',
      description: 'Invalid default secret read action.',
      confirm: false,
      confirmMessage: '',
      steps: [
        { type: 'send', command: 'ver', order: 1 },
        { type: 'send', command: 'get guest.password', order: 2 },
      ],
    }));
    expect(secretRead.actions[0].steps).toEqual([{ type: 'send', command: 'ver' }]);

    const explicitReveal = adaptUpstreamSerialProfile(profileWithAction({
      id: 'reveal-secrets',
      label: 'Reveal Secrets',
      description: 'Explicit secret reveal action.',
      confirm: true,
      confirmMessage: 'Reveal secrets?',
      steps: [{ type: 'send', command: 'get guest.password', order: 1 }],
    }));
    expect(explicitReveal.actions[0].steps).toContainEqual({ type: 'send', command: 'get guest.password' });

    expect(() => adaptUpstreamSerialProfile(profileWithAction({
      id: 'write-secret',
      label: 'Write Secret',
      description: 'Invalid secret-writing action.',
      confirm: true,
      confirmMessage: 'Write secret?',
      steps: [{ type: 'send', command: 'set guest.password hunter2', order: 1 }],
    }))).toThrow('writes a private/secret/password field');

    expect(() => adaptUpstreamSerialProfile(profileWithAction({
      id: 'invalid-send',
      label: 'Invalid Send',
      description: 'Invalid empty send action.',
      confirm: false,
      confirmMessage: '',
      steps: [{ type: 'send', order: 1 }],
    }))).toThrow('has a send step without a command');
  });

  it('maps generated action and step line endings into local serial steps', () => {
    const profile = adaptUpstreamSerialProfile(profileWithAction({
      id: 'line-ending-overrides',
      label: 'Line Ending Overrides',
      description: 'Exercises action and step line endings.',
      confirm: false,
      confirmMessage: '',
      lineEnding: 'CR',
      steps: [
        { type: 'send', command: 'ver', order: 1 },
        { type: 'send', command: 'board', lineEnding: 'LF', order: 2 },
        { type: 'send', command: 'clock', lineEnding: 'CRLF', order: 3 },
        { type: 'send', command: 'region', lineEnding: 'NONE', order: 4 },
      ],
    }));

    expect(profile.actions[0].steps).toEqual([
      { type: 'send', command: 'ver', lineEnding: '\r' },
      { type: 'send', command: 'board', lineEnding: '\n' },
      { type: 'send', command: 'clock', lineEnding: '\r\n' },
      { type: 'send', command: 'region', lineEnding: '' },
    ]);
  });

  it('converts generated repeater settings into a confirmed command plan', () => {
    const exported = createRepeaterConfigExport({
      region: 'DEN',
      city: 'GLDN',
      landmark: 'LKVST',
      nodeType: 'RC',
      pubkey: 'A10F',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    const result = buildSerialSettingsPlan(stringifySettingsJson(exported.settingsJson));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.action).toMatchObject({
      id: 'apply-settings-json',
      confirm: true,
      confirmMessage: 'Apply these settings commands to the connected MeshCore device?',
    });
    expect(result.action.steps).toEqual([
      { type: 'send', command: 'set name DEN-GLDN-LKVST-RC-A10F' },
      { type: 'send', command: 'set freq 910525' },
      { type: 'send', command: 'set radio bw 62500 sf 7 cr 8' },
      { type: 'send', command: 'set tx 22' },
    ]);
    expect(result.warnings).toContain('Owner info is blank; set it manually if this repeater is public infrastructure.');
    expect(result.warnings).toContain('Some settings are not applied automatically and should be reviewed manually.');
    expect(result.unsupportedKeys).toEqual([
      'mobility',
      'node_type',
      'owner_info',
      'priority',
      'public_key_id',
      'regions.all',
      'regions.home',
      'repeat',
      'role',
    ]);
  });

  it('converts generated companion settings without unsupported hardware-only writes', () => {
    const exported = createCompanionConfigExport({
      emoji: '👻',
      handle: 'm3shghøst',
      suffix: 'f4a2',
      suffixStrategy: 'pubkey',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    expect(commandsFrom(exported.settingsJson)).toEqual([
      'set name 👻 M3SHGHØST F4A2',
      'set freq 910525',
      'set radio bw 62500 sf 7 cr 8',
      'set tx 22',
    ]);
  });

  it('rejects malformed JSON, empty objects, and blocked secret fields', () => {
    expect(buildSerialSettingsPlan('{bad json')).toEqual({
      ok: false,
      errors: ['Settings JSON is not valid JSON.'],
    });
    expect(buildSerialSettingsPlan({})).toEqual({
      ok: false,
      errors: ['No supported serial settings were found.'],
    });
    expect(buildSerialSettingsPlan({ name: 'DEN-GLDN-LKVST-RC-A10F', private_key: 'abc' })).toEqual({
      ok: false,
      errors: ['Settings JSON includes private/secret/password fields that cannot be applied from the browser.'],
    });
    expect(buildSerialSettingsPlan({
      name: 'DEN-GLDN-LKVST-RC-A10F',
      radio_settings: { frequency: 910525, guest_password: 'abc' },
    })).toEqual({
      ok: false,
      errors: ['Settings JSON includes private/secret/password fields that cannot be applied from the browser.'],
    });
    expect(buildSerialSettingsPlan({
      name: 'DEN-GLDN-LKVST-RC-A10F',
      owner_info: { contact: '@meshops', secret: 'abc' },
    })).toEqual({
      ok: false,
      errors: ['Settings JSON includes private/secret/password fields that cannot be applied from the browser.'],
    });
    expect(buildSerialSettingsPlan({
      name: 'DEN-GLDN-LKVST-RC-A10F',
      channels: [{ password: 'abc' }],
    })).toEqual({
      ok: false,
      errors: ['Settings JSON includes private/secret/password fields that cannot be applied from the browser.'],
    });
  });

  it('rejects command-control characters and invalid radio groups', () => {
    expect(buildSerialSettingsPlan({ name: 'good\nreboot' })).toEqual({
      ok: false,
      errors: [
        'Name must be 1–23 printable characters without control characters.',
        'No supported serial settings were found.',
      ],
    });
    expect(buildSerialSettingsPlan({ radio_settings: { bandwidth: 62500, spreading_factor: 7 } })).toEqual({
      ok: false,
      errors: [
        'Radio bandwidth, spreading_factor, and coding_rate must be provided together with valid values.',
        'No supported serial settings were found.',
      ],
    });
  });

  it('validates preview-only owner info and leaves regions unsupported', () => {
    const ownerInfoResult = buildSerialSettingsPlan({ name: 'DEN-GLDN-LKVST-RC-A10F', owner_info: '@meshops' });
    expect(ownerInfoResult.ok).toBe(true);
    if (!ownerInfoResult.ok) return;
    expect(ownerInfoResult.action.steps).toEqual([
      { type: 'send', command: 'set name DEN-GLDN-LKVST-RC-A10F' },
    ]);
    expect(ownerInfoResult.unsupportedKeys).toEqual(['owner_info']);

    const regionResult = buildSerialSettingsPlan({ name: 'DEN-GLDN-LKVST-RC-A10F', regions: { home: 'bad' } });
    expect(regionResult.ok).toBe(true);
    if (!regionResult.ok) return;
    expect(regionResult.action.steps).toEqual([
      { type: 'send', command: 'set name DEN-GLDN-LKVST-RC-A10F' },
    ]);
    expect(regionResult.unsupportedKeys).toEqual(['regions.home']);
  });
});
