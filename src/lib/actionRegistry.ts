export interface EditorAction {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  description?: string;
}

export const ACTION_REGISTRY: Record<string, EditorAction> = {
  undo: { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', category: 'Edit' },
  redo: { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', category: 'Edit' },
  reset: { id: 'reset', label: 'Reset Project', shortcut: '', category: 'Project', description: 'Discard all changes and start fresh' },
  addLayer: { id: 'addLayer', label: 'Add Screen', shortcut: 'Ctrl+Shift+N', category: 'Screens' },
  duplicateLayer: { id: 'duplicateLayer', label: 'Duplicate Screen', shortcut: '', category: 'Screens' },
  removeLayer: { id: 'removeLayer', label: 'Remove Screen', shortcut: '', category: 'Screens' },
  exportJson: { id: 'exportJson', label: 'Export JSON', shortcut: 'Ctrl+Shift+E', category: 'Project' },
  loadJson: { id: 'loadJson', label: 'Import JSON', shortcut: 'Ctrl+Shift+I', category: 'Project' },
  groupNodes: { id: 'groupNodes', label: 'Group Selection', shortcut: 'Ctrl+G', category: 'Edit' },
  ungroupNode: { id: 'ungroupNode', label: 'Ungroup', shortcut: 'Ctrl+Shift+G', category: 'Edit' },
  removeSelected: { id: 'removeSelected', label: 'Delete Selected', shortcut: 'Delete', category: 'Edit' },
  copyNode: { id: 'copyNode', label: 'Copy', shortcut: 'Ctrl+C', category: 'Edit' },
  pasteNode: { id: 'pasteNode', label: 'Paste', shortcut: 'Ctrl+V', category: 'Edit' },
  alignLeft: { id: 'alignLeft', label: 'Align Left', shortcut: '', category: 'Align' },
  alignRight: { id: 'alignRight', label: 'Align Right', shortcut: '', category: 'Align' },
  alignTop: { id: 'alignTop', label: 'Align Top', shortcut: '', category: 'Align' },
  alignBottom: { id: 'alignBottom', label: 'Align Bottom', shortcut: '', category: 'Align' },
  alignCenterH: { id: 'alignCenterH', label: 'Center Horizontally', shortcut: '', category: 'Align' },
  alignCenterV: { id: 'alignCenterV', label: 'Center Vertically', shortcut: '', category: 'Align' },
};

export function getActions(): EditorAction[] {
  return Object.values(ACTION_REGISTRY);
}

export function getAction(id: string): EditorAction | undefined {
  return ACTION_REGISTRY[id];
}
