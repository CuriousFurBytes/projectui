import { describe, it, expect } from 'vitest';
import { lintProject } from '../lib/linter';
import type { ProjectState, ComponentNode } from '../types/component';

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

function makeProject(overrides: Partial<ProjectState> = {}): ProjectState {
  const rootId = 'root';
  return {
    rootId,
    components: {
      [rootId]: makeNode(rootId),
    },
    termCols: 80,
    termRows: 24,
    theme: 'dracula',
    ...overrides,
  };
}

describe('lintProject – clean project', () => {
  it('returns no warnings for a minimal valid project', () => {
    const warnings = lintProject(makeProject());
    expect(warnings).toHaveLength(0);
  });

  it('returns no warnings for a project with valid parent/child relationships', () => {
    const project = makeProject({
      components: {
        root: makeNode('root', { children: ['child1'] }),
        child1: makeNode('child1', { parentId: 'root' }),
      },
    });
    const warnings = lintProject(project);
    expect(warnings).toHaveLength(0);
  });
});

describe('lintProject – missing child reference', () => {
  it('warns when a component references a child that does not exist', () => {
    const project = makeProject({
      components: {
        root: makeNode('root', { children: ['ghost'] }),
      },
    });
    const warnings = lintProject(project);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('ghost'))).toBe(true);
    expect(warnings.some((w) => w.includes('root'))).toBe(true);
  });
});

describe('lintProject – parentId pointing to non-existent parent', () => {
  it('warns when a component has a parentId that does not exist in components', () => {
    const project = makeProject({
      components: {
        root: makeNode('root'),
        orphan: makeNode('orphan', { parentId: 'non-existent' }),
      },
    });
    const warnings = lintProject(project);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('non-existent'))).toBe(true);
    expect(warnings.some((w) => w.includes('orphan'))).toBe(true);
  });
});

describe('lintProject – parentId not reflected in parent children', () => {
  it('warns when a component declares parentId but is not in that parent\'s children list', () => {
    const project = makeProject({
      components: {
        root: makeNode('root', { children: [] }), // child not listed
        child: makeNode('child', { parentId: 'root' }),
      },
    });
    const warnings = lintProject(project);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes('child') && w.includes('root'))).toBe(true);
  });
});

describe('lintProject – root component missing', () => {
  it('warns when the rootId does not match any component', () => {
    const project: ProjectState = {
      rootId: 'missing-root',
      components: {
        other: makeNode('other'),
      },
      termCols: 80,
      termRows: 24,
      theme: 'dracula',
    };
    const warnings = lintProject(project);
    expect(warnings.some((w) => w.includes('missing-root'))).toBe(true);
  });
});

describe('lintProject – multiple issues at once', () => {
  it('reports all relevant warnings in a single pass', () => {
    // root has a missing child, and another node has a bad parentId
    const project: ProjectState = {
      rootId: 'root',
      components: {
        root: makeNode('root', { children: ['ghost'] }),
        orphan: makeNode('orphan', { parentId: 'no-such-parent' }),
        // not-in-children declares root as parent but root's children is ['ghost']
        notInChildren: makeNode('notInChildren', { parentId: 'root' }),
      },
      termCols: 80,
      termRows: 24,
      theme: 'dracula',
    };
    const warnings = lintProject(project);
    // Expect at least 3 distinct issues
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    expect(warnings.some((w) => w.includes('ghost'))).toBe(true);
    expect(warnings.some((w) => w.includes('no-such-parent'))).toBe(true);
    expect(warnings.some((w) => w.includes('notInChildren'))).toBe(true);
  });
});
