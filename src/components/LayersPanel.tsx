import { useEditor } from '@/store/editorStore';
import type { ComponentNode } from '@/types/component';
import { getDef } from '@/lib/componentDefs';
import clsx from 'clsx';
import { useState } from 'react';

export function LayersPanel() {
  const { project, selectedId, select, setHidden, setLocked, remove, move } = useEditor();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ parentId: string; index: number } | null>(null);

  const renderNode = (node: ComponentNode, depth: number) => {
    const def = getDef(node.type);
    const isSel = node.id === selectedId;
    const label = node.name ?? def.label;
    const childDropAllowed = def.acceptsChildren;

    return (
      <div key={node.id}>
        <div
          className={clsx(
            'group flex items-center gap-1 pr-2 cursor-pointer text-xs h-6',
            isSel ? 'bg-accent-muted text-white' : 'hover:bg-ink-700',
          )}
          style={{ paddingLeft: 6 + depth * 12 }}
          onClick={() => select(node.id)}
          draggable={node.id !== project.rootId}
          onDragStart={(e) => {
            e.stopPropagation();
            setDragId(node.id);
            e.dataTransfer.setData('application/x-tui-layer', node.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDragId(null);
            setDropTarget(null);
          }}
          onDragOver={(e) => {
            if (!childDropAllowed) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDropTarget({ parentId: node.id, index: node.children.length });
          }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('application/x-tui-layer');
            if (id && id !== node.id && childDropAllowed) {
              move(id, node.id, node.children.length);
            }
            setDropTarget(null);
            setDragId(null);
          }}
        >
          <span className="text-accent w-4 text-center">{def.icon}</span>
          <span className="truncate flex-1">{label}</span>
          <span className="text-[10px] text-ink-300">{node.type}</span>
          <button
            className="opacity-0 group-hover:opacity-100 hover:text-white text-ink-300"
            title={node.hidden ? 'Show' : 'Hide'}
            aria-label={node.hidden ? 'Show' : 'Hide'}
            onClick={(e) => {
              e.stopPropagation();
              setHidden(node.id, !node.hidden);
            }}
          >
            {node.hidden ? '◌' : '●'}
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 hover:text-white text-ink-300"
            title={node.locked ? 'Unlock' : 'Lock'}
            aria-label={node.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => {
              e.stopPropagation();
              setLocked(node.id, !node.locked);
            }}
          >
            {node.locked ? '🔒' : '🔓'}
          </button>
          {node.id !== project.rootId && (
            <button
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-ink-300"
              title="Delete"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${label}?`)) remove(node.id);
              }}
            >
              ✕
            </button>
          )}
        </div>
        {childDropAllowed && (
          <div
            className={clsx(
              'h-1 mx-2 rounded transition-colors',
              dropTarget?.parentId === node.id && dragId ? 'bg-accent/60' : 'bg-transparent',
            )}
          />
        )}
        {node.children.map((cid) => {
          const child = project.components[cid];
          return child ? renderNode(child, depth + 1) : null;
        })}
      </div>
    );
  };

  const root = project.components[project.rootId];
  return (
    <section className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header">
        <span>Layers</span>
        <span className="text-[10px] normal-case tracking-normal text-ink-300">
          {Object.keys(project.components).length} nodes
        </span>
      </div>
      <div className="overflow-auto flex-1 py-1">{root ? renderNode(root, 0) : null}</div>
    </section>
  );
}
