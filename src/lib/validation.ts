import type { ProjectState } from '@/types/component';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProject(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Project must be an object'] };
  }

  const p = data as Record<string, unknown>;

  if (!p.rootId || typeof p.rootId !== 'string') {
    errors.push('Missing or invalid rootId');
  }

  if (!p.components || typeof p.components !== 'object') {
    errors.push('Missing or invalid components map');
  } else {
    const comps = p.components as Record<string, unknown>;

    if (p.rootId && typeof p.rootId === 'string' && !comps[p.rootId]) {
      errors.push(`Root node "${p.rootId}" not found in components`);
    }

    for (const [id, node] of Object.entries(comps)) {
      if (!node || typeof node !== 'object') {
        errors.push(`Component "${id}" is not an object`);
        continue;
      }
      const n = node as Record<string, unknown>;
      if (!Array.isArray(n.children)) {
        errors.push(`Component "${id}" has invalid children array`);
        continue;
      }
      for (const childId of n.children as string[]) {
        if (!comps[childId]) {
          errors.push(`Component "${id}" references missing child "${childId}"`);
        }
      }
    }
  }

  if (typeof (p as Partial<ProjectState>).termCols !== 'number') {
    errors.push('Missing or invalid termCols');
  }
  if (typeof (p as Partial<ProjectState>).termRows !== 'number') {
    errors.push('Missing or invalid termRows');
  }

  return { valid: errors.length === 0, errors };
}
