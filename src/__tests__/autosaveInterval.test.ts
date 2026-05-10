import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import { saveAutosave, listAutosaves, clearAutosaves } from '../lib/autosave';
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

describe('autosave API surface', () => {
  beforeEach(() => {
    clearAutosaves();
  });

  it('exports saveAutosave as a function', () => {
    expect(typeof saveAutosave).toBe('function');
  });

  it('persists an entry that listAutosaves can return', () => {
    const project = makeProject();
    saveAutosave(project);
    const entries = listAutosaves();
    expect(entries.length).toBe(1);
    expect(entries[0].project.rootId).toBe('root');
    expect(typeof entries[0].timestamp).toBe('number');
  });

  it('appends multiple entries across calls', () => {
    saveAutosave(makeProject());
    saveAutosave(makeProject());
    expect(listAutosaves().length).toBe(2);
  });
});
