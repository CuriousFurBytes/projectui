import { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/store/editorStore';

const ACTION_LABELS: Record<string, string> = {
  undo: 'Undo',
  redo: 'Redo',
  delete: 'Delete selected',
  copy: 'Copy',
  paste: 'Paste',
  duplicate: 'Duplicate',
  selectAll: 'Select All',
  commandPalette: 'Open Command Palette',
  save: 'Save project',
  export: 'Export code',
  toggleGrid: 'Toggle Grid',
  toggleRulers: 'Toggle Rulers',
  zoomIn: 'Zoom In',
  zoomOut: 'Zoom Out',
  zoomReset: 'Reset Zoom',
};

export function KeyboardShortcutsScreen({ onClose }: { onClose: () => void }) {
  const keyboardShortcuts = useEditor((s) => s.keyboardShortcuts);
  const setKeyboardShortcut = useEditor((s) => s.setKeyboardShortcut);
  const resetKeyboardShortcuts = useEditor((s) => s.resetKeyboardShortcuts);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [capturedCombo, setCapturedCombo] = useState('');
  const captureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingAction === null) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, editingAction]);

  useEffect(() => {
    if (editingAction !== null) {
      captureRef.current?.focus();
      setCapturedCombo('');
    }
  }, [editingAction]);

  const handleCaptureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingAction(null);
      return;
    }
    if (e.key === 'Enter' && capturedCombo) {
      if (editingAction) {
        setKeyboardShortcut(editingAction, capturedCombo);
      }
      setEditingAction(null);
      return;
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    const parts: string[] = [];
    if (e.metaKey) parts.push('Meta');
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key === ' ' ? 'Space' : e.key);
    setCapturedCombo(parts.join('+'));
  };

  const formatCombo = (combo: string) =>
    combo
      .replace('Meta', '⌘')
      .replace('Ctrl', '⌃')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧')
      .split('+')
      .join('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[560px] max-h-[80vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-600 text-ink-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium">Action</th>
                <th className="text-left px-4 py-2 font-medium">Shortcut</th>
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(keyboardShortcuts).map(([action, combo]) => (
                <tr key={action} className="border-b border-ink-700 hover:bg-ink-700/40">
                  <td className="px-4 py-2 text-ink-100">
                    {ACTION_LABELS[action] ?? action}
                  </td>
                  <td className="px-4 py-2">
                    {editingAction === action ? (
                      <input
                        ref={captureRef}
                        className="input text-xs w-36 font-mono"
                        value={capturedCombo || 'Press keys…'}
                        readOnly
                        onKeyDown={handleCaptureKeyDown}
                        placeholder="Press keys…"
                      />
                    ) : (
                      <kbd className="bg-ink-700 border border-ink-500 px-2 py-0.5 rounded text-xs font-mono text-accent">
                        {formatCombo(combo)}
                      </kbd>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingAction === action ? (
                      <div className="flex gap-1 justify-end">
                        <button
                          className="btn text-xs"
                          onClick={() => {
                            if (capturedCombo) setKeyboardShortcut(action, capturedCombo);
                            setEditingAction(null);
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="btn text-xs"
                          onClick={() => setEditingAction(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn text-xs"
                        onClick={() => setEditingAction(action)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-ink-600 flex justify-between items-center shrink-0">
          <button
            className="btn text-xs text-red-400 hover:text-red-300"
            onClick={() => {
              if (confirm('Reset all shortcuts to defaults?')) resetKeyboardShortcuts();
            }}
          >
            Reset All to Defaults
          </button>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
