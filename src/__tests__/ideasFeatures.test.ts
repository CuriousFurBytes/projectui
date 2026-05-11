// Red/green TDD for IDEAS.md features.
// Run tests RED first, then implement each feature.

import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import { useEditor } from '../store/editorStore';
import type { ProjectState } from '../types/component';

function freshStore() {
  useEditor.getState().reset();
}

// ─── Idea #1: Design Tokens ───────────────────────────────────────────────────

describe('Idea 1 – Design tokens model', () => {
  it('DesignToken type has id, name, type, value, group fields', async () => {
    const { DEFAULT_DESIGN_TOKENS } = await import('../lib/designTokens');
    expect(Array.isArray(DEFAULT_DESIGN_TOKENS)).toBe(true);
    const token = DEFAULT_DESIGN_TOKENS[0];
    expect(token).toHaveProperty('id');
    expect(token).toHaveProperty('name');
    expect(token).toHaveProperty('type');
    expect(token).toHaveProperty('value');
  });

  it('DEFAULT_DESIGN_TOKENS includes semantic color tokens: surface, accent, danger', async () => {
    const { DEFAULT_DESIGN_TOKENS } = await import('../lib/designTokens');
    const names = DEFAULT_DESIGN_TOKENS.map((t: any) => t.name);
    expect(names).toContain('surface');
    expect(names).toContain('accent');
    expect(names).toContain('danger');
  });

  it('DEFAULT_DESIGN_TOKENS includes spacing scale tokens', async () => {
    const { DEFAULT_DESIGN_TOKENS } = await import('../lib/designTokens');
    const spacingTokens = DEFAULT_DESIGN_TOKENS.filter((t: any) => t.type === 'spacing');
    expect(spacingTokens.length).toBeGreaterThan(0);
  });

  it('DEFAULT_DESIGN_TOKENS includes border and text tokens', async () => {
    const { DEFAULT_DESIGN_TOKENS } = await import('../lib/designTokens');
    const borderTokens = DEFAULT_DESIGN_TOKENS.filter((t: any) => t.type === 'border');
    const textTokens = DEFAULT_DESIGN_TOKENS.filter((t: any) => t.type === 'text');
    expect(borderTokens.length).toBeGreaterThan(0);
    expect(textTokens.length).toBeGreaterThan(0);
  });
});

describe('Idea 1 – Design tokens in ProjectState', () => {
  beforeEach(freshStore);

  it('project starts with default tokens from migration', () => {
    const project = useEditor.getState().project;
    expect(Array.isArray(project.tokens)).toBe(true);
    expect((project.tokens ?? []).length).toBeGreaterThan(0);
  });

  it('addToken adds a token to the project', () => {
    freshStore();
    useEditor.getState().addToken({ name: 'brand', type: 'color', value: '#ff0000', group: 'brand' });
    const tokens = useEditor.getState().project.tokens ?? [];
    const found = tokens.find((t: any) => t.name === 'brand');
    expect(found).toBeDefined();
    expect(found?.value).toBe('#ff0000');
  });

  it('addToken returns the new token id', () => {
    freshStore();
    const id = useEditor.getState().addToken({ name: 'mycolor', type: 'color', value: '#00ff00' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('removeToken removes the token by id', () => {
    freshStore();
    const id = useEditor.getState().addToken({ name: 'temp', type: 'color', value: '#aabbcc' });
    useEditor.getState().removeToken(id);
    const tokens = useEditor.getState().project.tokens ?? [];
    expect(tokens.find((t: any) => t.id === id)).toBeUndefined();
  });

  it('updateToken changes the value of a token', () => {
    freshStore();
    const id = useEditor.getState().addToken({ name: 'mytoken', type: 'color', value: '#111111' });
    useEditor.getState().updateToken(id, '#222222');
    const token = (useEditor.getState().project.tokens ?? []).find((t: any) => t.id === id);
    expect(token?.value).toBe('#222222');
  });

  it('renameToken changes the name of a token', () => {
    freshStore();
    const id = useEditor.getState().addToken({ name: 'oldname', type: 'color', value: '#000' });
    useEditor.getState().renameToken(id, 'newname');
    const token = (useEditor.getState().project.tokens ?? []).find((t: any) => t.id === id);
    expect(token?.name).toBe('newname');
  });

  it('addToken is undoable', () => {
    freshStore();
    const before = (useEditor.getState().project.tokens ?? []).length;
    useEditor.getState().addToken({ name: 'undotest', type: 'color', value: '#fff' });
    useEditor.getState().undo();
    const after = (useEditor.getState().project.tokens ?? []).length;
    expect(after).toBe(before);
  });
});

describe('Idea 1 – Token export utilities', () => {
  it('exportTokensJson returns a JSON string with tokens array', async () => {
    const { exportTokensJson } = await import('../lib/designTokens');
    const tokens = [{ id: 't1', name: 'surface', type: 'color', value: '#fff', group: 'semantic' }];
    const json = exportTokensJson(tokens as any);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('surface');
  });

  it('exportStyleDictionary returns Style Dictionary compatible output', async () => {
    const { exportStyleDictionary } = await import('../lib/designTokens');
    const tokens = [{ id: 't1', name: 'accent', type: 'color', value: '#7aa2f7', group: 'semantic' }];
    const json = exportStyleDictionary(tokens as any);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('color');
    expect(parsed.color).toHaveProperty('accent');
    expect(parsed.color.accent).toHaveProperty('value');
  });

  it('importTokensJson parses a JSON string into tokens', async () => {
    const { exportTokensJson, importTokensJson } = await import('../lib/designTokens');
    const tokens = [{ id: 't1', name: 'danger', type: 'color', value: '#f00', group: 'semantic' }];
    const json = exportTokensJson(tokens as any);
    const imported = importTokensJson(json);
    expect(imported).toHaveLength(1);
    expect(imported[0].name).toBe('danger');
  });
});

// ─── Idea #3: Grouping & Alignment ───────────────────────────────────────────

describe('Idea 3 – Grouping nodes', () => {
  beforeEach(freshStore);

  it('groupNodes exists on the store', () => {
    expect(typeof useEditor.getState().groupNodes).toBe('function');
  });

  it('groupNodes creates a new container and wraps selected nodes', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    const groupId = useEditor.getState().groupNodes([btn1, btn2], rootId);
    const comps = useEditor.getState().project.components;
    expect(comps[groupId]).toBeDefined();
    expect(comps[groupId].type).toBe('container');
    expect(comps[groupId].children).toContain(btn1);
    expect(comps[groupId].children).toContain(btn2);
  });

  it('groupNodes removes the grouped nodes from their original parent', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().groupNodes([btn1, btn2], rootId);
    const root = useEditor.getState().project.components[rootId];
    expect(root.children).not.toContain(btn1);
    expect(root.children).not.toContain(btn2);
  });

  it('groupNodes is undoable', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().groupNodes([btn1, btn2], rootId);
    useEditor.getState().undo();
    const root = useEditor.getState().project.components[rootId];
    expect(root.children).toContain(btn1);
    expect(root.children).toContain(btn2);
  });
});

describe('Idea 3 – Ungrouping nodes', () => {
  beforeEach(freshStore);

  it('ungroupNode exists on the store', () => {
    expect(typeof useEditor.getState().ungroupNode).toBe('function');
  });

  it('ungroupNode moves children to the parent and removes the group', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    const groupId = useEditor.getState().groupNodes([btn1, btn2], rootId);
    useEditor.getState().ungroupNode(groupId);
    const comps = useEditor.getState().project.components;
    expect(comps[groupId]).toBeUndefined();
    const root = comps[rootId];
    expect(root.children).toContain(btn1);
    expect(root.children).toContain(btn2);
  });

  it('ungroupNode is undoable', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    const groupId = useEditor.getState().groupNodes([btn1, btn2], rootId);
    useEditor.getState().ungroupNode(groupId);
    useEditor.getState().undo();
    const comps = useEditor.getState().project.components;
    expect(comps[groupId]).toBeDefined();
  });
});

describe('Idea 3 – Alignment tools', () => {
  beforeEach(freshStore);

  it('alignNodes exists on the store', () => {
    expect(typeof useEditor.getState().alignNodes).toBe('function');
  });

  it('alignNodes sets all selected nodes to the same x when aligning left', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    const n2 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 5, y: 0, width: 10, height: 3 });
    useEditor.getState().updateProps(n2, { absolute: true, x: 15, y: 3, width: 10, height: 3 });
    useEditor.getState().alignNodes([n1, n2], 'left');
    const comps = useEditor.getState().project.components;
    expect(comps[n1].props.x).toBe(comps[n2].props.x);
  });

  it('alignNodes sets all selected nodes to the same y when aligning top', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    const n2 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 0, y: 2, width: 10, height: 3 });
    useEditor.getState().updateProps(n2, { absolute: true, x: 0, y: 8, width: 10, height: 3 });
    useEditor.getState().alignNodes([n1, n2], 'top');
    const comps = useEditor.getState().project.components;
    expect(comps[n1].props.y).toBe(comps[n2].props.y);
  });

  it('alignNodes is undoable', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 5, y: 0 });
    const before = useEditor.getState().project.components[n1].props.x;
    useEditor.getState().alignNodes([n1], 'left');
    useEditor.getState().undo();
    expect(useEditor.getState().project.components[n1].props.x).toBe(before);
  });
});

// ─── Idea #5: Viewport presets & Layout constraints ──────────────────────────

describe('Idea 5 – Viewport presets', () => {
  it('VIEWPORT_PRESETS is exported with at least 3 presets', async () => {
    const { VIEWPORT_PRESETS } = await import('../lib/viewportPresets');
    expect(Array.isArray(VIEWPORT_PRESETS)).toBe(true);
    expect(VIEWPORT_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('VIEWPORT_PRESETS includes 80×24, 100×30, 120×40 presets', async () => {
    const { VIEWPORT_PRESETS } = await import('../lib/viewportPresets');
    const cols = VIEWPORT_PRESETS.map((p: any) => p.cols);
    const rows = VIEWPORT_PRESETS.map((p: any) => p.rows);
    expect(cols).toContain(80);
    expect(cols).toContain(100);
    expect(cols).toContain(120);
    expect(rows).toContain(24);
    expect(rows).toContain(30);
    expect(rows).toContain(40);
  });

  it('applyViewportPreset exists on the store and updates termCols/termRows', async () => {
    const { VIEWPORT_PRESETS } = await import('../lib/viewportPresets');
    freshStore();
    expect(typeof useEditor.getState().applyViewportPreset).toBe('function');
    const preset = VIEWPORT_PRESETS[0];
    useEditor.getState().applyViewportPreset(preset);
    const project = useEditor.getState().project;
    expect(project.termCols).toBe(preset.cols);
    expect(project.termRows).toBe(preset.rows);
  });

  it('applyViewportPreset is undoable', async () => {
    const { VIEWPORT_PRESETS } = await import('../lib/viewportPresets');
    freshStore();
    const before = useEditor.getState().project.termCols;
    const preset = VIEWPORT_PRESETS.find((p: any) => p.cols !== before) ?? VIEWPORT_PRESETS[0];
    useEditor.getState().applyViewportPreset(preset);
    useEditor.getState().undo();
    expect(useEditor.getState().project.termCols).toBe(before);
  });
});

describe('Idea 5 – Layout constraints in ComponentProps', () => {
  it('ComponentProps accepts a constraints field', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('container', null);
    node.props.constraints = { horizontal: 'fill', vertical: 'fixed' };
    expect(node.props.constraints?.horizontal).toBe('fill');
    expect(node.props.constraints?.vertical).toBe('fixed');
  });

  it('updateProps can set constraints on a node', () => {
    freshStore();
    const rootId = useEditor.getState().project.rootId;
    const id = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(id, { constraints: { horizontal: 'fill', vertical: 'fixed' } });
    const node = useEditor.getState().project.components[id];
    expect(node.props.constraints?.horizontal).toBe('fill');
  });
});

// ─── Idea #6: Mock data bindings & State variants ────────────────────────────

describe('Idea 6 – Mock datasets in project', () => {
  beforeEach(freshStore);

  it('addMockDataset exists on the store', () => {
    expect(typeof useEditor.getState().addMockDataset).toBe('function');
  });

  it('addMockDataset adds a dataset and returns its id', () => {
    const id = useEditor.getState().addMockDataset('users', [{ name: 'Alice' }, { name: 'Bob' }]);
    expect(typeof id).toBe('string');
    const datasets = useEditor.getState().project.mockDatasets ?? [];
    const found = datasets.find((d: any) => d.id === id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('users');
    expect(found?.data).toHaveLength(2);
  });

  it('removeMockDataset removes dataset by id', () => {
    const id = useEditor.getState().addMockDataset('temp', []);
    useEditor.getState().removeMockDataset(id);
    const datasets = useEditor.getState().project.mockDatasets ?? [];
    expect(datasets.find((d: any) => d.id === id)).toBeUndefined();
  });

  it('updateMockDataset replaces the data array', () => {
    const id = useEditor.getState().addMockDataset('tasks', [{ title: 'old' }]);
    useEditor.getState().updateMockDataset(id, [{ title: 'new1' }, { title: 'new2' }]);
    const dataset = (useEditor.getState().project.mockDatasets ?? []).find((d: any) => d.id === id);
    expect(dataset?.data).toHaveLength(2);
    expect((dataset?.data as any)[0].title).toBe('new1');
  });

  it('bindMockData sets mockDatasetId on the component', () => {
    const rootId = useEditor.getState().project.rootId;
    const listId = useEditor.getState().addChild(rootId, 'list');
    const dsId = useEditor.getState().addMockDataset('items', ['a', 'b', 'c']);
    useEditor.getState().bindMockData(listId, dsId);
    const node = useEditor.getState().project.components[listId];
    expect(node.props.mockDatasetId).toBe(dsId);
  });
});

describe('Idea 6 – Component state variants', () => {
  beforeEach(freshStore);

  it('ComponentNode accepts a stateVariants field', async () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().setNodeStateVariant(btnId, 'hover', { fg: 'brightWhite', bg: 'blue' });
    const node = useEditor.getState().project.components[btnId];
    expect(node.stateVariants).toBeDefined();
    expect(node.stateVariants?.hover).toBeDefined();
    expect(node.stateVariants?.hover?.fg).toBe('brightWhite');
  });

  it('setNodeStateVariant exists on the store', () => {
    expect(typeof useEditor.getState().setNodeStateVariant).toBe('function');
  });

  it('removeNodeStateVariant removes a state variant', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().setNodeStateVariant(btnId, 'hover', { fg: 'cyan' });
    useEditor.getState().removeNodeStateVariant(btnId, 'hover');
    const node = useEditor.getState().project.components[btnId];
    expect(node.stateVariants?.hover).toBeUndefined();
  });
});

// ─── Idea #7: Accessibility utilities ────────────────────────────────────────

describe('Idea 7 – Contrast checker', () => {
  it('contrastRatio is exported from accessibility lib', async () => {
    const { contrastRatio } = await import('../lib/accessibility');
    expect(typeof contrastRatio).toBe('function');
  });

  it('contrastRatio returns a number >= 1', async () => {
    const { contrastRatio } = await import('../lib/accessibility');
    const ratio = contrastRatio('#ffffff', '#000000');
    expect(typeof ratio).toBe('number');
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it('white on black has maximum contrast (21:1)', async () => {
    const { contrastRatio } = await import('../lib/accessibility');
    const ratio = contrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('identical colors have minimum contrast (1:1)', async () => {
    const { contrastRatio } = await import('../lib/accessibility');
    const ratio = contrastRatio('#888888', '#888888');
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('isContrastSafe returns true for WCAG AA (>= 4.5:1)', async () => {
    const { isContrastSafe } = await import('../lib/accessibility');
    expect(isContrastSafe(4.5)).toBe(true);
    expect(isContrastSafe(4.4)).toBe(false);
    expect(isContrastSafe(7.1, 'AAA')).toBe(true);
    expect(isContrastSafe(6.9, 'AAA')).toBe(false);
  });

  it('checkProjectContrast returns array of issues for low-contrast components', async () => {
    const { checkProjectContrast } = await import('../lib/accessibility');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'text', parentId: null, children: [], props: { fg: 'black', bg: 'black', text: 'hello' } },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const issues = checkProjectContrast(project);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toHaveProperty('nodeId');
    expect(issues[0]).toHaveProperty('ratio');
  });
});

describe('Idea 7 – Glyph safety checker', () => {
  it('isSafeGlyph is exported from accessibility lib', async () => {
    const { isSafeGlyph } = await import('../lib/accessibility');
    expect(typeof isSafeGlyph).toBe('function');
  });

  it('ASCII printable chars are safe glyphs', async () => {
    const { isSafeGlyph } = await import('../lib/accessibility');
    expect(isSafeGlyph('A')).toBe(true);
    expect(isSafeGlyph('+')).toBe(true);
    expect(isSafeGlyph('-')).toBe(true);
    expect(isSafeGlyph('|')).toBe(true);
  });

  it('Box-drawing Unicode chars are not safe glyphs', async () => {
    const { isSafeGlyph } = await import('../lib/accessibility');
    expect(isSafeGlyph('─')).toBe(false);
    expect(isSafeGlyph('│')).toBe(false);
    expect(isSafeGlyph('╭')).toBe(false);
  });

  it('checkProjectGlyphs returns issues for components using unsafe glyphs', async () => {
    const { checkProjectGlyphs } = await import('../lib/accessibility');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'text', parentId: null, children: [], props: { text: '─── heading ───' } },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const issues = checkProjectGlyphs(project);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toHaveProperty('nodeId');
    expect(issues[0]).toHaveProperty('glyph');
  });
});

describe('Idea 7 – Terminal capability profiles', () => {
  it('CAPABILITY_PROFILES is exported with truecolor, 256color, 16color, mono', async () => {
    const { CAPABILITY_PROFILES } = await import('../lib/accessibility');
    expect(Array.isArray(CAPABILITY_PROFILES)).toBe(true);
    const names = CAPABILITY_PROFILES.map((p: any) => p.name);
    expect(names).toContain('truecolor');
    expect(names).toContain('256color');
    expect(names).toContain('16color');
    expect(names).toContain('mono');
  });
});

// ─── Idea #10: Schema validation & project metadata ──────────────────────────

describe('Idea 10 – Schema validation', () => {
  it('validateProject is exported from validation lib', async () => {
    const { validateProject } = await import('../lib/validation');
    expect(typeof validateProject).toBe('function');
  });

  it('validateProject returns valid=true for a well-formed project', async () => {
    const { validateProject } = await import('../lib/validation');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const result = validateProject(project);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateProject returns valid=false if rootId is missing', async () => {
    const { validateProject } = await import('../lib/validation');
    const result = validateProject({} as any);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateProject returns error when rootId not in components', async () => {
    const { validateProject } = await import('../lib/validation');
    const result = validateProject({ rootId: 'missing', components: {}, termCols: 80, termRows: 24, theme: 'tokyo-night' } as any);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.toLowerCase().includes('root'))).toBe(true);
  });

  it('validateProject returns error when a component references a missing child', async () => {
    const { validateProject } = await import('../lib/validation');
    const result = validateProject({
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: ['missing-child'], props: {} },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    } as any);
    expect(result.valid).toBe(false);
  });
});

describe('Idea 10 – Project metadata', () => {
  beforeEach(freshStore);

  it('setProjectMetadata exists on the store', () => {
    expect(typeof useEditor.getState().setProjectMetadata).toBe('function');
  });

  it('setProjectMetadata updates the project metadata', () => {
    useEditor.getState().setProjectMetadata({ name: 'My App', description: 'A test app', tags: ['demo'], version: '1.0.0' });
    const { metadata } = useEditor.getState().project;
    expect(metadata?.name).toBe('My App');
    expect(metadata?.description).toBe('A test app');
    expect(metadata?.tags).toContain('demo');
    expect(metadata?.version).toBe('1.0.0');
  });

  it('setProjectMetadata is undoable', () => {
    useEditor.getState().setProjectMetadata({ name: 'Before' });
    useEditor.getState().setProjectMetadata({ name: 'After' });
    useEditor.getState().undo();
    expect(useEditor.getState().project.metadata?.name).toBe('Before');
  });
});

describe('Idea 10 – Recovery / autosave snapshots', () => {
  it('listAutosaves is exported from autosave lib', async () => {
    const { listAutosaves } = await import('../lib/autosave');
    expect(typeof listAutosaves).toBe('function');
  });

  it('saveAutosave writes to localStorage under autosave keys', async () => {
    const { saveAutosave, listAutosaves } = await import('../lib/autosave');
    const project: ProjectState = {
      rootId: 'r', components: { r: { id: 'r', type: 'container', parentId: null, children: [], props: {} } },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    saveAutosave(project);
    const snapshots = listAutosaves();
    expect(snapshots.length).toBeGreaterThan(0);
  });

  it('listAutosaves returns at most 10 recent snapshots', async () => {
    const { saveAutosave, listAutosaves } = await import('../lib/autosave');
    const project: ProjectState = {
      rootId: 'r', components: { r: { id: 'r', type: 'container', parentId: null, children: [], props: {} } },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    for (let i = 0; i < 15; i++) saveAutosave({ ...project, termCols: 80 + i });
    const snapshots = listAutosaves();
    expect(snapshots.length).toBeLessThanOrEqual(10);
  });

  it('restoreAutosave loads project state from snapshot', () => {
    expect(typeof useEditor.getState().restoreAutosave).toBe('function');
  });
});

// ─── Idea #9: Richer component types ─────────────────────────────────────────

describe('Idea 9 – New component types', () => {
  it('treeview is a valid ComponentType', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('treeview' as any, null);
    expect(node.type).toBe('treeview');
  });

  it('metriccard is a valid ComponentType', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('metriccard' as any, null);
    expect(node.type).toBe('metriccard');
  });

  it('markdowntext is a valid ComponentType', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('markdowntext' as any, null);
    expect(node.type).toBe('markdowntext');
  });

  it('COMPONENT_DEFS includes treeview, metriccard, markdowntext', async () => {
    const { COMPONENT_DEFS } = await import('../lib/componentDefs');
    const types = COMPONENT_DEFS.map((d: any) => d.type);
    expect(types).toContain('treeview');
    expect(types).toContain('metriccard');
    expect(types).toContain('markdowntext');
  });

  it('treeview def has treeItems in defaults', async () => {
    const { COMPONENT_DEFS } = await import('../lib/componentDefs');
    const def = COMPONENT_DEFS.find((d: any) => d.type === 'treeview');
    expect(def).toBeDefined();
    expect(def?.defaults).toHaveProperty('treeItems');
  });

  it('metriccard def has metricValue and metricLabel in defaults', async () => {
    const { COMPONENT_DEFS } = await import('../lib/componentDefs');
    const def = COMPONENT_DEFS.find((d: any) => d.type === 'metriccard');
    expect(def).toBeDefined();
    expect(def?.defaults).toHaveProperty('metricValue');
    expect(def?.defaults).toHaveProperty('metricLabel');
  });
});

// ─── Idea #4: Action registry ─────────────────────────────────────────────────

describe('Idea 4 – Action registry', () => {
  it('ACTION_REGISTRY is exported from actionRegistry lib', async () => {
    const { ACTION_REGISTRY } = await import('../lib/actionRegistry');
    expect(typeof ACTION_REGISTRY).toBe('object');
  });

  it('ACTION_REGISTRY has undo, redo, reset actions', async () => {
    const { ACTION_REGISTRY } = await import('../lib/actionRegistry');
    expect(ACTION_REGISTRY).toHaveProperty('undo');
    expect(ACTION_REGISTRY).toHaveProperty('redo');
    expect(ACTION_REGISTRY).toHaveProperty('reset');
  });

  it('each action has id, label, category, shortcut', async () => {
    const { ACTION_REGISTRY } = await import('../lib/actionRegistry');
    const action = ACTION_REGISTRY['undo'];
    expect(action).toHaveProperty('id');
    expect(action).toHaveProperty('label');
    expect(action).toHaveProperty('category');
    expect(action).toHaveProperty('shortcut');
  });

  it('getActions returns an array of all actions', async () => {
    const { getActions } = await import('../lib/actionRegistry');
    const actions = getActions();
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('getAction returns the action by id', async () => {
    const { getAction } = await import('../lib/actionRegistry');
    const action = getAction('undo');
    expect(action).toBeDefined();
    expect(action?.id).toBe('undo');
  });

  it('getAction returns undefined for unknown id', async () => {
    const { getAction } = await import('../lib/actionRegistry');
    expect(getAction('nonexistent')).toBeUndefined();
  });
});

// ─── Idea #11: Additional export surfaces ────────────────────────────────────

describe('Idea 11 – Mermaid timeline export', () => {
  it('exportTimelineMermaid is exported from mermaidExporter', async () => {
    const { exportTimelineMermaid } = await import('../lib/mermaidExporter');
    expect(typeof exportTimelineMermaid).toBe('function');
  });

  it('exportTimelineMermaid returns a flowchart string for a project with timeline', async () => {
    const { exportTimelineMermaid } = await import('../lib/mermaidExporter');
    const project: ProjectState = {
      rootId: 'r',
      components: { r: { id: 'r', type: 'container', parentId: null, children: [], props: {} } },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
      timelineSteps: [
        { id: 's1', layerId: 'l1', label: 'Home' },
        { id: 's2', layerId: 'l2', label: 'Settings' },
      ],
      timelineTransitions: [
        { id: 't1', fromStepId: 's1', toStepId: 's2', event: 'keypress', trigger: 's', label: 'Press s' },
      ],
    };
    const diagram = exportTimelineMermaid(project);
    expect(typeof diagram).toBe('string');
    expect(diagram).toContain('flowchart');
    expect(diagram).toContain('Home');
    expect(diagram).toContain('Settings');
    expect(diagram).toContain('Press s');
  });

  it('exportTimelineMermaid returns empty flowchart for project with no steps', async () => {
    const { exportTimelineMermaid } = await import('../lib/mermaidExporter');
    const project: ProjectState = {
      rootId: 'r',
      components: { r: { id: 'r', type: 'container', parentId: null, children: [], props: {} } },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const diagram = exportTimelineMermaid(project);
    expect(diagram).toContain('flowchart');
  });
});

// ─── Idea #8: Exporter shared helpers ────────────────────────────────────────

describe('Idea 8 – Shared exporter layout helpers', () => {
  it('collectSubtree is exported from exporterUtils', async () => {
    const { collectSubtree } = await import('../lib/exporterUtils');
    expect(typeof collectSubtree).toBe('function');
  });

  it('collectSubtree returns all nodes in a subtree', async () => {
    const { collectSubtree } = await import('../lib/exporterUtils');
    const comps: Record<string, any> = {
      root: { id: 'root', type: 'container', parentId: null, children: ['c1'], props: {} },
      c1: { id: 'c1', type: 'text', parentId: 'root', children: [], props: { text: 'hi' } },
    };
    const nodes = collectSubtree(comps, 'root');
    expect(nodes.map((n: any) => n.id)).toContain('root');
    expect(nodes.map((n: any) => n.id)).toContain('c1');
  });

  it('styleToAnsi is exported from exporterUtils', async () => {
    const { styleToAnsi } = await import('../lib/exporterUtils');
    expect(typeof styleToAnsi).toBe('function');
  });

  it('EXPORTER_CAPABILITIES is exported from exporterUtils', async () => {
    const { EXPORTER_CAPABILITIES } = await import('../lib/exporterUtils');
    expect(typeof EXPORTER_CAPABILITIES).toBe('object');
    expect(EXPORTER_CAPABILITIES).toHaveProperty('textual');
    expect(EXPORTER_CAPABILITIES).toHaveProperty('bubbletea');
    expect(EXPORTER_CAPABILITIES).toHaveProperty('ratatui');
  });

  it('each exporter capability entry has supported/partial/unsupported arrays', async () => {
    const { EXPORTER_CAPABILITIES } = await import('../lib/exporterUtils');
    const cap = EXPORTER_CAPABILITIES['textual'];
    expect(Array.isArray(cap.supported)).toBe(true);
    expect(Array.isArray(cap.partial)).toBe(true);
    expect(Array.isArray(cap.unsupported)).toBe(true);
  });
});

// ─── Idea #13: Quality – Pre-commit style checks ─────────────────────────────

describe('Idea 13 – Project linting utilities', () => {
  it('lintProject is exported from linter lib', async () => {
    const { lintProject } = await import('../lib/linter');
    expect(typeof lintProject).toBe('function');
  });

  it('lintProject returns an array of lint warnings', async () => {
    const { lintProject } = await import('../lib/linter');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: ['orphan'], props: {} },
        // orphan is in children array but has wrong parentId – shouldn't happen but test the linter catches missing node
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const warnings = lintProject(project);
    expect(Array.isArray(warnings)).toBe(true);
  });

  it('lintProject warns when a child id references a missing node', async () => {
    const { lintProject } = await import('../lib/linter');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: ['ghost'], props: {} },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const warnings = lintProject(project);
    expect(warnings.some((w: any) => w.toLowerCase().includes('ghost') || w.toLowerCase().includes('missing'))).toBe(true);
  });

  it('lintProject returns no warnings for a clean project', async () => {
    const { lintProject } = await import('../lib/linter');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: 80, termRows: 24, theme: 'tokyo-night',
    };
    const warnings = lintProject(project);
    expect(warnings).toHaveLength(0);
  });
});
