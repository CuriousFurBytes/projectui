import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ComponentNode,
  ComponentProps,
  ComponentType,
  Layer,
  ProjectState,
  ThemeName,
  TimelineStep,
  TimelineTransition,
} from '@/types/component';
import { getDef, makeNode } from '@/lib/componentDefs';
import { uid } from '@/lib/id';

const STORAGE_KEY = 'tui-builder.project.v1';

function makeDefaultLayer(name = 'Screen 1'): { layer: Layer; nodes: Record<string, ComponentNode> } {
  const rootId = uid('root');
  const root: ComponentNode = {
    id: rootId,
    type: 'container',
    parentId: null,
    children: [],
    props: { direction: 'column', width: 'fill', height: 'fill', padding: 1, border: 'none' },
    name: 'App',
  };

  const header = makeNode('container', rootId);
  header.props = { ...header.props, direction: 'row', height: 3, border: 'rounded', title: ' tui-builder ', padding: 0 };

  const headerText = makeNode('text', header.id);
  headerText.props = { ...headerText.props, text: ' Welcome to your terminal app', fg: 'brightCyan' };
  header.children.push(headerText.id);

  const body = makeNode('container', rootId);
  body.props = { ...body.props, direction: 'row', height: 'fill', border: 'none', padding: 0, gap: 1 };

  const left = makeNode('list', body.id);
  left.props = { ...left.props, items: ['Dashboard', 'Tasks', 'Logs', 'Settings'], width: 22 };
  body.children.push(left.id);

  const right = makeNode('container', body.id);
  right.props = { ...right.props, direction: 'column', width: 'fill', border: 'single', title: ' Details ', padding: 1, gap: 0, align: 'center', justify: 'center' };

  const centeredPanel = makeNode('container', right.id);
  centeredPanel.name = 'Centered Panel';
  centeredPanel.props = { ...centeredPanel.props, direction: 'column', width: 36, height: 12, border: 'rounded', fg: 'brightBlack', title: ' Panel ', padding: 1, gap: 1 };

  const rightText = makeNode('text', centeredPanel.id);
  rightText.props = { ...rightText.props, text: 'Drag components from the left panel, or pick a layer to edit.' };
  centeredPanel.children.push(rightText.id);

  const progress = makeNode('progressbar', centeredPanel.id);
  centeredPanel.children.push(progress.id);

  const button = makeNode('button', centeredPanel.id);
  centeredPanel.children.push(button.id);

  right.children.push(centeredPanel.id);
  body.children.push(right.id);

  const status = makeNode('statusbar', rootId);

  root.children = [header.id, body.id, status.id];

  const nodes: Record<string, ComponentNode> = {
    [root.id]: root,
    [header.id]: header,
    [headerText.id]: headerText,
    [body.id]: body,
    [left.id]: left,
    [right.id]: right,
    [centeredPanel.id]: centeredPanel,
    [rightText.id]: rightText,
    [progress.id]: progress,
    [button.id]: button,
    [status.id]: status,
  };

  const layer: Layer = { id: uid('layer'), name, rootId, components: nodes };
  return { layer, nodes };
}

function makeInitialProject(): ProjectState {
  const { layer, nodes } = makeDefaultLayer('Screen 1');
  return {
    rootId: layer.rootId,
    components: nodes,
    termCols: 100,
    termRows: 30,
    theme: 'tokyo-night',
    layers: [layer],
    activeLayerIndex: 0,
    timelineSteps: [{ id: uid('step'), layerId: layer.id, label: 'Screen 1' }],
    timelineTransitions: [],
  };
}

function makeTimelineStepsForLayers(layers: Layer[]): TimelineStep[] {
  return layers.map((layer) => ({
    id: uid('step'),
    layerId: layer.id,
    label: layer.name,
  }));
}

function migrateProject(p: ProjectState): ProjectState {
  // Migrate older saves that lacked layers / activeLayerIndex
  if (!p.layers || !Array.isArray(p.layers) || p.layers.length === 0) {
    const layerId = uid('layer');
    return {
      ...p,
      layers: [{ id: layerId, name: 'Screen 1', rootId: p.rootId, components: p.components }],
      activeLayerIndex: 0,
      timelineSteps: p.timelineSteps ?? [{ id: uid('step'), layerId, label: 'Screen 1' }],
      timelineTransitions: p.timelineTransitions ?? [],
    };
  }

  let project = p;
  if (project.activeLayerIndex === undefined) {
    project = { ...project, activeLayerIndex: 0 };
  }
  if (!project.timelineSteps) {
    project = { ...project, timelineSteps: makeTimelineStepsForLayers(project.layers) };
  }
  if (!project.timelineTransitions) {
    project = { ...project, timelineTransitions: [] };
  }
  return project;
}

function loadProject(): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialProject();
    const parsed = JSON.parse(raw) as ProjectState;
    if (!parsed.rootId || !parsed.components?.[parsed.rootId]) return makeInitialProject();
    return migrateProject(parsed);
  } catch {
    return makeInitialProject();
  }
}

function saveProject(project: ProjectState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    /* quota / private mode */
  }
}

interface UndoEntry {
  project: ProjectState;
  selectedId: string | null;
}

interface EditorState {
  project: ProjectState;
  selectedId: string | null;
  hoverId: string | null;
  // history
  past: UndoEntry[];
  future: UndoEntry[];
  // actions
  select: (id: string | null) => void;
  setHover: (id: string | null) => void;
  addChild: (parentId: string, type: ComponentType, index?: number) => string;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  updateProps: (id: string, patch: Partial<ComponentProps>) => void;
  move: (id: string, newParentId: string, index: number) => void;
  setHidden: (id: string, hidden: boolean) => void;
  setLocked: (id: string, locked: boolean) => void;
  setTermSize: (cols: number, rows: number) => void;
  setTheme: (theme: ThemeName) => void;
  reset: () => void;
  loadFromJson: (json: string) => void;
  exportJson: () => string;
  undo: () => void;
  redo: () => void;
  // Layer / screen actions
  addLayer: (name?: string) => void;
  removeLayer: (index: number) => void;
  renameLayer: (index: number, name: string) => void;
  switchLayer: (index: number) => void;
  // Timeline actions
  addTimelineStep: (layerId: string, label?: string) => void;
  removeTimelineStep: (stepId: string) => void;
  updateTimelineStep: (stepId: string, patch: Partial<TimelineStep>) => void;
  addTimelineTransition: (fromStepId: string, toStepId: string, event: TimelineTransition['event'], trigger?: string, label?: string) => void;
  removeTimelineTransition: (transId: string) => void;
  updateTimelineTransition: (transId: string, patch: Partial<TimelineTransition>) => void;
}

const cloneProject = (p: ProjectState): ProjectState => JSON.parse(JSON.stringify(p)) as ProjectState;

function pushHistory(state: EditorState): Pick<EditorState, 'past' | 'future'> {
  const entry: UndoEntry = { project: cloneProject(state.project), selectedId: state.selectedId };
  const past = [...state.past, entry].slice(-50);
  return { past, future: [] };
}

export const useEditor = create<EditorState>()(
  devtools(
    (set, get) => ({
      project: loadProject(),
      selectedId: null,
      hoverId: null,
      past: [],
      future: [],

      select: (id) => set({ selectedId: id }),
      setHover: (id) => set({ hoverId: id }),

      addChild: (parentId, type, index) => {
        const state = get();
        const parent = state.project.components[parentId];
        if (!parent) return '';
        try {
          if (!getDef(parent.type).acceptsChildren) return '';
        } catch {
          return '';
        }
        const node = makeNode(type, parentId);
        const next = pushHistory(state);
        const components = { ...state.project.components };
        components[node.id] = node;
        const newChildren = [...parent.children];
        const at = index ?? newChildren.length;
        newChildren.splice(at, 0, node.id);
        components[parentId] = { ...parent, children: newChildren };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: node.id });
        return node.id;
      },

      remove: (id) => {
        const state = get();
        if (id === state.project.rootId) return;
        const next = pushHistory(state);
        const components = { ...state.project.components };
        const collect = (rid: string, acc: string[]) => {
          acc.push(rid);
          components[rid]?.children.forEach((c) => collect(c, acc));
        };
        const toRemove: string[] = [];
        collect(id, toRemove);
        const node = components[id];
        if (node?.parentId) {
          const p = components[node.parentId];
          components[node.parentId] = { ...p, children: p.children.filter((c) => c !== id) };
        }
        toRemove.forEach((rid) => delete components[rid]);
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      rename: (id, name) => {
        const state = get();
        const node = state.project.components[id];
        if (!node) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, name } };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      updateProps: (id, patch) => {
        const state = get();
        const node = state.project.components[id];
        if (!node) return;
        const next = pushHistory(state);
        const components = {
          ...state.project.components,
          [id]: { ...node, props: { ...node.props, ...patch } },
        };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      move: (id, newParentId, index) => {
        const state = get();
        const node = state.project.components[id];
        const newParent = state.project.components[newParentId];
        if (!node || !newParent || id === newParentId) return;
        try {
          if (!getDef(newParent.type).acceptsChildren) return;
        } catch {
          return;
        }
        const subtreeContains = (subtreeRoot: string, nodeId: string): boolean => {
          if (subtreeRoot === nodeId) return true;
          const t = state.project.components[subtreeRoot];
          return t?.children.some((c) => subtreeContains(c, nodeId)) ?? false;
        };
        if (subtreeContains(id, newParentId)) return;

        const next = pushHistory(state);
        const components = { ...state.project.components };
        if (node.parentId) {
          const oldParent = components[node.parentId];
          components[node.parentId] = { ...oldParent, children: oldParent.children.filter((c) => c !== id) };
        }
        const targetChildren = [...components[newParentId].children];
        const at = Math.max(0, Math.min(index, targetChildren.length));
        targetChildren.splice(at, 0, id);
        components[newParentId] = { ...components[newParentId], children: targetChildren };
        components[id] = { ...node, parentId: newParentId };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      setHidden: (id, hidden) => {
        const state = get();
        const node = state.project.components[id];
        if (!node || node.hidden === hidden) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, hidden } };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      setLocked: (id, locked) => {
        const state = get();
        const node = state.project.components[id];
        if (!node || node.locked === locked) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, locked } };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      setTermSize: (cols, rows) => {
        const state = get();
        if (cols === state.project.termCols && rows === state.project.termRows) return;
        const next = pushHistory(state);
        const project = { ...state.project, termCols: cols, termRows: rows };
        saveProject(project);
        set({ ...next, project });
      },

      setTheme: (theme) => {
        const state = get();
        if (theme === state.project.theme) return;
        const next = pushHistory(state);
        const project = { ...state.project, theme };
        saveProject(project);
        set({ ...next, project });
      },

      reset: () => {
        const project = makeInitialProject();
        saveProject(project);
        set({ project, selectedId: null, past: [], future: [] });
      },

      loadFromJson: (json) => {
        try {
          const parsed = JSON.parse(json) as ProjectState;
          if (!parsed.rootId || !parsed.components || !parsed.components[parsed.rootId]) throw new Error('invalid');
          const migrated = migrateProject(parsed);
          saveProject(migrated);
          set({ project: migrated, selectedId: null, past: [], future: [] });
        } catch (e) {
          console.error('Failed to import project', e);
          alert('Could not import project: invalid JSON.');
        }
      },

      exportJson: () => JSON.stringify(get().project, null, 2),

      undo: () => {
        const state = get();
        const last = state.past[state.past.length - 1];
        if (!last) return;
        const future: UndoEntry[] = [
          ...state.future,
          { project: cloneProject(state.project), selectedId: state.selectedId },
        ];
        saveProject(last.project);
        set({
          project: last.project,
          selectedId: last.selectedId,
          past: state.past.slice(0, -1),
          future,
        });
      },

      redo: () => {
        const state = get();
        const next = state.future[state.future.length - 1];
        if (!next) return;
        const past: UndoEntry[] = [
          ...state.past,
          { project: cloneProject(state.project), selectedId: state.selectedId },
        ];
        saveProject(next.project);
        set({
          project: next.project,
          selectedId: next.selectedId,
          past,
          future: state.future.slice(0, -1),
        });
      },

      // ── Layer / screen actions ──────────────────────────────────────────

      addLayer: (name) => {
        const state = get();
        const layerName = name ?? `Screen ${(state.project.layers ?? []).length + 1}`;
        const { layer, nodes } = makeDefaultLayer(layerName);
        // Save current layer first
        const savedLayers = syncLayersArray(state.project);
        const newLayers = [...savedLayers, layer];
        const newIdx = newLayers.length - 1;
        const next = pushHistory(state);
        const newStep: TimelineStep = { id: uid('step'), layerId: layer.id, label: layerName };
        const project: ProjectState = {
          ...state.project,
          rootId: layer.rootId,
          components: nodes,
          layers: newLayers,
          activeLayerIndex: newIdx,
          timelineSteps: [...(state.project.timelineSteps ?? []), newStep],
        };
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      removeLayer: (index) => {
        const state = get();
        if ((state.project.layers ?? []).length <= 1) return; // must keep at least 1
        const next = pushHistory(state);
        const savedLayers = syncLayersArray(state.project);
        const removedLayer = savedLayers[index];
        const newLayers = savedLayers.filter((_, i) => i !== index);
        const newIdx = Math.min(state.project.activeLayerIndex ?? 0, newLayers.length - 1);
        const active = newLayers[newIdx]!;
        const timelineSteps = (state.project.timelineSteps ?? []).filter(s => s.layerId !== removedLayer?.id);
        const removedStepIds = (state.project.timelineSteps ?? [])
          .filter(s => s.layerId === removedLayer?.id).map(s => s.id);
        const timelineTransitions = (state.project.timelineTransitions ?? [])
          .filter(t => !removedStepIds.includes(t.fromStepId) && !removedStepIds.includes(t.toStepId));
        const project: ProjectState = {
          ...state.project,
          rootId: active.rootId,
          components: active.components,
          layers: newLayers,
          activeLayerIndex: newIdx,
          timelineSteps,
          timelineTransitions,
        };
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      renameLayer: (index, name) => {
        const state = get();
        const oldLayer = (state.project.layers ?? [])[index];
        if (!oldLayer) return;
        const next = pushHistory(state);
        const savedLayers = syncLayersArray(state.project);
        const newLayers = savedLayers.map((l, i) => i === index ? { ...l, name } : l);
        const timelineSteps = (state.project.timelineSteps ?? []).map((step) => {
          if (step.layerId !== oldLayer.id) return step;
          if (step.label && step.label !== oldLayer.name) return step;
          return { ...step, label: name };
        });
        const project = { ...state.project, layers: newLayers, timelineSteps };
        saveProject(project);
        set({ ...next, project });
      },

      switchLayer: (index) => {
        const state = get();
        if (index === state.project.activeLayerIndex) return;
        const savedLayers = syncLayersArray(state.project);
        if (index < 0 || index >= savedLayers.length) return;
        const active = savedLayers[index]!;
        const project: ProjectState = {
          ...state.project,
          rootId: active.rootId,
          components: active.components,
          layers: savedLayers,
          activeLayerIndex: index,
        };
        saveProject(project);
        set({ project, selectedId: null });
      },

      // ── Timeline actions ────────────────────────────────────────────────

      addTimelineStep: (layerId, label) => {
        const state = get();
        const step: TimelineStep = { id: uid('step'), layerId, label };
        const next = pushHistory(state);
        const project = {
          ...state.project,
          timelineSteps: [...(state.project.timelineSteps ?? []), step],
        };
        saveProject(project);
        set({ ...next, project });
      },

      removeTimelineStep: (stepId) => {
        const state = get();
        const next = pushHistory(state);
        const timelineSteps = (state.project.timelineSteps ?? []).filter(s => s.id !== stepId);
        const timelineTransitions = (state.project.timelineTransitions ?? [])
          .filter(t => t.fromStepId !== stepId && t.toStepId !== stepId);
        const project = { ...state.project, timelineSteps, timelineTransitions };
        saveProject(project);
        set({ ...next, project });
      },

      updateTimelineStep: (stepId, patch) => {
        const state = get();
        const next = pushHistory(state);
        const timelineSteps = (state.project.timelineSteps ?? []).map(s =>
          s.id === stepId ? { ...s, ...patch } : s
        );
        const project = { ...state.project, timelineSteps };
        saveProject(project);
        set({ ...next, project });
      },

      addTimelineTransition: (fromStepId, toStepId, event, trigger, label) => {
        const state = get();
        const next = pushHistory(state);
        const trans: TimelineTransition = {
          id: uid('trans'),
          fromStepId,
          toStepId,
          event,
          trigger,
          label,
        };
        const project = {
          ...state.project,
          timelineTransitions: [...(state.project.timelineTransitions ?? []), trans],
        };
        saveProject(project);
        set({ ...next, project });
      },

      removeTimelineTransition: (transId) => {
        const state = get();
        const next = pushHistory(state);
        const timelineTransitions = (state.project.timelineTransitions ?? []).filter(t => t.id !== transId);
        const project = { ...state.project, timelineTransitions };
        saveProject(project);
        set({ ...next, project });
      },

      updateTimelineTransition: (transId, patch) => {
        const state = get();
        const next = pushHistory(state);
        const timelineTransitions = (state.project.timelineTransitions ?? []).map(t =>
          t.id === transId ? { ...t, ...patch } : t
        );
        const project = { ...state.project, timelineTransitions };
        saveProject(project);
        set({ ...next, project });
      },
    }),
    { name: 'tui-builder' },
  ),
);

// Sync current rootId/components back into the layers array for the active layer.
function syncLayersArray(project: ProjectState): Layer[] {
  const layers = project.layers ?? [];
  const activeIdx = project.activeLayerIndex ?? 0;
  return layers.map((l, i) =>
    i === activeIdx
      ? { ...l, rootId: project.rootId, components: project.components }
      : l
  );
}

// Update the layers array in-place to reflect latest rootId/components.
function syncActiveLayer(project: ProjectState): ProjectState {
  const layers = syncLayersArray(project);
  return { ...project, layers };
}

export const selectComponent = (id: string | null) => (s: EditorState) =>
  id ? s.project.components[id] ?? null : null;
