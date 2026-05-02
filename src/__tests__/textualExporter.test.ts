import { describe, it, expect } from 'vitest';
import { exportTextual } from '../exporters/textualExporter';
import type { ComponentNode, ProjectState } from '../types/component';

function makeProject(node: Partial<ComponentNode> & { id: string; name?: string }): ProjectState {
  const root: ComponentNode = {
    type: 'text',
    parentId: null,
    children: [],
    props: { text: 'hello' },
    ...node,
  };
  return {
    rootId: root.id,
    components: { [root.id]: root },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

describe('textualExporter id()', () => {
  it('prefixes ids starting with a digit with underscore', () => {
    const project = makeProject({ id: 'abc', name: '123widget' });
    const output = exportTextual(project);
    // The generated id must not start with a digit in any id= or CSS #selector context
    expect(output).not.toMatch(/id="\d/);
    // Should have a leading underscore before the digit
    expect(output).toMatch(/id="_123widget/);
  });

  it('leaves ids that start with a letter unchanged', () => {
    const project = makeProject({ id: 'abc', name: 'myWidget' });
    const output = exportTextual(project);
    expect(output).toMatch(/id="mywidget/);
    expect(output).not.toMatch(/id="_mywidget/);
  });

  it('handles name that is entirely digits', () => {
    const project = makeProject({ id: 'xyz', name: '999' });
    const output = exportTextual(project);
    expect(output).not.toMatch(/id="\d/);
    expect(output).toMatch(/id="_999_/);
  });
});
