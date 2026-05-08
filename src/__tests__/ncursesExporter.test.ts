import { describe, it, expect } from 'vitest';
import { exportNcurses } from '../exporters/ncursesExporter';
import type { ComponentNode, ProjectState } from '../types/component';

function makeProject(node: ComponentNode, extra?: Record<string, ComponentNode>): ProjectState {
  return {
    rootId: node.id,
    components: { [node.id]: node, ...extra },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

// ─── RED → GREEN test suite ──────────────────────────────────────────────────

describe('ncursesExporter – headers and boilerplate', () => {
  it('includes <ncurses.h>', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('#include <ncurses.h>');
  });

  it('includes <string>', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('#include <string>');
  });

  it('includes <vector>', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('#include <vector>');
  });

  it('has int main()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('int main()');
  });
});

describe('ncursesExporter – initialization sequence', () => {
  it('calls initscr()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('initscr()');
  });

  it('calls cbreak()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('cbreak()');
  });

  it('calls noecho()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('noecho()');
  });

  it('calls keypad(stdscr, TRUE)', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('keypad(stdscr, TRUE)');
  });

  it('calls start_color()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('start_color()');
  });
});

describe('ncursesExporter – teardown', () => {
  it('calls getch() before endwin()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'bye' },
    };
    const output = exportNcurses(makeProject(node));
    const getchPos = output.indexOf('getch()');
    const endwinPos = output.indexOf('endwin()');
    expect(getchPos).toBeGreaterThan(-1);
    expect(endwinPos).toBeGreaterThan(-1);
    expect(getchPos).toBeLessThan(endwinPos);
  });

  it('calls endwin()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'bye' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('endwin()');
  });

  it('returns 0 from main', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('return 0;');
  });
});

describe('ncursesExporter – container', () => {
  it('renders container as newwin()', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { width: 40, height: 10, x: 0, y: 0 },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('newwin(');
  });

  it('uses height, width, y, x order in newwin()', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { width: 40, height: 10, x: 5, y: 2 },
    };
    const output = exportNcurses(makeProject(node));
    // newwin(height, width, y, x)
    expect(output).toContain('newwin(10, 40, 2, 5)');
  });

  it('calls box() when border is single', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { border: 'single', width: 30, height: 8 },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toMatch(/box\(\w+, 0, 0\)/);
  });

  it('does not call box() when border is none', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { border: 'none', width: 30, height: 8 },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).not.toMatch(/box\(/);
  });

  it('calls wrefresh() on the window', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { width: 30, height: 8 },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('wrefresh(');
  });
});

describe('ncursesExporter – text', () => {
  it('renders text as mvwprintw()', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'Hello ncurses' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('mvwprintw(');
  });

  it('includes the text content in mvwprintw', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'Hello ncurses' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('Hello ncurses');
  });

  it('uses %s format specifier', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'test' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('%s');
  });
});

describe('ncursesExporter – button', () => {
  it('renders button with bracket notation [ Label ]', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'OK' },
    };
    const output = exportNcurses(makeProject(node));
    // The format string should use "[ %s ]"
    expect(output).toContain('[ %s ]');
  });

  it('includes button label in output', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'Cancel' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('Cancel');
  });

  it('uses mvwprintw for button', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'Save' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('mvwprintw(');
  });
});

describe('ncursesExporter – list', () => {
  it('renders each list item with mvwprintw', () => {
    const node: ComponentNode = {
      id: 'l1',
      type: 'list',
      parentId: null,
      children: [],
      props: { items: ['one', 'two', 'three'] },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('one');
    expect(output).toContain('two');
    expect(output).toContain('three');
    // Should have multiple mvwprintw calls (one per item)
    const count = (output.match(/mvwprintw/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

describe('ncursesExporter – progressbar', () => {
  it('renders progressbar as [####    ] style', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 0.5, width: 10 },
    };
    const output = exportNcurses(makeProject(node));
    // The output encodes the bar as a C string argument containing # and space chars
    // e.g. mvwprintw(stdscr, 0, 0, "[%s]", "#####     ");
    expect(output).toContain('"#####     "');
  });

  it('renders a fully empty bar when progress is 0', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 0, width: 10 },
    };
    const output = exportNcurses(makeProject(node));
    // All spaces inside the bar string (no # chars from the bar content itself)
    // The bar string argument should be all spaces
    expect(output).toContain('"          "');
  });

  it('clamps progress > 1 to fully filled', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 5, width: 10 },
    };
    const output = exportNcurses(makeProject(node));
    // All 20 default chars should be #  (uses default width=20 when width is number=10 → sizeVal returns 10)
    expect(output).toContain('#'.repeat(10));
  });
});

describe('ncursesExporter – color pairs', () => {
  it('emits init_pair when a node has fg color', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi', fg: 'red' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('init_pair(');
    expect(output).toContain('COLOR_RED');
  });

  it('does not emit init_pair when node has no color props', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hi' },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).not.toContain('init_pair(');
  });
});

describe('ncursesExporter – table', () => {
  it('renders column headers with mvwprintw', () => {
    const node: ComponentNode = {
      id: 'tbl1',
      type: 'table',
      parentId: null,
      children: [],
      props: { columns: ['Name', 'Role'], rows: [['Alice', 'Admin']] },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('Name');
    expect(output).toContain('Role');
  });

  it('renders data rows', () => {
    const node: ComponentNode = {
      id: 'tbl1',
      type: 'table',
      parentId: null,
      children: [],
      props: { columns: ['Name'], rows: [['Alice'], ['Bob']] },
    };
    const output = exportNcurses(makeProject(node));
    expect(output).toContain('Alice');
    expect(output).toContain('Bob');
  });
});

describe('ncursesExporter – empty project', () => {
  it('handles missing root gracefully', () => {
    const project: ProjectState = {
      rootId: 'nonexistent',
      components: {},
      termCols: 80,
      termRows: 24,
      theme: 'dracula',
    };
    const output = exportNcurses(project);
    expect(output).toContain('empty project');
  });
});
