import { describe, it, expect } from 'vitest';
import { encodeProject, decodeProject } from '../lib/shareUrl';
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

describe('shareUrl encode/decode', () => {
  it('round-trips a real ProjectState', async () => {
    const project = makeProject();
    const encoded = await encodeProject(project);
    const decoded = await decodeProject(encoded);
    expect(decoded.rootId).toBe('root');
    expect(decoded.components.root).toBeDefined();
    expect(decoded.termCols).toBe(80);
  });

  it('rejects encoded data that is not a valid ProjectState shape', async () => {
    const bogus = await encodeProject({ foo: 'bar' } as unknown as ProjectState);
    await expect(decodeProject(bogus)).rejects.toThrow(/Invalid project data/);
  });
});
