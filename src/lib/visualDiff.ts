import type { ComponentNode, ProjectState } from '@/types/component';

export type DiffKind = 'added' | 'removed' | 'changed' | 'unchanged';

export interface NodeDiff {
  nodeId: string;
  kind: DiffKind;
  oldNode?: ComponentNode;
  newNode?: ComponentNode;
  changedProps?: string[];
}

export interface ProjectDiff {
  added: NodeDiff[];
  removed: NodeDiff[];
  changed: NodeDiff[];
  unchanged: NodeDiff[];
  summary: { added: number; removed: number; changed: number; unchanged: number };
}

export function diffNodes(a: ComponentNode, b: ComponentNode): NodeDiff {
  if (a.id !== b.id) {
    return { nodeId: a.id, kind: 'changed', oldNode: a, newNode: b };
  }
  const changedProps: string[] = [];
  const allKeys = new Set([...Object.keys(a.props), ...Object.keys(b.props)]);
  for (const key of allKeys) {
    const av = (a.props as Record<string, unknown>)[key];
    const bv = (b.props as Record<string, unknown>)[key];
    if (JSON.stringify(av) !== JSON.stringify(bv)) changedProps.push(key);
  }
  const metaFields: Array<keyof ComponentNode> = ['type', 'parentId', 'name', 'hidden', 'locked'];
  for (const field of metaFields) {
    if (JSON.stringify(a[field]) !== JSON.stringify(b[field])) changedProps.push(field as string);
  }
  if (JSON.stringify(a.children) !== JSON.stringify(b.children)) changedProps.push('children');
  if (changedProps.length > 0) {
    return { nodeId: a.id, kind: 'changed', oldNode: a, newNode: b, changedProps };
  }
  return { nodeId: a.id, kind: 'unchanged', oldNode: a, newNode: b };
}

export function diffProjects(a: ProjectState, b: ProjectState): ProjectDiff {
  const added: NodeDiff[] = [];
  const removed: NodeDiff[] = [];
  const changed: NodeDiff[] = [];
  const unchanged: NodeDiff[] = [];

  const aIds = new Set(Object.keys(a.components));
  const bIds = new Set(Object.keys(b.components));

  for (const id of aIds) {
    if (!bIds.has(id)) {
      removed.push({ nodeId: id, kind: 'removed', oldNode: a.components[id] });
    } else {
      const diff = diffNodes(a.components[id], b.components[id]);
      if (diff.kind === 'changed') changed.push(diff);
      else unchanged.push(diff);
    }
  }

  for (const id of bIds) {
    if (!aIds.has(id)) {
      added.push({ nodeId: id, kind: 'added', newNode: b.components[id] });
    }
  }

  return {
    added,
    removed,
    changed,
    unchanged,
    summary: { added: added.length, removed: removed.length, changed: changed.length, unchanged: unchanged.length },
  };
}

export function applyDiff(base: ProjectState, diff: ProjectDiff): ProjectState {
  const components = { ...base.components };

  for (const entry of diff.removed) {
    delete components[entry.nodeId];
  }

  for (const entry of diff.added) {
    if (entry.newNode) components[entry.nodeId] = entry.newNode;
  }

  for (const entry of diff.changed) {
    if (entry.newNode) components[entry.nodeId] = entry.newNode;
  }

  return { ...base, components };
}
