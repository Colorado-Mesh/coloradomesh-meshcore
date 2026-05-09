import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalPages = ['/', '/start', '/map', '/tools'];

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

  test('serial-usb tool previews settings JSON and disables Apply without a connection', async ({ page }) => {
    await page.goto('/tools/serial-usb');
    await expect(page.getByRole('heading', { name: /USB serial/i })).toBeVisible();

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

    await input.fill('{not json');
    await expect(page.getByTestId('serial-settings-error')).toBeVisible();
    await expect(apply).toBeDisabled();
  });

  test('prefix-matrix page exposes search, suggestion, and 4-char grid', async ({ page }) => {
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

test.describe('critical page accessibility @a11y', () => {
  for (const pagePath of criticalPages) {
    test(`has no detectable axe violations on ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const results = await new AxeBuilder({ page }).analyze();
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
