import { useEditor } from '@/store/editorStore';
import type { ThemeName } from '@/types/component';
import clsx from 'clsx';
import { useState } from 'react';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'solarized-dark', label: 'Solarized' },
  { value: 'mono', label: 'Mono' },
];

export function TopBar({
  view,
  setView,
}: {
  view: 'preview' | 'code';
  setView: (v: 'preview' | 'code') => void;
}) {
  const { project, undo, redo, reset, setTheme, exportJson, loadFromJson, setTermSize, past, future } =
    useEditor();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tui-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      loadFromJson(String(reader.result ?? ''));
      setImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-11 shrink-0 border-b border-ink-600 bg-ink-800 flex items-center px-3 gap-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-bold">&gt;_</span>
        <span className="text-sm font-semibold">TUI Builder</span>
        <span className="text-[10px] text-ink-300 ml-1">v0.1</span>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1" />

      <div className="flex items-center gap-1">
        <button className="btn" onClick={undo} disabled={past.length === 0} title="Undo (⌘Z)">
          ↶
        </button>
        <button className="btn" onClick={redo} disabled={future.length === 0} title="Redo (⌘⇧Z)">
          ↷
        </button>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1" />

      <div className="flex items-center gap-2">
        <span className="label">Term</span>
        <input
          type="number"
          className="input w-14"
          value={project.termCols}
          min={20}
          max={300}
          onChange={(e) => setTermSize(Number(e.target.value) || 80, project.termRows)}
        />
        <span className="text-ink-300">×</span>
        <input
          type="number"
          className="input w-14"
          value={project.termRows}
          min={5}
          max={100}
          onChange={(e) => setTermSize(project.termCols, Number(e.target.value) || 24)}
        />
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1" />

      <div className="flex items-center gap-2">
        <span className="label">Theme</span>
        <select
          className="input w-32"
          value={project.theme}
          onChange={(e) => setTheme(e.target.value as ThemeName)}
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="flex rounded border border-ink-500 overflow-hidden">
          <button
            className={clsx(
              'px-3 py-1 text-xs',
              view === 'preview' ? 'bg-accent text-ink-900 font-semibold' : 'bg-ink-700 hover:bg-ink-600',
            )}
            onClick={() => setView('preview')}
          >
            Preview
          </button>
          <button
            className={clsx(
              'px-3 py-1 text-xs',
              view === 'code' ? 'bg-accent text-ink-900 font-semibold' : 'bg-ink-700 hover:bg-ink-600',
            )}
            onClick={() => setView('code')}
          >
            Code
          </button>
        </div>

        <label className="btn cursor-pointer" title="Import project JSON">
          {importing ? '…' : 'Import'}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </label>
        <button className="btn" onClick={handleExport} title="Download project JSON">
          Export JSON
        </button>
        <button
          className="btn"
          onClick={() => {
            if (confirm('Reset project to default?')) reset();
          }}
        >
          Reset
        </button>
      </div>
    </header>
  );
}
