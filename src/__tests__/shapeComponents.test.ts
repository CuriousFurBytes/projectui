import { describe, it, expect } from 'vitest';
import { render } from '../renderer/render';
import { getDef } from '../lib/componentDefs';
import type { ComponentNode, ProjectState } from '../types/component';

// ─── helpers ───────────────────────────────────────────────────────────────

function withChild(child: ComponentNode): ProjectState {
  const root: ComponentNode = {
    id: 'root',
    type: 'container',
    parentId: null,
    children: [child.id],
    props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
  };
  return {
    rootId: 'root',
    components: { root, [child.id]: { ...child, parentId: 'root' } },
    layers: [{ id: 'layer1', name: 'Screen 1', rootId: 'root', components: {} }],
    activeLayerIndex: 0,
    termCols: 40,
    termRows: 20,
    theme: 'tokyo-night',
  };
}

function rowText(result: ReturnType<typeof render>, y: number): string {
  return result.grid[y]?.map((c) => c.ch).join('') ?? '';
}

// ─── getDef for new component types ───────────────────────────────────────

describe('getDef for new component types', () => {
  it('getDef("line") returns a component def', () => {
    const def = getDef('line');
    expect(def).toBeDefined();
    expect(def.type).toBe('line');
    expect(def.group).toBe('shape');
  });

  it('getDef("circle") returns a component def', () => {
    const def = getDef('circle');
    expect(def).toBeDefined();
    expect(def.type).toBe('circle');
    expect(def.group).toBe('shape');
  });

  it('getDef("polygon") returns a component def', () => {
    const def = getDef('polygon');
    expect(def).toBeDefined();
    expect(def.type).toBe('polygon');
    expect(def.group).toBe('shape');
  });

  it('getDef("chart") returns a component def with bar default', () => {
    const def = getDef('chart');
    expect(def).toBeDefined();
    expect(def.type).toBe('chart');
    expect(def.defaults.chartKind).toBe('bar');
  });
});

// ─── Line shape primitive ──────────────────────────────────────────────────

describe('Line shape primitive', () => {
  it('renders horizontal line with ─ chars across width', () => {
    const child: ComponentNode = {
      id: 'line1',
      type: 'line',
      parentId: 'root',
      children: [],
      props: { orientation: 'horizontal', shapeChar: '─', width: 10, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['line1']!;
    expect(rect).toBeDefined();
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toMatch(/^─+$/);
  });

  it('renders vertical line with │ chars down height', () => {
    const child: ComponentNode = {
      id: 'line2',
      type: 'line',
      parentId: 'root',
      children: [],
      props: { orientation: 'vertical', shapeChar: '│', width: 1, height: 5 },
    };
    const result = render(withChild(child));
    const rect = result.rects['line2']!;
    expect(rect).toBeDefined();
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      const cell = result.grid[y]?.[rect.x];
      expect(cell?.ch).toBe('│');
    }
  });

  it('uses custom shapeChar when provided', () => {
    const child: ComponentNode = {
      id: 'line3',
      type: 'line',
      parentId: 'root',
      children: [],
      props: { orientation: 'horizontal', shapeChar: '=', width: 8, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['line3']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toMatch(/^=+$/);
  });
});

// ─── Circle shape primitive ────────────────────────────────────────────────

describe('Circle shape primitive', () => {
  it('renders circle as ring of characters in bounding box', () => {
    const child: ComponentNode = {
      id: 'circle1',
      type: 'circle',
      parentId: 'root',
      children: [],
      props: { radius: 3, shapeChar: '*', width: 7, height: 7 },
    };
    const result = render(withChild(child));
    const rect = result.rects['circle1']!;
    expect(rect).toBeDefined();
    // Count non-space cells in the rect
    let charCount = 0;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (result.grid[y]?.[x]?.ch === '*') charCount++;
      }
    }
    expect(charCount).toBeGreaterThan(0);
  });

  it('uses shapeChar for circle points', () => {
    const child: ComponentNode = {
      id: 'circle2',
      type: 'circle',
      parentId: 'root',
      children: [],
      props: { radius: 3, shapeChar: 'o', width: 7, height: 7 },
    };
    const result = render(withChild(child));
    const rect = result.rects['circle2']!;
    let foundChar = false;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (result.grid[y]?.[x]?.ch === 'o') { foundChar = true; break; }
      }
      if (foundChar) break;
    }
    expect(foundChar).toBe(true);
  });

  it('renders within bounds for radius=3', () => {
    const child: ComponentNode = {
      id: 'circle3',
      type: 'circle',
      parentId: 'root',
      children: [],
      props: { radius: 3, shapeChar: '*', width: 7, height: 7 },
    };
    const result = render(withChild(child));
    const rect = result.rects['circle3']!;
    // No '*' chars should appear outside the rect
    for (let y = 0; y < result.rows; y++) {
      for (let x = 0; x < result.cols; x++) {
        const inRect = x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
        if (!inRect && result.grid[y]?.[x]?.ch === '*') {
          expect(false).toBe(true); // fail: circle char found outside rect
        }
      }
    }
    expect(true).toBe(true);
  });
});

// ─── Chart component ────────────────────────────────────────────────────────

describe('Chart component - bar', () => {
  it('renders with chartKind=bar containing block chars or | chars', () => {
    const child: ComponentNode = {
      id: 'chart1',
      type: 'chart',
      parentId: 'root',
      children: [],
      props: {
        chartKind: 'bar',
        chartData: [4, 8, 6, 3],
        chartLabels: ['A', 'B', 'C', 'D'],
        width: 20,
        height: 8,
        fg: 'brightCyan',
      },
    };
    const result = render(withChild(child));
    const rect = result.rects['chart1']!;
    expect(rect).toBeDefined();
    // Find at least one block or pipe character in the rect
    let found = false;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        const ch = result.grid[y]?.[x]?.ch ?? ' ';
        if (ch === '█' || ch === '▇' || ch === '▆' || ch === '▅' || ch === '▄' || ch === '▃' || ch === '▂' || ch === '▁' || ch === '|') {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBe(true);
  });

  it('scales bars to fit height', () => {
    const child: ComponentNode = {
      id: 'chart2',
      type: 'chart',
      parentId: 'root',
      children: [],
      props: {
        chartKind: 'bar',
        chartData: [10, 5],
        width: 10,
        height: 6,
      },
    };
    const result = render(withChild(child));
    const rect = result.rects['chart2']!;
    expect(rect.h).toBe(6);
    // At least one character in the rect should be non-space
    let nonSpace = 0;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if ((result.grid[y]?.[x]?.ch ?? ' ') !== ' ') nonSpace++;
      }
    }
    expect(nonSpace).toBeGreaterThan(0);
  });

  it('renders sparkline with 8-level block chars', () => {
    const child: ComponentNode = {
      id: 'chart3',
      type: 'chart',
      parentId: 'root',
      children: [],
      props: {
        chartKind: 'sparkline',
        chartData: [1, 4, 2, 8, 5, 3, 7, 6],
        width: 16,
        height: 2,
      },
    };
    const result = render(withChild(child));
    const rect = result.rects['chart3']!;
    expect(rect).toBeDefined();
    const sparklineChars = new Set(['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']);
    let foundSparkline = false;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (sparklineChars.has(result.grid[y]?.[x]?.ch ?? '')) {
          foundSparkline = true;
          break;
        }
      }
      if (foundSparkline) break;
    }
    expect(foundSparkline).toBe(true);
  });
});

// ─── Text wrapping and alignment ────────────────────────────────────────────

describe('Text wrapping', () => {
  it('truncates long text at width by default', () => {
    const child: ComponentNode = {
      id: 'txt1',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'Hello World This Is Long Text', width: 10, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row.length).toBe(10);
    expect(row).toBe('Hello Worl');
  });

  it('adds ellipsis when textWrap=ellipsis', () => {
    const child: ComponentNode = {
      id: 'txt2',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'Hello World This Is Long', textWrap: 'ellipsis', width: 10, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt2']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toHaveLength(10);
    expect(row[9]).toBe('…');
  });

  it('wraps text to next line when textWrap=wrap', () => {
    const child: ComponentNode = {
      id: 'txt3',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'Hello World', textWrap: 'wrap', width: 6, height: 3 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt3']!;
    // First row
    const row0 = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    // Second row should have the wrapped content
    const row1 = rowText(result, rect.y + 1).substring(rect.x, rect.x + rect.w);
    // The content should span at least two rows
    expect(row0.trim().length).toBeGreaterThan(0);
    expect(row1.trim().length).toBeGreaterThan(0);
  });

  it('centers text when textAlign=center', () => {
    const child: ComponentNode = {
      id: 'txt4',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'Hi', textAlign: 'center', width: 10, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt4']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    // 'Hi' in a width-10 field centered: offset = floor((10-2)/2) = 4
    // So chars at indices 4 and 5 should be 'H' and 'i'
    const hIdx = row.indexOf('H');
    expect(hIdx).toBeGreaterThan(0); // not at the start
  });

  it('right-aligns text when textAlign=right', () => {
    const child: ComponentNode = {
      id: 'txt5',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'Hi', textAlign: 'right', width: 10, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt5']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    // 'Hi' right-aligned in width 10: starts at index 8
    const hIdx = row.indexOf('H');
    expect(hIdx).toBeGreaterThanOrEqual(7);
  });
});
