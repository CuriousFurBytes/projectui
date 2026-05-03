import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage so zustand persistence doesn't fail in node
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import { useEditor } from '../store/editorStore';

function freshStore() {
  useEditor.getState().reset();
}

describe('editorStore – addChild parent validation', () => {
  beforeEach(() => {
    freshStore();
  });

  it('refuses to add a child to a leaf node (text)', () => {
    const state = useEditor.getState();
    const textId = state.addChild(state.project.rootId, 'text');
    expect(textId).not.toBe('');

    const beforeCount = Object.keys(useEditor.getState().project.components).length;
    const result = useEditor.getState().addChild(textId, 'button');
    expect(result).toBe('');
    expect(Object.keys(useEditor.getState().project.components).length).toBe(beforeCount);
  });

  it('allows adding a child to a container', () => {
    const result = useEditor.getState().addChild(useEditor.getState().project.rootId, 'button');
    expect(result).not.toBe('');
  });
});

describe('editorStore – move parent validation', () => {
  beforeEach(() => {
    freshStore();
  });

  it('refuses to move a node into a leaf node', () => {
    const rootId = useEditor.getState().project.rootId;
    const textId = useEditor.getState().addChild(rootId, 'text');
    const btnId = useEditor.getState().addChild(rootId, 'button');

    useEditor.getState().move(btnId, textId, 0);

    const textChildren = useEditor.getState().project.components[textId]?.children ?? [];
    expect(textChildren.length).toBe(0);
  });

  it('allows moving a node into a container', () => {
    const rootId = useEditor.getState().project.rootId;
    const containerId = useEditor.getState().addChild(rootId, 'container');
    const btnId = useEditor.getState().addChild(rootId, 'button');

    useEditor.getState().move(btnId, containerId, 0);

    expect(useEditor.getState().project.components[containerId].children).toContain(btnId);
  });

  it('refuses to move a node into its own descendant (circular reference guard)', () => {
    const rootId = useEditor.getState().project.rootId;
    // root → outer → inner
    const outerId = useEditor.getState().addChild(rootId, 'container');
    const innerId = useEditor.getState().addChild(outerId, 'container');

    // Try to move outer into inner — would create a cycle
    useEditor.getState().move(outerId, innerId, 0);

    // inner should still be a child of outer, not the other way around
    const outerChildren = useEditor.getState().project.components[outerId].children;
    expect(outerChildren).toContain(innerId);
    // outer should not be a child of inner
    const innerChildren = useEditor.getState().project.components[innerId].children;
    expect(innerChildren).not.toContain(outerId);
  });
});

describe('editorStore – timeline migration and history', () => {
  beforeEach(() => {
    freshStore();
  });

  it('migrates older multi-screen projects by creating timeline steps for existing layers', () => {
    useEditor.getState().loadFromJson(JSON.stringify({
      rootId: 'root1',
      components: {
        root1: {
          id: 'root1',
          type: 'container',
          parentId: null,
          children: [],
          props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
        },
      },
      layers: [
        { id: 'layer1', name: 'Home', rootId: 'root1', components: {} },
        { id: 'layer2', name: 'Settings', rootId: 'root2', components: {} },
      ],
      activeLayerIndex: 1,
      termCols: 80,
      termRows: 24,
      theme: 'tokyo-night',
    }));

    const project = useEditor.getState().project;
    expect(project.timelineSteps).toHaveLength(2);
    expect(project.timelineSteps?.map((step) => [step.layerId, step.label])).toEqual([
      ['layer1', 'Home'],
      ['layer2', 'Settings'],
    ]);
    expect(project.timelineTransitions).toEqual([]);
    expect(project.activeLayerIndex).toBe(1);
  });

  it('supports undo and redo for timeline step changes', () => {
    const layerId = useEditor.getState().project.layers?.[0]?.id;
    expect(layerId).toBeTruthy();

    useEditor.getState().addTimelineStep(layerId!, 'Extra Step');
    expect(useEditor.getState().project.timelineSteps?.map((step) => step.label)).toContain('Extra Step');

    useEditor.getState().undo();
    expect(useEditor.getState().project.timelineSteps?.map((step) => step.label)).not.toContain('Extra Step');

    useEditor.getState().redo();
    expect(useEditor.getState().project.timelineSteps?.map((step) => step.label)).toContain('Extra Step');
  });

  it('renames default timeline labels with their layer but preserves custom step labels', () => {
    useEditor.getState().addLayer();

    const state = useEditor.getState();
    const secondLayer = state.project.layers?.[1];
    const defaultStep = state.project.timelineSteps?.find((step) => step.layerId === secondLayer?.id);
    expect(secondLayer).toBeTruthy();
    expect(defaultStep?.label).toBe('Screen 2');

    useEditor.getState().renameLayer(1, 'Login');

    let project = useEditor.getState().project;
    let renamedStep = project.timelineSteps?.find((step) => step.layerId === secondLayer?.id);
    expect(renamedStep?.label).toBe('Login');

    useEditor.getState().updateTimelineStep(renamedStep!.id, { label: 'Open modal' });
    useEditor.getState().renameLayer(1, 'Auth');

    project = useEditor.getState().project;
    renamedStep = project.timelineSteps?.find((step) => step.layerId === secondLayer?.id);
    expect(renamedStep?.label).toBe('Open modal');
  });
});
