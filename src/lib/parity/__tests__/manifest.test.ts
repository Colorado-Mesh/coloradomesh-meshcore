import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';

import { PARITY_MANIFEST } from '../manifest';
import { buildParityReport } from '../report';
import recommendedSettings from '../fixtures/utilities/recommended_settings.json';
import serialCommands from '../fixtures/utilities/default_serial_commands.json';
import serialCommandSchema from '../fixtures/utilities/serial_commands.schema.json';
import regions from '../fixtures/utilities/regions.json';
import liveMapNodes from '../fixtures/live-map/nodes-full.json';
import provenance from '../fixtures/provenance.json';

describe('PARITY_MANIFEST', () => {
  it('uses unique item ids and covers required domains', () => {
    const ids = PARITY_MANIFEST.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    expect(PARITY_MANIFEST.map((item) => item.domain)).toEqual(
      expect.arrayContaining([
        'utilities',
        'repeater-config',
        'serial-usb',
        'prefix-matrix',
        'live-map-api',
        'live-map-ui',
        'docker',
        'ci',
      ])
    );
  });

  it('records contacts export as out of scope', () => {
    expect(PARITY_MANIFEST).toContainEqual(
      expect.objectContaining({
        id: 'contacts-export',
        status: 'out-of-scope',
      })
    );
  });

  it('builds a maintainer report from the manifest', () => {
    const report = buildParityReport();
    expect(report).toContain('Colorado MeshCore Upstream Parity Report');
    expect(report).toContain('live-map-service-api-consumer');
  });
});

describe('upstream parity fixtures', () => {
  it('loads utility and live-map fixtures', () => {
    expect(recommendedSettings).toBeTypeOf('object');
    expect(serialCommands).toBeTypeOf('object');
    expect(regions).toBeTypeOf('object');
    expect(liveMapNodes).toHaveProperty('nodes');
    expect(provenance.sources).toHaveLength(2);
  });

  it('validates the vendored serial command fixture against the upstream schema', () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(serialCommandSchema);
    const valid = validate(serialCommands);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });
});
