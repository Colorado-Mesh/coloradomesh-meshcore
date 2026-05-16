import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const criticalPages = ['/', '/start', '/map', '/tools', '/guides'];
const repoRoot = process.cwd();
const soundOverlayScript = readFileSync(path.join(repoRoot, 'corescope-overlay/denvermc-sound.js'), 'utf8');
const shellOverlayScript = readFileSync(path.join(repoRoot, 'corescope-overlay/denvermc-shell.js'), 'utf8');
const shellOverlayCss = readFileSync(path.join(repoRoot, 'corescope-overlay/denvermc-shell.css'), 'utf8');
const upstreamUtilityRedirects = [
  { source: '/repeater_name_tool', destination: '/tools/repeater-name' },
  { source: '/companion_name_tool', destination: '/tools/companion-name' },
  { source: '/prefix_matrix', destination: '/tools/prefix-matrix' },
  { source: '/serial_usb_tool', destination: '/tools/serial-usb' },
] as const;

function mockCoreScopeAnalyzer(page: Page) {
  const generatedAt = '2026-05-09T12:00:00.000Z';
  const nodes = [
    {
      id: 'node-a10f-1',
      public_key: 'A10F000000000000000000000000000000000000000000000000000000000000000',
      name: 'DEN-TEST-A',
      role: 'companion',
      last_heard: generatedAt,
    },
    {
      id: 'node-a10f-2',
      public_key: 'A10F111111111111111111111111111111111111111111111111111111111111111',
      name: 'DEN-TEST-B',
      role: 'node',
      last_heard: generatedAt,
    },
  ];

  return Promise.all([
    page.route((url) => url.pathname === '/api/nodes', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ nodes, total: nodes.length }),
      });
    }),
    page.route((url) => url.pathname === '/api/stats', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          totalNodes: nodes.length,
          totalObservers: 0,
          totalPackets: 12,
          packetsLastHour: 4,
          packetsLast24h: 12,
          counts: { repeaters: 0, rooms: 0, companions: 1, sensors: 0 },
        }),
      });
    }),
  ]);
}

type NormalizedSoundEvent = {
  id: string;
  type: string;
  modeHint: string;
  channelName: string | null;
  channelHash: string | number | null;
  isEmergency: boolean;
  isPriority: boolean;
  isReplay: boolean;
  observationCount: number;
  hopCount: number;
  intensity: number;
  seed: number;
  timestamp: number;
};

type SoundState = {
  mode: string;
  volume: number;
  unlocked: boolean;
  status: string;
  available: boolean;
  counters: Record<string, number>;
  lastNormalizedEvent: NormalizedSoundEvent | null;
  lastEvent: NormalizedSoundEvent | null;
  lastDroppedReason: string | null;
  traffic: {
    total: number;
    density: number;
    priority: number;
    pulse: number;
    replay: number;
    activeWindowEvents: number;
    lastUpdatedAt: number;
  };
  worklet: {
    status: string;
    loaded: boolean;
    fallback: boolean;
    error: string | null;
    updates: number;
    active: boolean;
    schedulerActive: boolean;
    fallbackActive: boolean;
  };
  sequencer: {
    queued: number;
    scheduled: number;
    coalesced: number;
    lastCue: {
      mode: string;
      type: string;
      lane: string;
      ordinal: number;
      coalesced?: boolean;
      burstCount?: number;
      admissionReason?: string;
    } | null;
    lastAdmission: {
      type: string;
      lane: string;
      accepted: boolean;
      reason: string;
      coalesced?: boolean;
      burstCount?: number;
    } | null;
    lastBurst: {
      mode: string;
      type: string;
      lane: string;
      ordinal: number;
      coalesced?: boolean;
      burstCount?: number;
      admissionReason?: string;
    } | null;
    lastMidi: number | null;
    lastSampleId: string | null;
    recentMidi: number[];
    recentSampleIds: string[];
    lastEnsembleRole: string | null;
    recentEnsembleRoles: string[];
    lastEnsembleTemplate: string | null;
    recentEnsembleTemplates: string[];
    lastBlasterFrequency: number | null;
    recentBlasterFrequencies: number[];
    lastBlasterPitch: {
      lane: string;
      baseFrequency: number;
      endFrequency: number;
      maxFrequency: number;
      semitoneGlide: number;
    } | null;
    recentBlasterPitches: Array<{
      lane: string;
      baseFrequency: number;
      endFrequency: number;
      maxFrequency: number;
      semitoneGlide: number;
    }>;
    lastBlasterPatch: string | null;
    recentBlasterPatches: string[];
    lastBlasterCue: {
      patch: string;
      lane: string;
      baseFrequency: number;
      endFrequency: number;
      maxFrequency: number;
      semitoneGlide: number;
      filterQ: number;
      noiseGain: number;
      duration: number;
      coalesced: boolean;
      burstCount: number;
    } | null;
    recentBlasterCues: Array<{
      patch: string;
      lane: string;
      baseFrequency: number;
      endFrequency: number;
      maxFrequency: number;
      semitoneGlide: number;
      filterQ: number;
      noiseGain: number;
      duration: number;
      coalesced: boolean;
      burstCount: number;
    }>;
    queueLength: number;
    active: boolean;
    nextTime: number;
  };
  ensemble: {
    status: string;
    loaded: boolean;
    failed: boolean;
    sampleCount: number;
  };
  activeVoices: number;
  scheduledSources: number;
  scheduledNodes: number;
  cleanupTimers: number;
};

type SoundApi = {
  getModeOptions: () => Array<{ value: string; label: string }>;
  getState: () => SoundState;
  normalizePacket: (packet: unknown) => NormalizedSoundEvent | null;
  injectTestEvent: (eventOrPacket?: unknown) => boolean;
  setMode: (mode: string, options?: { userGesture?: boolean }) => boolean;
};

type SoundHarnessWindow = Window & {
  MeshAudio: {
    enabled: boolean;
    setEnabled: (value: boolean) => boolean;
    isEnabled: () => boolean;
    restore: () => boolean;
    sonifyPacket: (packet?: unknown) => unknown;
  };
  __coloradoMeshSound: SoundApi;
};

async function mountMapSoundOverlay(
  page: Page,
  options: { mode?: string; volume?: string; mobileSheet?: boolean; shellPreference?: 'analyzer' | 'minimal' } = {},
) {
  await page.route((url) => url.pathname === '/map', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>Map sound harness</title></head><body><main id="main-content"></main></body></html>',
    });
  });
  await page.goto('/map');
  await page.evaluate(({ mode, volume, shellPreference }) => {
    window.localStorage.removeItem('coloradoMesh.map.soundMode');
    window.localStorage.removeItem('coloradoMesh.map.soundVolume');
    window.localStorage.removeItem('denvermc.shell.userPreference');
    window.localStorage.setItem('live-audio-enabled', 'true');
    if (mode) window.localStorage.setItem('coloradoMesh.map.soundMode', mode);
    if (volume) window.localStorage.setItem('coloradoMesh.map.soundVolume', volume);
    if (shellPreference === 'analyzer') {
      window.localStorage.setItem('denvermc.shell.userPreference', 'analyzer');
    }

    const label = document.createElement('label');
    label.id = 'testAudioLabel';
    const toggle = document.createElement('input');
    toggle.id = 'liveAudioToggle';
    toggle.type = 'checkbox';
    toggle.checked = true;
    label.append(toggle, 'Audio');
    document.body.appendChild(label);

    const controls = document.createElement('div');
    controls.id = 'audioControls';
    controls.textContent = 'Audio controls';
    document.body.appendChild(controls);

    (window as unknown as SoundHarnessWindow).MeshAudio = {
      enabled: true,
      setEnabled(value: boolean) {
        this.enabled = value;
        return this.enabled;
      },
      isEnabled() {
        return this.enabled;
      },
      restore() {
        this.enabled = window.localStorage.getItem('live-audio-enabled') === 'true';
        return this.enabled;
      },
      sonifyPacket() {
        return 'upstream-audio';
      },
    };
  }, options);

  if (options.mobileSheet) {
    // The bottom sheet/backdrop depend on CSS positioning. Inject the
    // shell stylesheet so the sheet/trigger render the way they do in
    // the deployed CoreScope overlay.
    await page.addStyleTag({ content: shellOverlayCss });
  }
  await page.addScriptTag({ content: shellOverlayScript });
  await page.addScriptTag({ content: soundOverlayScript });
  if (options.mobileSheet) {
    // On phone widths the inline group is hidden in favor of the sheet
    // trigger; only assert attachment so existing visibility checks
    // don't fire for hidden controls.
    await expect(page.getByLabel('Colorado Mesh map sound mode')).toBeAttached();
  } else {
    await expect(page.getByLabel('Colorado Mesh map sound mode')).toBeVisible();
  }
}

async function getSoundState(page: Page) {
  return page.evaluate(() => (window as unknown as SoundHarnessWindow).__coloradoMeshSound.getState());
}

async function chooseSoundMode(page: Page, mode: string) {
  const select = page.getByLabel('Colorado Mesh map sound mode');
  await select.selectOption(mode);
  await expect.poll(() => getSoundState(page)).toMatchObject({ mode });
}

async function injectSoundBurst(page: Page, count: number, idPrefix = 'burst') {
  await page.evaluate(({ count: eventCount, idPrefix: prefix }) => {
    const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
    for (let i = 0; i < eventCount; i += 1) {
      api.injectTestEvent({
        id: `${prefix}-${i % 4}`,
        type: i % 7 === 0 ? 'NODEINFO' : 'GRP_TXT',
        modeHint: 'normal',
        channelName: i % 5 === 0 ? '#emergency' : 'Public',
        channelHash: i % 5 === 0 ? 'emergency' : null,
        isEmergency: i % 5 === 0,
        isPriority: i % 5 === 0 || i % 7 !== 0,
        isReplay: i % 11 === 0,
        observationCount: 1 + (i % 6),
        hopCount: 1 + (i % 4),
        intensity: 0.3 + (i % 5) * 0.09,
        seed: i,
        timestamp: 1715800000000 + i,
      });
    }
  }, { count, idPrefix });
}

async function mockOrchestralManifest(page: Page) {
  await page.route('/sound/orchestral/manifest.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 2,
        samples: [
          { id: 'harp-c5-forte', role: 'messages', url: '/test-audio/harp.wav', rootNote: 72, minMidi: 67, maxMidi: 77 },
          { id: 'harp-a4-warm', role: 'messages', url: '/test-audio/harp-warm.wav', rootNote: 69, minMidi: 64, maxMidi: 74 },
          { id: 'clarinet-f4-short', role: 'messages', url: '/test-audio/clarinet.wav', rootNote: 65, minMidi: 60, maxMidi: 70 },
          { id: 'flute-c5-staccato', role: 'messages', url: '/test-audio/flute.wav', rootNote: 72, minMidi: 67, maxMidi: 79 },
          { id: 'violin-pizz-c4', role: 'node', url: '/test-audio/pizzicato.wav', rootNote: 60, minMidi: 55, maxMidi: 65 },
          { id: 'viola-pizz-b3-soft', role: 'node', url: '/test-audio/viola.wav', rootNote: 59, minMidi: 54, maxMidi: 64 },
          { id: 'marimba-c4-hit', role: 'node', url: '/test-audio/marimba.wav', rootNote: 60, minMidi: 55, maxMidi: 67 },
          { id: 'timpani-hit-3', role: 'priority', url: '/test-audio/timpani.wav', rootNote: 50, minMidi: 45, maxMidi: 55 },
          { id: 'horn-c3-sustain', role: 'priority', url: '/test-audio/horn.wav', rootNote: 48, minMidi: 43, maxMidi: 55 },
        ],
        roles: {
          messages: ['harp-c5-forte', 'harp-a4-warm', 'clarinet-f4-short', 'flute-c5-staccato'],
          node: ['violin-pizz-c4', 'viola-pizz-b3-soft', 'marimba-c4-hit'],
          priority: ['timpani-hit-3', 'horn-c3-sustain', 'harp-c5-forte'],
          woodwinds: ['clarinet-f4-short', 'flute-c5-staccato'],
          strings: ['violin-pizz-c4', 'viola-pizz-b3-soft'],
          mallets: ['harp-c5-forte', 'harp-a4-warm', 'marimba-c4-hit'],
          brass: ['horn-c3-sustain'],
        },
      }),
    });
  });
  await page.route('/test-audio/*.wav', async (route) => {
    await route.fulfill({
      contentType: 'audio/wav',
      body: Buffer.from([0]),
    });
  });
}

async function installAudioProbe(page: Page) {
  await page.addInitScript(() => {
    type AudioParamStub = {
      value: number;
      setValueAtTime: (value: number) => void;
      exponentialRampToValueAtTime: (value: number) => void;
      setTargetAtTime: (value: number) => void;
    };

    const makeParam = (initial = 0): AudioParamStub => ({
      value: initial,
      setValueAtTime(value: number) {
        this.value = value;
      },
      exponentialRampToValueAtTime(value: number) {
        this.value = value;
      },
      setTargetAtTime(value: number) {
        this.value = value;
      },
    });

    class FakeAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
    }

    class FakeOscillatorNode extends FakeAudioNode {
      type = 'sine';
      frequency = makeParam(440);
      detune = makeParam(0);
      onended: (() => void) | null = null;
      start() {}
      stop() {
        this.onended?.();
      }
    }

    class FakeGainNode extends FakeAudioNode {
      gain = makeParam(1);
    }

    class FakeBiquadFilterNode extends FakeAudioNode {
      type = 'lowpass';
      frequency = makeParam(350);
      Q = makeParam(1);
    }

    class FakeBufferSourceNode extends FakeAudioNode {
      buffer: { duration: number } | null = null;
      loop = false;
      playbackRate = makeParam(1);
      onended: (() => void) | null = null;
      start() {}
      stop() {
        this.onended?.();
      }
    }

    class FakeDynamicsCompressorNode extends FakeAudioNode {
      threshold = makeParam(-24);
      knee = makeParam(30);
      ratio = makeParam(12);
      attack = makeParam(0.003);
      release = makeParam(0.25);
    }

    class FakeAudioContext {
      currentTime = 0;
      destination = new FakeAudioNode();
      sampleRate = 48000;
      state = 'running';
      audioWorklet = { addModule: () => Promise.reject(new Error('fake worklet unavailable')) };
      createGain() {
        return new FakeGainNode();
      }
      createDynamicsCompressor() {
        return new FakeDynamicsCompressorNode();
      }
      createOscillator() {
        return new FakeOscillatorNode();
      }
      createBiquadFilter() {
        return new FakeBiquadFilterNode();
      }
      createBufferSource() {
        return new FakeBufferSourceNode();
      }
      createBuffer(_channels: number, length: number, sampleRate: number) {
        return {
          duration: length / sampleRate,
          getChannelData: () => new Float32Array(length),
        };
      }
      decodeAudioData(_buffer: ArrayBuffer, success?: (buffer: { duration: number }) => void) {
        const decoded = { duration: 0.42 };
        success?.(decoded);
        return Promise.resolve(decoded);
      }
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      suspend() {
        this.state = 'suspended';
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: FakeAudioContext });
    Object.defineProperty(window, 'AudioWorkletNode', { configurable: true, value: undefined });
  });
}

test.describe('critical page smoke', () => {
  for (const pagePath of criticalPages) {
    test(`loads ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveTitle(/Colorado MeshCore/);
    });
  }

  test('start page exposes Get Started heading and three balanced journey paths', async ({ page }) => {
    await page.goto('/start');

    await expect(page.getByRole('heading', { level: 1, name: /Get Started/i })).toBeVisible();

    const main = page.locator('#main-content');

    for (const audience of ['Newcomer', 'Operator', 'Community']) {
      await expect(main.getByText(audience, { exact: true }).first()).toBeVisible();
    }

    await expect(main.getByRole('link', { name: /Getting started guide/i }).first()).toBeVisible();
    await expect(main.getByRole('link', { name: /Open operator tools/i }).first()).toBeVisible();
    await expect(main.getByRole('link', { name: /About the project/i }).first()).toBeVisible();

    await expect(main.locator('a[href="/map"]').first()).toBeVisible();
    await expect(main.locator('a[href="/tools"]').first()).toBeVisible();
    await expect(main.locator('a[href="/guides/repeater-setup"]').first()).toBeVisible();
    await expect(main.locator('a[href="/about"]').first()).toBeVisible();

    const discordLink = main.locator('a[href*="discord"]').first();
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('target', '_blank');
    await expect(discordLink).toHaveAttribute('rel', /noopener/);
  });

  test('map page exposes either the Docker CoreScope runtime or local fallback guidance', async ({ page }) => {
    await page.goto('/map');

    const fallbackHeading = page.getByRole('heading', { name: /Run Docker to use the production map/i });
    const coreScopeTopbar = page.getByRole('banner', { name: /Colorado Mesh live map/i });
    const hasFallback = await fallbackHeading.isVisible().catch(() => false);

    if (hasFallback) {
      await expect(page.getByText(/CoreScope runtime served by nginx inside the site container/i)).toBeVisible();
      await expect(page.getByText(/docker compose up --build/i)).toBeVisible();
    } else {
      await expect(coreScopeTopbar).toBeVisible();
      await expect(page.getByLabel('Colorado Mesh map sound mode')).toBeVisible();
    }
  });

  test('@sound map sound overlay defaults Off, uses the Colorado Mesh logo, and suppresses upstream audio', async ({ page }) => {
    await mountMapSoundOverlay(page);

    await expect(page.getByLabel('Colorado Mesh map sound mode')).toHaveValue('off');
    await expect(page.getByLabel('Colorado Mesh map sound volume')).toHaveValue('30');
    await expect(page.locator('.denvermc-topbar__mark-img')).toHaveAttribute('src', '/brand/color/mesh-color-256.png');
    await expect(page.locator('#liveAudioToggle')).toBeDisabled();
    await expect(page.locator('#testAudioLabel')).toBeHidden();
    await expect(page.locator('#audioControls')).toBeHidden();

    await expect.poll(() => page.evaluate(() => ({
      upstreamStored: window.localStorage.getItem('live-audio-enabled'),
      upstreamEnabled: (window as unknown as SoundHarnessWindow).MeshAudio.isEnabled(),
      upstreamSonifyResult: (window as unknown as SoundHarnessWindow).MeshAudio.sonifyPacket(),
    }))).toEqual({
      upstreamStored: 'false',
      upstreamEnabled: false,
      upstreamSonifyResult: false,
    });
  });

  test('@sound map sound overlay shows persisted modes as locked and persists volume changes', async ({ page }) => {
    await mountMapSoundOverlay(page, { mode: 'ensemble', volume: '0.72' });

    const mode = page.getByLabel('Colorado Mesh map sound mode');
    const volume = page.getByLabel('Colorado Mesh map sound volume');

    await expect(mode).toHaveValue('ensemble');
    await expect(volume).toHaveValue('72');
    await expect(page.locator('.denvermc-sound__status')).toContainText('Tap to start');
    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'ensemble',
      volume: 0.72,
      unlocked: false,
      status: 'locked',
    });

    await volume.evaluate((input) => {
      const slider = input as HTMLInputElement;
      slider.value = '42';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('coloradoMesh.map.soundVolume'))).toBe('0.42');
  });

  test('@sound map sound density keeps rising under burst traffic even when accents are dropped', async ({ page }) => {
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'native');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'native',
      unlocked: true,
    });

    await injectSoundBurst(page, 48, 'density-burst');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        ingested: 48,
      }),
      traffic: expect.objectContaining({
        total: 48,
      }),
    });

    const state = await getSoundState(page);
    expect(state.traffic.density).toBeGreaterThan(0);
    expect(state.traffic.activeWindowEvents).toBeGreaterThan(0);
    expect(state.counters.accentDropped).toBeGreaterThan(0);
    expect(state.counters.deduped).toBeGreaterThan(0);
    expect(state.counters.coalesced).toBeGreaterThan(0);
    expect(state.counters.burstAccents).toBeGreaterThan(0);
    expect(state.counters.played).toBeLessThan(48);
    expect(state.counters.routed).toBe(48);
    expect(state.sequencer.lastBurst).toMatchObject({ coalesced: true });
    expect(state.sequencer.queueLength).toBeLessThanOrEqual(160);
    expect(state.activeVoices).toBeLessThanOrEqual(24);
    expect(state.scheduledSources).toBeLessThanOrEqual(240);
    expect(state.cleanupTimers).toBeLessThanOrEqual(240);
  });

  test('@sound map sound normalization ignores raw payload and decoded message body contents', async ({ page }) => {
    await mountMapSoundOverlay(page);

    const normalized = await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      const basePacket = {
        hash: 'privacy-regression-hash',
        raw_hex: '00010203040506070809',
        observation_count: 3,
        timestamp: 1715801234567,
        decoded: {
          header: { payloadTypeName: 'GRP_TXT' },
          payload: {
            channelName: 'Public',
            text: 'first message body',
            message: 'first message body',
          },
        },
      };
      const changedPacket = {
        ...basePacket,
        raw_hex: 'fffefdfcfbfaf9f8f7f6',
        decoded: {
          header: { payloadTypeName: 'GRP_TXT' },
          payload: {
            channelName: 'Public',
            text: 'totally different message body',
            message: 'totally different message body',
          },
        },
      };
      return [api.normalizePacket(basePacket), api.normalizePacket(changedPacket)];
    });

    expect(normalized[0]).toEqual(normalized[1]);
    expect(normalized[0]).not.toMatchObject({ raw_hex: expect.any(String) });
    expect(JSON.stringify(normalized[0])).not.toContain('message body');
  });

  for (const soundMode of ['native', 'generative', 'ensemble', 'blaster'] as const) {
    test(`@sound map sound mode ${soundMode} is selectable, locked until gesture, and exposes worklet diagnostics`, async ({ page }) => {
      await mountMapSoundOverlay(page, { mode: soundMode });

      await expect(page.getByLabel('Colorado Mesh map sound mode')).toHaveValue(soundMode);
      await expect.poll(() => getSoundState(page)).toMatchObject({
        mode: soundMode,
        unlocked: false,
        status: 'locked',
      });

      await chooseSoundMode(page, 'off');
      await chooseSoundMode(page, soundMode);

      await expect.poll(() => getSoundState(page)).toMatchObject({
        mode: soundMode,
        unlocked: true,
        status: 'ready',
      });

      const state = await getSoundState(page);
      expect(['loading', 'ready', 'fallback']).toContain(state.worklet.status);
      expect(state.worklet.schedulerActive || state.worklet.fallbackActive || state.worklet.active || state.worklet.status === 'loading').toBe(true);
    });
  }

  test('@sound map sound exposes stable public APIs and mode-specific diagnostics', async ({ page }) => {
    await mockOrchestralManifest(page);
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);

    const options = await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      return {
        sameApi: api === (window as unknown as { __denvermcMapSound: SoundApi }).__denvermcMapSound,
        modes: api.getModeOptions(),
      };
    });
    expect(options.sameApi).toBe(true);
    expect(options.modes).toEqual([
      { value: 'off', label: 'Sound Off' },
      { value: 'native', label: 'Native+' },
      { value: 'generative', label: 'Generative Key' },
      { value: 'ensemble', label: 'Orchestral Ensemble' },
      { value: 'chime', label: 'Wind Chimes' },
      { value: 'blaster', label: 'Space Blaster' },
    ]);

    await chooseSoundMode(page, 'ensemble');
    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'ensemble',
      unlocked: true,
      ensemble: expect.objectContaining({ loaded: true }),
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      api.injectTestEvent({
        id: 'final-ensemble-0',
        type: 'GRP_TXT',
        modeHint: 'normal',
        channelName: 'Public',
        channelHash: null,
        isEmergency: false,
        isPriority: false,
        isReplay: false,
        observationCount: 1,
        hopCount: 1,
        intensity: 0.46,
        seed: 7100,
        timestamp: 1715808000000,
      });
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      sequencer: expect.objectContaining({
        scheduled: 1,
        recentEnsembleTemplates: expect.arrayContaining(['message-phrase']),
      }),
    });
    const ensembleState = await getSoundState(page);
    expect(ensembleState.sequencer.recentEnsembleRoles).toEqual(expect.arrayContaining(['messages', 'woodwinds', 'mallets']));
    expect(ensembleState.sequencer.recentBlasterPatches).toHaveLength(0);

    await chooseSoundMode(page, 'blaster');
    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 4; i += 1) {
        api.injectTestEvent({
          id: `final-blaster-${i}`,
          type: i === 0 ? 'NODEINFO' : 'GRP_TXT',
          modeHint: 'normal',
          channelName: i === 2 ? '#emergency' : 'Public',
          channelHash: i === 2 ? 'emergency' : null,
          isEmergency: i === 2,
          isPriority: i === 2,
          isReplay: false,
          observationCount: 1 + i,
          hopCount: 1,
          intensity: 0.52,
          seed: 7200 + i,
          timestamp: 1715809000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      sequencer: expect.objectContaining({
        scheduled: 4,
        recentBlasterPatches: expect.arrayContaining(['node-beacon', 'signal-pulse', 'priority-chime']),
      }),
    });
    const blasterState = await getSoundState(page);
    expect(blasterState.sequencer.recentEnsembleTemplates).toHaveLength(0);
    for (const cue of blasterState.sequencer.recentBlasterCues) {
      expect(cue.filterQ).toBeLessThanOrEqual(1.1);
      expect(cue.maxFrequency).toBeLessThanOrEqual(523.26);
    }
  });

  test('@sound map sound coalesces same-id ping-pong bursts instead of scheduling every duplicate', async ({ page }) => {
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'generative');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'generative',
      unlocked: true,
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 10; i += 1) {
        api.injectTestEvent({
          id: 'same-ping-pong-path',
          type: 'GRP_TXT',
          modeHint: 'normal',
          channelName: 'Public',
          channelHash: null,
          isEmergency: false,
          isPriority: false,
          isReplay: false,
          observationCount: 2,
          hopCount: 2 + (i % 2),
          intensity: 0.48,
          seed: 700 + i,
          timestamp: 1715801000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        routed: 10,
        admitted: 4,
        deduped: 9,
        coalesced: 3,
        burstAccents: 3,
        played: 4,
      }),
      sequencer: expect.objectContaining({
        scheduled: 4,
        coalesced: 3,
      }),
    });

    const state = await getSoundState(page);
    expect(state.counters.played).toBeLessThan(10);
    expect(state.sequencer.lastCue).toMatchObject({
      mode: 'generative',
      type: 'GRP_TXT',
      lane: 'normal',
      ordinal: 4,
      coalesced: true,
      burstCount: 3,
      admissionReason: 'coalesced:dedupe',
    });
    expect(state.sequencer.lastAdmission).toMatchObject({
      type: 'GRP_TXT',
      lane: 'normal',
      accepted: true,
      reason: 'coalesced:dedupe',
      coalesced: true,
      burstCount: 3,
    });
    expect(state.sequencer.lastBurst).toMatchObject({
      mode: 'generative',
      type: 'GRP_TXT',
      lane: 'normal',
      coalesced: true,
      burstCount: 3,
    });
    expect(state.lastDroppedReason).toBeNull();
  });

  test('@sound map sound Orchestral Ensemble rotates message samples and keeps scheduled notes in one key', async ({ page }) => {
    await mockOrchestralManifest(page);
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'ensemble');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'ensemble',
      unlocked: true,
      ensemble: expect.objectContaining({ loaded: true }),
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 6; i += 1) {
        api.injectTestEvent({
          id: `ensemble-message-${i}`,
          type: 'GRP_TXT',
          modeHint: 'normal',
          channelName: 'Public',
          channelHash: null,
          isEmergency: false,
          isPriority: false,
          isReplay: false,
          observationCount: 1,
          hopCount: 1 + (i % 3),
          intensity: 0.44,
          seed: 1200 + i,
          timestamp: 1715802000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        routed: 6,
        admitted: 6,
      }),
      sequencer: expect.objectContaining({
        scheduled: 6,
      }),
    });

    const state = await getSoundState(page);
    const allowedPitchClasses = new Set([0, 2, 3, 5, 7, 9, 10]);
    expect(state.sequencer.recentMidi.length).toBeGreaterThanOrEqual(6);
    for (const midi of state.sequencer.recentMidi) {
      expect(allowedPitchClasses.has(((midi % 12) + 12) % 12)).toBe(true);
    }
    expect(new Set(state.sequencer.recentSampleIds).size).toBeGreaterThan(2);
    expect(new Set(state.sequencer.recentEnsembleRoles).size).toBeGreaterThan(1);
    expect(state.sequencer.recentSampleIds).toEqual(expect.arrayContaining(['harp-c5-forte', 'clarinet-f4-short']));
    expect(state.sequencer.recentEnsembleRoles).toEqual(expect.arrayContaining(['messages', 'woodwinds', 'mallets']));
    expect(state.sequencer.recentEnsembleTemplates).toEqual(expect.arrayContaining(['message-phrase']));
  });

  test('@sound map sound Orchestral Ensemble keeps normalized public text on message templates', async ({ page }) => {
    await mockOrchestralManifest(page);
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'ensemble');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'ensemble',
      unlocked: true,
      ensemble: expect.objectContaining({ loaded: true }),
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 4; i += 1) {
        api.injectTestEvent({
          hash: `normalized-public-text-${i}`,
          observation_count: 1,
          decoded: {
            header: { payloadTypeName: 'GRP_TXT' },
            payload: { channelName: 'Public', hopCount: 1 + (i % 2) },
          },
          _ts: 1715803000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        normalized: 4,
        routed: 4,
        admitted: 4,
      }),
      lastNormalizedEvent: expect.objectContaining({
        type: 'GRP_TXT',
        isEmergency: false,
        isPriority: true,
      }),
      sequencer: expect.objectContaining({
        scheduled: 4,
      }),
    });

    const state = await getSoundState(page);
    expect(state.sequencer.recentEnsembleTemplates).toEqual(expect.arrayContaining(['message-phrase']));
    expect(state.sequencer.recentEnsembleTemplates).not.toContain('priority-fanfare');
    expect(state.sequencer.recentEnsembleTemplates).not.toContain('priority-burst');
    expect(state.sequencer.recentEnsembleRoles).toEqual(expect.arrayContaining(['messages', 'woodwinds', 'mallets']));
    expect(state.sequencer.recentEnsembleRoles).not.toContain('priority');
    expect(state.sequencer.recentEnsembleRoles).not.toContain('brass');
  });

  test('@sound map sound Orchestral Ensemble uses cinematic burst and priority templates within resource bounds', async ({ page }) => {
    await mockOrchestralManifest(page);
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'ensemble');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'ensemble',
      unlocked: true,
      ensemble: expect.objectContaining({ loaded: true }),
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 10; i += 1) {
        api.injectTestEvent({
          id: 'ensemble-normal-duplicate-burst',
          type: 'GRP_TXT',
          modeHint: 'normal',
          channelName: 'Public',
          channelHash: null,
          isEmergency: false,
          isPriority: false,
          isReplay: false,
          observationCount: 2,
          hopCount: 2,
          intensity: 0.54,
          seed: 3100 + i,
          timestamp: 1715804000000 + i,
        });
      }
      for (let i = 0; i < 10; i += 1) {
        api.injectTestEvent({
          id: 'ensemble-priority-duplicate-burst',
          type: 'GRP_TXT',
          modeHint: 'priority',
          channelName: '#emergency',
          channelHash: 'emergency',
          isEmergency: true,
          isPriority: true,
          isReplay: false,
          observationCount: 5,
          hopCount: 1,
          intensity: 0.78,
          seed: 4100 + i,
          timestamp: 1715805000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        routed: 20,
        coalesced: expect.any(Number),
        burstAccents: expect.any(Number),
      }),
      sequencer: expect.objectContaining({
        scheduled: expect.any(Number),
        coalesced: expect.any(Number),
      }),
    });

    const state = await getSoundState(page);
    const allowedPitchClasses = new Set([0, 2, 3, 5, 7, 9, 10]);
    expect(state.counters.coalesced).toBeGreaterThan(0);
    expect(state.counters.burstAccents).toBeGreaterThan(0);
    expect(state.sequencer.recentEnsembleTemplates).toEqual(expect.arrayContaining(['priority-burst', 'traffic-burst']));
    expect(state.sequencer.recentEnsembleRoles).toEqual(expect.arrayContaining(['priority', 'brass', 'messages']));
    for (const midi of state.sequencer.recentMidi) {
      expect(allowedPitchClasses.has(((midi % 12) + 12) % 12)).toBe(true);
    }
    expect(state.activeVoices).toBeLessThanOrEqual(24);
    expect(state.scheduledSources).toBeLessThanOrEqual(240);
    expect(state.cleanupTimers).toBeLessThanOrEqual(240);
  });

  test('@sound map sound Space Blaster uses musical patch bounds for normal and priority traffic', async ({ page }) => {
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'blaster');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'blaster',
      unlocked: true,
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 8; i += 1) {
        api.injectTestEvent({
          id: `blaster-ping-${i}`,
          type: i % 3 === 0 ? 'NODEINFO' : 'GRP_TXT',
          modeHint: 'normal',
          channelName: i % 4 === 0 ? '#emergency' : 'Public',
          channelHash: i % 4 === 0 ? 'emergency' : null,
          isEmergency: i % 4 === 0,
          isPriority: i % 4 === 0,
          isReplay: false,
          observationCount: 1 + (i % 4),
          hopCount: 1 + (i % 2),
          intensity: 0.52,
          seed: 2100 + i,
          timestamp: 1715803000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        routed: 8,
      }),
      sequencer: expect.objectContaining({
        scheduled: 8,
      }),
    });

    const state = await getSoundState(page);
    expect(state.sequencer.recentBlasterCues.length).toBeGreaterThanOrEqual(8);
    expect(state.sequencer.recentBlasterPatches).toEqual(expect.arrayContaining(['node-beacon', 'signal-pulse', 'priority-chime']));
    for (const cue of state.sequencer.recentBlasterCues) {
      expect(cue.maxFrequency).toBeLessThanOrEqual(523.26);
      expect(cue.baseFrequency).toBeGreaterThanOrEqual(130.81);
      expect(cue.semitoneGlide).toBeLessThanOrEqual(cue.lane === 'priority' ? 2.01 : 2.01);
      expect(cue.filterQ).toBeLessThanOrEqual(1.1);
      expect(cue.noiseGain).toBeLessThanOrEqual(cue.lane === 'priority' ? 0.012 : 0.006);
      expect(cue.duration).toBeLessThanOrEqual(0.65);
    }
  });

  test('@sound map sound Space Blaster uses softer burst patches within resource bounds', async ({ page }) => {
    await installAudioProbe(page);
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'blaster');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'blaster',
      unlocked: true,
    });

    await page.evaluate(() => {
      const api = (window as unknown as SoundHarnessWindow).__coloradoMeshSound;
      for (let i = 0; i < 10; i += 1) {
        api.injectTestEvent({
          id: 'blaster-normal-duplicate-burst',
          type: 'GRP_TXT',
          modeHint: 'normal',
          channelName: 'Public',
          channelHash: null,
          isEmergency: false,
          isPriority: false,
          isReplay: false,
          observationCount: 2,
          hopCount: 2,
          intensity: 0.56,
          seed: 5100 + i,
          timestamp: 1715806000000 + i,
        });
      }
      for (let i = 0; i < 10; i += 1) {
        api.injectTestEvent({
          id: 'blaster-priority-duplicate-burst',
          type: 'GRP_TXT',
          modeHint: 'priority',
          channelName: '#emergency',
          channelHash: 'emergency',
          isEmergency: true,
          isPriority: true,
          isReplay: false,
          observationCount: 5,
          hopCount: 1,
          intensity: 0.78,
          seed: 6100 + i,
          timestamp: 1715807000000 + i,
        });
      }
    });

    await expect.poll(() => getSoundState(page)).toMatchObject({
      counters: expect.objectContaining({
        routed: 20,
        coalesced: expect.any(Number),
        burstAccents: expect.any(Number),
      }),
      sequencer: expect.objectContaining({
        scheduled: expect.any(Number),
      }),
    });

    const state = await getSoundState(page);
    expect(state.counters.coalesced).toBeGreaterThan(0);
    expect(state.counters.burstAccents).toBeGreaterThan(0);
    expect(state.sequencer.recentBlasterPatches).toEqual(expect.arrayContaining(['traffic-sweep', 'priority-surge']));
    for (const cue of state.sequencer.recentBlasterCues) {
      expect(cue.maxFrequency).toBeLessThanOrEqual(523.26);
      expect(cue.filterQ).toBeLessThanOrEqual(1.1);
      expect(cue.noiseGain).toBeLessThanOrEqual(cue.lane === 'priority' ? 0.022 : 0.014);
      expect(cue.duration).toBeLessThanOrEqual(0.75);
    }
    expect(state.activeVoices).toBeLessThanOrEqual(24);
    expect(state.scheduledSources).toBeLessThanOrEqual(240);
    expect(state.cleanupTimers).toBeLessThanOrEqual(240);
  });

  test('@sound map sound burst cleanup stays bounded after switching Off', async ({ page }) => {
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'blaster');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'blaster',
      unlocked: true,
    });

    await injectSoundBurst(page, 72, 'cleanup-burst');

    const burstState = await getSoundState(page);
    expect(burstState.activeVoices).toBeLessThanOrEqual(24);
    expect(burstState.scheduledSources).toBeLessThanOrEqual(240);
    expect(burstState.cleanupTimers).toBeLessThanOrEqual(240);

    await chooseSoundMode(page, 'off');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'off',
      unlocked: false,
      activeVoices: 0,
      scheduledSources: 0,
      scheduledNodes: 0,
      cleanupTimers: 0,
      worklet: expect.objectContaining({
        active: false,
        schedulerActive: false,
        fallbackActive: false,
      }),
    });
  });

  test('map sound mobile bottom sheet stays within the viewport at 320/360/390/430 portrait widths', async ({ page }) => {
    const portraitWidths = [320, 360, 390, 430] as const;
    for (const width of portraitWidths) {
      await page.setViewportSize({ width, height: 844 });
      await mountMapSoundOverlay(page, { mobileSheet: true });

      const trigger = page.locator('#denvermcSoundTrigger');
      const sheet = page.locator('#denvermcSoundSheet');

      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(sheet).toBeVisible();

      const geometry = await sheet.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          viewport: window.innerWidth,
        };
      });

      expect(
        geometry.left,
        `sheet left edge must stay within viewport at ${width}px`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        geometry.right,
        `sheet right edge must stay within viewport at ${width}px`,
      ).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.width).toBeGreaterThan(0);
      expect(geometry.width).toBeLessThanOrEqual(geometry.viewport);

      // Body must not gain a horizontal scrollbar from the sheet itself.
      const overflowsHorizontally = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflowsHorizontally, `no horizontal overflow at ${width}px`).toBe(false);
    }
  });

  test('map sound mobile bottom sheet opens, closes via Escape/backdrop/close, and preserves the sound API', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mountMapSoundOverlay(page, { mobileSheet: true });

    const trigger = page.locator('#denvermcSoundTrigger');
    const sheet = page.locator('#denvermcSoundSheet');
    const backdrop = page.locator('#denvermcSoundSheetBackdrop');
    const closeBtn = page.locator('.denvermc-sound-sheet__close');
    const inlineSound = page.locator('.denvermc-topbar__actions > .denvermc-sound');

    // Compact trigger is the only sound affordance visible on phone widths.
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'denvermcSoundSheet');
    // Inline sound group moved into the sheet body — none remain as a
    // direct child of the topbar actions container.
    await expect(inlineSound).toHaveCount(0);
    // Sheet starts hidden, with aria-hidden=true and tabIndex managed.
    await expect(sheet).toBeHidden();
    await expect(sheet).toHaveAttribute('aria-hidden', 'true');

    // Open via trigger -> sheet visible, sound controls reachable.
    await trigger.click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('aria-hidden', 'false');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(closeBtn).toBeFocused();
    await expect(page.getByLabel('Colorado Mesh map sound mode')).toBeVisible();
    await expect(page.getByLabel('Colorado Mesh map sound volume')).toBeVisible();

    // Public sound API still drives the controls from inside the sheet.
    await page.getByLabel('Colorado Mesh map sound mode').selectOption('native');
    await expect.poll(() => getSoundState(page)).toMatchObject({ mode: 'native', unlocked: true });

    // Escape closes and returns focus to the trigger.
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(sheet).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    // Backdrop closes.
    await trigger.click();
    await expect(sheet).toBeVisible();
    await backdrop.click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Explicit close button closes.
    await trigger.click();
    await expect(sheet).toBeVisible();
    await closeBtn.click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('map sound mobile analyzer mode exposes the overlay topbar and compact sound trigger at 320/360/390/430 portrait widths', async ({ page }) => {
    const portraitWidths = [320, 360, 390, 430] as const;
    for (const width of portraitWidths) {
      await page.setViewportSize({ width, height: 844 });
      await mountMapSoundOverlay(page, { mobileSheet: true, shellPreference: 'analyzer' });

      const body = page.locator('body');
      const topbar = page.locator('.denvermc-topbar');
      const trigger = page.locator('#denvermcSoundTrigger');
      const sheet = page.locator('#denvermcSoundSheet');
      const brand = page.locator('.denvermc-topbar__brand');

      // Analyzer mode is active and the overlay topbar is no longer
      // hidden by CSS — both must be true for the sound trigger to be
      // reachable on the analyzer live route.
      await expect(body, `analyzer body class at ${width}px`).toHaveClass(/denvermc-analyzer/);
      await expect(topbar, `overlay topbar visible in analyzer at ${width}px`).toBeVisible();
      await expect(trigger, `compact sound trigger visible in analyzer at ${width}px`).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Topbar must clear the top safe-area inset (no negative offset).
      const topbarTop = await topbar.evaluate((el) => el.getBoundingClientRect().top);
      expect(topbarTop, `overlay topbar starts on-screen at ${width}px`).toBeGreaterThanOrEqual(0);

      // Regression guard for the mobile padding-shorthand pitfall: the
      // topbar must continue to apply the env-derived safe-area inset as
      // its padding-top at every mobile breakpoint. Headless Chromium
      // resolves `env(safe-area-inset-top, 0px)` to 0, so we inject a
      // simulated inset via the `--denvermc-topbar-safe-top` CSS variable
      // and verify the override survives the 768/540/360px media-query
      // cascade. If a future edit reintroduces `padding: 0 X` shorthand
      // on `.denvermc-topbar`, this assertion will fail because the
      // padding-top longhand gets reset to 0.
      const paddingTop = await topbar.evaluate((el) => {
        const root = document.documentElement;
        const previous = root.style.getPropertyValue('--denvermc-topbar-safe-top');
        root.style.setProperty('--denvermc-topbar-safe-top', '47px');
        const value = window.getComputedStyle(el).paddingTop;
        if (previous) root.style.setProperty('--denvermc-topbar-safe-top', previous);
        else root.style.removeProperty('--denvermc-topbar-safe-top');
        return value;
      });
      expect(
        paddingTop,
        `overlay topbar preserves safe-area padding-top at ${width}px`,
      ).toBe('47px');

      // Brand link must clear the 44×44 touch-target floor on phones —
      // both the visible mark and the surrounding tap surface need to
      // be large enough that a one-handed thumb reliably hits it.
      const brandBox = await brand.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      expect(
        brandBox.height,
        `brand link height ≥ 44px at ${width}px`,
      ).toBeGreaterThanOrEqual(44);
      expect(
        brandBox.width,
        `brand link width ≥ 44px at ${width}px`,
      ).toBeGreaterThanOrEqual(44);

      // Sheet open → sound API controls reachable through the bottom sheet.
      await trigger.click();
      await expect(sheet, `sheet opens in analyzer at ${width}px`).toBeVisible();
      await expect(page.getByLabel('Colorado Mesh map sound mode'), `mode select reachable at ${width}px`).toBeVisible();
      await expect(page.getByLabel('Colorado Mesh map sound volume'), `volume reachable at ${width}px`).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(sheet, `Escape closes sheet at ${width}px`).toBeHidden();

      // Focus mode is still zero-distraction: switching to focus must
      // hide the topbar even after analyzer just exposed it.
      await page.evaluate(() => {
        (document.getElementById('denvermcFocusBtn') as HTMLButtonElement | null)?.click();
      });
      await expect(body, `focus body class at ${width}px`).toHaveClass(/denvermc-focus/);
      await expect(topbar, `overlay topbar hidden in focus at ${width}px`).toBeHidden();
      await expect(trigger, `sound trigger hidden in focus at ${width}px`).toBeHidden();
    }
  });

  test('site icon metadata points at same-origin Colorado Mesh derivatives and excludes legacy /brand/linux and /brand/win paths', async ({ page }) => {
    await page.goto('/');

    const iconHrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]')).map(
        (link) => (link as HTMLLinkElement).getAttribute('href') ?? '',
      ),
    );

    expect(iconHrefs.length).toBeGreaterThan(0);
    for (const href of iconHrefs) {
      expect(href.startsWith('/')).toBe(true);
      expect(href).not.toContain('/brand/linux/');
      expect(href).not.toContain('/brand/win/');
    }
    expect(iconHrefs).toEqual(expect.arrayContaining([
      expect.stringMatching(/\/favicon\.ico/),
      expect.stringMatching(/\/favicon-16x16\.png/),
      expect.stringMatching(/\/favicon-32x32\.png/),
      expect.stringMatching(/\/apple-touch-icon\.png/),
      expect.stringMatching(/\/brand\/color\/mesh-color-256\.png/),
    ]));

    const assetChecks = await page.evaluate(async (paths: string[]) => {
      const results: Array<{ path: string; status: number | null; type: string | null }> = [];
      for (const path of paths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          results.push({
            path,
            status: response.status,
            type: response.headers.get('content-type'),
          });
        } catch {
          results.push({ path, status: null, type: null });
        }
      }
      return results;
    }, [
      '/favicon.ico',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/brand/color/mesh-color-256.png',
    ]);

    for (const { path, status, type } of assetChecks) {
      expect(status, `expected 200 for ${path}`).toBe(200);
      const contentType = (type || '').toLowerCase();
      if (path.endsWith('.ico')) {
        expect(
          contentType.includes('icon') || contentType.includes('image/'),
          `unexpected content-type for ${path}: ${contentType}`,
        ).toBe(true);
      } else {
        expect(contentType).toContain('image/png');
      }
    }
  });

  test('map overlay logo resolves to the vendored color mesh asset on desktop', async ({ page }) => {
    await mountMapSoundOverlay(page);
    const logo = page.locator('.denvermc-topbar__mark-img');
    await expect(logo).toHaveAttribute('src', '/brand/color/mesh-color-256.png');
    const status = await logo.evaluate((img) => {
      const i = img as HTMLImageElement;
      return new Promise<{ status: number | null; type: string | null }>((resolve) => {
        fetch(i.src, { method: 'HEAD' })
          .then((r) => resolve({ status: r.status, type: r.headers.get('content-type') }))
          .catch(() => resolve({ status: null, type: null }));
      });
    });
    expect(status.status).toBe(200);
    expect((status.type || '').toLowerCase()).toContain('image/png');
  });

  test('tools hub exposes all four operator tools as first-class entries', async ({ page }) => {
    await page.goto('/tools');
    const main = page.locator('#main-content');

    const toolHrefs = [
      '/tools/repeater-name',
      '/tools/companion-name',
      '/tools/prefix-matrix',
      '/tools/serial-usb',
    ];

    for (const href of toolHrefs) {
      await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    await expect(main.locator('a[href="/map"]').first()).toBeVisible();
    await expect(main.locator('a[href="/guides/repeater-setup"]').first()).toBeVisible();
    await expect(main.getByText(/Utility defaults are generated from/i)).toBeVisible();

    const upstreamLink = main.getByRole('link', { name: 'Colorado-Mesh/meshcore-utilities-site' });
    await expect(upstreamLink).toBeVisible();
    await expect(upstreamLink).toHaveAttribute('target', '_blank');
    await expect(upstreamLink).toHaveAttribute('rel', /noopener/);
  });

  for (const { source, destination } of upstreamUtilityRedirects) {
    test(`redirects upstream utility path ${source} to ${destination}`, async ({ page }) => {
      await page.goto(source);
      await expect(page).toHaveURL(new RegExp(`${destination.replaceAll('/', '\\/')}$`));
      await expect(page.locator('#main-content')).toBeVisible();
    });
  }

  test('guides hub exposes all guide pages and a tools handoff', async ({ page }) => {
    await page.goto('/guides');
    const main = page.locator('#main-content');

    const guideHrefs = [
      '/guides/getting-started',
      '/guides/radio-settings',
      '/guides/repeater-setup',
      '/guides/naming-standard',
      '/guides/troubleshooting',
    ];

    for (const href of guideHrefs) {
      await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    const toolHandoffHrefs = [
      '/tools/repeater-name',
      '/tools/companion-name',
      '/tools/prefix-matrix',
      '/tools/serial-usb',
    ];

    for (const href of toolHandoffHrefs) {
      await expect(main.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    await expect(main.locator('a[href="/tools"]').first()).toBeVisible();
  });

  test('serial-usb tool previews settings JSON and disables Apply without a connection', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'serial', {
        configurable: true,
        get: () => undefined,
      });
    });
    await page.goto('/tools/serial-usb');
    await expect(page.getByRole('heading', { name: /USB serial/i })).toBeVisible();

    await expect(page.getByTestId('serial-support-banner')).toContainText('Web Serial not available');
    await expect(page.getByTestId('serial-support-status')).toContainText('Unavailable in this browser');
    await expect(page.getByTestId('serial-connect')).toBeDisabled();

    const input = page.getByTestId('serial-settings-input');
    await expect(input).toBeVisible();

    const settingsJson = JSON.stringify({
      name: 'DEN-GLDN-LKVST-RC-A10F',
      radio_settings: { tx_power: 22 },
    });
    await input.fill(settingsJson);

    const preview = page.getByTestId('serial-settings-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('set name DEN-GLDN-LKVST-RC-A10F');
    await expect(preview).toContainText('set tx 22');

    const apply = page.getByTestId('serial-settings-apply');
    await expect(apply).toBeDisabled();
    await expect(page.getByText('Connect a device above to enable Apply.')).toBeVisible();

    await input.fill('{not json');
    await expect(page.getByTestId('serial-settings-error')).toBeVisible();
    await expect(apply).toBeDisabled();
  });

  test('prefix-matrix page exposes search, suggestion, and 4-char grid', async ({ page }) => {
    await mockCoreScopeAnalyzer(page);
    await page.goto('/tools/prefix-matrix');
    await expect(page.getByRole('heading', { name: /prefix matrix/i })).toBeVisible();

    const summary = page.getByTestId('prefix-matrix-summary');
    await expect(summary).toBeVisible({ timeout: 15_000 });
    await expect(summary).toContainText('occupied 4-char prefixes');

    const search = page.getByTestId('prefix-matrix-search');
    await expect(search).toBeVisible();
    await search.fill('00');

    const suggest = page.getByTestId('prefix-matrix-suggest');
    await expect(suggest).toBeEnabled();
    await search.fill('');
    await suggest.focus();
    await page.keyboard.press('Enter');

    const detail = page.getByTestId('prefix-matrix-detail');
    await expect(detail).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('prefix-matrix-primary-A1').focus();
    await page.keyboard.press('Enter');
    await page.getByTestId('prefix-matrix-secondary-A10F').focus();
    await page.keyboard.press('Enter');
    await expect(detail).toContainText('nodes share 0xA10F');

    await page.getByTestId('prefix-matrix-primary-00').focus();
    await page.keyboard.press('Enter');
    await page.getByTestId('prefix-matrix-secondary-0000').focus();
    await page.keyboard.press('Enter');
    await expect(detail).toContainText('Reserved prefix');
  });
});

const interactiveToolPages = [
  '/tools/repeater-name',
  '/tools/companion-name',
  '/tools/prefix-matrix',
  '/tools/serial-usb',
];

const representativeDetailPages = [
  '/guides/getting-started',
  '/guides/repeater-setup',
  '/blog/network-expansion-2026',
];

test.describe('critical page accessibility @a11y', () => {
  for (const pagePath of criticalPages) {
    test(`has no detectable axe violations on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('interactive tool smoke', () => {
  for (const pagePath of interactiveToolPages) {
    test(`loads ${pagePath} with a main heading and main landmark`, async ({ page }) => {
      if (pagePath === '/tools/serial-usb') {
        await page.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, 'serial', {
            configurable: true,
            get: () => undefined,
          });
        });
      }
      if (pagePath === '/tools/prefix-matrix') {
        await mockCoreScopeAnalyzer(page);
      }
      await page.goto(pagePath);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }

  test('repeater-name wizard surfaces map snapshot inputs and outputs', async ({ page }) => {
    await mockCoreScopeAnalyzer(page);
    await page.goto('/tools/repeater-name');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const main = page.locator('#main-content');
    await expect(main.getByRole('textbox').first()).toBeVisible();
  });

  test('companion-name builder accepts a single emoji grapheme', async ({ page }) => {
    await page.goto('/tools/companion-name');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const emoji = page.getByLabel('Emoji', { exact: true });
    await expect(emoji).toBeVisible();
    await emoji.fill('👻');
    await expect(emoji).toHaveValue('👻');
  });

  test('prefix-matrix grid cells expose accessible names', async ({ page }) => {
    await mockCoreScopeAnalyzer(page);
    await page.goto('/tools/prefix-matrix');
    const grid = page.getByRole('grid', { name: /First-byte prefix matrix/i });
    await expect(grid).toBeVisible({ timeout: 15_000 });
    const primaryCell = page.getByTestId('prefix-matrix-primary-A1');
    await expect(primaryCell).toBeVisible();
    await expect(primaryCell).toHaveAttribute('aria-label', /A1/);
    await expect(primaryCell).toHaveAttribute('aria-selected', /true|false/);
  });
});

test.describe('interactive tool accessibility @a11y', () => {
  for (const pagePath of interactiveToolPages) {
    test(`has no detectable axe violations on ${pagePath}`, async ({ page }) => {
      if (pagePath === '/tools/serial-usb') {
        await page.addInitScript(() => {
          Object.defineProperty(Navigator.prototype, 'serial', {
            configurable: true,
            get: () => undefined,
          });
        });
      }
      if (pagePath === '/tools/prefix-matrix') {
        await mockCoreScopeAnalyzer(page);
      }
      await page.goto(pagePath);
      const results = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('representative detail page smoke', () => {
  for (const pagePath of representativeDetailPages) {
    test(`loads ${pagePath} with a main heading and main landmark`, async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});

test.describe('representative detail page accessibility @a11y', () => {
  for (const pagePath of representativeDetailPages) {
    test(`has no detectable axe violations on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const results = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

const PRIMARY_NAV_LABELS = [
  'Get Started',
  'Live Map',
  'Tools',
  'Guides',
  'Learn',
  'About',
] as const;

const ACTIVE_NAV_CASES: ReadonlyArray<{ route: string; label: string }> = [
  { route: '/map', label: 'Live Map' },
  { route: '/tools/repeater-name', label: 'Tools' },
  { route: '/guides/getting-started', label: 'Guides' },
  { route: '/blog', label: 'Learn' },
];

test.describe('global navigation', () => {
  test('header exposes the approved primary nav labels', async ({ page }) => {
    await page.goto('/');
    const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const label of PRIMARY_NAV_LABELS) {
      await expect(mainNav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  });

  for (const { route, label } of ACTIVE_NAV_CASES) {
    test(`marks "${label}" as current on ${route}`, async ({ page }) => {
      await page.goto(route);
      const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
      const currentLinks = mainNav.locator('a[aria-current="page"]');
      await expect(currentLinks).toHaveCount(1);
      await expect(currentLinks.first()).toHaveText(label);
    });
  }

  test('does not mark any header link active on an unmatched route', async ({ page }) => {
    await page.goto('/');
    const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(mainNav.locator('a[aria-current="page"]')).toHaveCount(0);
  });

  test('mobile menu opens, lists primary nav, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const openButton = page.getByRole('button', { name: /Open main menu/i });
    await expect(openButton).toBeVisible();
    await expect(openButton).toHaveAttribute('aria-expanded', 'false');

    const dialog = page.locator('#mobile-menu');
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');

    await openButton.click();
    await expect(openButton).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog).toHaveAttribute('aria-hidden', 'false');
    await expect(page.getByRole('button', { name: /Close menu/i })).toBeFocused();
    for (const label of PRIMARY_NAV_LABELS) {
      await expect(dialog.getByRole('link', { name: label, exact: true })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(openButton).toHaveAttribute('aria-expanded', 'false');
    await expect(dialog).toHaveAttribute('aria-hidden', 'true');
  });

  test('skip link focuses first and points to main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-content')).toBeAttached();

    await page.keyboard.press('Tab');
    const skipLink = page.getByTestId('skip-to-main');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });
});

test.describe('map page interaction details', () => {
  test('local-development fallback keeps map guidance readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/map');

    const fallback = page.getByRole('heading', { name: /Run Docker to use the production map/i });
    await expect(fallback).toBeVisible();
    await expect(page.getByText(/docker compose up --build/i)).toBeVisible();
  });
});
