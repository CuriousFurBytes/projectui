import { describe, it, expect } from 'vitest';
import { buildProjectHash, parseProjectFromHash } from '../lib/shareUrl';
import type { ProjectState } from '../types/component';

function makeProject(): ProjectState {
  return {
    rootId: 'root',
    components: {
      root: {
        id: 'root',
        type: 'container',
        parentId: null,
        children: [],
        props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
      },
    },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

describe('buildProjectHash', () => {
  it('returns a string starting with #share=', async () => {
    const hash = await buildProjectHash(makeProject());
    expect(hash).toMatch(/^#share=/);
  });

  it('produces a non-trivially-short hash', async () => {
    const hash = await buildProjectHash(makeProject());
    expect(hash.length).toBeGreaterThan(10);
  });
});

describe('parseProjectFromHash', () => {
  it('round-trips a project through a hash string', async () => {
    const project = makeProject();
    const hash = await buildProjectHash(project);
    const decoded = await parseProjectFromHash(hash);
    expect(decoded?.rootId).toBe('root');
    expect(decoded?.components.root).toBeDefined();
    expect(decoded?.termCols).toBe(80);
  });

  it('returns null for an empty string', async () => {
    expect(await parseProjectFromHash('')).toBeNull();
  });

  it('returns null for a hash with no share parameter', async () => {
    expect(await parseProjectFromHash('#other=abc')).toBeNull();
  });
});
