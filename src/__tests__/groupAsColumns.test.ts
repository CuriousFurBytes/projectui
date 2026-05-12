import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage so zustand persistence doesn't fail in node
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import { preferredGroupDirection } from '../lib/groupUtils';
import { useEditor } from '../store/editorStore';

function freshStore() {
  useEditor.getState().reset();
}

// ── preferredGroupDirection ───────────────────────────────────────────────────

describe('preferredGroupDirection', () => {
  it('returns row when parent is wide enough for side-by-side items', () => {
    // 80 / 2 = 40 ≥ MIN_COLUMN_WIDTH(10) → row
    expect(preferredGroupDirection(80, 2)).toBe('row');
  });

  it('returns column when parent is too narrow', () => {
    // 15 / 2 = 7.5 < 10 → column
    expect(preferredGroupDirection(15, 2)).toBe('column');
  });

  it('returns row at exactly minimum width per column', () => {
    // 20 / 2 = 10 = 10 → row
    expect(preferredGroupDirection(20, 2)).toBe('row');
  });

  it('returns row for 3 items with enough space', () => {
    // 30 / 3 = 10 ≥ 10 → row
    expect(preferredGroupDirection(30, 3)).toBe('row');
  });

  it('returns column for 3 items with insufficient space', () => {
    // 29 / 3 ≈ 9.7 < 10 → column
    expect(preferredGroupDirection(29, 3)).toBe('column');
  });

  it('returns row for 5 items with plenty of space', () => {
    // 100 / 5 = 20 ≥ 10 → row
    expect(preferredGroupDirection(100, 5)).toBe('row');
  });
});

// ── groupNodes direction heuristic ───────────────────────────────────────────

describe('editorStore – groupNodes direction heuristic', () => {
  beforeEach(freshStore);

  it('uses row direction in default wide terminal (100 cols, 2 items)', () => {
    const s = useEditor.getState();
    // Default terminal is 100 cols; 100/2=50 ≥ 10 → row
    const b1 = s.addChild(s.project.rootId, 'button');
    const b2 = s.addChild(s.project.rootId, 'button');
    const groupId = useEditor.getState().groupNodes([b1, b2], s.project.rootId);
    const group = useEditor.getState().project.components[groupId];
    expect(group.props.direction).toBe('row');
  });

  it('uses column direction when parent container has narrow fixed width', () => {
    const s = useEditor.getState();
    const containerId = s.addChild(s.project.rootId, 'container');
    // Make the container very narrow so columns don't fit
    useEditor.getState().updateProps(containerId, { width: 15 });
    const b1 = useEditor.getState().addChild(containerId, 'button');
    const b2 = useEditor.getState().addChild(containerId, 'button');
    const groupId = useEditor.getState().groupNodes([b1, b2], containerId);
    const group = useEditor.getState().project.components[groupId];
    expect(group.props.direction).toBe('column');
  });
});

// ── groupAsColumns ────────────────────────────────────────────────────────────

describe('editorStore – groupAsColumns', () => {
  beforeEach(freshStore);

  it('always creates a row-direction container regardless of parent width', () => {
    const s = useEditor.getState();
    const containerId = s.addChild(s.project.rootId, 'container');
    useEditor.getState().updateProps(containerId, { width: 15 });
    const b1 = useEditor.getState().addChild(containerId, 'button');
    const b2 = useEditor.getState().addChild(containerId, 'button');
    const groupId = useEditor.getState().groupAsColumns([b1, b2], containerId);
    const group = useEditor.getState().project.components[groupId];
    expect(group.props.direction).toBe('row');
  });

  it('sets a gap between column children', () => {
    const s = useEditor.getState();
    const b1 = s.addChild(s.project.rootId, 'button');
    const b2 = s.addChild(s.project.rootId, 'button');
    const groupId = useEditor.getState().groupAsColumns([b1, b2], s.project.rootId);
    const group = useEditor.getState().project.components[groupId];
    expect(group.props.gap).toBeGreaterThan(0);
  });

  it('returns a non-empty group id', () => {
    const s = useEditor.getState();
    const b1 = s.addChild(s.project.rootId, 'button');
    const b2 = s.addChild(s.project.rootId, 'button');
    const groupId = useEditor.getState().groupAsColumns([b1, b2], s.project.rootId);
    expect(groupId).not.toBe('');
  });

  it('re-parents all ids into the new group', () => {
    const s = useEditor.getState();
    const b1 = s.addChild(s.project.rootId, 'button');
    const b2 = s.addChild(s.project.rootId, 'button');
    const groupId = useEditor.getState().groupAsColumns([b1, b2], s.project.rootId);
    const group = useEditor.getState().project.components[groupId];
    expect(group.children).toContain(b1);
    expect(group.children).toContain(b2);
  });

  it('removes grouped items from the parent and inserts the group instead', () => {
    const s = useEditor.getState();
    const b1 = s.addChild(s.project.rootId, 'button');
    const b2 = s.addChild(s.project.rootId, 'button');
    useEditor.getState().groupAsColumns([b1, b2], s.project.rootId);
    const root = useEditor.getState().project.components[s.project.rootId];
    expect(root.children).not.toContain(b1);
    expect(root.children).not.toContain(b2);
  });
});
