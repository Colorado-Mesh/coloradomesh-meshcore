#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const args = process.argv.slice(2);
const imageArgIndex = args.indexOf('--image');
const image = imageArgIndex >= 0 ? args[imageArgIndex + 1] : process.env.DOCKER_SMOKE_IMAGE;

if (!image) {
  console.error('Usage: npm run docker:smoke -- --image <image-tag>');
  process.exit(1);
}

const containerName = `colorado-meshcore-smoke-${process.pid}`;
const port = Number(process.env.DOCKER_SMOKE_PORT ?? 3300);
const baseUrl = `http://127.0.0.1:${port}`;

function docker(args, options = {}) {
  return spawnSync('docker', args, {
    stdio: options.stdio ?? 'pipe',
    encoding: 'utf8',
  });
}

async function waitFor(url, timeoutMs = 30_000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw lastError ?? new Error(`${url} was not ready`);
}

async function expectOk(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  return response;
}

async function expectTextIncludes(path, expected) {
  const response = await expectOk(path);
  const body = await response.text();
  if (!body.includes(expected)) {
    throw new Error(`${path} did not include expected text: ${expected}`);
  }
  return body;
}

async function expectJson(path) {
  const response = await expectOk(path);
  return response.json();
}

async function expectNonEmpty(path) {
  const response = await expectOk(path);
  const body = await response.arrayBuffer();
  if (body.byteLength <= 0) {
    throw new Error(`${path} returned an empty response`);
  }
  return body;
}

async function expectApiSuccess(path) {
  const body = await expectJson(path);
  if (body?.success !== true || body.data === undefined) {
    throw new Error(`${path} did not return ApiResponse success data`);
  }
  return body.data;
}

async function expectWebSocket(path) {
  const url = `${baseUrl}${path}`.replace(/^http:/, 'ws:');
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`${path} WebSocket did not open`));
    }, 5_000);

    ws.addEventListener('open', () => {
      clearTimeout(timer);
      ws.close();
      resolve();
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error(`${path} WebSocket failed to connect`));
    });
  });
}

function hasWarning(warnings, id) {
  return Array.isArray(warnings) && warnings.some((warning) => warning?.id === id);
}

try {
  const existing = docker(['ps', '-aq', '--filter', `name=^/${containerName}$`]);
  if (existing.status === 0 && existing.stdout.trim()) {
    docker(['rm', '-f', containerName], { stdio: 'ignore' });
  }

  const run = docker([
    'run',
    '--rm',
    '-d',
    '--name',
    containerName,
    '-p',
    `${port}:3000`,
    '-e',
    'MESHCORE_LIVE_MAP_API_URL=',
    '-e',
    'MESHCORE_MAP_SAMPLE_DATA=true',
    '-e',
    'MESHCORE_MAP_DEMO_MODE=true',
    image,
  ]);

  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || 'docker run failed');
  }

  await waitFor(`${baseUrl}/api/map/runtime`);
  await expectTextIncludes('/', 'Colorado MeshCore');
  const mapHtml = await expectTextIncludes('/map', 'denvermc-shell.js?v=denvermc');
  for (const expected of ['denvermc-leaflet-zoom.js?v=denvermc', 'denvermc-default-route.js?v=denvermc', 'denvermc-shell.css?v=denvermc', 'denvermc-sound.js?v=denvermc']) {
    if (!mapHtml.includes(expected)) {
      throw new Error(`/map did not include expected CoreScope overlay asset: ${expected}`);
    }
  }
  await expectTextIncludes('/denvermc-sound.js?v=denvermc', 'window.__coloradoMeshSound');

  const orchestralManifest = await expectJson('/sound/orchestral/manifest.json');
  if (orchestralManifest?.version === undefined || !Array.isArray(orchestralManifest.samples) || !orchestralManifest.samples.length) {
    throw new Error('/sound/orchestral/manifest.json did not include a valid sample manifest');
  }
  for (const role of ['messages', 'node', 'priority']) {
    if (!Array.isArray(orchestralManifest.roles?.[role]) || !orchestralManifest.roles[role].length) {
      throw new Error(`/sound/orchestral/manifest.json did not include role mappings for ${role}`);
    }
  }
  for (const sample of orchestralManifest.samples) {
    for (const field of ['id', 'url', 'rootNote', 'license', 'sourceUrl', 'attribution']) {
      if (sample[field] === undefined || sample[field] === null || sample[field] === '') {
        throw new Error(`/sound/orchestral/manifest.json sample is missing ${field}`);
      }
    }
    await expectNonEmpty(sample.url);
  }
  await expectTextIncludes('/sound/orchestral/ATTRIBUTION.md', 'Orchestral Ensemble sample attribution');

  const runtime = await expectApiSuccess('/api/map/runtime');
  const snapshot = await expectApiSuccess('/api/map/snapshot');
  const nextNodes = await expectApiSuccess('/api/map/nodes');

  if (!Array.isArray(snapshot.nodes)) {
    throw new Error('/api/map/snapshot data.nodes is not an array');
  }

  if (!Array.isArray(nextNodes)) {
    throw new Error('/api/map/nodes data is not an array');
  }

  if (runtime.sampleData !== true || runtime.demoMode !== true) {
    throw new Error('/api/map/runtime did not report sampleData=true and demoMode=true under smoke env');
  }

  if (runtime.sourceLabel !== 'Demo map data') {
    throw new Error('/api/map/runtime did not report the demo source label under smoke env');
  }

  if (!hasWarning(runtime.warnings, 'map-demo-data')) {
    throw new Error('/api/map/runtime did not include the demo-data warning under smoke env');
  }

  if (hasWarning(runtime.warnings, 'map-production-sample-data')) {
    throw new Error('/api/map/runtime included a production sample-data warning while demo mode is enabled');
  }

  if (snapshot.source?.type !== 'sample' || snapshot.connection?.sampleData !== true) {
    throw new Error('/api/map/snapshot did not report sample source and connection state under smoke env');
  }

  if (!hasWarning(snapshot.warnings, 'map-demo-data')) {
    throw new Error('/api/map/snapshot did not include the demo-data warning under smoke env');
  }

  if (hasWarning(snapshot.warnings, 'map-production-sample-data')) {
    throw new Error('/api/map/snapshot included a production sample-data warning while demo mode is enabled');
  }

  const health = await expectJson('/api/healthz');
  if (health.ready !== true) {
    throw new Error('/api/healthz did not report ready=true');
  }

  const mapConfig = await expectJson('/api/config/map');
  if (!Array.isArray(mapConfig.center) || mapConfig.center[0] !== 39.5501 || mapConfig.center[1] !== -105.7821) {
    throw new Error('/api/config/map did not report Colorado defaults');
  }
  if (mapConfig.zoom !== 7) {
    throw new Error('/api/config/map did not report zoom=7');
  }

  const clientConfig = await expectJson('/api/config/client');
  for (const variant of ['dark', 'light']) {
    const tileUrl = clientConfig.tiles?.[variant];
    if (typeof tileUrl !== 'string' || !tileUrl.includes('{z}') || !tileUrl.includes('{x}') || !tileUrl.includes('{y}')) {
      throw new Error(`/api/config/client tiles.${variant} did not include Leaflet tile placeholders`);
    }
    if (/%7B|%7D/i.test(tileUrl)) {
      throw new Error(`/api/config/client tiles.${variant} included encoded Leaflet placeholders`);
    }
  }

  const stats = await expectJson('/api/stats');
  if (typeof stats.totalNodes !== 'number' || typeof stats.totalPackets !== 'number') {
    throw new Error('/api/stats did not include CoreScope numeric counters');
  }

  const coreNodes = await expectJson('/api/nodes');
  if (!Array.isArray(coreNodes.nodes)) {
    throw new Error('/api/nodes did not return a CoreScope nodes array');
  }

  const packets = await expectJson('/api/packets?limit=1');
  if (!Array.isArray(packets.packets)) {
    throw new Error('/api/packets?limit=1 did not return a CoreScope packets array');
  }

  await expectWebSocket('/');

  console.log(`Docker smoke passed for ${image} on ${baseUrl}`);
} finally {
  docker(['rm', '-f', containerName], { stdio: 'ignore' });
}
