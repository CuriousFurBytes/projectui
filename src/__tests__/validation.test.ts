import { describe, it, expect } from 'vitest';
import { validateProject } from '../lib/validation';

describe('validateProject – non-object inputs', () => {
  it('returns invalid for null', () => {
    const result = validateProject(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Project must be an object');
  });

  it('returns invalid for a string', () => {
    const result = validateProject('hello');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Project must be an object');
  });

  it('returns invalid for a number', () => {
    const result = validateProject(42);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Project must be an object');
  });

  it('returns invalid for undefined', () => {
    const result = validateProject(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Project must be an object');
  });
});

describe('validateProject – missing or invalid rootId', () => {
  it('errors when rootId is missing', () => {
    const result = validateProject({
      components: {},
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('rootId'))).toBe(true);
  });

  it('errors when rootId is a number instead of string', () => {
    const result = validateProject({
      rootId: 123,
      components: {},
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('rootId'))).toBe(true);
  });
});

describe('validateProject – rootId not in components', () => {
  it('errors when rootId does not match any component key', () => {
    const result = validateProject({
      rootId: 'missing-root',
      components: {
        other: { id: 'other', type: 'text', parentId: null, children: [], props: {} },
      },
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing-root'))).toBe(true);
  });
});

describe('validateProject – invalid children array', () => {
  it('errors when a component has non-array children', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: 'not-an-array', props: {} },
      },
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid children array'))).toBe(true);
  });
});

describe('validateProject – missing child reference', () => {
  it('errors when a component references a child that does not exist', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: ['ghost'], props: {} },
      },
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ghost'))).toBe(true);
  });
});

describe('validateProject – missing or invalid termCols / termRows', () => {
  it('errors when termCols is missing', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: [], props: {} },
      },
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('termCols'))).toBe(true);
  });

  it('errors when termRows is missing', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: 80,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('termRows'))).toBe(true);
  });

  it('errors when termCols is a string', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: '80',
      termRows: 24,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('termCols'))).toBe(true);
  });

  it('errors when termRows is a string', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: 80,
      termRows: '24',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('termRows'))).toBe(true);
  });
});

describe('validateProject – valid projects', () => {
  it('returns valid with no errors for a minimal correct project', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: [], props: {} },
      },
      termCols: 80,
      termRows: 24,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for a project with multiple components', () => {
    const result = validateProject({
      rootId: 'root',
      components: {
        root: { id: 'root', type: 'container', parentId: null, children: ['child1', 'child2'], props: {} },
        child1: { id: 'child1', type: 'text', parentId: 'root', children: [], props: {} },
        child2: { id: 'child2', type: 'button', parentId: 'root', children: [], props: {} },
      },
      termCols: 120,
      termRows: 40,
      theme: 'dracula',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
