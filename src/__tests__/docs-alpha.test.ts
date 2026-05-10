// TDD tests for the documentation static site.
// These tests read the HTML file directly and assert structural requirements.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const docsHtml = readFileSync(resolve(__dirname, '../../docs/index.html'), 'utf-8');

describe('docs/index.html – no client-side JavaScript', () => {
  it('contains no <script> tags', () => {
    expect(docsHtml).not.toMatch(/<script[\s>]/i);
  });
});

describe('docs/index.html – alpha tag', () => {
  it('contains an "alpha" badge visible in the page', () => {
    expect(docsHtml.toLowerCase()).toContain('alpha');
  });

  it('includes alpha in the hero badge or title area', () => {
    // The hero-badge or h1 area must contain ALPHA so users know it's early-stage
    const heroBadgeMatch = docsHtml.match(/hero-badge[^>]*>[^<]*alpha/i)
      || docsHtml.match(/alpha[^<]*<\/span>/i)
      || docsHtml.match(/class="[^"]*alpha[^"]*"/i);
    expect(heroBadgeMatch).not.toBeNull();
  });
});

describe('docs/index.html – screenshots', () => {
  it('references at least 4 screenshot images', () => {
    const imgMatches = docsHtml.match(/<img[^>]+screenshots[^>]+>/gi) ?? [];
    expect(imgMatches.length).toBeGreaterThanOrEqual(4);
  });

  it('has a screenshots section heading', () => {
    expect(docsHtml.toLowerCase()).toContain('screenshot');
  });

  it('full-app screenshot is referenced', () => {
    expect(docsHtml).toContain('zz-full-app.png');
  });
});

describe('docs/index.html – inspiration links', () => {
  it('links to ascii-motion.app', () => {
    expect(docsHtml).toContain('ascii-motion');
  });

  it('links to tui.builders', () => {
    expect(docsHtml).toContain('tui.builders');
  });
});

describe('docs/index.html – library links', () => {
  it('links to Bubble Tea', () => {
    expect(docsHtml).toMatch(/bubbletea|bubble-tea|Bubble Tea/i);
  });

  it('links to Lip Gloss', () => {
    expect(docsHtml).toMatch(/lipgloss|lip-gloss|Lip Gloss/i);
  });

  it('links to Textual', () => {
    expect(docsHtml).toContain('Textual');
  });

  it('links to Ratatui', () => {
    expect(docsHtml).toContain('Ratatui');
  });

  it('links to Ink (Node.js TUI)', () => {
    expect(docsHtml).toMatch(/vadimdemedes\/ink|Ink.*Node/i);
  });
});

describe('docs/index.html – AI disclaimer', () => {
  it('contains AI disclaimer text', () => {
    expect(docsHtml.toLowerCase()).toContain('ai');
  });

  it('says "reviewed by a human"', () => {
    expect(docsHtml.toLowerCase()).toContain('reviewed by a human');
  });

  it('has an AI badge in the footer', () => {
    expect(docsHtml).toContain('ai-badge');
  });
});
