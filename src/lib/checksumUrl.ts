import type { ProjectState } from '@/types/component';
import { encodeProject, decodeProject } from '@/lib/shareUrl';

export function crc32(data: string): number {
  const table = makeCrc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data.charCodeAt(i)) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

function validateProject(project: ProjectState): { valid: boolean; error?: string } {
  if (!project.rootId) return { valid: false, error: 'missing rootId' };
  if (typeof project.termCols !== 'number' || project.termCols <= 0) {
    return { valid: false, error: 'termCols must be a positive number' };
  }
  if (typeof project.termRows !== 'number' || project.termRows <= 0) {
    return { valid: false, error: 'termRows must be a positive number' };
  }
  if (!project.components || !project.components[project.rootId]) {
    return { valid: false, error: 'rootId not found in components' };
  }
  if (project.layers !== undefined && !Array.isArray(project.layers)) {
    return { valid: false, error: 'layers must be an array' };
  }
  return { valid: true };
}

export async function encodeProjectWithChecksum(project: ProjectState): Promise<string> {
  const encoded = await encodeProject(project);
  const checksum = crc32(encoded).toString(16).padStart(8, '0');
  return `${encoded}.${checksum}`;
}

export async function decodeProjectWithChecksum(
  encoded: string,
): Promise<{ project: ProjectState; valid: boolean; error?: string }> {
  const lastDot = encoded.lastIndexOf('.');
  if (lastDot === -1) {
    return { project: {} as ProjectState, valid: false, error: 'missing checksum' };
  }
  const payload = encoded.slice(0, lastDot);
  const checksum = encoded.slice(lastDot + 1);
  const expected = crc32(payload).toString(16).padStart(8, '0');
  if (checksum !== expected) {
    return { project: {} as ProjectState, valid: false, error: 'checksum mismatch' };
  }
  try {
    const project = await decodeProject(payload);
    const schemaCheck = validateProject(project);
    if (!schemaCheck.valid) {
      return { project, valid: false, error: schemaCheck.error };
    }
    return { project, valid: true };
  } catch (e) {
    return { project: {} as ProjectState, valid: false, error: String(e) };
  }
}

export function buildChecksumShareUrl(encoded: string): string {
  const base = window.location.href.split('#')[0];
  return `${base}#cshare=${encoded}`;
}

export async function loadFromChecksumShareUrl(): Promise<{ project: ProjectState; valid: boolean } | null> {
  const hash = window.location.hash;
  const match = hash.match(/[#&]cshare=([^&]+)/);
  if (!match) return null;
  try {
    const result = await decodeProjectWithChecksum(match[1]);
    return { project: result.project, valid: result.valid };
  } catch {
    return null;
  }
}
