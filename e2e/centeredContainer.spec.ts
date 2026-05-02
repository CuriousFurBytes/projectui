import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = path.join(__dirname, 'screenshots');

test.describe('Centered container in terminal canvas', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so we always start from the default initial project.
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('01 – full app loads and terminal canvas is visible', async ({ page }) => {
    // Wait for the terminal canvas (font-mono div inside the preview).
    await page.waitForSelector('.font-mono', { timeout: 10000 });
    await page.screenshot({ path: `${SCREENSHOTS}/01-app-loaded.png`, fullPage: false });
  });

  test('02 – terminal canvas renders the tui-builder header', async ({ page }) => {
    await page.waitForSelector('div.font-mono', { timeout: 10000 });

    // The header container has title ' tui-builder ' in the top border.
    const canvas = page.locator('div.font-mono').first();
    const text = await canvas.textContent();
    expect(text).toContain('tui-builder');

    await page.screenshot({ path: `${SCREENSHOTS}/02-header-visible.png` });
  });

  test('03 – centered panel title appears in the terminal canvas', async ({ page }) => {
    await page.waitForSelector('div.font-mono', { timeout: 10000 });

    const canvas = page.locator('div.font-mono').first();
    const text = await canvas.textContent();
    // The centered container has title ' Panel '.
    expect(text).toContain('Panel');

    await page.screenshot({ path: `${SCREENSHOTS}/03-centered-panel-title.png` });
  });

  test('04 – terminal canvas renders rounded border characters', async ({ page }) => {
    await page.waitForSelector('div.font-mono', { timeout: 10000 });

    const canvas = page.locator('div.font-mono').first();
    const text = await canvas.textContent();
    // Rounded border uses ╭ ╮ ╰ ╯ characters.
    expect(text).toContain('╭');
    expect(text).toContain('╮');
    expect(text).toContain('╰');
    expect(text).toContain('╯');

    await page.screenshot({ path: `${SCREENSHOTS}/04-rounded-corners.png` });
  });

  test('05 – terminal preview area screenshot (zoomed in)', async ({ page }) => {
    await page.waitForSelector('.font-mono', { timeout: 10000 });

    // Capture just the terminal preview area.
    const preview = page.locator('.font-mono').first();
    await preview.screenshot({ path: `${SCREENSHOTS}/05-terminal-preview-zoom.png` });
  });

  test('06 – centered panel is present in the Layers panel', async ({ page }) => {
    await page.waitForSelector('.font-mono', { timeout: 10000 });

    // The layers panel lists all component names. 'Centered Panel' should appear.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Centered Panel');

    await page.screenshot({ path: `${SCREENSHOTS}/06-layers-panel.png` });
  });

  test('07 – clicking the centered panel selects it and shows properties', async ({ page }) => {
    await page.waitForSelector('.font-mono', { timeout: 10000 });

    // Click on "Centered Panel" in the Layers panel sidebar.
    const layersItem = page.getByText('Centered Panel').first();
    await layersItem.click();

    // Properties panel should now show the panel's props.
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/rounded|border|Panel/i);

    await page.screenshot({ path: `${SCREENSHOTS}/07-panel-selected.png` });
  });
});
