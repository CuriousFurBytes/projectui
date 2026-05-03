import type { ComponentNode, ComponentVariant } from '@/types/component';
import { uid } from './id';

export function collectSubtree(
  nodes: Record<string, ComponentNode>,
  rootId: string,
): Record<string, ComponentNode> {
  const result: Record<string, ComponentNode> = {};
  const collect = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    result[id] = node;
    node.children.forEach(collect);
  };
  collect(rootId);
  return result;
}

export function cloneSubtreeWithNewIds(
  nodes: Record<string, ComponentNode>,
  rootId: string,
  newParentId: string | null,
): { nodes: Record<string, ComponentNode>; rootId: string } {
  const idMap = new Map<string, string>();

  const assignIds = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    idMap.set(id, uid(node.type));
    node.children.forEach(assignIds);
  };
  assignIds(rootId);

  const result: Record<string, ComponentNode> = {};
  const cloneNode = (id: string, parentId: string | null) => {
    const node = nodes[id];
    if (!node) return;
    const newId = idMap.get(id)!;
    result[newId] = {
      ...node,
      id: newId,
      parentId,
      children: node.children.map((c) => idMap.get(c)!).filter(Boolean),
      props: JSON.parse(JSON.stringify(node.props)) as typeof node.props,
    };
    node.children.forEach((c) => cloneNode(c, newId));
  };
  cloneNode(rootId, newParentId);

  return { nodes: result, rootId: idMap.get(rootId)! };
}

export function variantFromSubtree(
  nodes: Record<string, ComponentNode>,
  rootId: string,
  name: string,
): ComponentVariant {
  const subtree = collectSubtree(nodes, rootId);
  const root = subtree[rootId];
  return {
    id: uid('variant'),
    name,
    rootType: root.type,
    rootNodeId: rootId,
    nodes: subtree,
    createdAt: Date.now(),
  };
}
