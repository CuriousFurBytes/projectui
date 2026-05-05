import type { ProjectState } from '@/types/component';

export function exportTimelineMermaid(project: ProjectState): string {
  const steps = project.timelineSteps ?? [];
  const transitions = project.timelineTransitions ?? [];

  const lines: string[] = ['flowchart LR'];

  for (const step of steps) {
    const label = step.label ?? step.id;
    lines.push(`  ${step.id}["${label}"]`);
  }

  for (const trans of transitions) {
    const label = trans.label ?? (trans.trigger ? `${trans.event}: ${trans.trigger}` : trans.event);
    lines.push(`  ${trans.fromStepId} -->|"${label}"| ${trans.toStepId}`);
  }

  return lines.join('\n');
}
