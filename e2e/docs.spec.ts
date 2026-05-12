import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = path.join(__dirname, 'screenshots');

test.describe('Documentation site', () => {
  test('docs home has ALPHA badge', async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('domcontentloaded');
    const alphaBadge = page.locator('.alpha-badge').first();
    await expect(alphaBadge).toBeVisible();
    await expect(alphaBadge).toContainText('ALPHA');
    await page.screenshot({ path: `${S}/docs-01-alpha-badge.png` });
  });

  test('docs home has no third-party analytics scripts', async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('domcontentloaded');
    const allScripts = await page.locator('script').all();
    for (const s of allScripts) {
      const src = await s.getAttribute('src') ?? '';
      const content = await s.textContent() ?? '';
      expect(src + content).not.toMatch(/google-analytics|googletagmanager|gtag\b|mixpanel/i);
    }
  });

  test('docs screenshots page is accessible', async ({ page }) => {
    await page.goto('/docs/introduction/screenshots');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({ path: `${S}/docs-02-screenshots-section.png` });
  });

  test('docs AI disclaimer page says "reviewed by a human"', async ({ page }) => {
    await page.goto('/docs/introduction/ai-disclaimer');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText('reviewed by a human');
  });

  test('docs inspiration page has ascii-motion and tui.builders', async ({ page }) => {
    await page.goto('/docs/reference/inspiration');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText('ascii-motion');
    await expect(page.locator('body')).toContainText('tui.builders');
  });

  test('docs libraries page has Textual, Bubble Tea, Ratatui', async ({ page }) => {
    await page.goto('/docs/reference/libraries');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText('Textual');
    await expect(page.locator('body')).toContainText('Bubble Tea');
    await expect(page.locator('body')).toContainText('Ratatui');
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
