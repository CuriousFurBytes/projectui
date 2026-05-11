import { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor } from '@/store/editorStore';
import { COMPONENT_DEFS } from '@/lib/componentDefs';
import type { ComponentType } from '@/types/component';

interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  run: () => void;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { project, undo, redo, reset, addChild, select } = useEditor();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ⌘K global toggle is wired in App; Escape always closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const allCommands = useMemo((): Command[] => {
    const rootId = project.rootId;
    const componentCommands: Command[] = COMPONENT_DEFS.map((def) => ({
      id: `add-${def.type}`,
      label: `Add ${def.label}`,
      description: def.description,
      category: 'Components',
      run: () => {
        const id = addChild(rootId, def.type as ComponentType);
        if (id) select(id);
        onClose();
      },
    }));

    const actionCommands: Command[] = [
      { id: 'undo', label: 'Undo', category: 'Edit', run: () => { undo(); onClose(); } },
      { id: 'redo', label: 'Redo', category: 'Edit', run: () => { redo(); onClose(); } },
      { id: 'reset', label: 'Reset project', description: 'Discard all changes and start fresh', category: 'Project', run: () => { if (confirm('Reset project?')) { reset(); onClose(); } } },
    ];

    return [...componentCommands, ...actionCommands];
  }, [project.rootId, addChild, select, undo, redo, reset, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q),
    );
  }, [query, allCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      filtered[activeIdx].run();
    }
  };

  // Reset active index on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50" onClick={onClose}>
      <div
        className="w-[540px] max-h-[60vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-ink-600">
          <span className="text-ink-400 text-sm">⌘</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder-ink-400"
            placeholder="Search commands and components…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="text-[10px] text-ink-400 bg-ink-700 px-1.5 py-0.5 rounded">ESC</span>
        </div>

        <div className="overflow-auto">
          {filtered.length === 0 && (
            <div className="text-center text-ink-400 text-sm py-8">No results</div>
          )}
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-3 py-1 text-[10px] text-ink-400 uppercase tracking-wide bg-ink-900/50">{category}</div>
              {cmds.map((cmd) => {
                const globalIdx = filtered.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-700 ${globalIdx === activeIdx ? 'bg-ink-700' : ''}`}
                    onClick={cmd.run}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                  >
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.description && <span className="text-[10px] text-ink-400 truncate max-w-[200px]">{cmd.description}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
