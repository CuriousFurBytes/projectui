// Lazy-loads Pyodide (Python on WebAssembly) from the official CDN and
// exposes a tiny runPython API. This is intentionally optional — the editor
// works fully without it. Pyodide is only fetched on first use, and its
// stdout/stderr are captured and returned as a string.
//
// Pyodide docs: https://pyodide.org

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideAPI {
  runPythonAsync: (src: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideAPI>;
  }
}

let pyodide: PyodideAPI | null = null;
let loadingPromise: Promise<PyodideAPI> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.dataset.pyodide = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function isPyodideReady(): boolean {
  return pyodide !== null;
}

export async function loadPyodideRuntime(): Promise<PyodideAPI> {
  if (pyodide) return pyodide;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      await injectScript(`${PYODIDE_BASE_URL}pyodide.js`);
      if (!window.loadPyodide) throw new Error('Pyodide loader not present after script injection');
      const py = await window.loadPyodide({ indexURL: PYODIDE_BASE_URL });
      pyodide = py;
      return py;
    } catch (e) {
      loadingPromise = null;
      throw e;
    }
  })();
  return loadingPromise;
}

export async function runPython(src: string): Promise<string> {
  const py = await loadPyodideRuntime();
  const buf: string[] = [];
  py.setStdout({ batched: (s: string) => buf.push(s) });
  py.setStderr({ batched: (s: string) => buf.push(s) });
  try {
    await py.runPythonAsync(src);
  } catch (e) {
    buf.push(String(e));
  }
  return buf.join('\n');
}
