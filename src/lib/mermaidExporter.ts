import type { ProjectState } from '@/types/component';

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeLabel(s: string): string {
  return s.replace(/"/g, '&quot;');
}

export function exportTimelineMermaid(project: ProjectState): string {
  const steps = project.timelineSteps ?? [];
  const transitions = project.timelineTransitions ?? [];

  const lines: string[] = ['flowchart LR'];

  for (const step of steps) {
    const label = step.label ?? step.id;
    lines.push(`  ${sanitizeId(step.id)}["${escapeLabel(label)}"]`);
  }

  for (const trans of transitions) {
    const label = trans.label ?? (trans.trigger ? `${trans.event}: ${trans.trigger}` : trans.event);
    lines.push(`  ${sanitizeId(trans.fromStepId)} -->|"${escapeLabel(label)}"| ${sanitizeId(trans.toStepId)}`);
  }

  return lines.join('\n');
}
