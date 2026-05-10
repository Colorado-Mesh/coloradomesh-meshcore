#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const submodulePath = path.join(repoRoot, 'vendor', 'meshcore-utilities-site');
const relativeSubmodulePath = path.relative(repoRoot, submodulePath);

const requiredFiles = [
  'app.py',
  'requirements.txt',
  'serial_commands.schema.json',
  'static/data/default_serial_commands.json',
  'static/data/emojis.json',
  'static/data/recommended_settings.json',
  'static/data/regions.json',
  'static/js/companion_name_tool.js',
  'static/js/prefix_matrix.js',
  'static/js/repeater_name_tool.js',
  'static/js/serial_usb_tool_page.js',
  'templates/companion-name-tool.html',
  'templates/prefix_matrix.html',
  'templates/repeater-name-tool.html',
  'templates/serial-usb-tool.html',
];

function fail(message) {
  console.error(`Utilities submodule check failed: ${message}`);
  console.error(`Run: git submodule update --init --recursive ${relativeSubmodulePath}`);
  process.exit(1);
}

if (!existsSync(submodulePath)) {
  fail(`${relativeSubmodulePath} does not exist.`);
}

if (readdirSync(submodulePath).length === 0) {
  fail(`${relativeSubmodulePath} is empty.`);
}

const missingFiles = requiredFiles.filter((file) => !existsSync(path.join(submodulePath, file)));
if (missingFiles.length > 0) {
  fail(`${relativeSubmodulePath} is missing required upstream files: ${missingFiles.join(', ')}`);
}

let commit;
try {
  commit = execFileSync('git', ['-C', submodulePath, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch {
  fail(`${relativeSubmodulePath} is not a readable git checkout.`);
}

if (!/^[0-9a-f]{40}$/i.test(commit)) {
  fail(`${relativeSubmodulePath} did not report a valid commit SHA.`);
}

console.log(`Utilities submodule ready: ${relativeSubmodulePath} @ ${commit}`);
