// Built-in project templates for the template gallery (A-J).
import type { ProjectState } from '@/types/component';
import { uid } from './id';

function makeId(prefix: string) { return uid(prefix); }

export interface Template {
  id: string;
  name: string;
  description: string;
  make: () => ProjectState;
}

function dashboardTemplate(): ProjectState {
  const rootId = makeId('root');
  const headerId = makeId('container');
  const headerTextId = makeId('text');
  const bodyId = makeId('container');
  const sidebarId = makeId('list');
  const contentId = makeId('container');
  const tableId = makeId('table');
  const statusId = makeId('statusbar');

  return {
    rootId,
    components: {
      [rootId]: { id: rootId, type: 'container', parentId: null, children: [headerId, bodyId, statusId], props: { direction: 'column', width: 'fill', height: 'fill', padding: 0, border: 'none' }, name: 'App' },
      [headerId]: { id: headerId, type: 'container', parentId: rootId, children: [headerTextId], props: { direction: 'row', height: 3, border: 'rounded', title: ' Dashboard ', padding: 1 } },
      [headerTextId]: { id: headerTextId, type: 'text', parentId: headerId, children: [], props: { text: 'System Monitor', fg: 'brightCyan', bold: true } },
      [bodyId]: { id: bodyId, type: 'container', parentId: rootId, children: [sidebarId, contentId], props: { direction: 'row', height: 'fill', border: 'none', padding: 0, gap: 1 } },
      [sidebarId]: { id: sidebarId, type: 'list', parentId: bodyId, children: [], props: { items: ['Overview', 'Processes', 'Network', 'Disks', 'Settings'], selectedIndex: 0, width: 20, border: 'single', title: ' Menu ' } },
      [contentId]: { id: contentId, type: 'container', parentId: bodyId, children: [tableId], props: { direction: 'column', width: 'fill', border: 'single', title: ' Processes ', padding: 1 } },
      [tableId]: { id: tableId, type: 'table', parentId: contentId, children: [], props: { columns: ['PID', 'Name', 'CPU%', 'MEM%'], rows: [['1234', 'nginx', '0.5', '1.2'], ['5678', 'postgres', '2.1', '8.4'], ['9012', 'redis', '0.1', '0.3']], width: 'fill', height: 'fill', border: 'none' } },
      [statusId]: { id: statusId, type: 'statusbar', parentId: rootId, children: [], props: { text: ' q: quit  ·  ↑↓: navigate  ·  enter: select', width: 'fill', height: 1, fg: 'black', bg: 'cyan' } },
    },
    termCols: 100,
    termRows: 30,
    theme: 'tokyo-night',
    layers: [{ id: makeId('layer'), name: 'Dashboard', rootId, components: {} }],
    activeLayerIndex: 0,
    timelineSteps: [],
    timelineTransitions: [],
  };
}

function loginFormTemplate(): ProjectState {
  const rootId = makeId('root');
  const centerId = makeId('container');
  const titleId = makeId('asciitext');
  const userInputId = makeId('input');
  const passInputId = makeId('input');
  const submitId = makeId('button');
  const statusId = makeId('statusbar');

  return {
    rootId,
    components: {
      [rootId]: { id: rootId, type: 'container', parentId: null, children: [centerId, statusId], props: { direction: 'column', width: 'fill', height: 'fill', padding: 0, border: 'none', align: 'center', justify: 'center' }, name: 'App' },
      [centerId]: { id: centerId, type: 'container', parentId: rootId, children: [titleId, userInputId, passInputId, submitId], props: { direction: 'column', width: 40, height: 16, border: 'double', title: ' Login ', padding: 2, gap: 1 } },
      [titleId]: { id: titleId, type: 'asciitext', parentId: centerId, children: [], props: { text: 'LOGIN', width: 'fill', height: 5, fg: 'brightCyan' } },
      [userInputId]: { id: userInputId, type: 'input', parentId: centerId, children: [], props: { placeholder: 'Username', width: 'fill', height: 3, border: 'single', focusable: true } },
      [passInputId]: { id: passInputId, type: 'input', parentId: centerId, children: [], props: { placeholder: 'Password', width: 'fill', height: 3, border: 'single', focusable: true } },
      [submitId]: { id: submitId, type: 'button', parentId: centerId, children: [], props: { text: 'Sign In', width: 'fill', height: 3, border: 'rounded', fg: 'black', bg: 'brightCyan', focusable: true } },
      [statusId]: { id: statusId, type: 'statusbar', parentId: rootId, children: [], props: { text: ' tab: next field  ·  enter: submit  ·  q: quit', width: 'fill', height: 1, fg: 'black', bg: 'brightBlack' } },
    },
    termCols: 80,
    termRows: 24,
    theme: 'dracula',
    layers: [{ id: makeId('layer'), name: 'Login', rootId, components: {} }],
    activeLayerIndex: 0,
    timelineSteps: [],
    timelineTransitions: [],
  };
}

function fileManagerTemplate(): ProjectState {
  const rootId = makeId('root');
  const headerId = makeId('container');
  const titleId = makeId('text');
  const bodyId = makeId('container');
  const leftId = makeId('container');
  const fileListId = makeId('filepicker');
  const rightId = makeId('container');
  const previewId = makeId('textarea');
  const statusId = makeId('statusbar');

  return {
    rootId,
    components: {
      [rootId]: { id: rootId, type: 'container', parentId: null, children: [headerId, bodyId, statusId], props: { direction: 'column', width: 'fill', height: 'fill', padding: 0, border: 'none' }, name: 'App' },
      [headerId]: { id: headerId, type: 'container', parentId: rootId, children: [titleId], props: { direction: 'row', height: 3, border: 'single', title: ' File Manager ', padding: 1 } },
      [titleId]: { id: titleId, type: 'text', parentId: headerId, children: [], props: { text: '~/Documents', fg: 'brightGreen' } },
      [bodyId]: { id: bodyId, type: 'container', parentId: rootId, children: [leftId, rightId], props: { direction: 'row', height: 'fill', border: 'none', padding: 0, gap: 0 } },
      [leftId]: { id: leftId, type: 'container', parentId: bodyId, children: [fileListId], props: { direction: 'column', width: 35, border: 'single', title: ' Files ', padding: 0 } },
      [fileListId]: { id: fileListId, type: 'filepicker', parentId: leftId, children: [], props: { width: 'fill', height: 'fill', border: 'none', items: ['📁 Documents', '📁 Projects', '📁 Downloads', '📄 README.md', '📄 config.toml', '📄 notes.txt'] } },
      [rightId]: { id: rightId, type: 'container', parentId: bodyId, children: [previewId], props: { direction: 'column', width: 'fill', border: 'single', title: ' Preview ', padding: 1 } },
      [previewId]: { id: previewId, type: 'textarea', parentId: rightId, children: [], props: { value: '# README\n\nSelect a file to preview its contents here.', width: 'fill', height: 'fill', border: 'none' } },
      [statusId]: { id: statusId, type: 'statusbar', parentId: rootId, children: [], props: { text: ' enter: open  ·  d: delete  ·  r: rename  ·  q: quit', width: 'fill', height: 1, fg: 'black', bg: 'green' } },
    },
    termCols: 100,
    termRows: 30,
    theme: 'solarized-dark',
    layers: [{ id: makeId('layer'), name: 'File Manager', rootId, components: {} }],
    activeLayerIndex: 0,
    timelineSteps: [],
    timelineTransitions: [],
  };
}

function settingsTemplate(): ProjectState {
  const rootId = makeId('root');
  const tabsId = makeId('tabs');
  const bodyId = makeId('container');
  const themeSelectId = makeId('select');
  const boldCheckId = makeId('checkbox');
  const progressId = makeId('progressbar');
  const saveId = makeId('button');
  const statusId = makeId('statusbar');

  return {
    rootId,
    components: {
      [rootId]: { id: rootId, type: 'container', parentId: null, children: [tabsId, bodyId, statusId], props: { direction: 'column', width: 'fill', height: 'fill', padding: 0, border: 'none' }, name: 'App' },
      [tabsId]: { id: tabsId, type: 'tabs', parentId: rootId, children: [], props: { items: ['General', 'Appearance', 'Keybindings', 'Advanced'], selectedIndex: 1, width: 'fill', height: 1 } },
      [bodyId]: { id: bodyId, type: 'container', parentId: rootId, children: [themeSelectId, boldCheckId, progressId, saveId], props: { direction: 'column', width: 'fill', height: 'fill', border: 'single', title: ' Appearance ', padding: 2, gap: 1 } },
      [themeSelectId]: { id: themeSelectId, type: 'select', parentId: bodyId, children: [], props: { items: ['Dark', 'Light', 'High Contrast', 'Solarized'], selectedIndex: 0, width: 'fill', height: 3, border: 'single', focusable: true } },
      [boldCheckId]: { id: boldCheckId, type: 'checkbox', parentId: bodyId, children: [], props: { label: 'Bold font', checked: true, focusable: true } },
      [progressId]: { id: progressId, type: 'progressbar', parentId: bodyId, children: [], props: { progress: 0.75, width: 'fill', height: 1, fg: 'brightBlue' } },
      [saveId]: { id: saveId, type: 'button', parentId: bodyId, children: [], props: { text: 'Save Settings', width: 20, height: 3, border: 'rounded', fg: 'black', bg: 'brightBlue', focusable: true } },
      [statusId]: { id: statusId, type: 'statusbar', parentId: rootId, children: [], props: { text: ' tab: next  ·  enter: activate  ·  s: save  ·  q: quit', width: 'fill', height: 1, fg: 'black', bg: 'blue' } },
    },
    termCols: 80,
    termRows: 24,
    theme: 'tokyo-night',
    layers: [{ id: makeId('layer'), name: 'Settings', rootId, components: {} }],
    activeLayerIndex: 0,
    timelineSteps: [],
    timelineTransitions: [],
  };
}

export const TEMPLATES: Template[] = [
  { id: 'dashboard', name: 'System Dashboard', description: 'Process list with sidebar navigation and status bar', make: dashboardTemplate },
  { id: 'login', name: 'Login Form', description: 'Centered login form with ASCII title and inputs', make: loginFormTemplate },
  { id: 'file-manager', name: 'File Manager', description: 'Dual-pane file browser with preview panel', make: fileManagerTemplate },
  { id: 'settings', name: 'Settings Screen', description: 'Tabbed settings page with select, checkbox and progress', make: settingsTemplate },
];
