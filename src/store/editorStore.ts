import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ComponentNode, ComponentProps, ComponentType, ProjectState, ThemeName } from '@/types/component';
import { getDef, makeNode } from '@/lib/componentDefs';
import { uid } from '@/lib/id';

const STORAGE_KEY = 'tui-builder.project.v1';

function makeInitialProject(): ProjectState {
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
  right.props = { ...right.props, direction: 'column', width: 'fill', border: 'single', title: ' Details ', padding: 1, gap: 1 };

  const rightText = makeNode('text', right.id);
  rightText.props = { ...rightText.props, text: 'Drag components from the left panel, or pick a layer to edit.' };
  right.children.push(rightText.id);

  const progress = makeNode('progressbar', right.id);
  right.children.push(progress.id);

  const button = makeNode('button', right.id);
  right.children.push(button.id);

  body.children.push(right.id);

  const status = makeNode('statusbar', rootId);

  root.children = [header.id, body.id, status.id];

  return {
    rootId,
    components: {
      [root.id]: root,
      [header.id]: header,
      [headerText.id]: headerText,
      [body.id]: body,
      [left.id]: left,
      [right.id]: right,
      [rightText.id]: rightText,
      [progress.id]: progress,
      [button.id]: button,
      [status.id]: status,
    },
    termCols: 100,
    termRows: 30,
    theme: 'tokyo-night',
  };
}

function loadProject(): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialProject();
    const parsed = JSON.parse(raw) as ProjectState;
    if (!parsed.rootId || !parsed.components?.[parsed.rootId]) return makeInitialProject();
    return parsed;
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
}

const cloneProject = (p: ProjectState): ProjectState => ({
  ...p,
  components: Object.fromEntries(
    Object.entries(p.components).map(([k, v]) => [k, { ...v, children: [...v.children], props: { ...v.props } }]),
  ),
});

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
        if (!getDef(parent.type).acceptsChildren) return '';
        const node = makeNode(type, parentId);
        const next = pushHistory(state);
        const components = { ...state.project.components };
        components[node.id] = node;
        const newChildren = [...parent.children];
        const at = index ?? newChildren.length;
        newChildren.splice(at, 0, node.id);
        components[parentId] = { ...parent, children: newChildren };
        const project = { ...state.project, components };
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
        const project = { ...state.project, components };
        saveProject(project);
        set({ ...next, project, selectedId: null });
      },

      rename: (id, name) => {
        const state = get();
        const node = state.project.components[id];
        if (!node) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, name } };
        const project = { ...state.project, components };
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
        const project = { ...state.project, components };
        saveProject(project);
        set({ ...next, project });
      },

      move: (id, newParentId, index) => {
        const state = get();
        const node = state.project.components[id];
        const newParent = state.project.components[newParentId];
        if (!node || !newParent || id === newParentId) return;
        if (!getDef(newParent.type).acceptsChildren) return;
        // Disallow moving into own descendant.
        const isDescendant = (target: string, ancestor: string): boolean => {
          if (target === ancestor) return true;
          const t = state.project.components[target];
          return t?.children.some((c) => isDescendant(c, ancestor)) ?? false;
        };
        if (isDescendant(id, newParentId)) return;

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
        const project = { ...state.project, components };
        saveProject(project);
        set({ ...next, project });
      },

      setHidden: (id, hidden) => {
        const state = get();
        const node = state.project.components[id];
        if (!node || node.hidden === hidden) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, hidden } };
        const project = { ...state.project, components };
        saveProject(project);
        set({ ...next, project });
      },

      setLocked: (id, locked) => {
        const state = get();
        const node = state.project.components[id];
        if (!node || node.locked === locked) return;
        const next = pushHistory(state);
        const components = { ...state.project.components, [id]: { ...node, locked } };
        const project = { ...state.project, components };
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
          if (!parsed.rootId || !parsed.components) throw new Error('invalid');
          saveProject(parsed);
          set({ project: parsed, selectedId: null, past: [], future: [] });
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
    }),
    { name: 'tui-builder' },
  ),
);

export const selectComponent = (id: string | null) => (s: EditorState) =>
  id ? s.project.components[id] ?? null : null;
