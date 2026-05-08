import type { AnsiColor, ComponentNode } from '@/types/component';

export function collectSubtree(
  components: Record<string, ComponentNode>,
  rootId: string,
): ComponentNode[] {
  const result: ComponentNode[] = [];
  const visit = (id: string) => {
    const node = components[id];
    if (!node) return;
    result.push(node);
    for (const childId of node.children) visit(childId);
  };
  visit(rootId);
  return result;
}

const ANSI_COLOR_MAP: Record<AnsiColor, string> = {
  default: '',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

export function styleToAnsi(fg?: AnsiColor, bg?: AnsiColor): string {
  let out = '';
  if (fg) out += ANSI_COLOR_MAP[fg] ?? '';
  if (bg) {
    const bgCode = ANSI_COLOR_MAP[bg]?.replace('[3', '[4') ?? '';
    out += bgCode;
  }
  return out;
}

export interface ExporterCapability {
  supported: string[];
  partial: string[];
  unsupported: string[];
}

export const EXPORTER_CAPABILITIES: Record<string, ExporterCapability> = {
  textual: {
    supported: ['container', 'text', 'button', 'input', 'checkbox', 'select', 'list', 'textarea', 'table', 'tabs', 'statusbar', 'progressbar', 'modal', 'spinner'],
    partial: ['divider', 'toast', 'grid', 'viewport'],
    unsupported: ['timer', 'filepicker', 'asciitext', 'treeview', 'metriccard', 'markdowntext'],
  },
  bubbletea: {
    supported: ['container', 'text', 'button', 'input', 'list', 'progressbar', 'spinner', 'statusbar'],
    partial: ['checkbox', 'select', 'textarea', 'table', 'tabs', 'divider'],
    unsupported: ['modal', 'toast', 'grid', 'viewport', 'timer', 'filepicker', 'asciitext', 'treeview', 'metriccard', 'markdowntext'],
  },
  ratatui: {
    supported: ['container', 'text', 'list', 'table', 'progressbar', 'statusbar', 'tabs', 'divider'],
    partial: ['button', 'input', 'checkbox', 'select', 'spinner'],
    unsupported: ['modal', 'toast', 'grid', 'viewport', 'timer', 'filepicker', 'asciitext', 'treeview', 'metriccard', 'markdowntext'],
  },
  blessed: {
    supported: ['container', 'text', 'button', 'input', 'list', 'progressbar', 'table', 'tabs', 'modal'],
    partial: ['statusbar', 'checkbox', 'select', 'textarea', 'divider'],
    unsupported: ['spinner', 'toast', 'grid', 'viewport', 'timer', 'filepicker', 'asciitext', 'treeview', 'metriccard', 'markdowntext'],
  },
  ncurses: {
    supported: ['container', 'text', 'button', 'input', 'list', 'progressbar', 'table', 'tabs'],
    partial: ['modal', 'statusbar', 'checkbox', 'divider'],
    unsupported: ['select', 'textarea', 'spinner', 'toast', 'grid', 'viewport', 'timer', 'filepicker', 'asciitext', 'treeview', 'metriccard', 'markdowntext'],
  },
};
