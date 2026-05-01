import { useMemo, useState, useEffect } from 'react';
import clsx from 'clsx';
import { useEditor } from '@/store/editorStore';
import { exportTextual } from '@/exporters/textualExporter';
import { exportBubbleTea } from '@/exporters/bubbleTeaExporter';
import { runPython, isPyodideReady, loadPyodideRuntime } from '@/wasm/pyodideRunner';

type Lang = 'textual' | 'bubbletea' | 'json';

const TABS: { value: Lang; label: string; ext: string }[] = [
  { value: 'textual', label: 'Python · Textual', ext: 'py' },
  { value: 'bubbletea', label: 'Go · Bubble Tea', ext: 'go' },
  { value: 'json', label: 'Project · JSON', ext: 'json' },
];

export function CodeView() {
  const project = useEditor((s) => s.project);
  const exportJson = useEditor((s) => s.exportJson);
  const [lang, setLang] = useState<Lang>('textual');
  const [copied, setCopied] = useState(false);
  const [pyOutput, setPyOutput] = useState<string>('');
  const [pyRunning, setPyRunning] = useState(false);
  const [pyReady, setPyReady] = useState(isPyodideReady());

  const code = useMemo(() => {
    if (lang === 'textual') return exportTextual(project);
    if (lang === 'bubbletea') return exportBubbleTea(project);
    return exportJson();
  }, [lang, project, exportJson]);

  const filename = `tui-app.${TABS.find((t) => t.value === lang)?.ext}`;

  useEffect(() => {
    setPyOutput('');
  }, [lang]);

  const copy = async () => {
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(code);
      didCopy = true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        didCopy = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (error) {
        console.error('Failed to copy code to clipboard.', error);
      }
    }
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runInBrowser = async () => {
    setPyRunning(true);
    setPyOutput('Loading Pyodide (one-time, ~10MB)…');
    try {
      await loadPyodideRuntime();
      setPyReady(true);
      // Strip the textual import + run a minimal sanity script that prints
      // the structure. Textual itself can't render to a real TTY in-browser,
      // but Pyodide can verify the generated code parses + the structure
      // composes — useful as a smoke test.
      const probe = `
import ast
src = ${JSON.stringify(code)}
try:
    tree = ast.parse(src)
    classes = [n.name for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    print("✓ Generated Python parses cleanly.")
    print(f"  classes: {classes}")
    print(f"  functions: {funcs}")
    print(f"  size: {len(src)} bytes")
except SyntaxError as e:
    print(f"✗ SyntaxError: {e}")
`;
      const out = await runPython(probe);
      setPyOutput(out);
    } catch (e) {
      setPyOutput(`Failed to load Pyodide: ${(e as Error).message}`);
    } finally {
      setPyRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-ink-900">
      <div className="border-b border-ink-600 flex items-center px-3 h-10 gap-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setLang(t.value)}
            className={clsx(
              'px-3 py-1 text-xs rounded',
              lang === t.value ? 'bg-accent text-ink-900 font-semibold' : 'hover:bg-ink-700',
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {lang === 'textual' && (
            <button className="btn" onClick={runInBrowser} disabled={pyRunning}>
              {pyRunning ? 'Running…' : pyReady ? 'Re-run in browser' : 'Run in browser (Pyodide)'}
            </button>
          )}
          <button className="btn" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn" onClick={download}>
            Download {filename}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto]">
        <pre className="overflow-auto p-4 text-xs leading-relaxed whitespace-pre">{code}</pre>
        {pyOutput && (
          <div className="border-t border-ink-600 bg-ink-800 max-h-48 overflow-auto p-3">
            <div className="label mb-1">Pyodide output</div>
            <pre className="text-xs text-ink-100 whitespace-pre-wrap">{pyOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
