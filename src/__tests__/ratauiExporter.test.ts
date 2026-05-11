import { describe, it, expect } from 'vitest';
import { exportRatatui } from '../exporters/ratauiExporter';
import { EXPORTER_CAPABILITIES } from '../lib/exporterUtils';
import type { ComponentNode, ComponentType, ProjectState } from '../types/component';

function makeProject(rootId: string, components: Record<string, ComponentNode>): ProjectState {
  return {
    rootId,
    components,
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
  };
}

describe('ratauiExporter – container with border AND children', () => {
  it('includes both the border AND each child in output (no silent drop)', () => {
    const child1: ComponentNode = {
      id: 'c1',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'child-one-content' },
    };
    const child2: ComponentNode = {
      id: 'c2',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'child-two-content' },
    };
    const root: ComponentNode = {
      id: 'root',
      type: 'container',
      parentId: null,
      children: ['c1', 'c2'],
      props: { border: 'rounded', title: 'My Box' },
    };
    const output = exportRatatui(makeProject('root', { root, c1: child1, c2: child2 }));
    // Border is preserved
    expect(output).toContain('Block::bordered()');
    expect(output).toContain('BorderType::Rounded');
    expect(output).toContain('"My Box"');
    // Both children are emitted
    expect(output).toContain('child-one-content');
    expect(output).toContain('child-two-content');
  });
});

describe('ratauiExporter – modal', () => {
  it('produces valid output for a modal (covers former duplicate-case path)', () => {
    const child: ComponentNode = {
      id: 'mc',
      type: 'text',
      parentId: 'root',
      children: [],
      props: { text: 'modal-body' },
    };
    const root: ComponentNode = {
      id: 'root',
      type: 'modal',
      parentId: null,
      children: ['mc'],
      props: {},
    };
    const output = exportRatatui(makeProject('root', { root, mc: child }));
    expect(output).toContain('modal-body');
    expect(output).toContain('Vertical::new');
  });

  it('handles empty modal without throwing', () => {
    const root: ComponentNode = {
      id: 'root',
      type: 'modal',
      parentId: null,
      children: [],
      props: {},
    };
    const output = exportRatatui(makeProject('root', { root }));
    expect(output).toContain('Paragraph::new("")');
  });
});

// Catches future drift if a new ComponentType is added to the union but not to
// EXPORTER_CAPABILITIES.
describe('EXPORTER_CAPABILITIES coverage', () => {
  const allTypes: ComponentType[] = [
    'container', 'text', 'button', 'input', 'checkbox', 'select', 'list',
    'textarea', 'table', 'tabs', 'statusbar', 'progressbar', 'modal', 'spinner',
    'divider', 'toast', 'grid', 'viewport', 'timer', 'filepicker', 'asciitext',
    'treeview', 'metriccard', 'markdowntext', 'line', 'circle', 'polygon', 'chart',
  ];

  for (const exporter of Object.keys(EXPORTER_CAPABILITIES)) {
    it(`${exporter} has an entry for every ComponentType`, () => {
      const cap = EXPORTER_CAPABILITIES[exporter];
      const known = new Set([...cap.supported, ...cap.partial, ...cap.unsupported]);
      const missing = allTypes.filter((t) => !known.has(t));
      expect(missing).toEqual([]);
    });
  }
});
