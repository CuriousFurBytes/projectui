import { describe, it, expect } from 'vitest';
import { collectSubtree, cloneSubtreeWithNewIds, variantFromSubtree } from '../lib/variantUtils';
import type { ComponentNode } from '../types/component';

function makeNode(id: string, overrides: Partial<ComponentNode> = {}): ComponentNode {
  return {
    id,
    type: 'container',
    parentId: null,
    children: [],
    props: {},
    ...overrides,
  };
}

// ── collectSubtree ────────────────────────────────────────────────────────────

describe('collectSubtree – root only (no children)', () => {
  it('returns only the root node when it has no children', () => {
    const nodes = {
      root: makeNode('root'),
    };
    const result = collectSubtree(nodes, 'root');
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['root']).toBeDefined();
  });
});

describe('collectSubtree – nested tree', () => {
  it('collects root and all descendants', () => {
    const nodes = {
      root: makeNode('root', { children: ['child1', 'child2'] }),
      child1: makeNode('child1', { parentId: 'root', children: ['grandchild'] }),
      child2: makeNode('child2', { parentId: 'root' }),
      grandchild: makeNode('grandchild', { parentId: 'child1' }),
    };
    const result = collectSubtree(nodes, 'root');
    expect(Object.keys(result)).toHaveLength(4);
    expect(result['root']).toBeDefined();
    expect(result['child1']).toBeDefined();
    expect(result['child2']).toBeDefined();
    expect(result['grandchild']).toBeDefined();
  });

  it('collects only the subtree rooted at a non-root node', () => {
    const nodes = {
      root: makeNode('root', { children: ['child1', 'child2'] }),
      child1: makeNode('child1', { parentId: 'root', children: ['grandchild'] }),
      child2: makeNode('child2', { parentId: 'root' }),
      grandchild: makeNode('grandchild', { parentId: 'child1' }),
    };
    const result = collectSubtree(nodes, 'child1');
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['child1']).toBeDefined();
    expect(result['grandchild']).toBeDefined();
    expect(result['root']).toBeUndefined();
    expect(result['child2']).toBeUndefined();
  });
});

// ── cloneSubtreeWithNewIds ────────────────────────────────────────────────────

describe('cloneSubtreeWithNewIds – new IDs', () => {
  it('returns different IDs from the originals', () => {
    const nodes = {
      root: makeNode('root', { children: ['child'] }),
      child: makeNode('child', { parentId: 'root' }),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', null);
    expect(newRootId).not.toBe('root');
    const newChildId = Object.keys(cloned).find((k) => k !== newRootId);
    expect(newChildId).toBeDefined();
    expect(newChildId).not.toBe('child');
  });

  it('all cloned node IDs differ from the originals', () => {
    const nodes = {
      root: makeNode('root', { children: ['child'] }),
      child: makeNode('child', { parentId: 'root' }),
    };
    const { nodes: cloned } = cloneSubtreeWithNewIds(nodes, 'root', null);
    expect(cloned['root']).toBeUndefined();
    expect(cloned['child']).toBeUndefined();
  });
});

describe('cloneSubtreeWithNewIds – preserves structure', () => {
  it('cloned root has the same number of children as original', () => {
    const nodes = {
      root: makeNode('root', { children: ['c1', 'c2'] }),
      c1: makeNode('c1', { parentId: 'root' }),
      c2: makeNode('c2', { parentId: 'root' }),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', null);
    expect(cloned[newRootId].children).toHaveLength(2);
  });

  it('cloned nodes have correct parentId references', () => {
    const nodes = {
      root: makeNode('root', { children: ['child'] }),
      child: makeNode('child', { parentId: 'root' }),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', null);
    const newChildId = cloned[newRootId].children[0];
    expect(cloned[newChildId].parentId).toBe(newRootId);
  });

  it('cloned root gets the supplied newParentId', () => {
    const nodes = {
      root: makeNode('root'),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', 'some-parent');
    expect(cloned[newRootId].parentId).toBe('some-parent');
  });
});

describe('cloneSubtreeWithNewIds – preserves prop values', () => {
  it('deep-copies props so mutating clone does not affect original', () => {
    const nodes = {
      root: makeNode('root', { props: { text: 'hello', padding: 4 } }),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', null);
    expect(cloned[newRootId].props.text).toBe('hello');
    expect(cloned[newRootId].props.padding).toBe(4);

    // Mutate clone — original must be unchanged
    cloned[newRootId].props.text = 'mutated';
    expect(nodes['root'].props.text).toBe('hello');
  });
});

describe('cloneSubtreeWithNewIds – nested children', () => {
  it('handles three levels of nesting correctly', () => {
    const nodes = {
      root: makeNode('root', { children: ['child'] }),
      child: makeNode('child', { parentId: 'root', children: ['grandchild'] }),
      grandchild: makeNode('grandchild', { parentId: 'child' }),
    };
    const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(nodes, 'root', null);
    expect(Object.keys(cloned)).toHaveLength(3);

    const newChildId = cloned[newRootId].children[0];
    const newGrandchildId = cloned[newChildId].children[0];

    expect(newChildId).toBeDefined();
    expect(newGrandchildId).toBeDefined();
    expect(cloned[newGrandchildId].parentId).toBe(newChildId);
  });
});

// ── variantFromSubtree ────────────────────────────────────────────────────────

describe('variantFromSubtree – basic structure', () => {
  it('returns a variant with the correct rootType', () => {
    const nodes = {
      root: makeNode('root', { type: 'button' }),
    };
    const variant = variantFromSubtree(nodes, 'root', 'My Variant');
    expect(variant.rootType).toBe('button');
  });

  it('returns a variant with the correct rootNodeId', () => {
    const nodes = {
      root: makeNode('root'),
    };
    const variant = variantFromSubtree(nodes, 'root', 'My Variant');
    expect(variant.rootNodeId).toBe('root');
  });

  it('returns a variant with the correct name', () => {
    const nodes = {
      root: makeNode('root'),
    };
    const variant = variantFromSubtree(nodes, 'root', 'Named Variant');
    expect(variant.name).toBe('Named Variant');
  });

  it('includes all nodes in the subtree', () => {
    const nodes = {
      root: makeNode('root', { children: ['child'] }),
      child: makeNode('child', { parentId: 'root' }),
      sibling: makeNode('sibling'), // not in subtree
    };
    const variant = variantFromSubtree(nodes, 'root', 'v');
    expect(variant.nodes['root']).toBeDefined();
    expect(variant.nodes['child']).toBeDefined();
    expect(variant.nodes['sibling']).toBeUndefined();
  });

  it('has a numeric createdAt timestamp', () => {
    const nodes = { root: makeNode('root') };
    const before = Date.now();
    const variant = variantFromSubtree(nodes, 'root', 'v');
    const after = Date.now();
    expect(variant.createdAt).toBeGreaterThanOrEqual(before);
    expect(variant.createdAt).toBeLessThanOrEqual(after);
  });
});

// ── Edge case: missing child reference ────────────────────────────────────────

describe('collectSubtree – graceful skip on missing child', () => {
  it('skips missing child references without throwing', () => {
    const nodes = {
      root: makeNode('root', { children: ['ghost'] }), // 'ghost' is missing
    };
    expect(() => collectSubtree(nodes, 'root')).not.toThrow();
    const result = collectSubtree(nodes, 'root');
    // Only root should be collected; ghost is silently skipped
    expect(result['root']).toBeDefined();
    expect(result['ghost']).toBeUndefined();
  });
});
