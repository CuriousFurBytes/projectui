import type { DragEvent } from 'react';
import { COMPONENT_DEFS, type ComponentDef } from '@/lib/componentDefs';
import { useEditor } from '@/store/editorStore';
import { useState } from 'react';
import clsx from 'clsx';

const GROUPS: { id: ComponentDef['group']; label: string }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'shape', label: 'Shapes' },
];

type LibTab = 'components' | 'variants';

export function ComponentLibrary() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LibTab>('components');
  const variants = useEditor((s) => s.project.variants ?? []);
  const deleteVariant = useEditor((s) => s.deleteVariant);

  const handleDragStart = (e: DragEvent, def: ComponentDef) => {
    e.dataTransfer.setData('application/x-tui-component', def.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleVariantDragStart = (e: DragEvent, variantId: string) => {
    e.dataTransfer.setData('application/x-tui-variant', variantId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <section className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header">
        <span>Components</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-ink-600 shrink-0">
        <button
          className={clsx(
            'flex-1 py-1 text-xs',
            tab === 'components' ? 'bg-ink-700 text-accent font-semibold' : 'hover:bg-ink-700 text-ink-300',
          )}
          onClick={() => setTab('components')}
        >
          Library
        </button>
        <button
          className={clsx(
            'flex-1 py-1 text-xs relative',
            tab === 'variants' ? 'bg-ink-700 text-accent font-semibold' : 'hover:bg-ink-700 text-ink-300',
          )}
          onClick={() => setTab('variants')}
        >
          Variants
          {variants.length > 0 && (
            <span className="ml-1 text-[9px] bg-accent text-ink-900 rounded-full px-1">
              {variants.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'components' ? (
        <>
          <div className="px-2 py-2 border-b border-ink-600">
            <input
              className="input"
              placeholder="Filter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-3" style={{ maxHeight: '600px' }}>
            {GROUPS.map((g) => {
              const items = COMPONENT_DEFS.filter(
                (d) =>
                  d.group === g.id && (query === '' || d.label.toLowerCase().includes(query.toLowerCase())),
              );
              if (items.length === 0) return null;
              return (
                <div key={g.id}>
                  <div className="label mb-1 px-1">{g.label}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((d) => (
                      <button
                        key={d.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, d)}
                        title={d.description}
                        className={clsx(
                          'flex items-center gap-2 text-left px-2 py-2 rounded border border-ink-500 bg-ink-700',
                          'hover:bg-ink-600 hover:border-accent cursor-grab active:cursor-grabbing',
                        )}
                      >
                        <span className="text-accent text-base w-5 text-center">{d.icon}</span>
                        <span className="text-xs truncate">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="overflow-auto flex-1 p-2">
          {variants.length === 0 ? (
            <div className="text-xs text-ink-300 text-center py-6 px-3">
              No variants yet. Select a component and click &quot;Save as Variant&quot; in the Properties panel.
            </div>
          ) : (
            <div className="space-y-1.5">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="group flex items-center gap-2 px-2 py-2 rounded border border-ink-500 bg-ink-700 hover:bg-ink-600 hover:border-accent"
                  draggable
                  onDragStart={(e) => handleVariantDragStart(e, v.id)}
                  title={`Variant: ${v.name}\nType: ${v.rootType}\nDrag to canvas to use`}
                >
                  <span className="text-accent text-base w-5 text-center shrink-0">◈</span>
                  <span className="text-xs truncate flex-1">{v.name}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-red-400 text-xs shrink-0 transition-opacity"
                    title="Delete variant"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete variant "${v.name}"?`)) deleteVariant(v.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
