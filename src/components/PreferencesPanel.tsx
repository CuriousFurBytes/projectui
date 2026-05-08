import { useEffect } from 'react';
import { useEditor } from '@/store/editorStore';
import type { ThemeName } from '@/types/component';

const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'solarized-dark', label: 'Solarized Dark' },
  { value: 'mono', label: 'Mono' },
];

const UI_THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'high-contrast', label: 'High Contrast' },
] as const;

export function PreferencesPanel({ onClose }: { onClose: () => void }) {
  const preferences = useEditor((s) => s.preferences);
  const setPreference = useEditor((s) => s.setPreference);
  const setTheme = useEditor((s) => s.setTheme);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-h-[80vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Preferences</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1 p-4 space-y-6">
          {/* Editor UI Theme */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Editor UI Theme
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">UI Theme</label>
                <select
                  className="input w-40 text-xs"
                  value={preferences.editorUiTheme ?? 'dark'}
                  onChange={(e) =>
                    setPreference('editorUiTheme', e.target.value as 'dark' | 'light' | 'high-contrast')
                  }
                >
                  {UI_THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">Terminal Theme</label>
                <select
                  className="input w-40 text-xs"
                  value={preferences.theme ?? 'tokyo-night'}
                  onChange={(e) => setTheme(e.target.value as ThemeName)}
                >
                  {THEME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Grid & Rulers */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Grid &amp; Rulers
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Grid</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={preferences.showGrid ?? false}
                  onChange={(e) => setPreference('showGrid', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Show Rulers</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={preferences.showRulers ?? false}
                  onChange={(e) => setPreference('showRulers', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Snap to Grid</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={preferences.snapToGrid ?? false}
                  onChange={(e) => setPreference('snapToGrid', e.target.checked)}
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="text-sm">Grid Size (cells)</label>
                <input
                  type="number"
                  className="input w-20 text-xs"
                  min={1}
                  max={20}
                  value={preferences.gridSize ?? 4}
                  onChange={(e) => setPreference('gridSize', Number(e.target.value) || 4)}
                />
              </div>
            </div>
          </section>

          {/* Animation */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Animation
            </h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Enable Animations</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={preferences.animationsEnabled ?? true}
                  onChange={(e) => setPreference('animationsEnabled', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Reduced Motion</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent"
                  checked={preferences.reducedMotion ?? false}
                  onChange={(e) => setPreference('reducedMotion', e.target.checked)}
                />
              </label>
            </div>
          </section>

          {/* Autosave */}
          <section>
            <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
              Autosave
            </h3>
            <div className="flex items-center justify-between">
              <label className="text-sm">Autosave Interval (seconds)</label>
              <input
                type="number"
                className="input w-20 text-xs"
                min={5}
                max={600}
                value={Math.round((preferences.autoSaveIntervalMs ?? 30000) / 1000)}
                onChange={(e) =>
                  setPreference('autoSaveIntervalMs', (Number(e.target.value) || 30) * 1000)
                }
              />
            </div>
          </section>
        </div>

        <div className="px-4 py-3 border-t border-ink-600 flex justify-end shrink-0">
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
