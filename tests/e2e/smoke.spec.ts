import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalPages = ['/', '/map', '/tools'];

test.describe('critical page smoke', () => {
  for (const pagePath of criticalPages) {
    test(`loads ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveTitle(/Colorado MeshCore/);
    });
  }

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
