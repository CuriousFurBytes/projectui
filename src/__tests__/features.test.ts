// RED: tests for all 10 new features – run before implementing anything.
import { describe, it, expect } from 'vitest';
import { render } from '../renderer/render';
import type { ComponentNode, ProjectState, RichSpan } from '../types/component';

// ─── helpers ───────────────────────────────────────────────────────────────

function withChild(child: ComponentNode): ProjectState {
  const root: ComponentNode = {
    id: 'root', type: 'container', parentId: null, children: [child.id],
    props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
  };
  return {
    rootId: 'root',
    components: { root, [child.id]: { ...child, parentId: 'root' } },
    layers: [{ id: 'layer1', name: 'Screen 1', rootId: 'root', components: {} }],
    activeLayerIndex: 0,
    termCols: 40,
    termRows: 12,
    theme: 'tokyo-night',
  };
}

function rowText(result: ReturnType<typeof render>, y: number): string {
  return result.grid[y]?.map(c => c.ch).join('') ?? '';
}

// ─── Feature 5: Border color + title color ─────────────────────────────────

describe('Feature 5 – borderColor / titleColor props', () => {
  it('renders a container with borderColor set (cells on border row have the color)', () => {
    const child: ComponentNode = {
      id: 'c1', type: 'container', parentId: 'root', children: [],
      props: { border: 'single', borderColor: 'red', width: 10, height: 4, padding: 0 },
    };
    const result = render(withChild(child));
    const rect = result.rects['c1']!;
    // Top-left corner cell should have fg = red
    const tlCell = result.grid[rect.y][rect.x];
    expect(tlCell.fg).toBe('red');
  });

  it('renders a container with titleColor affecting the title text', () => {
    const child: ComponentNode = {
      id: 'c1', type: 'container', parentId: 'root', children: [],
      props: { border: 'single', title: 'Hello', titleColor: 'cyan', borderColor: 'white', width: 20, height: 4, padding: 0 },
    };
    const result = render(withChild(child));
    const rect = result.rects['c1']!;
    // Find the 'H' of "Hello" in the title row — should have fg=cyan
    const titleRow = result.grid[rect.y];
    const hIdx = titleRow.findIndex((c, i) => i >= rect.x && c.ch === 'H');
    expect(hIdx).toBeGreaterThan(-1);
    expect(titleRow[hIdx].fg).toBe('cyan');
  });
});

// ─── Feature 6+7: Divider + titleAlign ─────────────────────────────────────

describe('Feature 6 – divider component', () => {
  it('renders a horizontal divider with ─ characters', () => {
    const child: ComponentNode = {
      id: 'div1', type: 'divider', parentId: 'root', children: [],
      props: { width: 'fill', height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['div1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toMatch(/^─+$/);
  });

  it('renders a divider with centered text', () => {
    const child: ComponentNode = {
      id: 'div1', type: 'divider', parentId: 'root', children: [],
      props: { width: 20, height: 1, text: 'SECTION', titleAlign: 'center' },
    };
    const result = render(withChild(child));
    const rect = result.rects['div1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toContain('SECTION');
    expect(row).toMatch(/^─+.*SECTION.*─+$/);
  });

  it('renders a divider with left-aligned text', () => {
    const child: ComponentNode = {
      id: 'div1', type: 'divider', parentId: 'root', children: [],
      props: { width: 20, height: 1, text: 'Title', titleAlign: 'left' },
    };
    const result = render(withChild(child));
    const rect = result.rects['div1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toContain('Title');
    // Text appears at the left: starts with ─ Title
    expect(row).toMatch(/^─\s?Title/);
  });
});

describe('Feature 7 – titleAlign on containers', () => {
  it('centers the title in a border with titleAlign=center', () => {
    const child: ComponentNode = {
      id: 'c1', type: 'container', parentId: 'root', children: [],
      props: { border: 'single', title: 'Center', titleAlign: 'center', width: 20, height: 4, padding: 0 },
    };
    const result = render(withChild(child));
    const rect = result.rects['c1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    const titleIdx = row.indexOf('Center');
    // title should not be at column 1 (left-align would be)
    expect(titleIdx).toBeGreaterThan(1);
  });

  it('right-aligns the title with titleAlign=right', () => {
    const child: ComponentNode = {
      id: 'c1', type: 'container', parentId: 'root', children: [],
      props: { border: 'single', title: 'Right', titleAlign: 'right', width: 20, height: 4, padding: 0 },
    };
    const result = render(withChild(child));
    const rect = result.rects['c1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    const titleIdx = row.indexOf('Right');
    // right-align: title starts after width/2
    expect(titleIdx).toBeGreaterThan(7);
  });
});

// ─── Feature 2: New widget types ───────────────────────────────────────────

describe('Feature 2 – spinner component', () => {
  it('renders a spinner character at the given position', () => {
    const child: ComponentNode = {
      id: 'spin1', type: 'spinner', parentId: 'root', children: [],
      props: { width: 3, height: 1, spinnerStyle: 'dots' },
    };
    const result = render(withChild(child));
    const rect = result.rects['spin1']!;
    expect(rect).toBeDefined();
    // Should contain at least one non-space character
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row.trim()).not.toBe('');
  });

  it('renders a line-style spinner', () => {
    const child: ComponentNode = {
      id: 'spin2', type: 'spinner', parentId: 'root', children: [],
      props: { width: 5, height: 1, spinnerStyle: 'line' },
    };
    const result = render(withChild(child));
    const rect = result.rects['spin2']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row.trim()).not.toBe('');
  });
});

describe('Feature 2 – toast component', () => {
  it('renders a toast with the given text', () => {
    const child: ComponentNode = {
      id: 't1', type: 'toast', parentId: 'root', children: [],
      props: { text: 'Saved!', toastVariant: 'success', width: 20, height: 3 },
    };
    const result = render(withChild(child));
    const rect = result.rects['t1']!;
    // Find the text "Saved!" in the rendered grid within the toast's rect
    let found = false;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      const row = rowText(result, y).substring(rect.x, rect.x + rect.w);
      if (row.includes('Saved!')) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it('renders a toast border', () => {
    const child: ComponentNode = {
      id: 't1', type: 'toast', parentId: 'root', children: [],
      props: { text: 'Error!', toastVariant: 'error', width: 20, height: 3, border: 'rounded' },
    };
    const result = render(withChild(child));
    const rect = result.rects['t1']!;
    // Top-left corner should be a rounded border char
    const tlCell = result.grid[rect.y][rect.x];
    expect(tlCell.ch).toBe('╭');
  });
});

describe('Feature 2 – timer component', () => {
  it('renders the timer value string', () => {
    const child: ComponentNode = {
      id: 'tim1', type: 'timer', parentId: 'root', children: [],
      props: { timerValue: '01:23:45', width: 12, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['tim1']!;
    const row = rowText(result, rect.y).substring(rect.x, rect.x + rect.w);
    expect(row).toContain('01:23:45');
  });
});

describe('Feature 2 – filepicker component', () => {
  it('renders a file picker with a border', () => {
    const child: ComponentNode = {
      id: 'fp1', type: 'filepicker', parentId: 'root', children: [],
      props: { width: 30, height: 8, border: 'single' },
    };
    const result = render(withChild(child));
    const rect = result.rects['fp1']!;
    const tlCell = result.grid[rect.y][rect.x];
    expect(tlCell.ch).toBe('┌');
  });
});

describe('Feature 2 – asciitext component', () => {
  it('renders ascii art text across multiple rows', () => {
    const child: ComponentNode = {
      id: 'at1', type: 'asciitext', parentId: 'root', children: [],
      props: { text: 'AB', width: 30, height: 5 },
    };
    const result = render(withChild(child));
    const rect = result.rects['at1']!;
    // Should render at least 3 rows of content
    let nonEmptyRows = 0;
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      const row = rowText(result, y).substring(rect.x, rect.x + rect.w).trim();
      if (row) nonEmptyRows++;
    }
    expect(nonEmptyRows).toBeGreaterThanOrEqual(3);
  });
});

// ─── Feature 2 – viewport component ──────────────────────────────────────

describe('Feature 2 – viewport component', () => {
  it('renders a viewport container with a border', () => {
    const child: ComponentNode = {
      id: 'vp1', type: 'viewport', parentId: 'root', children: [],
      props: { width: 20, height: 6, border: 'single', padding: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['vp1']!;
    expect(rect.w).toBe(20);
    const tlCell = result.grid[rect.y][rect.x];
    expect(tlCell.ch).toBe('┌');
  });
});

// ─── Feature 3: Rich text spans ────────────────────────────────────────────

describe('Feature 3 – richSpans on text component', () => {
  it('renders each span with its own fg color', () => {
    const spans: RichSpan[] = [
      { text: 'OK', fg: 'green' },
      { text: ' ', fg: 'default' },
      { text: 'FAIL', fg: 'red' },
    ];
    const child: ComponentNode = {
      id: 'txt1', type: 'text', parentId: 'root', children: [],
      props: { richSpans: spans, width: 20, height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['txt1']!;
    const row = result.grid[rect.y];
    // Find 'O' of "OK" — should be green
    const okCell = row[rect.x];
    expect(okCell.ch).toBe('O');
    expect(okCell.fg).toBe('green');
    // Find 'F' of "FAIL" — should be red
    const fCell = row[rect.x + 3];
    expect(fCell.ch).toBe('F');
    expect(fCell.fg).toBe('red');
  });

  it('renders richSpans on statusbar', () => {
    const spans: RichSpan[] = [
      { text: ' READY', fg: 'black', bg: 'green', bold: true },
      { text: ' | ', fg: 'white', bg: 'blue' },
      { text: 'q: quit', fg: 'white', bg: 'blue' },
    ];
    const child: ComponentNode = {
      id: 'sb1', type: 'statusbar', parentId: 'root', children: [],
      props: { richSpans: spans, width: 'fill', height: 1 },
    };
    const result = render(withChild(child));
    const rect = result.rects['sb1']!;
    const row = result.grid[rect.y];
    // First char ' ' should have bg=green
    const firstCell = row[rect.x];
    expect(firstCell.bg).toBe('green');
  });
});

// ─── Feature 4: Absolute positioning ──────────────────────────────────────

describe('Feature 4 – absolute positioning', () => {
  it('places a component at exact x/y coordinates', () => {
    const root: ComponentNode = {
      id: 'root', type: 'container', parentId: null, children: ['abs1'],
      props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
    };
    const abs: ComponentNode = {
      id: 'abs1', type: 'text', parentId: 'root', children: [],
      props: { text: 'Floating', absolute: true, x: 10, y: 5, width: 10, height: 1 },
    };
    const project: ProjectState = {
      rootId: 'root',
      components: { root, abs1: abs },
      layers: [{ id: 'l1', name: 'Screen 1', rootId: 'root', components: {} }],
      activeLayerIndex: 0,
      termCols: 40,
      termRows: 12,
      theme: 'tokyo-night',
    };
    const result = render(project);
    const rect = result.rects['abs1']!;
    expect(rect.x).toBe(10);
    expect(rect.y).toBe(5);
  });
});

// ─── Feature 9: Grid container ─────────────────────────────────────────────

describe('Feature 9 – grid container', () => {
  it('lays out children in a 2-column grid', () => {
    const item1: ComponentNode = {
      id: 'item1', type: 'text', parentId: 'grid1', children: [],
      props: { text: 'Cell A', width: 'fill', height: 1 },
    };
    const item2: ComponentNode = {
      id: 'item2', type: 'text', parentId: 'grid1', children: [],
      props: { text: 'Cell B', width: 'fill', height: 1 },
    };
    const grid: ComponentNode = {
      id: 'grid1', type: 'grid', parentId: 'root', children: ['item1', 'item2'],
      props: { gridCols: 2, gridGap: 1, width: 20, height: 3 },
    };
    const root: ComponentNode = {
      id: 'root', type: 'container', parentId: null, children: ['grid1'],
      props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
    };
    const project: ProjectState = {
      rootId: 'root',
      components: { root, grid1: grid, item1, item2 },
      layers: [{ id: 'l1', name: 'Screen 1', rootId: 'root', components: {} }],
      activeLayerIndex: 0,
      termCols: 40,
      termRows: 12,
      theme: 'tokyo-night',
    };
    const result = render(project);
    // item1 and item2 should be on the same row
    const r1 = result.rects['item1']!;
    const r2 = result.rects['item2']!;
    expect(r1.y).toBe(r2.y);
    // item2 should be to the right of item1
    expect(r2.x).toBeGreaterThan(r1.x);
  });
});

// ─── Feature 1: Multiple layers ────────────────────────────────────────────

describe('Feature 1 – multiple layers in ProjectState', () => {
  it('ProjectState accepts layers array', () => {
    const project: ProjectState = {
      rootId: 'root',
      components: {
        root: {
          id: 'root', type: 'container', parentId: null, children: [],
          props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
        },
      },
      layers: [
        { id: 'l1', name: 'Screen 1', rootId: 'root', components: {} },
        { id: 'l2', name: 'Screen 2', rootId: 'root2', components: {} },
      ],
      activeLayerIndex: 0,
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
    };
    expect(project.layers).toHaveLength(2);
    expect(project.layers![0].name).toBe('Screen 1');
    expect(project.activeLayerIndex).toBe(0);
  });
});

// ─── Feature 10: Timeline steps in ProjectState ────────────────────────────

describe('Feature 10 – timeline in ProjectState', () => {
  it('ProjectState accepts timelineSteps and timelineTransitions', () => {
    const project: ProjectState = {
      rootId: 'root',
      components: {
        root: {
          id: 'root', type: 'container', parentId: null, children: [],
          props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
        },
      },
      layers: [{ id: 'l1', name: 'Screen 1', rootId: 'root', components: {} }],
      activeLayerIndex: 0,
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
      timelineSteps: [
        { id: 'step1', layerId: 'l1', label: 'Main Screen' },
        { id: 'step2', layerId: 'l2', label: 'Modal' },
      ],
      timelineTransitions: [
        { id: 'tr1', fromStepId: 'step1', toStepId: 'step2', event: 'keypress', trigger: 'enter', label: 'Open Modal' },
      ],
    };
    expect(project.timelineSteps).toHaveLength(2);
    expect(project.timelineTransitions).toHaveLength(1);
    expect(project.timelineTransitions![0].event).toBe('keypress');
  });
});
