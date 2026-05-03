import { useEffect, useRef, useState, useCallback } from 'react';
import clsx from 'clsx';
import { useEditor } from '@/store/editorStore';
import { exportTextual } from '@/exporters/textualExporter';
import { runTextualInspect, loadPyodideRuntime, isPyodideReady } from '@/wasm/pyodideRunner';

type Status = 'idle' | 'loading-pyodide' | 'running' | 'done' | 'error';

export function TextualLivePreview() {
  const project = useEditor((s) => s.project);
  const [output, setOutput] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [autoRun, setAutoRun] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      if (!isPyodideReady()) {
        setStatus('loading-pyodide');
        setOutput('Loading Pyodide runtime (~10 MB, one-time download)…');
        await loadPyodideRuntime();
      }
      setStatus('running');
      setOutput('Inspecting widget tree…');
      const code = exportTextual(project);
      const result = await runTextualInspect(code);
      setOutput(result);
      setStatus(result.includes('⚠') ? 'error' : 'done');
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  }, [project]);

  // Auto-run with debounce when project changes
  useEffect(() => {
    if (!autoRun) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void run();
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [project, autoRun, run]);

  const statusLabel: Record<Status, string> = {
    idle: 'Ready',
    'loading-pyodide': 'Loading Pyodide…',
    running: 'Running…',
    done: 'Done',
    error: 'Error',
  };

  const statusColor: Record<Status, string> = {
    idle: 'text-ink-300',
    'loading-pyodide': 'text-yellow-400',
    running: 'text-yellow-400',
    done: 'text-green-400',
    error: 'text-red-400',
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-ink-900">
      {/* Toolbar */}
      <div className="border-b border-ink-600 flex items-center px-3 h-10 gap-2 shrink-0">
        <span className="text-xs font-semibold text-accent">⚡ Live Python Preview</span>
        <span className="text-ink-500 text-xs">·</span>
        <span className="text-xs text-ink-300">Runs generated Textual code via Pyodide (WASM)</span>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-ink-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              className="accent-accent"
            />
            Auto-run on changes
          </label>

          <span className={clsx('text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-800', statusColor[status])}>
            {statusLabel[status]}
          </span>

          <button
            className="btn"
            onClick={() => void run()}
            disabled={status === 'running' || status === 'loading-pyodide'}
          >
            {status === 'running' || status === 'loading-pyodide' ? 'Running…' : isPyodideReady() ? '▶ Re-run' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 min-h-0 grid grid-rows-[1fr]">
        {status === 'idle' ? (
          <div className="flex items-center justify-center flex-col gap-3 text-ink-300">
            <div className="text-4xl">⚡</div>
            <div className="text-sm font-semibold">Textual Live Preview</div>
            <div className="text-xs text-center max-w-sm leading-relaxed">
              Run the generated Python code in-browser using Pyodide (WebAssembly).
              Stub Textual widgets capture the composition tree so you can verify
              your layout before copying the code.
            </div>
            <button className="btn mt-2" onClick={() => void run()}>
              ▶ Run in browser (Pyodide)
            </button>
            <div className="text-[10px] text-ink-500 mt-1">First run downloads ~10 MB. Subsequent runs are instant.</div>
          </div>
        ) : (
          <div className="overflow-auto p-4">
            <pre
              className={clsx(
                'text-xs leading-relaxed whitespace-pre font-mono',
                status === 'error' ? 'text-red-300' : 'text-ink-100',
              )}
            >
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
