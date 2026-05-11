import type { ProjectState, ComponentNode, Layer } from '@/types/component';
import { uid } from '@/lib/id';

export interface AsciiMotionFrame {
  lines: string[];
}

export interface AsciiMotionFile {
  frames: AsciiMotionFrame[];
  fps?: number;
  name?: string;
}

export function parseAsciiMotion(json: string): AsciiMotionFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected object');
  }
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.frames)) {
    throw new Error('Missing frames array');
  }
  for (const frame of obj.frames as unknown[]) {
    if (typeof frame !== 'object' || frame === null || !Array.isArray((frame as Record<string, unknown>).lines)) {
      throw new Error('Each frame must have a lines array');
    }
    for (const line of (frame as { lines: unknown[] }).lines) {
      if (typeof line !== 'string') {
        throw new Error('Each line must be a string');
      }
    }
  }
  return {
    frames: (obj.frames as Array<{ lines: string[] }>).map((f) => ({ lines: f.lines })),
    fps: typeof obj.fps === 'number' ? obj.fps : undefined,
    name: typeof obj.name === 'string' ? obj.name : undefined,
  };
}

export function asciiMotionToProject(file: AsciiMotionFile, name?: string): ProjectState {
  const termCols = Math.max(1, ...file.frames.map((f) => Math.max(1, ...f.lines.map((l) => l.length))));
  const termRows = Math.max(1, ...file.frames.map((f) => f.lines.length));

  const layers: Layer[] = [];
  const firstLayerNodes: Record<string, ComponentNode> = {};
  let firstRootId = '';

  for (let i = 0; i < file.frames.length; i++) {
    const frame = file.frames[i];
    const rootId = uid('root');
    const textId = uid('text');
    if (i === 0) firstRootId = rootId;

    const root: ComponentNode = {
      id: rootId,
      type: 'container',
      parentId: null,
      children: [textId],
      props: { direction: 'column', width: 'fill', height: 'fill', border: 'none', padding: 0 },
    };
    const textNode: ComponentNode = {
      id: textId,
      type: 'asciitext',
      parentId: rootId,
      children: [],
      props: { text: frame.lines.join('\n') },
    };
    const nodes: Record<string, ComponentNode> = { [rootId]: root, [textId]: textNode };
    if (i === 0) {
      Object.assign(firstLayerNodes, nodes);
    }
    layers.push({ id: uid('layer'), name: name ? `${name} Frame ${i + 1}` : `Frame ${i + 1}`, rootId, components: nodes });
  }

  return {
    rootId: firstRootId,
    components: layers[0]?.components ?? firstLayerNodes,
    termCols,
    termRows,
    theme: 'tokyo-night',
    layers,
    activeLayerIndex: 0,
  };
}

export function asciiMotionToAnimation(file: AsciiMotionFile): { layerIds: string[]; fps: number } {
  const layerIds: string[] = [];
  for (let i = 0; i < file.frames.length; i++) {
    layerIds.push(uid('layer'));
  }
  return { layerIds, fps: file.fps ?? 10 };
}
