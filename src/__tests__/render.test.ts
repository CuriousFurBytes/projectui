import { describe, it, expect } from 'vitest';
import { render } from '../renderer/render';
import type { ComponentNode, ProjectState } from '../types/component';

function makeProjectWithContainer(child: ComponentNode, containerH: number): ProjectState {
  const root: ComponentNode = {
    id: 'root',
    type: 'container',
    parentId: null,
    children: [child.id],
    props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
  };
  const constrained: ComponentNode = {
    ...child,
    parentId: 'root',
    props: { ...child.props, height: containerH },
  };
  return {
    rootId: 'root',
    components: { root, [child.id]: constrained },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

describe('render.ts – textarea slice clamping with small height', () => {
  it('does not throw and does not write below widget bottom when h=1', () => {
    const child: ComponentNode = {
      id: 'ta',
      type: 'textarea',
      parentId: 'root',
      children: [],
      props: { value: 'line1\nline2\nline3', border: 'none' },
    };
    const project = makeProjectWithContainer(child, 1);
    let result: ReturnType<typeof render>;
    expect(() => { result = render(project); }).not.toThrow();
    // Row 1 and beyond should be empty (no textarea content written outside widget)
    const grid = result!.grid;
    const rect = result!.rects['ta'];
    // Everything below rect.y + rect.h should not have textarea content
    for (let y = rect.y + rect.h; y < grid.length; y++) {
      for (const cell of grid[y]) {
        // Cell should not have content painted by the textarea (it's all spaces at default)
        expect(cell.ch).toBe(' ');
      }
    }
  });

  it('does not throw when h=0', () => {
    const child: ComponentNode = {
      id: 'ta',
      type: 'textarea',
      parentId: 'root',
      children: [],
      props: { value: 'line1\nline2', border: 'none' },
    };
    const project = makeProjectWithContainer(child, 0);
    expect(() => render(project)).not.toThrow();
  });
});

describe('render.ts – list slice clamping with small height', () => {
  it('does not write list items below widget bottom when h=1', () => {
    const child: ComponentNode = {
      id: 'li',
      type: 'list',
      parentId: 'root',
      children: [],
      props: { items: ['alpha', 'beta', 'gamma'], border: 'none' },
    };
    const project = makeProjectWithContainer(child, 1);
    let result: ReturnType<typeof render>;
    expect(() => { result = render(project); }).not.toThrow();
    const grid = result!.grid;
    const rect = result!.rects['li'];
    for (let y = rect.y + rect.h; y < grid.length; y++) {
      for (const cell of grid[y]) {
        expect(cell.ch).toBe(' ');
      }
    }
  });
});

describe('render.ts – table slice clamping with small height', () => {
  it('does not write table rows below widget bottom when h=3', () => {
    const child: ComponentNode = {
      id: 'tbl',
      type: 'table',
      parentId: 'root',
      children: [],
      props: {
        columns: ['A', 'B'],
        rows: [['1', '2'], ['3', '4'], ['5', '6']],
        border: 'none',
      },
    };
    const project = makeProjectWithContainer(child, 3);
    let result: ReturnType<typeof render>;
    expect(() => { result = render(project); }).not.toThrow();
    const grid = result!.grid;
    const rect = result!.rects['tbl'];
    // Rows below widget should be space
    for (let y = rect.y + rect.h; y < grid.length; y++) {
      for (const cell of grid[y]) {
        expect(cell.ch).toBe(' ');
      }
    }
  });
});
