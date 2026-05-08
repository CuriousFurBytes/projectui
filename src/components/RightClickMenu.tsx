import { useEffect, useRef } from 'react';
import { useEditor } from '@/store/editorStore';
import { getDef } from '@/lib/componentDefs';

interface Props {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
}

export function RightClickMenu({ x, y, nodeId, onClose }: Props) {
  const {
    project,
    selectedId,
    selectedIds,
    select,
    copyNode,
    pasteNode,
    clipboardId,
    remove,
    setLocked,
    setHidden,
    groupNodes,
  } = useEditor();

  const menuRef = useRef<HTMLDivElement>(null);
  const node = project.components[nodeId];
  const rootId = project.rootId;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const clickHandler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('mousedown', clickHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousedown', clickHandler);
    };
  }, [onClose]);

  if (!node) return null;

  const isRoot = nodeId === rootId;
  const allSelectedIds = selectedIds.size > 1 ? Array.from(selectedIds) : [nodeId];
  const canGroup = selectedIds.size >= 2 && node.parentId !== null;
  const parentId = node.parentId ?? rootId;

  const handleDuplicate = () => {
    copyNode(nodeId);
    pasteNode(parentId);
    onClose();
  };

  const menuItems = [
    {
      label: 'Select',
      icon: '▶',
      action: () => { select(nodeId); onClose(); },
    },
    { divider: true },
    {
      label: 'Copy',
      icon: '⎘',
      action: () => { copyNode(nodeId); onClose(); },
    },
    {
      label: 'Paste',
      icon: '📋',
      disabled: !clipboardId,
      action: () => { pasteNode(selectedId ?? parentId); onClose(); },
    },
    {
      label: 'Duplicate',
      icon: '⧉',
      action: handleDuplicate,
    },
    { divider: true },
    {
      label: node.hidden ? 'Show' : 'Hide',
      icon: node.hidden ? '◌' : '●',
      action: () => { setHidden(nodeId, !node.hidden); onClose(); },
    },
    {
      label: node.locked ? 'Unlock' : 'Lock',
      icon: node.locked ? '🔓' : '🔒',
      action: () => { setLocked(nodeId, !node.locked); onClose(); },
    },
    { divider: true },
    ...(canGroup
      ? [{
          label: 'Group Selected',
          icon: '⊞',
          action: () => {
            const parent = project.components[allSelectedIds[0]];
            groupNodes(allSelectedIds, parent?.parentId ?? rootId);
            onClose();
          },
        }]
      : []),
    {
      label: 'Delete',
      icon: '✕',
      disabled: isRoot || node.locked,
      danger: true,
      action: () => {
        if (isRoot || node.locked) return;
        const label = node.name ?? getDef(node.type).label;
        if (confirm(`Delete "${label}"?`)) remove(nodeId);
        onClose();
      },
    },
  ] as Array<
    | { divider: true }
    | { label: string; icon: string; disabled?: boolean; danger?: boolean; action: () => void }
  >;

  // Clamp to viewport
  const menuWidth = 180;
  const left = Math.min(x, window.innerWidth - menuWidth - 8);
  const top = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left, top }}
    >
      {/* Node info header */}
      <div className="px-3 py-1.5 border-b border-ink-600 mb-1">
        <span className="text-[10px] text-ink-400">{getDef(node.type).label}</span>
        {node.name && <span className="text-[10px] text-ink-300 ml-1">· {node.name}</span>}
      </div>

      {menuItems.map((item, i) => {
        if ('divider' in item) {
          return <div key={i} className="h-px bg-ink-600 my-1 mx-2" />;
        }
        return (
          <button
            key={item.label}
            className={[
              'w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm',
              item.disabled
                ? 'text-ink-500 cursor-not-allowed'
                : item.danger
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'hover:bg-ink-700 text-ink-100',
            ].join(' ')}
            disabled={item.disabled}
            onClick={item.disabled ? undefined : item.action}
          >
            <span className="w-4 text-center text-xs">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
