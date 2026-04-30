import { COMPONENT_DEFS, type ComponentDef } from '@/lib/componentDefs';
import { useState } from 'react';
import clsx from 'clsx';

const GROUPS: { id: ComponentDef['group']; label: string }[] = [
  { id: 'layout', label: 'Layout' },
  { id: 'basic', label: 'Basic' },
  { id: 'advanced', label: 'Advanced' },
];

export function ComponentLibrary() {
  const [query, setQuery] = useState('');

  const handleDragStart = (e: React.DragEvent, def: ComponentDef) => {
    e.dataTransfer.setData('application/x-tui-component', def.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <section className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header">
        <span>Components</span>
      </div>
      <div className="px-2 py-2 border-b border-ink-600">
        <input
          className="input"
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="overflow-auto flex-1 p-2 space-y-3">
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
    </section>
  );
}
