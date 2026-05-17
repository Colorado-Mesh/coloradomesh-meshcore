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

function validateOrchestralManifest(orchestralManifest, attributionText = '') {
  if (orchestralManifest?.version === undefined || !Array.isArray(orchestralManifest.samples) || !orchestralManifest.samples.length) {
    throw new Error('/sound/orchestral/manifest.json did not include a valid sample manifest');
  }

  const ids = new Set();
  const requiredSampleFields = ['id', 'url', 'rootNote', 'minMidi', 'maxMidi', 'license', 'sourceUrl', 'attribution'];
  for (const sample of orchestralManifest.samples) {
    for (const field of requiredSampleFields) {
      if (sample[field] === undefined || sample[field] === null || sample[field] === '') {
        throw new Error(`/sound/orchestral/manifest.json sample is missing ${field}`);
      }
    }
    for (const field of ['instrument', 'family', 'articulation']) {
      if (!sample[field]) {
        throw new Error(`/sound/orchestral/manifest.json sample ${sample.id} is missing ${field}`);
      }
    }
    if (ids.has(sample.id)) {
      throw new Error(`/sound/orchestral/manifest.json duplicated sample id ${sample.id}`);
    }
    if (!String(sample.url).startsWith('/sound/orchestral/samples/') || !String(sample.url).endsWith('.wav')) {
      throw new Error(`/sound/orchestral/manifest.json sample ${sample.id} has invalid same-origin wav url`);
    }
    if (sample.minMidi > sample.rootNote || sample.maxMidi < sample.rootNote) {
      throw new Error(`/sound/orchestral/manifest.json sample ${sample.id} rootNote is outside min/max range`);
    }
    ids.add(sample.id);
  }

  for (const role of ['messages', 'node', 'priority']) {
    if (!Array.isArray(orchestralManifest.roles?.[role]) || orchestralManifest.roles[role].length < 3) {
      throw new Error(`/sound/orchestral/manifest.json did not include at least three role mappings for ${role}`);
    }
  }

  for (const [role, roleIds] of Object.entries(orchestralManifest.roles ?? {})) {
    if (!Array.isArray(roleIds) || !roleIds.length) {
      throw new Error(`/sound/orchestral/manifest.json role ${role} is empty`);
    }
    for (const id of roleIds) {
      if (!ids.has(id)) {
        throw new Error(`/sound/orchestral/manifest.json role ${role} references missing sample ${id}`);
      }
    }
  }

  if (attributionText) {
    for (const sample of orchestralManifest.samples) {
      const fileName = String(sample.url).split('/').pop();
      if (!fileName || !attributionText.includes(fileName)) {
        throw new Error(`/sound/orchestral/ATTRIBUTION.md did not mention ${fileName}`);
      }
    }
  }
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

async function expectContentType(path, expected) {
  const response = await expectOk(path);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes(expected)) {
    throw new Error(`${path} returned unexpected content-type: ${contentType}`);
  }
  const body = await response.arrayBuffer();
  if (body.byteLength <= 0) {
    throw new Error(`${path} returned an empty response`);
  }
  return body;
}

async function expectStatus(path, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) {
    throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}`);
  }
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
    image,
  ]);

  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || 'docker run failed');
  }

  // Wait for both upstreams. /api/healthz goes through nginx to corescope;
  // / goes through nginx to next. Both must be live or nginx 502s on whichever
  // upstream is still booting.
  await waitFor(`${baseUrl}/api/healthz`);
  await waitFor(`${baseUrl}/`);
  await expectTextIncludes('/', 'Colorado MeshCore');
  const mapHtml = await expectTextIncludes('/map', 'denvermc-shell.js?v=denvermc');
  for (const expected of ['denvermc-leaflet-zoom.js?v=denvermc', 'denvermc-default-route.js?v=denvermc', 'denvermc-shell.css?v=denvermc', 'denvermc-sound.js?v=denvermc']) {
    if (!mapHtml.includes(expected)) {
      throw new Error(`/map did not include expected CoreScope overlay asset: ${expected}`);
    }
  }
  await expectTextIncludes('/denvermc-sound.js?v=denvermc', 'window.__coloradoMeshSound');
  await expectTextIncludes('/sound/denvermc-density-worklet.js', "registerProcessor('colorado-mesh-density'");
  await expectContentType('/brand/color/mesh-color-256.png', 'image/png');
  await expectContentType('/favicon-16x16.png', 'image/png');
  await expectContentType('/favicon-32x32.png', 'image/png');
  await expectContentType('/apple-touch-icon.png', 'image/png');
  await expectContentType('/favicon.ico', 'image/');

  const orchestralManifest = await expectJson('/sound/orchestral/manifest.json');
  const attributionText = await expectTextIncludes('/sound/orchestral/ATTRIBUTION.md', 'Orchestral Ensemble sample attribution');
  validateOrchestralManifest(orchestralManifest, attributionText);
  for (const sample of orchestralManifest.samples) {
    await expectNonEmpty(sample.url);
  }

  await expectStatus('/api/map/nodes', 404);
  await expectStatus('/api/map/stats', 404);
  await expectStatus('/api/live-map/nodes', 404);

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
