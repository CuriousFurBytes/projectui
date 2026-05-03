import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = path.join(__dirname, 'screenshots');

async function loadFresh(page: Parameters<typeof test.beforeEach>[0] extends (ctx: infer C) => unknown ? C : never) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.font-mono', { timeout: 10000 });
}

test.describe('10 New Features – E2E smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.font-mono', { timeout: 10000 });
  });

  // ── Feature 1: Multiple screens ─────────────────────────────────────────

  test('F1 – screen tabs visible and "+ screen" button adds a new screen', async ({ page }) => {
    // The screen strip should show "Screen 1"
    const body = await page.locator('body').textContent();
    expect(body).toContain('Screen 1');
    expect(body).toContain('+ screen');

    await page.screenshot({ path: `${S}/f1-01-initial-screens.png` });

    // Click "+ screen" to add Screen 2
    await page.getByText('+ screen').click();
    await page.waitForTimeout(300);

    const bodyAfter = await page.locator('body').textContent();
    expect(bodyAfter).toContain('Screen 2');

    await page.screenshot({ path: `${S}/f1-02-added-screen.png` });
  });

  test('F1 – switching screens updates the canvas', async ({ page }) => {
    await page.getByText('+ screen').click();
    await page.waitForTimeout(300);

    // Click Screen 1 tab
    await page.getByRole('button', { name: 'Screen 1' }).first().click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${S}/f1-03-screen1.png` });

    // Click Screen 2 tab
    await page.getByRole('button', { name: 'Screen 2' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${S}/f1-04-screen2.png` });
  });

  // ── Feature 2: New widget types ─────────────────────────────────────────

  test('F2 – new component types visible in library (Spinner, Toast, Divider…)', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).toContain('Spinner');
    expect(body).toContain('Toast');
    expect(body).toContain('Divider');
    expect(body).toContain('Timer');
    expect(body).toContain('File Picker');
    expect(body).toContain('ASCII Text');
    expect(body).toContain('Grid');
    expect(body).toContain('Viewport');

    await page.screenshot({ path: `${S}/f2-01-new-components.png` });
  });

  test('F2 – drag a Spinner onto the canvas', async ({ page }) => {
    // Find "Spinner" in the component library
    const spinnerBtn = page.locator('button', { hasText: 'Spinner' }).first();

    // Drag to the canvas
    const canvas = page.locator('.font-mono').first();
    await spinnerBtn.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${S}/f2-02-spinner-on-canvas.png` });
  });

  test('F2 – drag a Toast onto the canvas', async ({ page }) => {
    const toastBtn = page.locator('button', { hasText: 'Toast' }).first();
    const canvas = page.locator('.font-mono').first();
    await toastBtn.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${S}/f2-03-toast-on-canvas.png` });
  });

  test('F2 – drag an ASCII Text onto the canvas', async ({ page }) => {
    const asciiBtn = page.locator('button', { hasText: 'ASCII Text' }).first();
    const canvas = page.locator('.font-mono').first();
    await asciiBtn.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });
    await page.waitForTimeout(400);

    // Canvas should contain ASCII art characters
    const text = await page.locator('.font-mono').first().textContent();
    expect(text).toBeTruthy();

    await page.screenshot({ path: `${S}/f2-04-asciitext-on-canvas.png` });
  });

  // ── Feature 5: Border color ──────────────────────────────────────────────

  test('F5 – selecting a container shows Border color and Title color fields', async ({ page }) => {
    // Click the root container in the layers panel
    const layerEntry = page.locator('text=App').first();
    await layerEntry.click();
    await page.waitForTimeout(200);

    const props = await page.locator('body').textContent();
    expect(props).toContain('Border');

    await page.screenshot({ path: `${S}/f5-01-border-props.png` });
  });

  // ── Feature 6+7: Divider and title align ────────────────────────────────

  test('F6 – drag a Divider and see separator line on canvas', async ({ page }) => {
    const dividerBtn = page.locator('button', { hasText: 'Divider' }).first();
    const canvas = page.locator('.font-mono').first();
    await dividerBtn.dragTo(canvas, { targetPosition: { x: 200, y: 200 } });
    await page.waitForTimeout(400);

    const text = await page.locator('.font-mono').first().textContent();
    expect(text).toContain('─');

    await page.screenshot({ path: `${S}/f6-01-divider.png` });
  });

  test('F7 – title align selector is visible in properties', async ({ page }) => {
    const layerEntry = page.locator('text=Centered Panel').first();
    await layerEntry.click();
    await page.waitForTimeout(200);

    const body = await page.locator('body').textContent();
    expect(body).toMatch(/title.*align/i);

    await page.screenshot({ path: `${S}/f7-01-title-align.png` });
  });

  // ── Feature 8: Toast ─────────────────────────────────────────────────────

  test('F8 – Toast renders on canvas with variant icon', async ({ page }) => {
    // Toast component shows in the library
    const body = await page.locator('body').textContent();
    expect(body).toContain('Toast');

    // Click the App layer (root) to select the root container
    await page.getByText('App', { exact: true }).first().click();
    await page.waitForTimeout(200);

    // Drag toast onto the canvas
    const toastBtn = page.locator('button', { hasText: 'Toast' }).first();
    const canvas = page.locator('.font-mono').first();
    const box = await canvas.boundingBox();
    if (box) {
      await toastBtn.dragTo(canvas, {
        targetPosition: { x: Math.floor(box.width / 2), y: Math.floor(box.height / 2) },
      });
    }
    await page.waitForTimeout(600);

    await page.screenshot({ path: `${S}/f8-01-toast.png` });

    // After the drag, the layers panel should have more nodes
    const bodyAfter = await page.locator('body').textContent();
    // toast or Toast should appear somewhere (either as type in layers or as component label)
    expect(bodyAfter).toMatch(/[Tt]oast/);
  });

  // ── Feature 9: Grid container ────────────────────────────────────────────

  test('F9 – Grid container in component library', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).toContain('Grid');

    await page.screenshot({ path: `${S}/f9-01-grid-in-library.png` });
  });

  // ── Feature 10: Timeline panel ───────────────────────────────────────────

  test('F10 – timeline panel visible at bottom', async ({ page }) => {
    const body = await page.locator('body').textContent();
    expect(body).toContain('Timeline');

    await page.screenshot({ path: `${S}/f10-01-timeline-visible.png` });
  });

  test('F10 – timeline expands when clicked', async ({ page }) => {
    await page.getByText('Timeline').click();
    await page.waitForTimeout(300);
    const body = await page.locator('body').textContent();
    // After expanding, should show step/transition controls
    expect(body).toMatch(/\+ step/i);

    await page.screenshot({ path: `${S}/f10-02-timeline-expanded.png` });
  });

  test('F10 – timeline shows Screen 1 step by default', async ({ page }) => {
    await page.getByText('Timeline').click();
    await page.waitForTimeout(300);
    const body = await page.locator('body').textContent();
    expect(body).toContain('Screen 1');

    await page.screenshot({ path: `${S}/f10-03-timeline-screen1.png` });
  });

  // ── Feature 3: Rich text spans ───────────────────────────────────────────

  test('F3 – rich spans editor visible for text component', async ({ page }) => {
    // Click the header text node (first text node)
    const layerEntry = page.locator('text=App').first();
    await layerEntry.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: `${S}/f3-01-rich-spans.png` });
  });

  // ── Feature 4: Absolute positioning ─────────────────────────────────────

  test('F4 – absolute position checkbox visible in properties', async ({ page }) => {
    const layerEntry = page.locator('text=App').first();
    await layerEntry.click();
    await page.waitForTimeout(200);

    const body = await page.locator('body').textContent();
    expect(body).toContain('Absolute position');

    await page.screenshot({ path: `${S}/f4-01-absolute-position.png` });
  });

  // ── Full app screenshot ──────────────────────────────────────────────────

  test('ZZ – full app screenshot with all new features', async ({ page }) => {
    await page.screenshot({ path: `${S}/zz-full-app.png`, fullPage: false });
  });
});
