// TDD tests for the documentation site content.
// Reads docs-src markdown source files directly (VitePress multi-page site).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '../..');
const indexMd = readFileSync(resolve(root, 'docs-src/index.md'), 'utf-8');
const screenshotsMd = readFileSync(resolve(root, 'docs-src/introduction/screenshots.md'), 'utf-8');
const inspirationMd = readFileSync(resolve(root, 'docs-src/reference/inspiration.md'), 'utf-8');
const librariesMd = readFileSync(resolve(root, 'docs-src/reference/libraries.md'), 'utf-8');
const aiDisclaimerMd = readFileSync(resolve(root, 'docs-src/introduction/ai-disclaimer.md'), 'utf-8');

describe('docs – alpha tag', () => {
  it('contains an "alpha" badge visible in the page', () => {
    expect(indexMd.toLowerCase()).toContain('alpha');
  });

  it('includes alpha in the hero badge or title area', () => {
    const heroBadgeMatch = indexMd.match(/hero-badge[^>]*>[^<]*alpha/i)
      || indexMd.match(/alpha[^<]*<\/span>/i)
      || indexMd.match(/class="[^"]*alpha[^"]*"/i);
    expect(heroBadgeMatch).not.toBeNull();
  });
});

describe('docs – screenshots', () => {
  it('references at least 4 screenshot images', () => {
    const imgMatches = screenshotsMd.match(/!\[.*?\]\(.*?screenshots.*?\)/gi) ?? [];
    expect(imgMatches.length).toBeGreaterThanOrEqual(4);
  });

  it('has a screenshots section heading', () => {
    expect(screenshotsMd.toLowerCase()).toContain('screenshot');
  });

  it('full-app screenshot is referenced', () => {
    expect(screenshotsMd).toContain('zz-full-app.png');
  });
});

describe('docs – inspiration links', () => {
  it('links to ascii-motion.app', () => {
    expect(inspirationMd).toContain('ascii-motion');
  });

  it('links to tui.builders', () => {
    expect(inspirationMd).toContain('tui.builders');
  });
});

describe('docs – library links', () => {
  it('links to Bubble Tea', () => {
    expect(librariesMd).toMatch(/bubbletea|bubble-tea|Bubble Tea/i);
  });

  it('links to Lip Gloss', () => {
    expect(librariesMd).toMatch(/lipgloss|lip-gloss|Lip Gloss/i);
  });

  it('links to Textual', () => {
    expect(librariesMd).toContain('Textual');
  });

  it('links to Ratatui', () => {
    expect(librariesMd).toContain('Ratatui');
  });

  it('links to Ink (Node.js TUI)', () => {
    expect(librariesMd).toMatch(/vadimdemedes\/ink|Ink.*Node/i);
  });
});

describe('docs – AI disclaimer', () => {
  it('contains AI disclaimer text', () => {
    expect(aiDisclaimerMd.toLowerCase()).toContain('ai');
  });

  it('says "reviewed by a human"', () => {
    expect(aiDisclaimerMd.toLowerCase()).toContain('reviewed by a human');
  });

  it('has an AI warning block', () => {
    expect(aiDisclaimerMd).toMatch(/ai-badge|::: warning/i);
  });
});
