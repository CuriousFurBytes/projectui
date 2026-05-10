import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = path.join(__dirname, 'screenshots');

test.describe('Documentation site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('docs page has ALPHA badge', async ({ page }) => {
    const alphaBadge = page.locator('.alpha-badge').first();
    await expect(alphaBadge).toBeVisible();
    await expect(alphaBadge).toContainText('ALPHA');
    await page.screenshot({ path: `${S}/docs-01-alpha-badge.png` });
  });

  test('docs page has no authored client-side JavaScript', async ({ page }) => {
    // Vite dev server injects HMR scripts; only count non-vite, non-react-refresh scripts
    const allScripts = await page.locator('script').all();
    const authoredScripts: string[] = [];
    for (const s of allScripts) {
      const src = await s.getAttribute('src') ?? '';
      const content = await s.textContent() ?? '';
      const isViteHmr = src.includes('@vite') || content.includes('injectIntoGlobalHook') || src.includes('@react-refresh');
      if (!isViteHmr) authoredScripts.push(src || content.slice(0, 40));
    }
    expect(authoredScripts).toHaveLength(0);
  });

  test('docs page screenshots section is visible', async ({ page }) => {
    await page.locator('#screenshots').scrollIntoViewIfNeeded();
    await expect(page.locator('#screenshots h2')).toBeVisible();
    await page.screenshot({ path: `${S}/docs-02-screenshots-section.png` });
  });

  test('docs page AI disclaimer says "reviewed by a human"', async ({ page }) => {
    const disclaimer = page.locator('#ai-disclaimer');
    await expect(disclaimer).toContainText('reviewed by a human');
  });

  test('docs page has inspirations section with ascii-motion and tui.builders', async ({ page }) => {
    const inspirationSection = page.locator('#inspiration');
    await expect(inspirationSection).toContainText('ascii-motion');
    await expect(inspirationSection).toContainText('tui.builders');
  });

  test('docs page has libraries section with Textual, Bubble Tea, Ratatui, Ink', async ({ page }) => {
    const librariesSection = page.locator('#libraries');
    await expect(librariesSection).toContainText('Textual');
    await expect(librariesSection).toContainText('Bubble Tea');
    await expect(librariesSection).toContainText('Ratatui');
    await expect(librariesSection).toContainText('Ink');
  });
});

test.describe('Main app – alpha badge and docs link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('top bar has ALPHA badge', async ({ page }) => {
    const alphaBadge = page.locator('.alpha-badge').first();
    await expect(alphaBadge).toBeVisible();
    await expect(alphaBadge).toContainText('ALPHA');
    await page.screenshot({ path: `${S}/docs-03-topbar-alpha.png` });
  });

  test('top bar has Docs link', async ({ page }) => {
    const docsLink = page.locator('a[href*="docs"]').first();
    await expect(docsLink).toBeVisible();
  });
});
