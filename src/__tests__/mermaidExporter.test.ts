import { describe, it, expect } from 'vitest';
import { exportTimelineMermaid } from '../lib/mermaidExporter';
import type { ProjectState } from '../types/component';

function makeProject(extra: Partial<ProjectState> = {}): ProjectState {
  return {
    rootId: 'root',
    components: {},
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
    ...extra,
  };
}

describe('mermaidExporter sanitization', () => {
  it('sanitizes node IDs containing special characters', () => {
    const project = makeProject({
      timelineSteps: [
        { id: 'step"]bad', layerId: 'L', label: 'Hello' },
        { id: 'step-2.x', layerId: 'L', label: 'World' },
      ],
      timelineTransitions: [
        { id: 't1', fromStepId: 'step"]bad', toStepId: 'step-2.x', event: 'click' },
      ],
    });
    const out = exportTimelineMermaid(project);
    // No raw quote/bracket leaking into node-id positions
    expect(out).not.toContain('step"]bad[');
    // Special chars replaced with underscores
    expect(out).toContain('step__bad["Hello"]');
    expect(out).toContain('step_2_x["World"]');
    // Transition uses sanitized IDs
    expect(out).toContain('step__bad -->');
    expect(out).toContain('| step_2_x');
  });

  it('escapes double quotes in labels', () => {
    const project = makeProject({
      timelineSteps: [
        { id: 's1', layerId: 'L', label: 'He said "hi"' },
      ],
      timelineTransitions: [
        { id: 't1', fromStepId: 's1', toStepId: 's1', event: 'custom', label: 'on "ok"' },
      ],
    });
    const out = exportTimelineMermaid(project);
    expect(out).toContain('s1["He said &quot;hi&quot;"]');
    expect(out).toContain('-->|"on &quot;ok&quot;"|');
    // Verify the literal raw quote in label content does not appear unescaped
    expect(out).not.toContain('He said "hi"');
  });
});
