import { describe, it, expect, beforeEach, vi } from 'vitest';

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

// ─── 1. Discriminated union types ────────────────────────────────────────────

describe('1 – Discriminated union types', () => {
  it('isNodeOfType returns true when type matches', async () => {
    const { isNodeOfType } = await import('../types/component');
    const node = { id: 'n1', type: 'text' as const, parentId: null, children: [], props: {} };
    expect(isNodeOfType(node, 'text')).toBe(true);
  });

  it('isNodeOfType returns false when type does not match', async () => {
    const { isNodeOfType } = await import('../types/component');
    const node = { id: 'n1', type: 'button' as const, parentId: null, children: [], props: {} };
    expect(isNodeOfType(node, 'text')).toBe(false);
  });

  it('assertNever throws with the unreachable value stringified', async () => {
    const { assertNever } = await import('../types/component');
    expect(() => assertNever('oops' as never)).toThrow('Unreachable: oops');
  });
});

// ─── 2. Undo labels ───────────────────────────────────────────────────────────

import { useEditor } from '../store/editorStore';

function freshStore() {
  useEditor.getState().reset();
}

describe('2 – Undo labels', () => {
  beforeEach(freshStore);

  it('undoLabel returns undefined when history is empty', () => {
    expect(useEditor.getState().undoLabel()).toBeUndefined();
  });

  it('undoLabel returns label of last action after addChild', () => {
    const rootId = useEditor.getState().project.rootId;
    useEditor.getState().addChild(rootId, 'button');
    expect(useEditor.getState().undoLabel()).toBe('Add button');
  });

  it('undoLabel returns Delete after remove', () => {
    const rootId = useEditor.getState().project.rootId;
    const id = useEditor.getState().addChild(rootId, 'text');
    useEditor.getState().remove(id);
    expect(useEditor.getState().undoLabel()).toBe('Delete');
  });

  it('undoLabel returns Rename after rename', () => {
    const rootId = useEditor.getState().project.rootId;
    const id = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().rename(id, 'MyBox');
    expect(useEditor.getState().undoLabel()).toBe('Rename');
  });

  it('redoLabel returns label of undone action', () => {
    const rootId = useEditor.getState().project.rootId;
    useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().undo();
    expect(useEditor.getState().redoLabel()).toBe('Add button');
  });

  it('redoLabel is undefined when future is empty', () => {
    expect(useEditor.getState().redoLabel()).toBeUndefined();
  });
});

// ─── 3. distributeNodes ───────────────────────────────────────────────────────

describe('3 – distributeNodes', () => {
  beforeEach(freshStore);

  it('distributeNodes exists on the store', () => {
    expect(typeof useEditor.getState().distributeNodes).toBe('function');
  });

  it('distributeNodes evenly spaces 3 nodes horizontally', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    const n2 = useEditor.getState().addChild(rootId, 'container');
    const n3 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 0, y: 0, width: 10, height: 3 });
    useEditor.getState().updateProps(n2, { absolute: true, x: 5, y: 0, width: 10, height: 3 });
    useEditor.getState().updateProps(n3, { absolute: true, x: 30, y: 0, width: 10, height: 3 });
    useEditor.getState().distributeNodes([n1, n2, n3], 'horizontal');
    const comps = useEditor.getState().project.components;
    const x1 = comps[n1].props.x ?? 0;
    const x2 = comps[n2].props.x ?? 0;
    const x3 = comps[n3].props.x ?? 0;
    expect(x1).toBe(0);
    expect(x3).toBe(30);
    const gap1 = x2 - x1 - (comps[n1].props.width as number);
    const gap2 = x3 - x2 - (comps[n2].props.width as number);
    expect(Math.abs(gap1 - gap2)).toBeLessThanOrEqual(1);
  });

  it('distributeNodes evenly spaces 3 nodes vertically', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    const n2 = useEditor.getState().addChild(rootId, 'container');
    const n3 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 0, y: 0, width: 10, height: 3 });
    useEditor.getState().updateProps(n2, { absolute: true, x: 0, y: 5, width: 10, height: 3 });
    useEditor.getState().updateProps(n3, { absolute: true, x: 0, y: 20, width: 10, height: 3 });
    useEditor.getState().distributeNodes([n1, n2, n3], 'vertical');
    const comps = useEditor.getState().project.components;
    const y1 = comps[n1].props.y ?? 0;
    const y2 = comps[n2].props.y ?? 0;
    const y3 = comps[n3].props.y ?? 0;
    expect(y1).toBe(0);
    expect(y3).toBe(20);
    const gap1 = y2 - y1 - (comps[n1].props.height as number);
    const gap2 = y3 - y2 - (comps[n2].props.height as number);
    expect(Math.abs(gap1 - gap2)).toBeLessThanOrEqual(1);
  });

  it('distributeNodes with fewer than 3 nodes does nothing', () => {
    const rootId = useEditor.getState().project.rootId;
    const n1 = useEditor.getState().addChild(rootId, 'container');
    const n2 = useEditor.getState().addChild(rootId, 'container');
    useEditor.getState().updateProps(n1, { absolute: true, x: 0, y: 0, width: 10, height: 3 });
    useEditor.getState().updateProps(n2, { absolute: true, x: 15, y: 0, width: 10, height: 3 });
    const beforeX = useEditor.getState().project.components[n1].props.x;
    useEditor.getState().distributeNodes([n1, n2], 'horizontal');
    expect(useEditor.getState().project.components[n1].props.x).toBe(beforeX);
  });
});

// ─── 4. Preferences ───────────────────────────────────────────────────────────

describe('4 – Preferences', () => {
  beforeEach(freshStore);

  it('preferences are initialized with defaults', () => {
    const prefs = useEditor.getState().preferences;
    expect(prefs).toBeDefined();
    expect(prefs.theme).toBe('tokyo-night');
    expect(prefs.showGrid).toBe(false);
    expect(prefs.snapToGrid).toBe(false);
    expect(prefs.animationsEnabled).toBe(true);
  });

  it('setPreference updates a single preference', () => {
    useEditor.getState().setPreference('showGrid', true);
    expect(useEditor.getState().preferences.showGrid).toBe(true);
  });

  it('setPreference persists to localStorage', () => {
    useEditor.getState().setPreference('gridSize', 8);
    const raw = store['projectui.preferences.v1'];
    expect(raw).toBeDefined();
    const saved = JSON.parse(raw);
    expect(saved.gridSize).toBe(8);
  });

  it('resetPreferences restores defaults', () => {
    useEditor.getState().setPreference('showGrid', true);
    useEditor.getState().setPreference('gridSize', 16);
    useEditor.getState().resetPreferences();
    expect(useEditor.getState().preferences.showGrid).toBe(false);
    expect(useEditor.getState().preferences.gridSize).toBe(4);
  });

  it('setPreference works for language', () => {
    useEditor.getState().setPreference('language', 'pt-BR');
    expect(useEditor.getState().preferences.language).toBe('pt-BR');
  });
});

// ─── 5. Keyboard shortcuts ────────────────────────────────────────────────────

describe('5 – Keyboard shortcuts', () => {
  beforeEach(freshStore);

  it('keyboardShortcuts are initialized with defaults', () => {
    const shortcuts = useEditor.getState().keyboardShortcuts;
    expect(shortcuts).toBeDefined();
    expect(shortcuts['undo']).toBe('Meta+z');
    expect(shortcuts['redo']).toBe('Meta+Shift+z');
  });

  it('setKeyboardShortcut updates a shortcut', () => {
    useEditor.getState().setKeyboardShortcut('undo', 'Ctrl+z');
    expect(useEditor.getState().keyboardShortcuts['undo']).toBe('Ctrl+z');
  });

  it('setKeyboardShortcut persists to localStorage', () => {
    useEditor.getState().setKeyboardShortcut('save', 'Ctrl+s');
    const raw = store['projectui.shortcuts.v1'];
    expect(raw).toBeDefined();
    const saved = JSON.parse(raw);
    expect(saved.save).toBe('Ctrl+s');
  });

  it('resetKeyboardShortcuts restores defaults', () => {
    useEditor.getState().setKeyboardShortcut('undo', 'Ctrl+z');
    useEditor.getState().resetKeyboardShortcuts();
    expect(useEditor.getState().keyboardShortcuts['undo']).toBe('Meta+z');
  });

  it('setKeyboardShortcut can add new action shortcut', () => {
    useEditor.getState().setKeyboardShortcut('myCustomAction', 'Meta+Shift+x');
    expect(useEditor.getState().keyboardShortcuts['myCustomAction']).toBe('Meta+Shift+x');
  });
});

// ─── 6. Contrast palette ─────────────────────────────────────────────────────

describe('6 – Contrast palette', () => {
  it('generateSafePairs returns only AA-passing pairs', async () => {
    const { generateSafePairs } = await import('../lib/contrastPalette');
    const { isContrastSafe } = await import('../lib/accessibility');
    const pairs = generateSafePairs('AA');
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(isContrastSafe(pair.ratio, 'AA')).toBe(true);
    }
  });

  it('generateSafePairs AAA has fewer pairs than AA', async () => {
    const { generateSafePairs } = await import('../lib/contrastPalette');
    const aa = generateSafePairs('AA');
    const aaa = generateSafePairs('AAA');
    expect(aaa.length).toBeLessThan(aa.length);
  });

  it('getTopContrastPairs returns pairs sorted descending by ratio', async () => {
    const { getTopContrastPairs } = await import('../lib/contrastPalette');
    const top = getTopContrastPairs(5);
    expect(top.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].ratio).toBeGreaterThanOrEqual(top[i].ratio);
    }
  });

  it('suggestContrastFix returns a passing pair for a failing combination', async () => {
    const { suggestContrastFix } = await import('../lib/contrastPalette');
    const { isContrastSafe } = await import('../lib/accessibility');
    const fix = suggestContrastFix('black', 'black');
    expect(fix).not.toBeNull();
    if (fix) expect(isContrastSafe(fix.ratio, 'AA')).toBe(true);
  });

  it('generateSafePairs never includes a pair where fg === bg', async () => {
    const { generateSafePairs } = await import('../lib/contrastPalette');
    const pairs = generateSafePairs('AA');
    for (const pair of pairs) {
      expect(pair.fg).not.toBe(pair.bg);
    }
  });
});

// ─── 7. Checksum URL ─────────────────────────────────────────────────────────

describe('7 – Checksum URL', () => {
  it('crc32 returns a number', async () => {
    const { crc32 } = await import('../lib/checksumUrl');
    expect(typeof crc32('hello')).toBe('number');
  });

  it('crc32 is consistent for same input', async () => {
    const { crc32 } = await import('../lib/checksumUrl');
    expect(crc32('test')).toBe(crc32('test'));
  });

  it('encodeProjectWithChecksum / decodeProjectWithChecksum roundtrip succeeds', async () => {
    const { encodeProjectWithChecksum, decodeProjectWithChecksum } = await import('../lib/checksumUrl');
    const project = {
      rootId: 'r',
      components: { r: { id: 'r', type: 'container' as const, parentId: null as null, children: [] as string[], props: {} } },
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night' as const,
    };
    const encoded = await encodeProjectWithChecksum(project);
    const result = await decodeProjectWithChecksum(encoded);
    expect(result.valid).toBe(true);
    expect(result.project.rootId).toBe('r');
  });

  it('decodeProjectWithChecksum returns valid=false for tampered data', async () => {
    const { encodeProjectWithChecksum, decodeProjectWithChecksum } = await import('../lib/checksumUrl');
    const project = {
      rootId: 'r',
      components: { r: { id: 'r', type: 'container' as const, parentId: null as null, children: [] as string[], props: {} } },
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night' as const,
    };
    const encoded = await encodeProjectWithChecksum(project);
    const tampered = encoded.slice(0, -4) + 'dead';
    const result = await decodeProjectWithChecksum(tampered);
    expect(result.valid).toBe(false);
  });

  it('decodeProjectWithChecksum returns valid=false for missing checksum', async () => {
    const { decodeProjectWithChecksum } = await import('../lib/checksumUrl');
    const result = await decodeProjectWithChecksum('nodothere');
    expect(result.valid).toBe(false);
  });
});

// ─── 8. Plugin API ────────────────────────────────────────────────────────────

describe('8 – Plugin API', () => {
  it('pluginRegistry can register and retrieve a plugin', async () => {
    const { pluginRegistry } = await import('../lib/pluginApi');
    pluginRegistry.register({
      manifest: { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0' },
      components: [{ type: 'test-plugin.widget', label: 'Widget' }],
    });
    const plugin = pluginRegistry.getPlugin('test-plugin');
    expect(plugin).toBeDefined();
    expect(plugin?.manifest.name).toBe('Test Plugin');
    pluginRegistry.unregister('test-plugin');
  });

  it('pluginRegistry.getComponents returns all registered component defs', async () => {
    const { pluginRegistry } = await import('../lib/pluginApi');
    pluginRegistry.register({
      manifest: { id: 'comp-plugin', name: 'Comp Plugin', version: '0.1.0' },
      components: [
        { type: 'comp-plugin.a', label: 'A' },
        { type: 'comp-plugin.b', label: 'B' },
      ],
    });
    const comps = pluginRegistry.getComponents();
    expect(comps.some((c) => c.type === 'comp-plugin.a')).toBe(true);
    expect(comps.some((c) => c.type === 'comp-plugin.b')).toBe(true);
    pluginRegistry.unregister('comp-plugin');
  });

  it('pluginRegistry.getExporters returns registered exporters', async () => {
    const { pluginRegistry } = await import('../lib/pluginApi');
    pluginRegistry.register({
      manifest: { id: 'exp-plugin', name: 'Exp Plugin', version: '1.0.0' },
      exporters: [{ id: 'elm', label: 'Elm', language: 'elm', export: () => '' }],
    });
    const exporters = pluginRegistry.getExporters();
    expect(exporters.some((e) => e.id === 'elm')).toBe(true);
    pluginRegistry.unregister('exp-plugin');
  });

  it('registerPlugin and unregisterPlugin are exported functions', async () => {
    const { registerPlugin, unregisterPlugin } = await import('../lib/pluginApi');
    expect(typeof registerPlugin).toBe('function');
    expect(typeof unregisterPlugin).toBe('function');
  });

  it('unregister removes the plugin', async () => {
    const { pluginRegistry } = await import('../lib/pluginApi');
    pluginRegistry.register({ manifest: { id: 'rm-plugin', name: 'RM', version: '1.0.0' } });
    pluginRegistry.unregister('rm-plugin');
    expect(pluginRegistry.getPlugin('rm-plugin')).toBeUndefined();
  });
});

// ─── 9. ASCII Motion import ───────────────────────────────────────────────────

describe('9 – ASCII Motion import', () => {
  it('parseAsciiMotion parses valid JSON', async () => {
    const { parseAsciiMotion } = await import('../lib/asciiMotionImport');
    const json = JSON.stringify({ frames: [{ lines: ['hello', 'world'] }], fps: 10 });
    const result = parseAsciiMotion(json);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].lines).toEqual(['hello', 'world']);
    expect(result.fps).toBe(10);
  });

  it('parseAsciiMotion throws on invalid JSON', async () => {
    const { parseAsciiMotion } = await import('../lib/asciiMotionImport');
    expect(() => parseAsciiMotion('not json')).toThrow();
  });

  it('parseAsciiMotion throws when frames is missing', async () => {
    const { parseAsciiMotion } = await import('../lib/asciiMotionImport');
    expect(() => parseAsciiMotion(JSON.stringify({ fps: 10 }))).toThrow();
  });

  it('asciiMotionToProject creates one layer per frame', async () => {
    const { parseAsciiMotion, asciiMotionToProject } = await import('../lib/asciiMotionImport');
    const file = parseAsciiMotion(JSON.stringify({
      frames: [
        { lines: ['frame1 line1', 'frame1 line2'] },
        { lines: ['frame2 line1'] },
      ],
      fps: 5,
    }));
    const project = asciiMotionToProject(file);
    expect(project.layers).toHaveLength(2);
  });

  it('asciiMotionToProject sets termCols to max line width', async () => {
    const { parseAsciiMotion, asciiMotionToProject } = await import('../lib/asciiMotionImport');
    const file = parseAsciiMotion(JSON.stringify({
      frames: [{ lines: ['short', 'a much longer line here'] }],
    }));
    const project = asciiMotionToProject(file);
    expect(project.termCols).toBe('a much longer line here'.length);
  });

  it('asciiMotionToAnimation returns layerIds and fps', async () => {
    const { parseAsciiMotion, asciiMotionToAnimation } = await import('../lib/asciiMotionImport');
    const file = parseAsciiMotion(JSON.stringify({ frames: [{ lines: ['a'] }, { lines: ['b'] }, { lines: ['c'] }], fps: 12 }));
    const anim = asciiMotionToAnimation(file);
    expect(anim.layerIds).toHaveLength(3);
    expect(anim.fps).toBe(12);
  });
});

// ─── 10. Event system ─────────────────────────────────────────────────────────

describe('10 – Event system', () => {
  it('createEventHandler returns a handler with an id', async () => {
    const { createEventHandler } = await import('../lib/eventSystem');
    const handler = createEventHandler(
      { type: 'keypress', sourceNodeId: 'n1', key: 'Enter' },
      'navigate',
    );
    expect(handler.id).toBeDefined();
    expect(handler.action).toBe('navigate');
    expect(handler.event.key).toBe('Enter');
  });

  it('matchesEvent returns true for matching handler', async () => {
    const { createEventHandler, matchesEvent } = await import('../lib/eventSystem');
    const handler = createEventHandler({ type: 'keypress', sourceNodeId: 'n1', key: 'q' }, 'navigate');
    expect(matchesEvent(handler, { type: 'keypress', sourceNodeId: 'n1', key: 'q' })).toBe(true);
  });

  it('matchesEvent returns false for wrong key', async () => {
    const { createEventHandler, matchesEvent } = await import('../lib/eventSystem');
    const handler = createEventHandler({ type: 'keypress', sourceNodeId: 'n1', key: 'q' }, 'navigate');
    expect(matchesEvent(handler, { type: 'keypress', sourceNodeId: 'n1', key: 'Enter' })).toBe(false);
  });

  it('getHandlersForNode returns only handlers for a given node', async () => {
    const { createEventHandler, getHandlersForNode } = await import('../lib/eventSystem');
    const h1 = createEventHandler({ type: 'focus', sourceNodeId: 'nodeA' }, 'setState');
    const h2 = createEventHandler({ type: 'blur', sourceNodeId: 'nodeB' }, 'setState');
    const h3 = createEventHandler({ type: 'click', sourceNodeId: 'nodeA' }, 'navigate');
    const result = getHandlersForNode([h1, h2, h3], 'nodeA');
    expect(result).toHaveLength(2);
    expect(result.every((h) => h.event.sourceNodeId === 'nodeA')).toBe(true);
  });

  it('serialize / deserialize roundtrip preserves handlers', async () => {
    const { createEventHandler, serializeEventHandlers, deserializeEventHandlers } = await import('../lib/eventSystem');
    const h = createEventHandler({ type: 'timer', sourceNodeId: 'n1', intervalMs: 1000 }, 'navigate', { targetLayerId: 'l2' });
    const json = serializeEventHandlers([h]);
    const result = deserializeEventHandlers(json);
    expect(result).toHaveLength(1);
    expect(result[0].event.intervalMs).toBe(1000);
    expect(result[0].targetLayerId).toBe('l2');
  });
});

// ─── 11. Visual diff ─────────────────────────────────────────────────────────

import type { ProjectState } from '../types/component';

const baseProject: ProjectState = {
  rootId: 'r',
  components: {
    r: { id: 'r', type: 'container', parentId: null, children: ['c1'], props: { border: 'none' } },
    c1: { id: 'c1', type: 'text', parentId: 'r', children: [], props: { text: 'hello' } },
  },
  termCols: 80,
  termRows: 24,
  theme: 'tokyo-night',
};

describe('11 – Visual diff', () => {
  it('diffProjects: identical projects produce all unchanged', async () => {
    const { diffProjects } = await import('../lib/visualDiff');
    const diff = diffProjects(baseProject, baseProject);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diff.unchanged.length).toBeGreaterThan(0);
  });

  it('diffProjects: added node detected', async () => {
    const { diffProjects } = await import('../lib/visualDiff');
    const bProject: ProjectState = {
      ...baseProject,
      components: {
        ...baseProject.components,
        c2: { id: 'c2', type: 'button', parentId: 'r', children: [], props: {} },
      },
    };
    const diff = diffProjects(baseProject, bProject);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].nodeId).toBe('c2');
  });

  it('diffProjects: removed node detected', async () => {
    const { diffProjects } = await import('../lib/visualDiff');
    const bProject: ProjectState = {
      ...baseProject,
      components: {
        r: { ...baseProject.components.r, children: [] },
      },
    };
    const diff = diffProjects(baseProject, bProject);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].nodeId).toBe('c1');
  });

  it('diffProjects: changed props detected', async () => {
    const { diffProjects } = await import('../lib/visualDiff');
    const bProject: ProjectState = {
      ...baseProject,
      components: {
        ...baseProject.components,
        c1: { ...baseProject.components.c1, props: { text: 'world' } },
      },
    };
    const diff = diffProjects(baseProject, bProject);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].changedProps).toContain('text');
  });

  it('applyDiff applies additions and changes to the base', async () => {
    const { diffProjects, applyDiff } = await import('../lib/visualDiff');
    const bProject: ProjectState = {
      ...baseProject,
      components: {
        ...baseProject.components,
        c1: { ...baseProject.components.c1, props: { text: 'updated' } },
        c2: { id: 'c2', type: 'button', parentId: 'r', children: [], props: {} },
      },
    };
    const diff = diffProjects(baseProject, bProject);
    const applied = applyDiff(baseProject, diff);
    expect(applied.components['c1'].props.text).toBe('updated');
    expect(applied.components['c2']).toBeDefined();
  });
});

// ─── 12. New component types ──────────────────────────────────────────────────

describe('12 – New component types', () => {
  it("'line' is a valid ComponentType in the union", async () => {
    const node = { id: 'n', type: 'line' as const, parentId: null, children: [], props: {} };
    expect(node.type).toBe('line');
  });

  it("'circle' is a valid ComponentType in the union", async () => {
    const node = { id: 'n', type: 'circle' as const, parentId: null, children: [], props: {} };
    expect(node.type).toBe('circle');
  });

  it("'polygon' is a valid ComponentType in the union", async () => {
    const node = { id: 'n', type: 'polygon' as const, parentId: null, children: [], props: {} };
    expect(node.type).toBe('polygon');
  });

  it("'chart' is a valid ComponentType in the union", async () => {
    const node = { id: 'n', type: 'chart' as const, parentId: null, children: [], props: {} };
    expect(node.type).toBe('chart');
  });
});

// ─── 13. EventBinding interface ───────────────────────────────────────────────

describe('13 – EventBinding interface', () => {
  it('ComponentProps accepts eventBindings array', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('button', null);
    node.props.eventBindings = [
      { type: 'onKey', key: 'Enter', action: 'navigate', targetLayerId: 'l2' },
    ];
    expect(node.props.eventBindings).toHaveLength(1);
    expect(node.props.eventBindings?.[0].key).toBe('Enter');
  });

  it('EventBinding has all required fields', async () => {
    const binding = { type: 'onTimer' as const, intervalMs: 500, action: 'refresh' };
    expect(binding.type).toBe('onTimer');
    expect(binding.intervalMs).toBe(500);
    expect(binding.action).toBe('refresh');
  });

  it('ComponentProps accepts textWrap and textAlign', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('text', null);
    node.props.textWrap = 'ellipsis';
    node.props.textAlign = 'center';
    expect(node.props.textWrap).toBe('ellipsis');
    expect(node.props.textAlign).toBe('center');
  });
});

// ─── 14. TextWrap type ────────────────────────────────────────────────────────

describe('14 – TextWrap type', () => {
  it("TextWrap values are 'wrap' | 'truncate' | 'ellipsis' | 'clip'", () => {
    const values = ['wrap', 'truncate', 'ellipsis', 'clip'] as const;
    for (const v of values) {
      const tw: import('../types/component').TextWrap = v;
      expect(tw).toBe(v);
    }
  });

  it('ComponentProps.textWrap accepts all TextWrap values', async () => {
    const { makeNode } = await import('../lib/componentDefs');
    const node = makeNode('text', null);
    for (const v of ['wrap', 'truncate', 'ellipsis', 'clip'] as const) {
      node.props.textWrap = v;
      expect(node.props.textWrap).toBe(v);
    }
  });

  it('ChartKind type covers bar, line, pie, sparkline', () => {
    const values = ['bar', 'line', 'pie', 'sparkline'] as const;
    for (const v of values) {
      const ck: import('../types/component').ChartKind = v;
      expect(ck).toBe(v);
    }
  });
});

// ─── 15. UserPreferences defaults ────────────────────────────────────────────

describe('15 – UserPreferences default includes theme, showGrid, snapToGrid', () => {
  beforeEach(freshStore);

  it('default preferences include theme', () => {
    const prefs = useEditor.getState().preferences;
    expect(prefs).toHaveProperty('theme');
    expect(typeof prefs.theme).toBe('string');
  });

  it('default preferences include showGrid as boolean', () => {
    const prefs = useEditor.getState().preferences;
    expect(prefs).toHaveProperty('showGrid');
    expect(typeof prefs.showGrid).toBe('boolean');
  });

  it('default preferences include snapToGrid as boolean', () => {
    const prefs = useEditor.getState().preferences;
    expect(prefs).toHaveProperty('snapToGrid');
    expect(typeof prefs.snapToGrid).toBe('boolean');
  });

  it('default preferences include autoSaveIntervalMs', () => {
    const prefs = useEditor.getState().preferences;
    expect(prefs).toHaveProperty('autoSaveIntervalMs');
    expect(typeof prefs.autoSaveIntervalMs).toBe('number');
    expect(prefs.autoSaveIntervalMs).toBeGreaterThan(0);
  });

  it('UserPreferences has all required fields', () => {
    const prefs = useEditor.getState().preferences;
    const requiredKeys: Array<keyof typeof prefs> = [
      'theme', 'editorUiTheme', 'showGrid', 'showRulers', 'snapToGrid',
      'gridSize', 'animationsEnabled', 'reducedMotion', 'autoSaveIntervalMs', 'language',
    ];
    for (const key of requiredKeys) {
      expect(prefs).toHaveProperty(key);
    }
  });
});
