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
  useEditor.setState(useEditor.getInitialState ? useEditor.getInitialState() : useEditor.getState());
  // Reset to a clean initial project by calling reset()
  useEditor.getState().reset();
}

describe('editorStore – addChild parent validation', () => {
  beforeEach(() => {
    freshStore();
  });

  it('refuses to add a child to a leaf node (text)', () => {
    const state = useEditor.getState();
    const root = state.project.components[state.project.rootId];
    // Find or add a text node
    const textId = state.addChild(state.project.rootId, 'text');
    expect(textId).not.toBe('');

    const beforeCount = Object.keys(useEditor.getState().project.components).length;
    // Try to add a child to a text node (leaf) — should be rejected
    const result = useEditor.getState().addChild(textId, 'button');
    expect(result).toBe('');
    const afterCount = Object.keys(useEditor.getState().project.components).length;
    expect(afterCount).toBe(beforeCount);
    void root;
  });

  it('allows adding a child to a container', () => {
    const state = useEditor.getState();
    const result = state.addChild(state.project.rootId, 'button');
    expect(result).not.toBe('');
  });
});

describe('editorStore – move parent validation', () => {
  beforeEach(() => {
    freshStore();
  });

  it('refuses to move a node into a leaf node', () => {
    const state = useEditor.getState();
    const rootId = state.project.rootId;

    // Add two children to root
    const textId = state.addChild(rootId, 'text');
    const btnId = useEditor.getState().addChild(rootId, 'button');

    const beforeChildren = useEditor.getState().project.components[textId].children;
    expect(beforeChildren.length).toBe(0);

    // Try to move button into text (leaf — should be rejected)
    useEditor.getState().move(btnId, textId, 0);

    const afterChildren = useEditor.getState().project.components[textId]?.children ?? [];
    expect(afterChildren.length).toBe(0);
  });

  it('allows moving a node into a container', () => {
    const state = useEditor.getState();
    const rootId = state.project.rootId;

    const containerId = state.addChild(rootId, 'container');
    const btnId = useEditor.getState().addChild(rootId, 'button');

    useEditor.getState().move(btnId, containerId, 0);

    const containerChildren = useEditor.getState().project.components[containerId].children;
    expect(containerChildren).toContain(btnId);
  });
});
