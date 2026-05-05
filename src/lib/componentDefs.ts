import type { ComponentNode, ComponentProps, ComponentType } from '@/types/component';
import { uid } from './id';

export interface ComponentDef {
  type: ComponentType;
  label: string;
  group: 'layout' | 'basic' | 'advanced';
  icon: string; // single-char glyph rendered in the palette
  description: string;
  defaults: ComponentProps;
  acceptsChildren: boolean;
}

export const COMPONENT_DEFS: ComponentDef[] = [
  // ── Layout ───────────────────────────────────────────────────────────────
  {
    type: 'container',
    label: 'Container',
    group: 'layout',
    icon: '▦',
    description: 'Box that lays out children in a row or column.',
    acceptsChildren: true,
    defaults: {
      direction: 'column',
      width: 'fill',
      height: 'fill',
      padding: 1,
      gap: 0,
      border: 'single',
      title: '',
    },
  },
  {
    type: 'grid',
    label: 'Grid',
    group: 'layout',
    icon: '⊞',
    description: '2D grid container. Place fill-width children here to arrange them in columns.',
    acceptsChildren: true,
    defaults: {
      gridCols: 2,
      gridGap: 1,
      width: 'fill',
      height: 'fill',
      padding: 0,
      border: 'none',
    },
  },
  {
    type: 'viewport',
    label: 'Viewport',
    group: 'layout',
    icon: '▣',
    description: 'Scrollable content area.',
    acceptsChildren: true,
    defaults: {
      direction: 'column',
      width: 'fill',
      height: 'fill',
      padding: 1,
      border: 'single',
      title: ' Viewport ',
    },
  },
  // ── Basic ─────────────────────────────────────────────────────────────────
  {
    type: 'text',
    label: 'Text',
    group: 'basic',
    icon: 'T',
    description: 'Static text label.',
    acceptsChildren: false,
    defaults: { text: 'Hello, world', width: 'auto', height: 'auto' },
  },
  {
    type: 'button',
    label: 'Button',
    group: 'basic',
    icon: '⏵',
    description: 'Pressable button.',
    acceptsChildren: false,
    defaults: {
      text: 'Submit',
      width: 'auto',
      height: 3,
      border: 'rounded',
      focusable: true,
      fg: 'brightWhite',
      bg: 'blue',
    },
  },
  {
    type: 'input',
    label: 'Input',
    group: 'basic',
    icon: '▢',
    description: 'Single-line text input.',
    acceptsChildren: false,
    defaults: {
      placeholder: 'Type here…',
      width: 'fill',
      height: 3,
      border: 'single',
      focusable: true,
    },
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    group: 'basic',
    icon: '☑',
    description: 'Boolean toggle.',
    acceptsChildren: false,
    defaults: { label: 'Enable feature', checked: false, width: 'auto', height: 'auto', focusable: true },
  },
  {
    type: 'select',
    label: 'Select',
    group: 'basic',
    icon: '⌄',
    description: 'Dropdown selector.',
    acceptsChildren: false,
    defaults: {
      items: ['Option A', 'Option B', 'Option C'],
      selectedIndex: 0,
      width: 'fill',
      height: 3,
      border: 'single',
      focusable: true,
    },
  },
  {
    type: 'list',
    label: 'List',
    group: 'basic',
    icon: '≡',
    description: 'Vertical list of items.',
    acceptsChildren: false,
    defaults: {
      items: ['Item 1', 'Item 2', 'Item 3'],
      selectedIndex: 0,
      width: 'fill',
      height: 'fill',
      border: 'single',
      focusable: true,
    },
  },
  {
    type: 'textarea',
    label: 'TextArea',
    group: 'basic',
    icon: '▤',
    description: 'Multi-line text input.',
    acceptsChildren: false,
    defaults: {
      placeholder: 'Multi-line…',
      width: 'fill',
      height: 6,
      border: 'single',
      focusable: true,
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    group: 'basic',
    icon: '─',
    description: 'Horizontal or vertical separator line, optionally with a label.',
    acceptsChildren: false,
    defaults: {
      width: 'fill',
      height: 1,
      orientation: 'horizontal',
      titleAlign: 'center',
    },
  },
  // ── Advanced ───────────────────────────────────────────────────────────────
  {
    type: 'table',
    label: 'Table',
    group: 'advanced',
    icon: '⊟',
    description: 'Tabular data.',
    acceptsChildren: false,
    defaults: {
      columns: ['Name', 'Status', 'Owner'],
      rows: [
        ['api-server', 'OK', 'alice'],
        ['worker', 'WARN', 'bob'],
        ['cron', 'OK', 'carol'],
      ],
      width: 'fill',
      height: 'fill',
      border: 'single',
    },
  },
  {
    type: 'tabs',
    label: 'Tabs',
    group: 'advanced',
    icon: '⋯',
    description: 'Tab strip with selectable items.',
    acceptsChildren: false,
    defaults: {
      items: ['Overview', 'Logs', 'Settings'],
      selectedIndex: 0,
      width: 'fill',
      height: 1,
    },
  },
  {
    type: 'statusbar',
    label: 'Status bar',
    group: 'advanced',
    icon: '▭',
    description: 'Single-line status footer. Supports richSpans for per-word coloring.',
    acceptsChildren: false,
    defaults: {
      text: ' READY  ·  q: quit  ·  ?: help ',
      width: 'fill',
      height: 1,
      fg: 'black',
      bg: 'cyan',
    },
  },
  {
    type: 'progressbar',
    label: 'Progress',
    group: 'advanced',
    icon: '▰',
    description: 'Progress bar (0..1).',
    acceptsChildren: false,
    defaults: { progress: 0.4, width: 'fill', height: 1, fg: 'green' },
  },
  {
    type: 'spinner',
    label: 'Spinner',
    group: 'advanced',
    icon: '⠋',
    description: 'Animated loading indicator (static in preview).',
    acceptsChildren: false,
    defaults: {
      spinnerStyle: 'dots',
      width: 'auto',
      height: 1,
      fg: 'cyan',
    },
  },
  {
    type: 'timer',
    label: 'Timer',
    group: 'advanced',
    icon: '⏱',
    description: 'Countdown or elapsed-time display.',
    acceptsChildren: false,
    defaults: {
      timerValue: '00:00',
      width: 'auto',
      height: 1,
      fg: 'brightCyan',
    },
  },
  {
    type: 'toast',
    label: 'Toast',
    group: 'advanced',
    icon: '◈',
    description: 'Floating notification. Set toastVariant for coloring.',
    acceptsChildren: false,
    defaults: {
      text: 'Operation complete',
      toastVariant: 'success',
      width: 26,
      height: 3,
      border: 'rounded',
    },
  },
  {
    type: 'filepicker',
    label: 'File Picker',
    group: 'advanced',
    icon: '⊡',
    description: 'File browser / selection widget.',
    acceptsChildren: false,
    defaults: {
      width: 30,
      height: 8,
      border: 'single',
      title: ' Files ',
      items: ['📁 Documents', '📁 Downloads', '📄 file.txt', '📄 notes.md'],
    },
  },
  {
    type: 'asciitext',
    label: 'ASCII Text',
    group: 'advanced',
    icon: 'A',
    description: 'Large ASCII-art banner text (figlet-style).',
    acceptsChildren: false,
    defaults: {
      text: 'HELLO',
      width: 'fill',
      height: 5,
      fg: 'brightCyan',
    },
  },
  {
    type: 'modal',
    label: 'Modal',
    group: 'advanced',
    icon: '◫',
    description: 'Overlay container (renders in document flow; position via parent layout).',
    acceptsChildren: true,
    defaults: {
      title: 'Confirm',
      width: 40,
      height: 8,
      border: 'double',
      padding: 1,
      direction: 'column',
    },
  },
  // ── Idea #9: Richer components ────────────────────────────────────────────
  {
    type: 'treeview',
    label: 'Tree View',
    group: 'advanced',
    icon: '⊳',
    description: 'Hierarchical tree of items with expand/collapse.',
    acceptsChildren: false,
    defaults: {
      width: 'fill',
      height: 'fill',
      border: 'single',
      title: ' Tree ',
      treeItems: [
        { label: 'Root', expanded: true, children: [
          { label: 'Child 1' },
          { label: 'Child 2', children: [{ label: 'Grandchild' }] },
        ]},
      ],
    },
  },
  {
    type: 'metriccard',
    label: 'Metric Card',
    group: 'advanced',
    icon: '◈',
    description: 'KPI card showing a metric value with optional label and delta.',
    acceptsChildren: false,
    defaults: {
      width: 20,
      height: 5,
      border: 'rounded',
      metricValue: '1,234',
      metricLabel: 'Total Requests',
      metricDelta: '+12%',
    },
  },
  {
    type: 'markdowntext',
    label: 'Markdown',
    group: 'advanced',
    icon: 'M',
    description: 'Markdown-rich text block rendered as styled spans.',
    acceptsChildren: false,
    defaults: {
      width: 'fill',
      height: 'auto',
      markdownContent: '**Bold** and _italic_ text.',
    },
  },
];

export function getDef(type: ComponentType): ComponentDef {
  const d = COMPONENT_DEFS.find((d) => d.type === type);
  if (!d) throw new Error(`Unknown component type: ${type}`);
  return d;
}

export function makeNode(type: ComponentType, parentId: string | null): ComponentNode {
  const def = COMPONENT_DEFS.find((d) => d.type === type);
  const props: ComponentProps = def ? (JSON.parse(JSON.stringify(def.defaults)) as ComponentProps) : {};
  return {
    id: uid(type),
    type,
    parentId,
    children: [],
    props,
  };
}
