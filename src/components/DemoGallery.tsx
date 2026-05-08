import { useEffect } from 'react';
import { TEMPLATES, type Template } from '@/lib/templates';
import type { ProjectState } from '@/types/component';

interface Props {
  onLoad: (project: ProjectState) => void;
  onClose: () => void;
}

function AsciiPreview({ name }: { name: string }) {
  const label = name.length > 12 ? name.slice(0, 11) + '…' : name;
  const inner = label.padStart(Math.floor((14 + label.length) / 2)).padEnd(14);
  return (
    <pre className="text-[10px] leading-tight font-mono text-ink-300 select-none">
      {`┌──────────────┐\n│${inner}│\n│              │\n│              │\n└──────────────┘`}
    </pre>
  );
}

function TemplateCard({ tmpl, onSelect }: { tmpl: Template; onSelect: () => void }) {
  return (
    <button
      className="text-left bg-ink-700 hover:bg-ink-600 border border-ink-500 hover:border-accent rounded-lg p-3 transition-colors flex flex-col gap-2"
      onClick={onSelect}
    >
      <AsciiPreview name={tmpl.name} />
      <div>
        <div className="text-sm font-semibold leading-snug">{tmpl.name}</div>
        <div className="text-[11px] text-ink-300 leading-relaxed mt-0.5">{tmpl.description}</div>
      </div>
    </button>
  );
}

export function DemoGallery({ onLoad, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSelect = (tmpl: Template) => {
    if (!confirm(`Load "${tmpl.name}"? Unsaved changes will be lost.`)) return;
    onLoad(tmpl.make());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[680px] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600">
          <h2 className="text-sm font-semibold">Demo Gallery</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 overflow-auto max-h-[70vh]">
          {TEMPLATES.map((tmpl) => (
            <TemplateCard key={tmpl.id} tmpl={tmpl} onSelect={() => handleSelect(tmpl)} />
          ))}
        </div>

        <div className="px-4 py-3 border-t border-ink-600 text-[10px] text-ink-400">
          Click a template to load it — this replaces the current project. Press <kbd className="bg-ink-700 px-1 rounded">Esc</kbd> to close.
        </div>
      </div>
    </div>
  );
}
