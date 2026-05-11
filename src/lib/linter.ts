import type { ProjectState } from '@/types/component';

export function lintProject(project: ProjectState): string[] {
  const warnings: string[] = [];
  const { components, rootId } = project;

  for (const [id, node] of Object.entries(components)) {
    for (const childId of node.children) {
      if (!components[childId]) {
        warnings.push(`Component "${id}" references missing child "${childId}"`);
      }
    }

    if (node.parentId && !components[node.parentId]) {
      warnings.push(`Component "${id}" has parentId "${node.parentId}" which does not exist`);
    }

    if (node.parentId) {
      const parent = components[node.parentId];
      if (parent && !parent.children.includes(id)) {
        warnings.push(`Component "${id}" declares parentId "${node.parentId}" but is not in that parent's children`);
      }
    }
  }

  if (!components[rootId]) {
    warnings.push(`Root component "${rootId}" is missing from components map`);
  }

  return warnings;
}
