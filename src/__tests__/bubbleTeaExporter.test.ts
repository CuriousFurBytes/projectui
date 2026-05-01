import { describe, it, expect } from 'vitest';
import { exportBubbleTea } from '../exporters/bubbleTeaExporter';
import type { ComponentNode, ProjectState } from '../types/component';

function makeProject(node: ComponentNode): ProjectState {
  return {
    rootId: node.id,
    components: { [node.id]: node },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

describe('bubbleTeaExporter – progressbar clamping', () => {
  it('does not throw RangeError when progress > 1', () => {
    const n: ComponentNode = {
      id: 'pb',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 1.5, width: 20 },
    };
    expect(() => exportBubbleTea(makeProject(n))).not.toThrow();
  });

  it('does not throw RangeError when progress < 0', () => {
    const n: ComponentNode = {
      id: 'pb',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: -0.5, width: 20 },
    };
    expect(() => exportBubbleTea(makeProject(n))).not.toThrow();
  });

  it('clamps progress=2 to produce 20 filled chars out of 20', () => {
    const n: ComponentNode = {
      id: 'pb',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 2, width: 20 },
    };
    const output = exportBubbleTea(makeProject(n));
    // Should produce 20 filled █ chars and 0 empty chars
    expect(output).toContain('█'.repeat(20));
    expect(output).not.toContain('░');
  });

  it('clamps progress=-1 to produce 0 filled chars', () => {
    const n: ComponentNode = {
      id: 'pb',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: -1, width: 20 },
    };
    const output = exportBubbleTea(makeProject(n));
    expect(output).toContain('░'.repeat(20));
    expect(output).not.toContain('█');
  });
});
