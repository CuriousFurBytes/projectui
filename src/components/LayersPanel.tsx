import { useEditor } from '@/store/editorStore';
import type { ComponentNode } from '@/types/component';
import { getDef } from '@/lib/componentDefs';
import clsx from 'clsx';
import { useState, useMemo } from 'react';

export function LayersPanel() {
  const {
    project, selectedId, select, setHidden, setLocked, remove, move,
    switchLayer, addLayer, removeLayer, renameLayer, duplicateLayer,
  } = useEditor();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ parentId: string; index: number } | null>(null);
  const [editingLayerIdx, setEditingLayerIdx] = useState<number | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const [search, setSearch] = useState('');

  const layers = project.layers ?? [];
  const activeIdx = project.activeLayerIndex ?? 0;

  // B-8: filter visible nodes by search query
  const matchesSearch = useMemo(() => {
    if (!search.trim()) return null; // null = show all
    const q = search.toLowerCase();
    return (node: ComponentNode) => {
      const label = (node.name ?? node.type).toLowerCase();
      return label.includes(q) || node.type.toLowerCase().includes(q);
    };
  }, [search]);

  const renderNode = (node: ComponentNode, depth: number): JSX.Element | null => {
    const def = getDef(node.type);
    const isSel = node.id === selectedId;
    const label = node.name ?? def.label;
    const childDropAllowed = def.acceptsChildren;

    // If search is active and this node (and none of its descendants) matches, hide it
    const childMatches = (n: ComponentNode): boolean => {
      if (matchesSearch && matchesSearch(n)) return true;
      return n.children.some((cid) => {
        const child = project.components[cid];
        return child ? childMatches(child) : false;
      });
    };

    if (matchesSearch && !childMatches(node)) return null;

    return (
      <div key={node.id}>
        <div
          className={clsx(
            'group flex items-center gap-1 pr-2 cursor-pointer text-xs h-6',
            isSel ? 'bg-accent-muted text-white' : 'hover:bg-ink-700',
            matchesSearch && matchesSearch(node) ? 'ring-1 ring-accent/40' : '',
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
          onDragEnd={() => { setDragId(null); setDropTarget(null); }}
          onDragOver={(e) => {
            if (!childDropAllowed) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDropTarget({ parentId: node.id, index: node.children.length });
          }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('application/x-tui-layer');
            if (id && id !== node.id && childDropAllowed) move(id, node.id, node.children.length);
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
            onClick={(e) => { e.stopPropagation(); setHidden(node.id, !node.hidden); }}
          >
            {node.hidden ? '◌' : '●'}
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 hover:text-white text-ink-300"
            title={node.locked ? 'Unlock' : 'Lock'}
            aria-label={node.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => { e.stopPropagation(); setLocked(node.id, !node.locked); }}
          >
            {node.locked ? '🔒' : '🔓'}
          </button>
          {node.id !== project.rootId && (
            <button
              className={clsx(
                'opacity-0 group-hover:opacity-100 text-ink-300',
                node.locked ? 'cursor-not-allowed opacity-50 group-hover:opacity-50' : 'hover:text-red-400',
              )}
              title={node.locked ? 'Unlock to delete' : 'Delete'}
              aria-label={node.locked ? 'Locked node cannot be deleted' : 'Delete'}
              disabled={node.locked}
              onClick={(e) => {
                e.stopPropagation();
                if (node.locked) return;
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
      {/* Screen tabs header */}
      <div className="panel-header">
        <span>Screens</span>
        <button className="text-[10px] text-accent hover:text-white" title="Add screen" onClick={() => addLayer()}>
          + screen
        </button>
      </div>

      {/* Screen tab strip */}
      <div className="flex flex-wrap gap-1 px-2 py-1 border-b border-ink-600">
        {layers.map((layer, idx) => (
          <div key={layer.id} className="flex items-center gap-0.5">
            {editingLayerIdx === idx ? (
              <input
                className="input text-[10px] px-1 py-0 w-20 h-5"
                autoFocus
                value={editingLayerName}
                onChange={(e) => setEditingLayerName(e.target.value)}
                onBlur={() => {
                  if (editingLayerName.trim()) renameLayer(idx, editingLayerName.trim());
                  setEditingLayerIdx(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingLayerName.trim()) renameLayer(idx, editingLayerName.trim());
                    setEditingLayerIdx(null);
                  } else if (e.key === 'Escape') {
                    setEditingLayerIdx(null);
                  }
                }}
              />
            ) : (
              <button
                className={clsx(
                  'text-[10px] px-2 py-0.5 rounded',
                  idx === activeIdx ? 'bg-accent text-white' : 'bg-ink-700 text-ink-300 hover:bg-ink-600',
                )}
                onClick={() => switchLayer(idx)}
                onDoubleClick={() => { setEditingLayerIdx(idx); setEditingLayerName(layer.name); }}
                title="Double-click to rename"
              >
                {layer.name}
              </button>
            )}
            {/* B-21: Duplicate button */}
            <button
              className="text-[10px] text-ink-400 hover:text-accent"
              title="Duplicate screen"
              onClick={() => duplicateLayer(idx)}
            >
              ⧉
            </button>
            {layers.length > 1 && (
              <button
                className="text-[10px] text-ink-400 hover:text-red-400"
                title="Remove screen"
                onClick={() => { if (confirm(`Remove screen "${layer.name}"?`)) removeLayer(idx); }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Layers tree header with B-8 search */}
      <div className="panel-header !py-1">
        <span>Layers</span>
        <span className="text-[10px] normal-case tracking-normal text-ink-300">
          {Object.keys(project.components).length} nodes
        </span>
      </div>

      {/* B-8: Search input */}
      <div className="px-2 pb-1">
        <input
          type="text"
          className="input w-full text-xs py-0.5"
          placeholder="Search layers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-auto flex-1 py-1">{root ? renderNode(root, 0) : null}</div>
    </section>
  );
}
