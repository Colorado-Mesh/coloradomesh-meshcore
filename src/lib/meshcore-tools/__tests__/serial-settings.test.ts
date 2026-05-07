import { describe, expect, it } from 'vitest';

import { createCompanionConfigExport, createRepeaterConfigExport, stringifySettingsJson } from '@/lib/meshcore-tools/config-export';
import { buildSerialSettingsPlan } from '@/lib/meshcore-tools/serial-settings';

function commandsFrom(input: string | unknown): string[] {
  const result = buildSerialSettingsPlan(input);
  expect(result.ok).toBe(true);
  if (!result.ok) return [];
  return result.action.steps.map((step) => step.type === 'send' ? step.command : `wait:${step.durationMs}`);
}

describe('MeshCore serial settings conversion', () => {
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
