import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const criticalPages = ['/', '/start', '/map', '/tools', '/guides'];
const repoRoot = process.cwd();
const soundOverlayScript = readFileSync(path.join(repoRoot, 'corescope-overlay/denvermc-sound.js'), 'utf8');
const shellOverlayScript = readFileSync(path.join(repoRoot, 'corescope-overlay/denvermc-shell.js'), 'utf8');
const upstreamUtilityRedirects = [
  { source: '/repeater_name_tool', destination: '/tools/repeater-name' },
  { source: '/companion_name_tool', destination: '/tools/companion-name' },
  { source: '/prefix_matrix', destination: '/tools/prefix-matrix' },
  { source: '/serial_usb_tool', destination: '/tools/serial-usb' },
] as const;

function mockPrefixMatrixSnapshot(page: Page) {
  return page.route('/api/map/snapshot', async (route) => {
    const generatedAt = '2026-05-09T12:00:00.000Z';
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          generatedAt,
          nodes: [
            {
              id: 'node-a10f-1',
              publicKey: 'A10F000000000000000000000000000000000000000000000000000000000000000',
              name: 'DEN-TEST-A',
              role: 'companion',
              coordinates: null,
              lastHeardAt: generatedAt,
              status: 'online',
              isOnline: true,
            },
            {
              id: 'node-a10f-2',
              publicKey: 'A10F111111111111111111111111111111111111111111111111111111111111111',
              name: 'DEN-TEST-B',
              role: 'node',
              coordinates: null,
              lastHeardAt: generatedAt,
              status: 'online',
              isOnline: true,
            },
          ],
          links: [],
          routes: [],
          stats: {
            totalNodes: 2,
            onlineNodes: 2,
            visibleNodes: 0,
            locatedNodes: 0,
            repeaterNodes: 0,
            staleNodes: 0,
            offlineNodes: 0,
            linkCount: 0,
            routeCount: 0,
            averageBatteryPercent: null,
            lastUpdated: generatedAt,
            source: { type: 'live_map_api', label: 'Test map data', lastUpdated: generatedAt },
            connectionState: 'connected',
          },
          connection: {
            state: 'connected',
            configured: true,
            sampleData: false,
            historyEnabled: false,
            topic: null,
            lastConnectedAt: generatedAt,
            lastMessageAt: generatedAt,
            message: 'Test map data is active.',
          },
          source: { type: 'live_map_api', label: 'Test map data', lastUpdated: generatedAt },
          warnings: [],
          features: [],
        },
      }),
    });
  });
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

async function mountMapSoundOverlay(page: Page, options: { mode?: string; volume?: string } = {}) {
  await page.goto('/map');
  await page.evaluate(({ mode, volume }) => {
    window.localStorage.removeItem('coloradoMesh.map.soundMode');
    window.localStorage.removeItem('coloradoMesh.map.soundVolume');
    window.localStorage.setItem('live-audio-enabled', 'true');
    if (mode) window.localStorage.setItem('coloradoMesh.map.soundMode', mode);
    if (volume) window.localStorage.setItem('coloradoMesh.map.soundVolume', volume);

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

  await page.addScriptTag({ content: shellOverlayScript });
  await page.addScriptTag({ content: soundOverlayScript });
  await expect(page.getByLabel('Colorado Mesh map sound mode')).toBeVisible();
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

  test('map page documents Docker-owned CoreScope runtime in local development', async ({ page }) => {
    await page.goto('/map');

    await expect(page.getByRole('heading', { name: /Run Docker to use the production map/i })).toBeVisible();
    await expect(page.getByText(/CoreScope runtime served by nginx inside the site container/i)).toBeVisible();
    await expect(page.getByText(/docker compose up --build/i)).toBeVisible();
  });

  test('map sound overlay defaults Off, uses the Colorado Mesh logo, and suppresses upstream audio', async ({ page }) => {
    await mountMapSoundOverlay(page);

    await expect(page.getByLabel('Colorado Mesh map sound mode')).toHaveValue('off');
    await expect(page.getByLabel('Colorado Mesh map sound volume')).toHaveValue('30');
    await expect(page.locator('.denvermc-topbar__mark-img')).toHaveAttribute('src', '/brand/linux/256x256.png');
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

  test('map sound overlay shows persisted modes as locked and persists volume changes', async ({ page }) => {
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

  test('map sound density keeps rising under burst traffic even when accents are dropped', async ({ page }) => {
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
    expect(state.counters.routed).toBe(48);
  });

  test('map sound normalization ignores raw payload and decoded message body contents', async ({ page }) => {
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
    test(`map sound mode ${soundMode} is selectable, locked until gesture, and exposes worklet diagnostics`, async ({ page }) => {
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

  test('map sound burst cleanup stays bounded after switching Off', async ({ page }) => {
    await mountMapSoundOverlay(page);
    await chooseSoundMode(page, 'blaster');

    await expect.poll(() => getSoundState(page)).toMatchObject({
      mode: 'blaster',
      unlocked: true,
    });

    await injectSoundBurst(page, 72, 'cleanup-burst');

    const burstState = await getSoundState(page);
    expect(burstState.activeVoices).toBeLessThanOrEqual(14);
    expect(burstState.scheduledSources).toBeLessThanOrEqual(48);
    expect(burstState.cleanupTimers).toBeLessThanOrEqual(96);

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
    await mockPrefixMatrixSnapshot(page);
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
        await mockPrefixMatrixSnapshot(page);
      }
      await page.goto(pagePath);
      await expect(page.locator('#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }

  test('repeater-name wizard surfaces map snapshot inputs and outputs', async ({ page }) => {
    await mockPrefixMatrixSnapshot(page);
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
    await mockPrefixMatrixSnapshot(page);
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
        await mockPrefixMatrixSnapshot(page);
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
