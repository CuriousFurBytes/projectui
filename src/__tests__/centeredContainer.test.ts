import { describe, it, expect } from 'vitest';
import { render } from '../renderer/render';
import { BOX } from '../renderer/boxStyles';
import type { ComponentNode, ProjectState } from '../types/component';

// Build a project where a parent container wraps a child container.
function makeCenteringProject(opts: {
  parentAlign?: 'start' | 'center' | 'end';
  parentJustify?: 'start' | 'center' | 'end';
  parentDirection?: 'row' | 'column';
  childW: number;
  childH: number;
}): ProjectState {
  const { parentAlign, parentJustify, parentDirection = 'column', childW, childH } = opts;
  const parent: ComponentNode = {
    id: 'parent',
    type: 'container',
    parentId: 'root',
    children: ['child'],
    props: {
      direction: parentDirection,
      width: 'fill',
      height: 'fill',
      border: 'none',
      padding: 0,
      align: parentAlign,
      justify: parentJustify,
    },
  };
  const child: ComponentNode = {
    id: 'child',
    type: 'container',
    parentId: 'parent',
    children: [],
    props: {
      direction: 'column',
      width: childW,
      height: childH,
      border: 'rounded',
      fg: 'brightBlack',
      title: 'My Panel',
      padding: 1,
    },
  };
  const root: ComponentNode = {
    id: 'root',
    type: 'container',
    parentId: null,
    children: ['parent'],
    props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
  };
  return {
    rootId: 'root',
    components: { root, parent, child },
    termCols: 40,
    termRows: 20,
    theme: 'tokyo-night',
  };
}

describe('centered container – layout (align / justify)', () => {
  it('RED: centers a fixed-width child horizontally when parent column-direction has align:center', () => {
    // parent: column direction, 40 cols wide, align:center
    // child: width=20 → should start at col 10 (= (40-20)/2)
    const result = render(makeCenteringProject({ parentDirection: 'column', parentAlign: 'center', childW: 20, childH: 10 }));
    const rect = result.rects['child'];
    expect(rect.w).toBe(20);
    expect(rect.x).toBe(10); // centered horizontally
  });

  it('RED: centers a fixed-height child vertically when parent column-direction has justify:center', () => {
    // parent: column direction, 20 rows tall, justify:center
    // child: height=6 → should start at row 7 (= (20-6)/2)
    const result = render(makeCenteringProject({ parentDirection: 'column', parentJustify: 'center', childW: 40, childH: 6 }));
    const rect = result.rects['child'];
    expect(rect.h).toBe(6);
    expect(rect.y).toBe(7); // centered vertically
  });

  it('RED: centers a fixed-size child both ways when parent has align:center and justify:center', () => {
    // parent: column direction, 40×20, align:center, justify:center
    // child: 20×6 → x=10, y=7
    const result = render(makeCenteringProject({
      parentDirection: 'column',
      parentAlign: 'center',
      parentJustify: 'center',
      childW: 20,
      childH: 6,
    }));
    const rect = result.rects['child'];
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(7);
    expect(rect.w).toBe(20);
    expect(rect.h).toBe(6);
  });

  it('RED: row-direction parent with align:center centers child vertically', () => {
    // parent: row direction, 20 rows tall, align:center (cross=vertical)
    // child: height=6 → y should be 7
    const result = render(makeCenteringProject({ parentDirection: 'row', parentAlign: 'center', childW: 20, childH: 6 }));
    const rect = result.rects['child'];
    expect(rect.h).toBe(6);
    expect(rect.y).toBe(7);
  });
});

describe('centered container – rendering (rounded border + gray + title)', () => {
  it('RED: renders rounded corner characters (╭ ╮ ╰ ╯) for border:rounded', () => {
    const result = render(makeCenteringProject({
      parentDirection: 'column',
      parentAlign: 'center',
      parentJustify: 'center',
      childW: 20,
      childH: 6,
    }));
    const rect = result.rects['child'];
    const grid = result.grid;
    // Top-left corner
    expect(grid[rect.y][rect.x].ch).toBe(BOX.rounded.tl);   // ╭
    // Top-right corner
    expect(grid[rect.y][rect.x + rect.w - 1].ch).toBe(BOX.rounded.tr); // ╮
    // Bottom-left corner
    expect(grid[rect.y + rect.h - 1][rect.x].ch).toBe(BOX.rounded.bl); // ╰
    // Bottom-right corner
    expect(grid[rect.y + rect.h - 1][rect.x + rect.w - 1].ch).toBe(BOX.rounded.br); // ╯
  });

  it('RED: title text appears in the top border of the centered container', () => {
    const result = render(makeCenteringProject({
      parentDirection: 'column',
      parentAlign: 'center',
      parentJustify: 'center',
      childW: 20,
      childH: 6,
    }));
    const rect = result.rects['child'];
    const topRow = result.grid[rect.y].slice(rect.x, rect.x + rect.w).map(c => c.ch).join('');
    expect(topRow).toContain('My Panel');
  });

  it('RED: border cells have brightBlack fg color (gray border)', () => {
    const result = render(makeCenteringProject({
      parentDirection: 'column',
      parentAlign: 'center',
      parentJustify: 'center',
      childW: 20,
      childH: 6,
    }));
    const rect = result.rects['child'];
    const grid = result.grid;
    // Top-left corner cell should have fg: brightBlack
    expect(grid[rect.y][rect.x].fg).toBe('brightBlack');
    // Top-right corner
    expect(grid[rect.y][rect.x + rect.w - 1].fg).toBe('brightBlack');
  });
});
