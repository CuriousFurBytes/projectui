// TDD test suite for 17 new features.
// Run vitest to see all tests fail first, then implement the features.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import { BOX } from '../renderer/boxStyles';
import { render } from '../renderer/render';
import { useEditor } from '../store/editorStore';
import { exportBubbleTea } from '../exporters/bubbleTeaExporter';
import { exportTextual } from '../exporters/textualExporter';
import type { ProjectState, TimelineStep, TimelineTransition } from '../types/component';

function freshStore() {
  useEditor.getState().reset();
}

// ─── A-K: ASCII border style ─────────────────────────────────────────────────

describe('A-K: ASCII border style', () => {
  it('BOX has an ascii key with + - | characters', () => {
    expect(BOX).toHaveProperty('ascii');
    expect(BOX.ascii.tl).toBe('+');
    expect(BOX.ascii.tr).toBe('+');
    expect(BOX.ascii.bl).toBe('+');
    expect(BOX.ascii.br).toBe('+');
    expect(BOX.ascii.h).toBe('-');
    expect(BOX.ascii.v).toBe('|');
  });

  it('renders a container with ascii border using + and - characters', () => {
    const project: ProjectState = {
      rootId: 'root',
      components: {
        root: {
          id: 'root',
          type: 'container',
          parentId: null,
          children: [],
          props: { border: 'ascii', width: 10, height: 5, padding: 0 },
        },
      },
      termCols: 10,
      termRows: 5,
      theme: 'tokyo-night',
    };
    const result = render(project);
    expect(result.grid[0][0].ch).toBe('+');
    expect(result.grid[0][9].ch).toBe('+');
    expect(result.grid[4][0].ch).toBe('+');
    expect(result.grid[4][9].ch).toBe('+');
    expect(result.grid[0][1].ch).toBe('-');
    expect(result.grid[2][0].ch).toBe('|');
  });
});

// ─── B-21: Duplicate layer ────────────────────────────────────────────────────

describe('B-21: Duplicate layer', () => {
  beforeEach(freshStore);

  it('duplicateLayer exists on the store', () => {
    expect(typeof useEditor.getState().duplicateLayer).toBe('function');
  });

  it('duplicating a layer creates a new layer with cloned components', () => {
    const state = useEditor.getState();
    const before = state.project.layers?.length ?? 0;
    state.duplicateLayer(0);
    const after = useEditor.getState().project.layers?.length ?? 0;
    expect(after).toBe(before + 1);
  });

  it('duplicate layer has a new id and a modified name', () => {
    useEditor.getState().duplicateLayer(0);
    const layers = useEditor.getState().project.layers ?? [];
    const original = layers[0];
    const copy = layers[layers.length - 1];
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).not.toBe(original.name);
  });

  it('duplicating a layer is undoable', () => {
    const before = useEditor.getState().project.layers?.length ?? 0;
    useEditor.getState().duplicateLayer(0);
    useEditor.getState().undo();
    expect(useEditor.getState().project.layers?.length).toBe(before);
  });

  it('adds a timeline step for the duplicated layer', () => {
    const stepsBefore = useEditor.getState().project.timelineSteps?.length ?? 0;
    useEditor.getState().duplicateLayer(0);
    const stepsAfter = useEditor.getState().project.timelineSteps?.length ?? 0;
    expect(stepsAfter).toBe(stepsBefore + 1);
  });
});

// ─── A-I: Copy / Paste component ─────────────────────────────────────────────

describe('A-I: Copy/paste component', () => {
  beforeEach(freshStore);

  it('copyNode and pasteNode exist on the store', () => {
    expect(typeof useEditor.getState().copyNode).toBe('function');
    expect(typeof useEditor.getState().pasteNode).toBe('function');
  });

  it('copyNode stores a node id in clipboard state', () => {
    const state = useEditor.getState();
    const btnId = state.addChild(state.project.rootId, 'button');
    state.copyNode(btnId);
    expect(useEditor.getState().clipboardId).toBe(btnId);
  });

  it('pasteNode clones the copied subtree into the given parent', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().copyNode(btnId);
    const newId = useEditor.getState().pasteNode(rootId);
    expect(newId).not.toBe('');
    expect(newId).not.toBe(btnId);
    const components = useEditor.getState().project.components;
    expect(components[newId]).toBeDefined();
    expect(components[newId].type).toBe('button');
  });

  it('pasteNode is undoable', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().copyNode(btnId);
    const newId = useEditor.getState().pasteNode(rootId);
    expect(useEditor.getState().project.components[newId]).toBeDefined();
    useEditor.getState().undo();
    expect(useEditor.getState().project.components[newId]).toBeUndefined();
  });

  it('pasteNode returns empty string if no clipboard', () => {
    const rootId = useEditor.getState().project.rootId;
    // Ensure no clipboard
    (useEditor.getState() as any).clipboardId = null;
    const result = useEditor.getState().pasteNode(rootId);
    expect(result).toBe('');
  });
});

// ─── A-E: Multi-select ───────────────────────────────────────────────────────

describe('A-E: Multi-select', () => {
  beforeEach(freshStore);

  it('selectedIds exists on the store as a Set', () => {
    const state = useEditor.getState();
    expect(state.selectedIds).toBeInstanceOf(Set);
  });

  it('toggleSelectId adds an id to selectedIds', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().toggleSelectId(btnId);
    expect(useEditor.getState().selectedIds.has(btnId)).toBe(true);
  });

  it('toggleSelectId removes an already-selected id', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().toggleSelectId(btnId);
    useEditor.getState().toggleSelectId(btnId);
    expect(useEditor.getState().selectedIds.has(btnId)).toBe(false);
  });

  it('clearMultiSelect empties selectedIds', () => {
    const rootId = useEditor.getState().project.rootId;
    const btnId = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().toggleSelectId(btnId);
    useEditor.getState().clearMultiSelect();
    expect(useEditor.getState().selectedIds.size).toBe(0);
  });

  it('removeSelected deletes all nodes in selectedIds', () => {
    const rootId = useEditor.getState().project.rootId;
    const btn1 = useEditor.getState().addChild(rootId, 'button');
    const btn2 = useEditor.getState().addChild(rootId, 'button');
    useEditor.getState().toggleSelectId(btn1);
    useEditor.getState().toggleSelectId(btn2);
    useEditor.getState().removeSelected();
    const comps = useEditor.getState().project.components;
    expect(comps[btn1]).toBeUndefined();
    expect(comps[btn2]).toBeUndefined();
  });
});

// ─── A-H: Timeline routing in exporters ─────────────────────────────────────

describe('A-H: Timeline transitions exported as routing code', () => {
  const makeProjectWithTransitions = (): ProjectState => {
    const layer1 = { id: 'l1', name: 'Home', rootId: 'r1', components: {
      r1: { id: 'r1', type: 'container' as const, parentId: null, children: [], props: { direction: 'column' as const, width: 'fill' as const, height: 'fill' as const, border: 'none' as const, padding: 0 } },
    }};
    const layer2 = { id: 'l2', name: 'Settings', rootId: 'r2', components: {
      r2: { id: 'r2', type: 'container' as const, parentId: null, children: [], props: { direction: 'column' as const, width: 'fill' as const, height: 'fill' as const, border: 'none' as const, padding: 0 } },
    }};
    const step1: TimelineStep = { id: 's1', layerId: 'l1', label: 'Home' };
    const step2: TimelineStep = { id: 's2', layerId: 'l2', label: 'Settings' };
    const trans: TimelineTransition = { id: 't1', fromStepId: 's1', toStepId: 's2', event: 'keypress', trigger: 's' };
    return {
      rootId: 'r1',
      components: layer1.components,
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
      layers: [layer1, layer2],
      activeLayerIndex: 0,
      timelineSteps: [step1, step2],
      timelineTransitions: [trans],
    };
  };

  it('BubbleTea exporter includes screen routing when transitions exist', () => {
    const project = makeProjectWithTransitions();
    const code = exportBubbleTea(project);
    expect(code).toContain('Home');
    expect(code).toContain('Settings');
    // Should include key handling routing
    expect(code).toContain('"s"');
  });

  it('Textual exporter includes screen routing when transitions exist', () => {
    const project = makeProjectWithTransitions();
    const code = exportTextual(project);
    expect(code).toContain('Home');
    expect(code).toContain('Settings');
  });
});

// ─── A-B: Ratatui exporter ──────────────────────────────────────────────────

describe('A-B: Ratatui exporter', () => {
  it('exports valid Rust with ratatui imports', async () => {
    const { exportRatatui } = await import('../exporters/ratauiExporter');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: [], props: { direction: 'column', width: 'fill', height: 'fill', border: 'single', padding: 1 } },
      },
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
    };
    const code = exportRatatui(project);
    expect(code).toContain('ratatui');
    expect(code).toContain('fn main');
    expect(code).toContain('Terminal');
  });

  it('includes a text widget for text nodes', async () => {
    const { exportRatatui } = await import('../exporters/ratauiExporter');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: ['t1'], props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 } },
        t1: { id: 't1', type: 'text', parentId: 'r', children: [], props: { text: 'Hello ratatui' } },
      },
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
    };
    const code = exportRatatui(project);
    expect(code).toContain('Hello ratatui');
  });
});

// ─── A-F: Share URL ──────────────────────────────────────────────────────────

describe('A-F: Share URL utility', () => {
  it('encodeProject and decodeProject are exported', async () => {
    const mod = await import('../lib/shareUrl');
    expect(typeof mod.encodeProject).toBe('function');
    expect(typeof mod.decodeProject).toBe('function');
  });

  it('round-trips a project through encode/decode', async () => {
    const { encodeProject, decodeProject } = await import('../lib/shareUrl');
    const project: ProjectState = {
      rootId: 'r',
      components: {
        r: { id: 'r', type: 'container', parentId: null, children: [], props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 } },
      },
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
    };
    const encoded = await encodeProject(project);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    const decoded = await decodeProject(encoded);
    expect(decoded.rootId).toBe('r');
    expect(decoded.termCols).toBe(80);
  });
});
