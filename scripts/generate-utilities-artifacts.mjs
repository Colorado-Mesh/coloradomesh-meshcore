#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const submodulePath = path.join(repoRoot, 'vendor', 'meshcore-utilities-site');
const checkMode = process.argv.includes('--check');

const upstreamRepository = 'Colorado-Mesh/meshcore-utilities-site';
const upstreamUrl = 'https://github.com/Colorado-Mesh/meshcore-utilities-site';
const relativeSubmodulePath = path.relative(repoRoot, submodulePath);

const sourceDefinitions = [
  {
    kind: 'recommended-settings',
    upstreamPath: 'static/data/recommended_settings.json',
    generatedPath: 'src/lib/upstream-utilities/generated/recommended-settings.json',
    validate: validateRecommendedSettings,
  },
  {
    kind: 'regions',
    upstreamPath: 'static/data/regions.json',
    generatedPath: 'src/lib/upstream-utilities/generated/regions.json',
    validate: validateRegions,
  },
  {
    kind: 'serial-command-profile',
    upstreamPath: 'static/data/default_serial_commands.json',
    generatedPath: 'src/lib/upstream-utilities/generated/serial-command-profile.json',
    validate: validateSerialCommandProfile,
  },
  {
    kind: 'serial-command-schema',
    upstreamPath: 'serial_commands.schema.json',
    generatedPath: 'src/lib/upstream-utilities/generated/serial-command-schema.json',
    validate: validateSerialCommandSchema,
  },
];

function fail(message) {
  console.error(`Utilities artifact generation failed: ${message}`);
  process.exit(1);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(value, label) {
  if (!isRecord(value)) fail(`${label} must be an object.`);
  return value;
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} must be a non-empty string.`);
}

function assertNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be a finite number.`);
}

function assertBoolean(value, label) {
  if (typeof value !== 'boolean') fail(`${label} must be a boolean.`);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array.`);
  return value;
}

function readJson(relativePath) {
  const absolutePath = path.join(submodulePath, relativePath);
  if (!existsSync(absolutePath)) fail(`Missing upstream file ${relativePath}.`);

  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`Unable to parse ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function stringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function validateRecommendedSettings(value) {
  const root = assertRecord(value, 'recommended settings');
  const radioSettings = assertRecord(root.radio_settings, 'recommended settings radio_settings');

  for (const key of ['frequency', 'bandwidth', 'spreading_factor', 'coding_rate', 'tx_power']) {
    assertNumber(radioSettings[key], `recommended settings radio_settings.${key}`);
  }

  return root;
}

function validateCodeRecord(value, label) {
  const record = assertRecord(value, label);
  for (const key of ['three', 'five', 'seven', 'fourteen']) {
    if (typeof record[key] !== 'string') fail(`${label}.${key} must be a string.`);
  }
}

function validateRegions(value) {
  const root = assertRecord(value, 'regions');
  const airports = assertArray(root.airports, 'regions.airports');
  const cities = assertArray(root.cities, 'regions.cities');
  const counties = assertArray(root.counties, 'regions.counties');
  const regions = assertArray(root.regions, 'regions.regions');
  const alternatives = assertArray(root.alternatives, 'regions.alternatives');

  if (airports.length === 0) fail('regions.airports must contain at least one airport.');
  if (cities.length === 0) fail('regions.cities must contain at least one city.');

  for (const [index, airportValue] of airports.entries()) {
    const airport = assertRecord(airportValue, `regions.airports[${index}]`);
    assertString(airport.name, `regions.airports[${index}].name`);
    assertString(airport.city, `regions.airports[${index}].city`);
    assertString(airport.code, `regions.airports[${index}].code`);
  }

  for (const [collectionName, collection] of Object.entries({ cities, counties, regions, alternatives })) {
    for (const [index, entryValue] of collection.entries()) {
      const entry = assertRecord(entryValue, `regions.${collectionName}[${index}]`);
      assertString(entry.name, `regions.${collectionName}[${index}].name`);
      validateCodeRecord(entry.codes, `regions.${collectionName}[${index}].codes`);
    }
  }

  return root;
}

function validateSerialStep(value, label) {
  const step = assertRecord(value, label);
  assertString(step.type, `${label}.type`);

  if (step.type === 'send') {
    assertString(step.command, `${label}.command`);
  } else if (step.type === 'wait') {
    assertNumber(step.delayMs, `${label}.delayMs`);
  } else {
    fail(`${label}.type must be send or wait.`);
  }

  assertNumber(step.order, `${label}.order`);
}

function readsSecretField(step) {
  return step.type === 'send' && /(?:private|secret|password|prv\.key)/i.test(step.command ?? '');
}

function sanitizeSerialSteps(action) {
  const steps = [];
  let removedPreviousSend = false;

  for (const step of action.steps) {
    if (action.id !== 'reveal-secrets' && readsSecretField(step)) {
      removedPreviousSend = true;
      continue;
    }

    if (removedPreviousSend && step.type === 'wait') {
      removedPreviousSend = false;
      continue;
    }

    removedPreviousSend = false;
    steps.push(step);
  }

  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

function validateSerialCommandProfile(value) {
  const root = assertRecord(value, 'serial command profile');
  assertString(root.name, 'serial command profile.name');
  assertString(root.description, 'serial command profile.description');

  const serial = assertRecord(root.serial, 'serial command profile.serial');
  assertNumber(serial.baudRate, 'serial command profile.serial.baudRate');
  assertNumber(serial.dataBits, 'serial command profile.serial.dataBits');
  assertNumber(serial.stopBits, 'serial command profile.serial.stopBits');
  assertString(serial.parity, 'serial command profile.serial.parity');
  assertString(serial.flowControl, 'serial command profile.serial.flowControl');
  assertString(serial.defaultLineEnding, 'serial command profile.serial.defaultLineEnding');

  const actions = assertArray(root.actions, 'serial command profile.actions');
  if (actions.length === 0) fail('serial command profile.actions must contain at least one action.');

  const sanitizedActions = actions.map((actionValue, index) => {
    const action = assertRecord(actionValue, `serial command profile.actions[${index}]`);
    assertString(action.id, `serial command profile.actions[${index}].id`);
    assertString(action.label, `serial command profile.actions[${index}].label`);
    assertString(action.description, `serial command profile.actions[${index}].description`);
    assertBoolean(action.confirm, `serial command profile.actions[${index}].confirm`);
    if (typeof action.confirmMessage !== 'string') {
      fail(`serial command profile.actions[${index}].confirmMessage must be a string.`);
    }
    const steps = assertArray(action.steps, `serial command profile.actions[${index}].steps`);
    if (steps.length === 0) fail(`serial command profile.actions[${index}].steps must contain at least one step.`);
    steps.forEach((step, stepIndex) => validateSerialStep(step, `serial command profile.actions[${index}].steps[${stepIndex}]`));
    const sanitizedSteps = sanitizeSerialSteps(action);
    if (sanitizedSteps.length === 0) fail(`serial command profile.actions[${index}].steps has no safe default commands after sanitization.`);
    return { ...action, steps: sanitizedSteps };
  });

  const profile = { ...root, actions: sanitizedActions };
  delete profile.$schema;
  return profile;
}

function validateSerialCommandSchema(value) {
  const root = assertRecord(value, 'serial command schema');
  assertString(root.$schema, 'serial command schema.$schema');
  assertString(root.$id, 'serial command schema.$id');
  assertString(root.title, 'serial command schema.title');
  if (root.type !== 'object') fail('serial command schema.type must be object.');
  const required = assertArray(root.required, 'serial command schema.required');
  for (const key of ['name', 'description', 'serial', 'actions']) {
    if (!required.includes(key)) fail(`serial command schema.required must include ${key}.`);
  }
  assertRecord(root.properties, 'serial command schema.properties');
  return root;
}

function getSubmoduleCommit() {
  return execFileSync('git', ['-C', submodulePath, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function runSubmoduleCheck() {
  execFileSync('node', [path.join(repoRoot, 'scripts', 'check-utilities-submodule.mjs')], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

function buildGeneratedFiles() {
  runSubmoduleCheck();
  const upstreamCommit = getSubmoduleCommit();
  if (!/^[0-9a-f]{40}$/i.test(upstreamCommit)) fail('Submodule did not report a valid commit SHA.');

  const files = new Map();
  const provenanceSources = [];

  for (const source of sourceDefinitions) {
    const data = source.validate(readJson(source.upstreamPath));
    files.set(source.generatedPath, stringify(data));
    provenanceSources.push({
      kind: source.kind,
      upstreamPath: source.upstreamPath,
      generatedPath: source.generatedPath,
    });
  }

  files.set('src/lib/upstream-utilities/generated/provenance.json', stringify({
    upstreamRepository,
    upstreamUrl,
    submodulePath: relativeSubmodulePath,
    upstreamCommit,
    sources: provenanceSources,
  }));

  return files;
}

const generatedFiles = buildGeneratedFiles();
let stale = false;

for (const [relativePath, content] of generatedFiles.entries()) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (checkMode) {
    const existing = existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : null;
    if (existing !== content) {
      console.error(`Generated utility artifact is stale: ${relativePath}`);
      stale = true;
    }
  } else {
    writeFileSync(absolutePath, content);
  }
}

if (stale) {
  console.error('Run: npm run utilities:generate');
  process.exit(1);
}

console.log(checkMode ? 'Utilities generated artifacts are current.' : 'Utilities generated artifacts updated.');
