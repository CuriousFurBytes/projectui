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
    const existing = document.querySelector<HTMLScriptElement>(`script[data-pyodide]`);
    if (existing) {
      // If a previous load succeeded (window.loadPyodide exists) we can reuse it.
      // If not, remove the stale/failed tag so we can try again.
      if (window.loadPyodide) return resolve();
      existing.remove();
    }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.pyodide = 'true';
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to load ${src}`));
    };
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

// Inspect a generated Textual app by running it with stub widgets.
// Returns a text representation of the widget tree and any errors.
export async function runTextualInspect(generatedCode: string): Promise<string> {
  const stubs = `
import re as _re

class _W:
    def __init__(self, *args, **kwargs):
        self._wid = kwargs.get('id', '')
        self._cls = kwargs.get('classes', '')
        self._children = [a for a in args if isinstance(a, _W)]
        self._label = next((a for a in args if isinstance(a, str)), '')
    def _render(self, depth=0):
        pad = '  ' * depth
        name = type(self).__name__
        info = f' {repr(self._label)}' if self._label else ''
        id_info = f'  #{self._wid}' if self._wid else ''
        lines = [f'{pad}{name}{info}{id_info}']
        for child in self._children:
            lines.extend(child._render(depth + 1))
        return lines

_widget_names = [
    'Vertical','Horizontal','Static','Button','Input','TextArea',
    'Checkbox','Select','ListView','ListItem','Label','Tabs','Tab',
    'ProgressBar','DataTable',
]
for _n in _widget_names:
    globals()[_n] = type(_n, (_W,), {})

class ComposeResult: pass

class _FakeQueryResult:
    def update(self, **kw): pass
    def add_columns(self, *a): pass
    def add_row(self, *a): pass
    progress = 0

class App:
    CSS = ''
    def compose(self): return iter([])
    def on_mount(self): pass
    def query_one(self, *a, **kw): return _FakeQueryResult()
    def run(self): pass

_src = ${JSON.stringify(generatedCode)}
_lines = _src.split('\\n')
_filtered = [l for l in _lines
             if not _re.match(r'^from textual', l)
             and not _re.match(r'^import textual', l)
             and l.strip() != 'if __name__ == "__main__":']
_cleaned = '\\n'.join(_filtered).replace("    GeneratedApp().run()", "")

exec(_cleaned)

_app = GeneratedApp()
_widgets = list(_app.compose())
print("Widget tree:")
for _w in _widgets:
    if isinstance(_w, _W):
        for _line in _w._render(1):
            print(_line)
    else:
        print(f'  {type(_w).__name__}')

try:
    _app.on_mount()
    print("\\n\\u2713 on_mount() ran without errors")
except Exception as _e:
    print(f"\\n\\u26a0 on_mount() raised: {_e}")

_cls_count = len([l for l in _lines if l.strip().startswith('class ')])
print(f"\\nSummary: {len(_widgets)} top-level widget(s), {_cls_count} class(es) defined")
`;
  return runPython(stubs);
}
