import { describe, it, expect } from 'vitest';
import { exportBlessed } from '../exporters/blessedExporter';
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

describe('blessedExporter – setup boilerplate', () => {
  it('requires blessed at the top', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hello' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain("require('blessed')");
  });

  it('creates a screen with smartCSR', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hello' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.screen(');
    expect(output).toContain('smartCSR: true');
  });

  it('ends with screen.render()', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'hello' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('screen.render()');
  });

  it('registers escape/q/C-c key handler that calls process.exit', () => {
    const node: ComponentNode = {
      id: 'root',
      type: 'text',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toMatch(/screen\.key\(\[['"]escape['"],\s*['"]q['"],\s*['"]C-c['"]\]/);
    expect(output).toContain('process.exit(0)');
  });
});

describe('blessedExporter – container', () => {
  it('renders a container as blessed.box()', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { width: 40, height: 10 },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.box(');
  });

  it('passes parent: screen when container is root', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { width: 40, height: 10 },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('parent: screen');
  });

  it('uses border single → type: line', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { border: 'single' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain("type: 'line'");
  });

  it('uses border double → type: bg', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { border: 'double' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain("type: 'bg'");
  });

  it('sets border: false when border is none', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: { border: 'none' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('border: false');
  });

  it('sets border: false when border is absent', () => {
    const node: ComponentNode = {
      id: 'c1',
      type: 'container',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('border: false');
  });
});

describe('blessedExporter – text', () => {
  it('renders text as blessed.text()', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'Hello World' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.text(');
  });

  it('includes the text content', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'Hello World' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('Hello World');
  });
});

describe('blessedExporter – button', () => {
  it('renders button as blessed.button()', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'Click me' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.button(');
  });

  it('includes the button label in content', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'Click me' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('Click me');
  });

  it('has a style block with focus state', () => {
    const node: ComponentNode = {
      id: 'b1',
      type: 'button',
      parentId: null,
      children: [],
      props: { text: 'OK' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('focus');
  });
});

describe('blessedExporter – list', () => {
  it('renders list as blessed.list()', () => {
    const node: ComponentNode = {
      id: 'l1',
      type: 'list',
      parentId: null,
      children: [],
      props: { items: ['alpha', 'beta', 'gamma'] },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.list(');
  });

  it('includes all items in the items array', () => {
    const node: ComponentNode = {
      id: 'l1',
      type: 'list',
      parentId: null,
      children: [],
      props: { items: ['alpha', 'beta', 'gamma'] },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('"alpha"');
    expect(output).toContain('"beta"');
    expect(output).toContain('"gamma"');
  });
});

describe('blessedExporter – input', () => {
  it('renders input as blessed.textbox()', () => {
    const node: ComponentNode = {
      id: 'i1',
      type: 'input',
      parentId: null,
      children: [],
      props: { placeholder: 'Enter name' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.textbox(');
  });

  it('includes label from placeholder', () => {
    const node: ComponentNode = {
      id: 'i1',
      type: 'input',
      parentId: null,
      children: [],
      props: { placeholder: 'Enter name' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('Enter name');
  });
});

describe('blessedExporter – progressbar', () => {
  it('renders progressbar as blessed.progressbar()', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 0.5 },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.progressbar(');
  });

  it('converts progress 0..1 to filled 0..100', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 0.75 },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('filled: 75');
  });

  it('clamps progress above 1 to filled: 100', () => {
    const node: ComponentNode = {
      id: 'pb1',
      type: 'progressbar',
      parentId: null,
      children: [],
      props: { progress: 2 },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('filled: 100');
  });
});

describe('blessedExporter – table', () => {
  it('renders table as blessed.listtable()', () => {
    const node: ComponentNode = {
      id: 'tbl1',
      type: 'table',
      parentId: null,
      children: [],
      props: { columns: ['Name', 'Age'], rows: [['Alice', '30']] },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.listtable(');
  });

  it('includes column headers in data', () => {
    const node: ComponentNode = {
      id: 'tbl1',
      type: 'table',
      parentId: null,
      children: [],
      props: { columns: ['Name', 'Age'], rows: [] },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('"Name"');
    expect(output).toContain('"Age"');
  });
});

describe('blessedExporter – tabs', () => {
  it('renders tabs as blessed.box() with tab buttons', () => {
    const node: ComponentNode = {
      id: 'tabs1',
      type: 'tabs',
      parentId: null,
      children: [],
      props: { items: ['Tab A', 'Tab B'] },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('blessed.box(');
    expect(output).toContain('blessed.button(');
    expect(output).toContain('Tab A');
    expect(output).toContain('Tab B');
  });
});

describe('blessedExporter – color mapping', () => {
  it('maps brightCyan fg to bright-cyan', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'colorful', fg: 'brightCyan' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('bright-cyan');
  });

  it('maps plain color name unchanged', () => {
    const node: ComponentNode = {
      id: 't1',
      type: 'text',
      parentId: null,
      children: [],
      props: { text: 'colorful', fg: 'red' },
    };
    const output = exportBlessed(makeProject(node));
    expect(output).toContain('"red"');
  });
});

describe('blessedExporter – empty project', () => {
  it('handles missing root gracefully', () => {
    const project: ProjectState = {
      rootId: 'nonexistent',
      components: {},
      termCols: 80,
      termRows: 24,
      theme: 'dracula',
    };
    const output = exportBlessed(project);
    expect(output).toContain('empty project');
  });
});
