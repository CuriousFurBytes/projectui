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
    type: 'table',
    label: 'Table',
    group: 'advanced',
    icon: '⊞',
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
    description: 'Single-line status footer.',
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
];

export function getDef(type: ComponentType): ComponentDef {
  const d = COMPONENT_DEFS.find((d) => d.type === type);
  if (!d) throw new Error(`Unknown component type: ${type}`);
  return d;
}

export function makeNode(type: ComponentType, parentId: string | null): ComponentNode {
  const def = getDef(type);
  return {
    id: uid(type),
    type,
    parentId,
    children: [],
    props: { ...def.defaults },
  };
}
