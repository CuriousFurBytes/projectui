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
