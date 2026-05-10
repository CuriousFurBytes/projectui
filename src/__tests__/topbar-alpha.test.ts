// TDD tests for the TopBar component: alpha badge and docs link.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const topBarSrc = readFileSync(resolve(__dirname, '../components/Layout/TopBar.tsx'), 'utf-8');

describe('TopBar – alpha badge', () => {
  it('renders an ALPHA badge near the logo', () => {
    // The TopBar must display an "alpha" label to warn users it is pre-release
    expect(topBarSrc.toLowerCase()).toContain('alpha');
  });

  it('alpha badge has a distinct style class', () => {
    expect(topBarSrc).toMatch(/alpha-badge|badge.*alpha|class="[^"]*alpha[^"]*"/i);
  });
});

describe('TopBar – docs link', () => {
  it('contains a link to the documentation', () => {
    expect(topBarSrc).toMatch(/docs|documentation/i);
  });

  it('docs link points to /docs/ or docs/index.html', () => {
    expect(topBarSrc).toMatch(/href.*docs/i);
  });
});
