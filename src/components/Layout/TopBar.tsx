import { useEditor } from '@/store/editorStore';
import type { ThemeName } from '@/types/component';
import clsx from 'clsx';
import { useState } from 'react';
import { encodeProject, buildShareUrl } from '@/lib/shareUrl';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'solarized-dark', label: 'Solarized' },
  { value: 'mono', label: 'Mono' },
];

export type AppView = 'preview' | 'code' | 'live';

export function TopBar({
  view,
  setView,
  zoom,
  setZoom,
  animPaused,
  setAnimPaused,
  showFocusOrder,
  setShowFocusOrder,
  onOpenCommandPalette,
  onOpenTemplates,
  onOpenHistory,
}: {
  view: AppView;
  setView: (v: AppView) => void;
  zoom: number;
  setZoom: (z: number) => void;
  animPaused: boolean;
  setAnimPaused: (p: boolean) => void;
  showFocusOrder: boolean;
  setShowFocusOrder: (s: boolean) => void;
  onOpenCommandPalette: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
}) {
  const { project, undo, redo, reset, setTheme, exportJson, loadFromJson, setTermSize, past, future } =
    useEditor();
  const [importing, setImporting] = useState(false);
  const [shareTooltip, setShareTooltip] = useState('');

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tui-project.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImport = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => { loadFromJson(String(reader.result ?? '')); setImporting(false); };
    reader.onerror = () => { setImporting(false); window.alert('Failed to import project file.'); };
    reader.onabort = () => { setImporting(false); window.alert('Import was cancelled.'); };
    reader.readAsText(file);
  };

  const handleShare = async () => {
    try {
      const encoded = await encodeProject(project);
      const url = buildShareUrl(encoded);
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareTooltip('URL copied!');
      setTimeout(() => setShareTooltip(''), 2000);
    } catch {
      setShareTooltip('Failed');
      setTimeout(() => setShareTooltip(''), 2000);
    }
  };

  const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <header className="h-11 shrink-0 border-b border-ink-600 bg-ink-800 flex items-center px-3 gap-2 overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-accent font-bold">&gt;_</span>
        <span className="text-sm font-semibold">ProjecTUI</span>
        <span className="text-[10px] text-ink-300 ml-1">v0.1</span>
        <span className="alpha-badge text-[9px] font-bold tracking-wide ml-1 px-1 py-0 rounded border" style={{color:'#ff9e64',borderColor:'rgba(255,158,100,0.4)',background:'rgba(255,158,100,0.1)'}}>ALPHA</span>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1 shrink-0" />

      <div className="flex items-center gap-1 shrink-0">
        <button className="btn" onClick={undo} disabled={past.length === 0} title="Undo (⌘Z)" aria-label="Undo">↶</button>
        <button className="btn" onClick={redo} disabled={future.length === 0} title="Redo (⌘⇧Z)" aria-label="Redo">↷</button>
        <button className="btn text-[10px]" onClick={onOpenHistory} title="Undo history">History</button>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <span className="label">Term</span>
        <input type="number" className="input w-14" value={project.termCols} min={20} max={300}
          onChange={(e) => setTermSize(Number(e.target.value) || 80, project.termRows)} />
        <span className="text-ink-300">×</span>
        <input type="number" className="input w-14" value={project.termRows} min={5} max={100}
          onChange={(e) => setTermSize(project.termCols, Number(e.target.value) || 24)} />
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1 shrink-0" />

      {/* A-A: Zoom control */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="label">Zoom</span>
        <button className="btn px-1" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} title="Zoom out">−</button>
        <select className="input w-16 text-xs" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
          {ZOOM_STEPS.map((z) => (
            <option key={z} value={z}>{Math.round(z * 100)}%</option>
          ))}
        </select>
        <button className="btn px-1" onClick={() => setZoom(Math.min(2, zoom + 0.25))} title="Zoom in">+</button>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1 shrink-0" />

      <div className="flex items-center gap-2 shrink-0">
        <span className="label">Theme</span>
        <select className="input w-28" value={project.theme} onChange={(e) => setTheme(e.target.value as ThemeName)}>
          {THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="h-5 w-px bg-ink-600 mx-1 shrink-0" />

      {/* B-26: Animation play/pause */}
      <button
        className={clsx('btn shrink-0', animPaused ? 'text-accent' : '')}
        onClick={() => setAnimPaused(!animPaused)}
        title={animPaused ? 'Resume animations' : 'Pause animations'}
      >
        {animPaused ? '▶' : '⏸'}
      </button>

      {/* A-N: Focus order overlay */}
      <button
        className={clsx('btn shrink-0', showFocusOrder ? 'bg-accent text-ink-900' : '')}
        onClick={() => setShowFocusOrder(!showFocusOrder)}
        title="Toggle focus-order overlay"
      >
        ⌨
      </button>

      <div className="ml-auto flex items-center gap-1 shrink-0">
        {/* Docs link */}
        <a href="docs/" className="btn shrink-0 text-xs" title="Documentation" aria-label="Documentation">Docs</a>

        {/* A-C: Command palette */}
        <button className="btn" onClick={onOpenCommandPalette} title="Command palette (⌘K)">⌘K</button>

        {/* A-J: Templates */}
        <button className="btn" onClick={onOpenTemplates} title="Template gallery">Templates</button>

        {/* A-F: Share URL */}
        <button className="btn relative" onClick={handleShare} title="Copy shareable URL">
          {shareTooltip || 'Share'}
        </button>

        <div className="flex rounded border border-ink-500 overflow-hidden shrink-0">
          <button className={clsx('px-3 py-1 text-xs', view === 'preview' ? 'bg-accent text-ink-900 font-semibold' : 'bg-ink-700 hover:bg-ink-600')} onClick={() => setView('preview')}>Preview</button>
          <button className={clsx('px-3 py-1 text-xs', view === 'code' ? 'bg-accent text-ink-900 font-semibold' : 'bg-ink-700 hover:bg-ink-600')} onClick={() => setView('code')}>Code</button>
          <button className={clsx('px-3 py-1 text-xs', view === 'live' ? 'bg-accent text-ink-900 font-semibold' : 'bg-ink-700 hover:bg-ink-600')} onClick={() => setView('live')} title="Run Textual in-browser via Pyodide">⚡ Live</button>
        </div>

        <label className="btn cursor-pointer shrink-0" title="Import project JSON">
          {importing ? '…' : 'Import'}
          <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
        </label>
        <button className="btn shrink-0" onClick={handleExport} title="Download project JSON">Export JSON</button>
        <button className="btn shrink-0" onClick={() => { if (confirm('Reset project to default?')) reset(); }}>Reset</button>
      </div>
    </header>
  );
}
