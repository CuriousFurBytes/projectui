// Encode/decode a ProjectState to/from a URL-safe base64 string.
// Uses CompressionStream (deflate-raw) when available, falls back to plain JSON.
import type { ProjectState } from '@/types/component';

async function compress(data: string): Promise<Uint8Array<ArrayBuffer>> {
  if (typeof CompressionStream === 'undefined') {
    return new TextEncoder().encode(data) as Uint8Array<ArrayBuffer>;
  }
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  void writer.write(new TextEncoder().encode(data));
  void writer.close();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array<ArrayBuffer>);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total) as Uint8Array<ArrayBuffer>;
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

async function decompress(data: Uint8Array<ArrayBuffer>): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    return new TextDecoder().decode(data);
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  void writer.write(data);
  void writer.close();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array<ArrayBuffer>);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total) as Uint8Array<ArrayBuffer>;
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return new TextDecoder().decode(out);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encodeProject(project: ProjectState): Promise<string> {
  const json = JSON.stringify(project);
  const compressed = await compress(json);
  return toBase64Url(compressed as Uint8Array<ArrayBuffer>);
}

export async function decodeProject(encoded: string): Promise<ProjectState> {
  const bytes = fromBase64Url(encoded) as Uint8Array<ArrayBuffer>;
  const json = await decompress(bytes);
  const parsed: unknown = JSON.parse(json);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { rootId?: unknown }).rootId !== 'string' ||
    typeof (parsed as { components?: unknown }).components !== 'object' ||
    (parsed as { components?: unknown }).components === null
  ) {
    throw new Error('Invalid project data in share URL');
  }
  return parsed as ProjectState;
}

export function buildShareUrl(encoded: string): string {
  const base = window.location.href.split('#')[0];
  return `${base}#share=${encoded}`;
}

export async function loadFromShareUrl(): Promise<ProjectState | null> {
  const hash = window.location.hash;
  const match = hash.match(/[#&]share=([^&]+)/);
  if (!match) return null;
  try {
    return await decodeProject(match[1]);
  } catch {
    return null;
  }
}

/** Returns a hash fragment string like `#share=<encoded>` for the given project. */
export async function buildProjectHash(project: ProjectState): Promise<string> {
  const encoded = await encodeProject(project);
  return `#share=${encoded}`;
}

/** Parses a project from a raw hash string like `#share=<encoded>`.
 *  Returns null when the hash contains no share parameter or is invalid. */
export async function parseProjectFromHash(hash: string): Promise<ProjectState | null> {
  const match = hash.match(/[#&]share=([^&]+)/);
  if (!match) return null;
  try {
    return await decodeProject(match[1]);
  } catch {
    return null;
  }
}
