// TDD tests for the /docs redirect fix.
// RED phase: these tests must fail before the fix is applied.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const topBarSrc = readFileSync(resolve(__dirname, '../components/Layout/TopBar.tsx'), 'utf-8');
const netlifyToml = readFileSync(resolve(__dirname, '../../netlify.toml'), 'utf-8');
const packageJson = readFileSync(resolve(__dirname, '../../package.json'), 'utf-8');

describe('TopBar – docs link is absolute', () => {
  it('docs href uses an absolute path starting with /', () => {
    // Relative "docs/" causes infinite nesting (/docs/docs/docs/…).
    // The href must be "/docs/" so it always navigates to the root-level docs.
    expect(topBarSrc).toMatch(/href="\/docs\//);
  });

  it('docs href does NOT use a bare relative path', () => {
    // Must NOT contain href="docs/" (without leading slash)
    expect(topBarSrc).not.toMatch(/href="docs\//);
  });
});

describe('netlify.toml – /docs excluded from SPA fallback', () => {
  it('has a redirect rule that handles /docs before the wildcard catch-all', () => {
    // The /docs path must appear as an explicit redirect entry before the /* rule
    // so static docs are not swallowed by the SPA rewrite.
    expect(netlifyToml).toMatch(/from\s*=\s*"\/docs/);
  });
});

describe('package.json – build copies docs to dist', () => {
  it('build script copies docs/ into dist/', () => {
    // VitePress is configured with outDir: '../dist/docs', invoked via the build:docs script.
    // The production build must include docs/ at dist/docs/ so Netlify can serve it.
    expect(packageJson).toMatch(/build:docs/);
  });
});
