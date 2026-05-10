import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ComponentNode,
  ComponentProps,
  ComponentType,
  ComponentVariant,
  DesignToken,
  KeyboardShortcutMap,
  Layer,
  MockDataset,
  ProjectMetadata,
  ProjectState,
  StateVariantProps,
  ThemeName,
  TimelineStep,
  TimelineTransition,
  UserPreferences,
} from '@/types/component';
import { getDef, makeNode } from '@/lib/componentDefs';
import { uid } from '@/lib/id';
import { variantFromSubtree, cloneSubtreeWithNewIds } from '@/lib/variantUtils';
import { DEFAULT_DESIGN_TOKENS } from '@/lib/designTokens';
import { getAutosave } from '@/lib/autosave';
import type { ViewportPreset } from '@/lib/viewportPresets';

const STORAGE_KEY = 'projectui.project.v1';

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
  header.props = { ...header.props, direction: 'row', height: 3, border: 'rounded', title: ' ProjecTUI ', padding: 0 };

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
    tokens: JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS)) as DesignToken[],
    mockDatasets: [],
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
    project = { ...project, timelineSteps: makeTimelineStepsForLayers(project.layers ?? []) };
  }
  if (!project.timelineTransitions) {
    project = { ...project, timelineTransitions: [] };
  }
  if (!project.tokens) {
    project = { ...project, tokens: JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS)) as DesignToken[] };
  }
  if (!project.mockDatasets) {
    project = { ...project, mockDatasets: [] };
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
  label?: string;
}

interface EditorState {
  project: ProjectState;
  selectedId: string | null;
  hoverId: string | null;
  // history
  past: UndoEntry[];
  future: UndoEntry[];
  undoLabel: () => string | undefined;
  redoLabel: () => string | undefined;
  // preferences
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  // keyboard shortcuts
  keyboardShortcuts: KeyboardShortcutMap;
  setKeyboardShortcut: (action: string, combo: string) => void;
  resetKeyboardShortcuts: () => void;
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
  // Variant actions
  saveVariant: (nodeId: string, name: string) => void;
  deleteVariant: (variantId: string) => void;
  instantiateVariant: (variantId: string, parentId: string, index?: number) => string;
  // Layer duplicate
  duplicateLayer: (index: number) => void;
  // Copy / paste
  clipboardId: string | null;
  copyNode: (id: string) => void;
  pasteNode: (parentId: string) => string;
  // Multi-select
  selectedIds: Set<string>;
  toggleSelectId: (id: string) => void;
  clearMultiSelect: () => void;
  removeSelected: () => void;
  // Grouping & alignment (Idea #3)
  groupNodes: (ids: string[], parentId: string) => string;
  ungroupNode: (id: string) => void;
  alignNodes: (ids: string[], alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  distributeNodes: (ids: string[], axis: 'horizontal' | 'vertical') => void;
  // Viewport presets (Idea #5)
  applyViewportPreset: (preset: ViewportPreset) => void;
  // Design token actions (Idea #1)
  addToken: (token: Omit<DesignToken, 'id'>) => string;
  removeToken: (id: string) => void;
  updateToken: (id: string, value: string) => void;
  renameToken: (id: string, name: string) => void;
  // Mock dataset actions (Idea #6)
  addMockDataset: (name: string, data: unknown[]) => string;
  removeMockDataset: (id: string) => void;
  updateMockDataset: (id: string, data: unknown[]) => void;
  bindMockData: (nodeId: string, datasetId: string) => void;
  // State variants (Idea #6)
  setNodeStateVariant: (nodeId: string, state: string, props: StateVariantProps) => void;
  removeNodeStateVariant: (nodeId: string, state: string) => void;
  // Project metadata (Idea #10)
  setProjectMetadata: (meta: ProjectMetadata) => void;
  // Recovery snapshots (Idea #10)
  restoreAutosave: (index: number) => void;
}

const PREFS_KEY = 'projectui.preferences.v1';
const SHORTCUTS_KEY = 'projectui.shortcuts.v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'tokyo-night',
  editorUiTheme: 'dark',
  showGrid: false,
  showRulers: false,
  snapToGrid: false,
  gridSize: 4,
  animationsEnabled: true,
  reducedMotion: false,
  autoSaveIntervalMs: 30000,
  language: 'en',
};

const DEFAULT_SHORTCUTS: KeyboardShortcutMap = {
  'undo': 'Meta+z',
  'redo': 'Meta+Shift+z',
  'delete': 'Backspace',
  'copy': 'Meta+c',
  'paste': 'Meta+v',
  'duplicate': 'Meta+d',
  'selectAll': 'Meta+a',
  'commandPalette': 'Meta+k',
  'save': 'Meta+s',
  'export': 'Meta+e',
  'toggleGrid': "Meta+'",
  'toggleRulers': 'Meta+r',
  'zoomIn': 'Meta+=',
  'zoomOut': 'Meta+-',
  'zoomReset': 'Meta+0',
};

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

function loadShortcuts(): KeyboardShortcutMap {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUTS };
    return Object.assign({}, DEFAULT_SHORTCUTS, JSON.parse(raw) as Partial<KeyboardShortcutMap>) as KeyboardShortcutMap;
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

function saveShortcuts(shortcuts: KeyboardShortcutMap): void {
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  } catch {
    /* quota */
  }
}

const cloneProject = (p: ProjectState): ProjectState => JSON.parse(JSON.stringify(p)) as ProjectState;

function pushHistory(state: EditorState, label?: string): Pick<EditorState, 'past' | 'future'> {
  const entry: UndoEntry = { project: cloneProject(state.project), selectedId: state.selectedId, label };
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
      clipboardId: null,
      selectedIds: new Set<string>(),
      preferences: loadPreferences(),
      keyboardShortcuts: loadShortcuts(),

      undoLabel: () => get().past.at(-1)?.label,
      redoLabel: () => get().future.at(0)?.label,

      setPreference: (key, value) => {
        const prefs = { ...get().preferences, [key]: value };
        savePreferences(prefs);
        set({ preferences: prefs });
      },

      resetPreferences: () => {
        const prefs = { ...DEFAULT_PREFERENCES };
        savePreferences(prefs);
        set({ preferences: prefs });
      },

      setKeyboardShortcut: (action, combo) => {
        const shortcuts = { ...get().keyboardShortcuts, [action]: combo };
        saveShortcuts(shortcuts);
        set({ keyboardShortcuts: shortcuts });
      },

      resetKeyboardShortcuts: () => {
        const shortcuts = { ...DEFAULT_SHORTCUTS };
        saveShortcuts(shortcuts);
        set({ keyboardShortcuts: shortcuts });
      },

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
        const next = pushHistory(state, 'Add ' + type);
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
        const next = pushHistory(state, 'Delete');
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
        const next = pushHistory(state, 'Rename');
        const components = { ...state.project.components, [id]: { ...node, name } };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      updateProps: (id, patch) => {
        const state = get();
        const node = state.project.components[id];
        if (!node) return;
        const next = pushHistory(state, 'Edit props');
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

        const next = pushHistory(state, 'Move');
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
        } catch {
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
          { project: cloneProject(state.project), selectedId: state.selectedId, label: last.label },
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

      // ── Variant actions ─────────────────────────────────────────────────

      saveVariant: (nodeId, name) => {
        const state = get();
        const node = state.project.components[nodeId];
        if (!node) return;
        const variant: ComponentVariant = variantFromSubtree(state.project.components, nodeId, name);
        const variants = [...(state.project.variants ?? []), variant];
        const project = { ...state.project, variants };
        saveProject(project);
        set({ project });
      },

      deleteVariant: (variantId) => {
        const state = get();
        const variants = (state.project.variants ?? []).filter((v) => v.id !== variantId);
        const project = { ...state.project, variants };
        saveProject(project);
        set({ project });
      },

      instantiateVariant: (variantId, parentId, index) => {
        const state = get();
        const variant = (state.project.variants ?? []).find((v) => v.id === variantId);
        const parent = state.project.components[parentId];
        if (!variant || !parent) return '';
        try {
          if (!getDef(parent.type).acceptsChildren) return '';
        } catch {
          return '';
        }
        const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(
          variant.nodes,
          variant.rootNodeId,
          parentId,
        );
        const next = pushHistory(state);
        const components = { ...state.project.components, ...cloned };
        const newChildren = [...parent.children];
        const at = index ?? newChildren.length;
        newChildren.splice(at, 0, newRootId);
        components[parentId] = { ...parent, children: newChildren };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: newRootId });
        return newRootId;
      },
      // ── Duplicate layer ─────────────────────────────────────────────────
      duplicateLayer: (index) => {
        const state = get();
        const savedLayers = syncLayersArray(state.project);
        const source = savedLayers[index];
        if (!source) return;
        const { nodes: clonedNodes, rootId: newRootId } = cloneSubtreeWithNewIds(
          source.components,
          source.rootId,
          null,
        );
        const newLayer: Layer = {
          id: uid('layer'),
          name: `${source.name} (copy)`,
          rootId: newRootId,
          components: clonedNodes,
        };
        const newLayers = [...savedLayers, newLayer];
        const newIdx = newLayers.length - 1;
        const next = pushHistory(state);
        const newStep: TimelineStep = { id: uid('step'), layerId: newLayer.id, label: newLayer.name };
        const project: ProjectState = {
          ...state.project,
          rootId: newLayer.rootId,
          components: newLayer.components,
          layers: newLayers,
          activeLayerIndex: newIdx,
          timelineSteps: [...(state.project.timelineSteps ?? []), newStep],
        };
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      // ── Copy / paste ────────────────────────────────────────────────────
      copyNode: (id) => {
        const node = get().project.components[id];
        if (!node) return;
        set({ clipboardId: id });
      },

      pasteNode: (parentId) => {
        const state = get();
        const clipId = state.clipboardId;
        if (!clipId) return '';
        const sourceNode = state.project.components[clipId];
        const parent = state.project.components[parentId];
        if (!sourceNode || !parent) return '';
        try {
          if (!getDef(parent.type).acceptsChildren) return '';
        } catch {
          return '';
        }
        const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(
          state.project.components,
          clipId,
          parentId,
        );
        const next = pushHistory(state);
        const components = { ...state.project.components, ...cloned };
        const newChildren = [...parent.children, newRootId];
        components[parentId] = { ...parent, children: newChildren };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: newRootId });
        return newRootId;
      },

      // ── Multi-select ────────────────────────────────────────────────────
      toggleSelectId: (id) => {
        const current = get().selectedIds;
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        set({ selectedIds: next });
      },

      clearMultiSelect: () => {
        set({ selectedIds: new Set() });
      },

      removeSelected: () => {
        const state = get();
        const ids = Array.from(state.selectedIds);
        if (ids.length === 0) return;
        const next = pushHistory(state);
        const components = { ...state.project.components };
        const rootId = state.project.rootId;
        ids.forEach((id) => {
          if (id === rootId) return;
          const collect = (rid: string) => {
            delete components[rid];
            (state.project.components[rid]?.children ?? []).forEach(collect);
          };
          const node = components[id];
          if (node?.parentId) {
            const p = components[node.parentId];
            if (p) components[node.parentId] = { ...p, children: p.children.filter((c) => c !== id) };
          }
          collect(id);
        });
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: null, selectedIds: new Set() });
      },

      // ── Grouping & Alignment (Idea #3) ──────────────────────────────────
      groupNodes: (ids, parentId) => {
        const state = get();
        if (ids.length === 0) return '';
        const parent = state.project.components[parentId];
        if (!parent) return '';
        const next = pushHistory(state, 'Group');
        const components = { ...state.project.components };
        const group = makeNode('container', parentId);
        group.props = { ...group.props, direction: 'column', border: 'none', padding: 0 };
        components[group.id] = group;
        const groupChildren: string[] = [];
        for (const id of ids) {
          const node = components[id];
          if (!node) continue;
          components[id] = { ...node, parentId: group.id };
          groupChildren.push(id);
        }
        components[group.id] = { ...components[group.id], children: groupChildren };
        const parentChildren = parent.children.filter((c) => !ids.includes(c));
        const firstIdx = parent.children.findIndex((c) => ids.includes(c));
        const insertAt = firstIdx >= 0 ? firstIdx : parentChildren.length;
        parentChildren.splice(insertAt, 0, group.id);
        components[parentId] = { ...parent, children: parentChildren };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: group.id });
        return group.id;
      },

      ungroupNode: (id) => {
        const state = get();
        const node = state.project.components[id];
        if (!node || !node.parentId) return;
        const parent = state.project.components[node.parentId];
        if (!parent) return;
        const next = pushHistory(state, 'Ungroup');
        const components = { ...state.project.components };
        const insertIdx = parent.children.indexOf(id);
        const newParentChildren = [...parent.children];
        newParentChildren.splice(insertIdx, 1, ...node.children);
        components[node.parentId] = { ...parent, children: newParentChildren };
        for (const childId of node.children) {
          const child = components[childId];
          if (child) components[childId] = { ...child, parentId: node.parentId };
        }
        delete components[id];
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      alignNodes: (ids, alignment) => {
        const state = get();
        if (ids.length === 0) return;
        const next = pushHistory(state);
        const components = { ...state.project.components };
        const nodes = ids.map((id) => components[id]).filter(Boolean);
        if (nodes.length === 0) return;

        if (alignment === 'left') {
          const minX = Math.min(...nodes.map((n) => n.props.x ?? 0));
          for (const id of ids) {
            const n = components[id];
            if (n) components[id] = { ...n, props: { ...n.props, x: minX } };
          }
        } else if (alignment === 'right') {
          const maxX = Math.max(...nodes.map((n) => (n.props.x ?? 0) + (typeof n.props.width === 'number' ? n.props.width : 0)));
          for (const id of ids) {
            const n = components[id];
            const w = typeof n?.props.width === 'number' ? n.props.width : 0;
            if (n) components[id] = { ...n, props: { ...n.props, x: maxX - w } };
          }
        } else if (alignment === 'top') {
          const minY = Math.min(...nodes.map((n) => n.props.y ?? 0));
          for (const id of ids) {
            const n = components[id];
            if (n) components[id] = { ...n, props: { ...n.props, y: minY } };
          }
        } else if (alignment === 'bottom') {
          const maxY = Math.max(...nodes.map((n) => (n.props.y ?? 0) + (typeof n.props.height === 'number' ? n.props.height : 0)));
          for (const id of ids) {
            const n = components[id];
            const h = typeof n?.props.height === 'number' ? n.props.height : 0;
            if (n) components[id] = { ...n, props: { ...n.props, y: maxY - h } };
          }
        } else if (alignment === 'center-h') {
          const xs = nodes.map((n) => n.props.x ?? 0);
          const widths = nodes.map((n) => (typeof n.props.width === 'number' ? n.props.width : 0));
          const centerX = (Math.min(...xs) + Math.max(...xs.map((x, i) => x + widths[i]))) / 2;
          for (const id of ids) {
            const n = components[id];
            const w = typeof n?.props.width === 'number' ? n.props.width : 0;
            if (n) components[id] = { ...n, props: { ...n.props, x: Math.round(centerX - w / 2) } };
          }
        } else if (alignment === 'center-v') {
          const ys = nodes.map((n) => n.props.y ?? 0);
          const heights = nodes.map((n) => (typeof n.props.height === 'number' ? n.props.height : 0));
          const centerY = (Math.min(...ys) + Math.max(...ys.map((y, i) => y + heights[i]))) / 2;
          for (const id of ids) {
            const n = components[id];
            const h = typeof n?.props.height === 'number' ? n.props.height : 0;
            if (n) components[id] = { ...n, props: { ...n.props, y: Math.round(centerY - h / 2) } };
          }
        }

        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      distributeNodes: (ids, axis) => {
        const state = get();
        if (ids.length < 3) return;
        const next = pushHistory(state);
        const components = { ...state.project.components };
        const nodes = ids.map((id) => components[id]).filter(Boolean);
        if (nodes.length < 3) return;

        if (axis === 'horizontal') {
          const sorted = [...nodes].sort((a, b) => (a.props.x ?? 0) - (b.props.x ?? 0));
          const first = sorted[0].props.x ?? 0;
          const lastNode = sorted[sorted.length - 1];
          const lastX = (lastNode.props.x ?? 0) + (typeof lastNode.props.width === 'number' ? lastNode.props.width : 0);
          const totalWidth = sorted.reduce((sum, n) => sum + (typeof n.props.width === 'number' ? n.props.width : 0), 0);
          const gap = (lastX - first - totalWidth) / (sorted.length - 1);
          let cursor = first;
          for (const n of sorted) {
            const w = typeof n.props.width === 'number' ? n.props.width : 0;
            components[n.id] = { ...n, props: { ...n.props, x: Math.round(cursor) } };
            cursor += w + gap;
          }
        } else {
          const sorted = [...nodes].sort((a, b) => (a.props.y ?? 0) - (b.props.y ?? 0));
          const first = sorted[0].props.y ?? 0;
          const lastNode = sorted[sorted.length - 1];
          const lastY = (lastNode.props.y ?? 0) + (typeof lastNode.props.height === 'number' ? lastNode.props.height : 0);
          const totalHeight = sorted.reduce((sum, n) => sum + (typeof n.props.height === 'number' ? n.props.height : 0), 0);
          const gap = (lastY - first - totalHeight) / (sorted.length - 1);
          let cursor = first;
          for (const n of sorted) {
            const h = typeof n.props.height === 'number' ? n.props.height : 0;
            components[n.id] = { ...n, props: { ...n.props, y: Math.round(cursor) } };
            cursor += h + gap;
          }
        }

        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      // ── Viewport presets (Idea #5) ───────────────────────────────────────
      applyViewportPreset: (preset) => {
        const state = get();
        if (preset.cols === state.project.termCols && preset.rows === state.project.termRows) return;
        const next = pushHistory(state);
        const project = { ...state.project, termCols: preset.cols, termRows: preset.rows };
        saveProject(project);
        set({ ...next, project });
      },

      // ── Design token actions (Idea #1) ───────────────────────────────────
      addToken: (tokenData) => {
        const state = get();
        const token: DesignToken = { id: uid('token'), ...tokenData };
        const next = pushHistory(state);
        const tokens = [...(state.project.tokens ?? []), token];
        const project = { ...state.project, tokens };
        saveProject(project);
        set({ ...next, project });
        return token.id;
      },

      removeToken: (id) => {
        const state = get();
        const next = pushHistory(state);
        const tokens = (state.project.tokens ?? []).filter((t) => t.id !== id);
        const project = { ...state.project, tokens };
        saveProject(project);
        set({ ...next, project });
      },

      updateToken: (id, value) => {
        const state = get();
        const next = pushHistory(state);
        const tokens = (state.project.tokens ?? []).map((t) => t.id === id ? { ...t, value } : t);
        const project = { ...state.project, tokens };
        saveProject(project);
        set({ ...next, project });
      },

      renameToken: (id, name) => {
        const state = get();
        const next = pushHistory(state);
        const tokens = (state.project.tokens ?? []).map((t) => t.id === id ? { ...t, name } : t);
        const project = { ...state.project, tokens };
        saveProject(project);
        set({ ...next, project });
      },

      // ── Mock dataset actions (Idea #6) ───────────────────────────────────
      addMockDataset: (name, data) => {
        const state = get();
        const next = pushHistory(state);
        const dataset: MockDataset = { id: uid('ds'), name, data };
        const mockDatasets = [...(state.project.mockDatasets ?? []), dataset];
        const project = { ...state.project, mockDatasets };
        saveProject(project);
        set({ ...next, project });
        return dataset.id;
      },

      removeMockDataset: (id) => {
        const state = get();
        const next = pushHistory(state);
        const mockDatasets = (state.project.mockDatasets ?? []).filter((d) => d.id !== id);
        const project = { ...state.project, mockDatasets };
        saveProject(project);
        set({ ...next, project });
      },

      updateMockDataset: (id, data) => {
        const state = get();
        const next = pushHistory(state);
        const mockDatasets = (state.project.mockDatasets ?? []).map((d) => d.id === id ? { ...d, data } : d);
        const project = { ...state.project, mockDatasets };
        saveProject(project);
        set({ ...next, project });
      },

      bindMockData: (nodeId, datasetId) => {
        const state = get();
        const node = state.project.components[nodeId];
        if (!node) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [nodeId]: { ...node, props: { ...node.props, mockDatasetId: datasetId } } };
        const project = syncActiveLayer({ ...state.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      // ── State variant actions (Idea #6) ─────────────────────────────────
      setNodeStateVariant: (nodeId, state: string, props) => {
        const editorState = get();
        const node = editorState.project.components[nodeId];
        if (!node) return;
        const next = pushHistory(editorState);
        const stateVariants = { ...(node.stateVariants ?? {}), [state]: props };
        const components = { ...editorState.project.components, [nodeId]: { ...node, stateVariants } };
        const project = syncActiveLayer({ ...editorState.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      removeNodeStateVariant: (nodeId, variantState) => {
        const editorState = get();
        const node = editorState.project.components[nodeId];
        if (!node) return;
        const next = pushHistory(editorState);
        const stateVariants = { ...(node.stateVariants ?? {}) };
        delete stateVariants[variantState];
        const components = { ...editorState.project.components, [nodeId]: { ...node, stateVariants } };
        const project = syncActiveLayer({ ...editorState.project, components });
        saveProject(project);
        set({ ...next, project });
      },

      // ── Project metadata (Idea #10) ─────────────────────────────────────
      setProjectMetadata: (meta) => {
        const state = get();
        const next = pushHistory(state);
        const metadata = { ...(state.project.metadata ?? {}), ...meta };
        const project = { ...state.project, metadata };
        saveProject(project);
        set({ ...next, project });
      },

      // ── Recovery snapshots (Idea #10) ────────────────────────────────────
      restoreAutosave: (index) => {
        const saved = getAutosave(index);
        if (!saved) return;
        const migrated = migrateProject(saved);
        saveProject(migrated);
        set({ project: migrated, selectedId: null, past: [], future: [] });
      },
    }),
    { name: 'ProjecTUI' },
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
