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

function noCellsBelowWidget(result: ReturnType<typeof render>, id: string) {
  const grid = result.grid;
  const rect = result.rects[id];
  for (let y = rect.y + rect.h; y < grid.length; y++) {
    for (const cell of grid[y]) {
      expect(cell.ch).toBe(' ');
    }
  }
}

describe('render.ts – textarea painting', () => {
  it('does not write below widget bounds at h=1 (no border)', () => {
    const child: ComponentNode = {
      id: 'ta', type: 'textarea', parentId: 'root', children: [],
      props: { value: 'line1\nline2\nline3', border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 1));
    noCellsBelowWidget(result, 'ta');
  });

  it('renders content at h=2 (no border) — 2 lines visible', () => {
    const child: ComponentNode = {
      id: 'ta', type: 'textarea', parentId: 'root', children: [],
      props: { value: 'hello\nworld\nextra', border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 2));
    const rect = result.rects['ta'];
    // With no border and h=2, two lines (at rect.y and rect.y+1) should be visible
    const row0 = result.grid[rect.y].map(c => c.ch).join('').trim();
    const row1 = result.grid[rect.y + 1].map(c => c.ch).join('').trim();
    expect(row0).toContain('hello');
    expect(row1).toContain('world');
    noCellsBelowWidget(result, 'ta');
  });

  it('does not throw at h=0', () => {
    const child: ComponentNode = {
      id: 'ta', type: 'textarea', parentId: 'root', children: [],
      props: { value: 'line1\nline2', border: 'none' },
    };
    expect(() => render(makeProjectWithContainer(child, 0))).not.toThrow();
  });
});

describe('render.ts – list painting', () => {
  it('does not write below widget bounds at h=1 (no border)', () => {
    const child: ComponentNode = {
      id: 'li', type: 'list', parentId: 'root', children: [],
      props: { items: ['alpha', 'beta', 'gamma'], border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 1));
    noCellsBelowWidget(result, 'li');
  });

  it('renders items at h=2 (no border) — 2 items visible', () => {
    const child: ComponentNode = {
      id: 'li', type: 'list', parentId: 'root', children: [],
      props: { items: ['alpha', 'beta', 'gamma'], border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 2));
    const rect = result.rects['li'];
    const row0 = result.grid[rect.y].map(c => c.ch).join('').trim();
    const row1 = result.grid[rect.y + 1].map(c => c.ch).join('').trim();
    expect(row0).toContain('alpha');
    expect(row1).toContain('beta');
    noCellsBelowWidget(result, 'li');
  });
});

describe('render.ts – table painting', () => {
  it('does not write below widget bounds at h=1', () => {
    const child: ComponentNode = {
      id: 'tbl', type: 'table', parentId: 'root', children: [],
      props: { columns: ['A', 'B'], rows: [['1', '2'], ['3', '4']], border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 1));
    noCellsBelowWidget(result, 'tbl');
  });

  it('does not write below widget bounds at h=2', () => {
    const child: ComponentNode = {
      id: 'tbl', type: 'table', parentId: 'root', children: [],
      props: { columns: ['A', 'B'], rows: [['1', '2'], ['3', '4']], border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 2));
    noCellsBelowWidget(result, 'tbl');
  });

  it('does not write below widget bounds at h=2 (with single border)', () => {
    const child: ComponentNode = {
      id: 'tbl', type: 'table', parentId: 'root', children: [],
      props: { columns: ['A', 'B'], rows: [['1', '2'], ['3', '4']], border: 'single' },
    };
    const result = render(makeProjectWithContainer(child, 2));
    noCellsBelowWidget(result, 'tbl');
  });

  it('renders header and separator when h is sufficient (no border)', () => {
    const child: ComponentNode = {
      id: 'tbl', type: 'table', parentId: 'root', children: [],
      props: { columns: ['Name'], rows: [['alice'], ['bob']], border: 'none' },
    };
    const result = render(makeProjectWithContainer(child, 4));
    const rect = result.rects['tbl'];
    const headerRow = result.grid[rect.y].map(c => c.ch).join('').trim();
    const sepRow = result.grid[rect.y + 1].map(c => c.ch).join('').trim();
    expect(headerRow).toContain('Name');
    expect(sepRow).toMatch(/─+/);
    noCellsBelowWidget(result, 'tbl');
  });
});
