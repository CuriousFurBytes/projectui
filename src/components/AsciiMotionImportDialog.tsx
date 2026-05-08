import { useState, useEffect, useRef } from 'react';
import { useEditor } from '@/store/editorStore';
import { parseAsciiMotion, asciiMotionToProject } from '@/lib/asciiMotionImport';
import type { AsciiMotionFile } from '@/lib/asciiMotionImport';

export function AsciiMotionImportDialog({ onClose }: { onClose: () => void }) {
  const loadFromJson = useEditor((s) => s.loadFromJson);
  const [parsed, setParsed] = useState<AsciiMotionFile | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setParsed(null);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      try {
        const result = parseAsciiMotion(content);
        setParsed(result);
      } catch (e) {
        setParseError((e as Error).message ?? 'Parse failed');
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleImport = () => {
    if (!parsed) return;
    const project = asciiMotionToProject(parsed, fileName?.replace(/\.[^.]+$/, '') ?? 'ascii-motion');
    loadFromJson(JSON.stringify(project));
    onClose();
  };

  const maxDim = parsed
    ? {
        cols: Math.max(1, ...parsed.frames.map((f) => Math.max(1, ...f.lines.map((l) => l.length)))),
        rows: Math.max(1, ...parsed.frames.map((f) => f.lines.length)),
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[480px] max-h-[80vh] bg-ink-800 border border-ink-500 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-600 shrink-0">
          <h2 className="text-sm font-semibold">Import ASCII Motion</h2>
          <button
            className="text-ink-400 hover:text-white text-lg leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* File picker */}
          <div>
            <label className="text-xs text-ink-400 block mb-2">
              Select an ASCII Motion file (.json or .txt):
            </label>
            <div className="flex gap-2 items-center">
              <button
                className="btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </button>
              {fileName && (
                <span className="text-xs text-ink-300 font-mono truncate">{fileName}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Format info */}
          <div className="bg-ink-900 rounded p-3 text-xs text-ink-400 space-y-1">
            <div className="font-semibold text-ink-300 mb-1">Expected format:</div>
            <pre className="font-mono text-[10px] text-ink-500 whitespace-pre-wrap">{`{
  "frames": [
    { "lines": ["frame 1 line 1", "frame 1 line 2"] },
    { "lines": ["frame 2 line 1", "frame 2 line 2"] }
  ],
  "fps": 10,
  "name": "my animation"
}`}</pre>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-400">
              <span className="font-semibold">Parse error: </span>{parseError}
            </div>
          )}

          {/* Preview of parsed file */}
          {parsed && maxDim && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-xs space-y-1">
                <div className="text-green-400 font-semibold mb-1">File parsed successfully</div>
                <div className="flex gap-4 text-ink-300">
                  <span><span className="text-ink-400">Frames:</span> {parsed.frames.length}</span>
                  <span><span className="text-ink-400">FPS:</span> {parsed.fps ?? 10}</span>
                  <span>
                    <span className="text-ink-400">Size:</span> {maxDim.cols} × {maxDim.rows}
                  </span>
                </div>
                {parsed.name && (
                  <div className="text-ink-300">
                    <span className="text-ink-400">Name:</span> {parsed.name}
                  </div>
                )}
              </div>

              {/* First frame preview */}
              <div>
                <label className="text-xs text-ink-400 block mb-1">
                  Preview (frame 1 of {parsed.frames.length}):
                </label>
                <pre className="bg-ink-900 rounded p-2 text-[10px] font-mono text-ink-300 max-h-40 overflow-auto leading-tight">
                  {parsed.frames[0]?.lines.join('\n') ?? ''}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-ink-600 flex justify-end gap-2 shrink-0">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn bg-accent text-ink-900 hover:opacity-90 font-semibold disabled:opacity-40"
            onClick={handleImport}
            disabled={!parsed}
          >
            Import as Project
          </button>
        </div>
      </div>
    </div>
  );
}
