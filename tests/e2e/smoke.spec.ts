import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalPages = ['/', '/start', '/map', '/tools', '/guides'];
const upstreamUtilityRedirects = [
  { source: '/repeater_name_tool', destination: '/tools/repeater-name' },
  { source: '/companion_name_tool', destination: '/tools/companion-name' },
  { source: '/prefix_matrix', destination: '/tools/prefix-matrix' },
  { source: '/serial_usb_tool', destination: '/tools/serial-usb' },
] as const;

function mockOperatorPanelSnapshot(page: import('@playwright/test').Page) {
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
              id: 'node-test-1',
              publicKey: 'A10F000000000000000000000000000000000000000000000000000000000000000',
              name: 'DEN-OP-A',
              role: 'repeater',
              coordinates: { latitude: 39.74, longitude: -104.99 },
              lastHeardAt: generatedAt,
              status: 'online',
              isOnline: true,
            },
          ],
          links: [],
          routes: [],
          stats: {
            totalNodes: 1,
            onlineNodes: 1,
            visibleNodes: 1,
            locatedNodes: 1,
            repeaterNodes: 1,
            staleNodes: 0,
            offlineNodes: 0,
            linkCount: 0,
            routeCount: 0,
            averageBatteryPercent: null,
            lastUpdated: generatedAt,
            source: { type: 'live_map_api', label: 'Mocked map data', lastUpdated: generatedAt },
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
            message: 'Mocked map data is active.',
          },
          source: { type: 'live_map_api', label: 'Mocked map data', lastUpdated: generatedAt },
          warnings: [],
          features: [
            {
              id: 'live-map-snapshot',
              label: 'Live map snapshot',
              status: 'available',
              message: 'Mocked.',
            },
            {
              id: 'advanced-live-map-proxy',
              label: 'Advanced live-map operator endpoints',
              status: 'available',
              message: 'Mocked operator endpoints.',
            },
          ],
        },
      }),
    });
  });
}

function mockPrefixMatrixSnapshot(page: import('@playwright/test').Page) {
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

  test('map page renders diagnostics and operator copy', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByText(/\/api\/map\/snapshot/)).toBeVisible();
    await expect(page.getByText(/\/api\/live-map\/\*/)).toBeVisible();
    const diagnostics = page.getByTestId('map-diagnostics');
    await expect(diagnostics).toBeVisible({ timeout: 15_000 });
  });

  test('map page exposes configured live-map operator fallbacks', async ({ page }) => {
    await mockOperatorPanelSnapshot(page);
    await page.route('/api/live-map/stats', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            node_count: 1,
            decoder: { nodes: 1, errors_total: 0 },
            mqtt: { connected: true },
            source: { label: 'Mocked map data', type: 'live_map_api' },
          },
        }),
      });
    });
    await page.route('/api/live-map/coverage', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { type: 'FeatureCollection', features: [] } }),
      });
    });
    await page.route('/api/live-map/los**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { distance_km: 1.2, clear: true } }),
      });
    });
    await page.route('/api/live-map/weather/radar/country-bounds**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { country: 'United States', country_code: 'US' } }),
      });
    });

    await page.goto('/map');

    const diagnostics = page.getByTestId('map-diagnostics');
    await expect(diagnostics).toContainText('Advanced live-map operator endpoints', { timeout: 15_000 });
    await expect(diagnostics).toContainText('Available');

    const stats = page.getByRole('region', { name: 'Live-map stats' });
    await expect(stats.getByText('NODES')).toBeVisible({ timeout: 15_000 });

    const coverage = page.getByRole('region', { name: 'Coverage overlay' });
    await expect(coverage.getByRole('button', { name: /Probe coverage/i })).toBeEnabled();
    await coverage.getByRole('button', { name: /Probe coverage/i }).click();
    await expect(coverage.getByText('FeatureCollection')).toBeVisible({ timeout: 15_000 });

    const los = page.getByRole('region', { name: 'Line-of-sight' });
    await expect(los.getByRole('button', { name: /Calculate LOS/i })).toBeEnabled();
    await los.getByRole('button', { name: /Calculate LOS/i }).click();
    await expect(los.getByText('DISTANCE')).toBeVisible({ timeout: 15_000 });

    const weather = page.getByRole('region', { name: 'Weather radar bounds' });
    await expect(weather.getByRole('button', { name: /Probe bounds/i })).toBeEnabled();
    await weather.getByRole('button', { name: /Probe bounds/i }).click();
    await expect(weather.getByText('United States')).toBeVisible({ timeout: 15_000 });

    const peerHistory = page.getByRole('region', { name: 'Peer history' });
    await expect(peerHistory.getByRole('combobox', { name: /Node/i })).toBeVisible();
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
  test('mobile viewport keeps the map within ~70svh of the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/map');
    const shell = page.locator('.cm-map-shell .cm-map').first();
    await expect(shell).toBeVisible({ timeout: 15_000 });
    const box = await shell.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // clamp(360px, 70svh, 620px) at 844px viewport ≈ min(620, 590) = 590px
      expect(box.height).toBeLessThanOrEqual(620);
      expect(box.height).toBeGreaterThanOrEqual(360);
    }
  });

  test('operator-panels anchor scrolls clear of the fixed header', async ({ page }) => {
    await page.goto('/map');
    const panels = page.getByTestId('map-operator-panels');
    await expect(panels).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      const target = document.getElementById('cm-operator-panels');
      target?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    // Allow the browser a tick to settle scroll position.
    await page.waitForTimeout(100);

    const headerBottom = await page.evaluate(() => {
      const header = document.querySelector('header[role="banner"]');
      return header ? header.getBoundingClientRect().bottom : 0;
    });
    const panelsTop = await panels.evaluate(
      (node) => (node as HTMLElement).getBoundingClientRect().top
    );

    // Panels heading must not be hidden behind the fixed header.
    expect(panelsTop).toBeGreaterThanOrEqual(headerBottom);
  });

  test('LOS panel rejects out-of-range latitude and disables submit', async ({ page }) => {
    await mockOperatorPanelSnapshot(page);
    await page.goto('/map');

    const los = page.getByRole('region', { name: 'Line-of-sight' });
    await expect(los).toBeVisible({ timeout: 15_000 });
    const submit = los.getByRole('button', { name: /Calculate LOS/i });
    await expect(submit).toBeEnabled();

    const lat1 = los.getByLabel('Lat 1', { exact: true });
    await expect(lat1).toBeVisible();
    await lat1.fill('91');

    await expect(lat1).toHaveAttribute('aria-invalid', 'true');
    await expect(los.getByText(/Latitude must be between/i)).toBeVisible();
    await expect(submit).toBeDisabled();

    await lat1.fill('40');
    await expect(submit).toBeEnabled();
  });

  test('Weather radar panel rejects out-of-range longitude and disables submit', async ({ page }) => {
    await mockOperatorPanelSnapshot(page);
    await page.goto('/map');

    const weather = page.getByRole('region', { name: 'Weather radar bounds' });
    await expect(weather).toBeVisible({ timeout: 15_000 });
    const submit = weather.getByRole('button', { name: /Probe bounds/i });
    await expect(submit).toBeEnabled();

    const lon = weather.getByLabel('Longitude', { exact: true });
    await expect(lon).toBeVisible();
    await lon.fill('-200');

    await expect(lon).toHaveAttribute('aria-invalid', 'true');
    await expect(weather.getByText(/Longitude must be between/i)).toBeVisible();
    await expect(submit).toBeDisabled();

    await lon.fill('-105');
    await expect(submit).toBeEnabled();
  });

  test('coverage probe button has a visible focus outline when focused via keyboard', async ({ page }) => {
    await mockOperatorPanelSnapshot(page);
    await page.goto('/map');

    const coverage = page.getByRole('region', { name: 'Coverage overlay' });
    await expect(coverage).toBeVisible({ timeout: 15_000 });
    const probe = coverage.getByRole('button', { name: /Probe coverage/i });
    await expect(probe).toBeEnabled();

    await probe.evaluate((node) => (node as HTMLElement).focus({ preventScroll: true } as FocusOptions));

    const outline = await probe.evaluate((node) => {
      const style = window.getComputedStyle(node, null);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth || '0'),
      };
    });

    expect(outline.outlineStyle).not.toBe('none');
    expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
  });
});
