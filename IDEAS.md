# TUI Builder — Improvement Ideas

This file documents a curated set of improvement ideas for TUI Builder.
Each idea that passed critical evaluation is described in detail with a concrete plan,
code snippets, reasoning, downsides, and a confidence score.

---

## Initial Brainstorm (30 ideas)

1. Add a canvas zoom / scale control so users can work on large or small terminals comfortably
2. Export a Rust / Ratatui target alongside the existing Python / Go exporters
3. Implement "snap to grid" during drag-and-drop so components align to character-cell boundaries
4. Add a keyboard-driven component picker (Command Palette / ⌘K) for faster insertion
5. Introduce a minimap / thumbnail sidebar of the full terminal canvas
6. Add per-component notes/annotations that appear in the Layers panel but not in the canvas
7. Implement a diff-based `updateProps` that only pushes undo history when values actually change
8. Add a "group selection" mode so multiple components can be selected and moved together
9. Add a shareable URL that encodes the project JSON in the hash / a short-link via a serverless function
10. Implement a proper syntax-highlighted code view (highlight border + keywords)
11. Replace the flat color-name `<select>` with a visual color swatch picker
12. Add a `padding` shorthand editor (top/right/bottom/left) instead of a single uniform value
13. Export the Timeline transitions as actual routing code in the Textual and BubbleTea outputs
14. Add an "align & distribute" toolbar for centering / spacing multiple selected components
15. Allow the canvas to be scrolled/panned when the terminal grid is larger than the viewport
16. Add a "Copy component" / "Paste component" clipboard shortcut within the same project
17. Add a built-in template gallery so users can start from pre-built screens (login, dashboard, etc.)
18. Implement a proper canvas ruler (column / row numbers along edges) to aid layout precision
19. Support exporting a self-contained HTML file that renders the terminal animation in a browser
20. Add more border styles (ASCII `+`/`-`/`|`, "bold+thin" mixed corners) to `boxStyles.ts`
21. Add an accessibility audit panel that reports on missing labels, low contrast, etc.
22. Add a "Simulate keypress" playback mode that animates through timeline transitions
23. Make the undo history limit (currently 50) configurable in a settings panel
24. Add multi-project management: browser tabs / multiple named projects in localStorage
25. Implement "smart resize" handles on the canvas so you can drag a component's edge to resize it
26. Introduce a `conditional` prop or show/hide bindings so components can reference each other's state
27. Add a "dark/light editor theme" toggle independent of the canvas theme (the IDE chrome itself)
28. Generate a `README.md` alongside the exported code describing how to install and run it
29. Throttle / debounce the `saveProject` call (currently fires on every single prop change) with a 300 ms delay
30. Add a visual "focus order" overlay that shows the tab-order number on each focusable widget

---

## Critical Evaluation

Below each idea is evaluated and either **rejected** (with reason) or **kept**.

---

**1. Canvas zoom / scale control**
*Kept.* The canvas is rendered in character cells with hard-coded `fontSize: 14` / `lineHeight: 18`. Users with very large terminals (200+ cols) or very small ones (40 cols) get no way to see the full canvas without scrolling. A zoom slider is a precision-editing quality-of-life win.

**2. Rust / Ratatui exporter**
*Kept.* The exporter pattern is already well-established. Ratatui is the dominant Rust TUI library and a real user request in the community. The code structure (component tree → string blocks) maps cleanly onto `ratatui::widgets`.

**3. Snap to grid during drag-and-drop**
*Rejected.* The canvas already constrains placement to whole-character-cell boundaries via `Math.floor((e.clientX - wrap.left) / cell.w)`. Adding an extra snap layer would only add complexity with no practical benefit.

**4. Command Palette (⌘K) for component insertion**
*Kept.* Power users want to stay on the keyboard. A fuzzy-search palette over all 21 component types and actions (undo, rename, switch screen…) with `⌘K` is a huge productivity accelerator, and the data is already in `COMPONENT_DEFS`.

**5. Minimap sidebar**
*Rejected.* A minimap is useful at very high zoom or for navigating a scrollable canvas. The canvas is already visible in full most of the time. The complexity of rendering a scaled-down second pass of the grid far outweighs the value for a character-grid UI builder.

**6. Per-component annotations**
*Rejected.* The `name` field on `ComponentNode` already serves the "label for humans" purpose. Adding a full notes field is scope creep with minimal payoff for a design tool with no collaboration features.

**7. Diff-based `updateProps` to suppress spurious undo entries**
*Kept.* Currently every `updateProps` call (including typing a single character in a text field) pushes a new undo entry. Typing "hello" in a name field creates 5 undo steps. A debounced / diff-aware approach dramatically improves the undo UX.

**8. Multi-select and group move**
*Kept.* This is a standard canvas editor affordance. The `rects` map produced by `render()` already provides hit areas. Holding `Shift` to add to selection and then moving all selected nodes is a natural extension.

**9. Shareable URL (project in hash)**
*Kept.* The project JSON is already serializable. Base64-encoding it into the URL hash enables sharing without any backend, which aligns perfectly with the "no backend" philosophy. LZ-string compression can keep URLs manageable.

**10. Syntax-highlighted code view**
*Rejected.* Adding a full syntax highlighter (e.g., Prism or highlight.js) for a feature that is secondary to the visual builder adds a ~50 kB bundle. The plain `<pre>` output is legible. This is polish, not an improvement.

**11. Visual color swatch picker**
*Kept.* Every color property is currently a plain `<select>` with raw color names like "brightMagenta". A small swatch grid (16 ANSI colors rendered with their actual theme color) would be dramatically more usable and requires no new dependencies.

**12. Padding shorthand (top/right/bottom/left)**
*Rejected.* Textual and Bubble Tea / Lip Gloss both treat padding as a single uniform value in their layout models. Adding four-sided padding to the schema would produce exported code that doesn't map cleanly to the target frameworks.

**13. Timeline transitions exported as routing code**
*Kept.* The Timeline panel lets users define keypress-triggered transitions between screens, but the code exporters completely ignore this information. Generating the key-binding handlers and screen-switch logic in the Textual and Bubble Tea output turns the Timeline from a documentation tool into an executable architecture diagram.

**14. Align & distribute toolbar**
*Rejected.* Requires multi-select first (idea #8), and even then, alignment is less meaningful for character-grid UIs where positions are integers. The complexity is medium, the value is low compared to other ideas.

**15. Canvas pan when terminal is larger than viewport**
*Rejected.* The canvas already wraps in `overflow-auto`. The browser's native scroll works. Adding a custom pan mode would be a step backward (mouse capture conflicts, etc.).

**16. Copy / paste component within project**
*Kept.* `⌘C` / `⌘V` to duplicate a subtree is a standard expectation in any design tool. The infrastructure already exists (see `cloneSubtreeWithNewIds` in `variantUtils.ts`). This just adds hotkey handlers and clipboard state to the store.

**17. Built-in template gallery**
*Kept.* A "New from template" flow with 5–8 pre-built screens (login form, dashboard, settings, error, confirm dialog…) dramatically lowers the barrier for first-time users, who currently face a blank "drag something" state.

**18. Canvas ruler (row / column numbers)**
*Rejected.* Character-grid rulers would eat into precious canvas real estate. The term-size inputs in the TopBar already communicate the dimensions. Marginal value.

**19. Export a self-contained HTML animation**
*Rejected.* Generating a DOM-rendered terminal animation from the project JSON is a separate product, not an improvement of the builder. It would require a full mini-renderer in the export, with non-trivial work and unclear value for real Textual/BubbleTea developers.

**20. More border styles (ASCII `+/-/|`, mixed)**
*Kept.* The `boxStyles.ts` file is tiny and easy to extend. An ASCII-art border (`+---+`) is the most common style for terminals that don't support Unicode box-drawing. Adding it is two lines of data, one new union type value, and a few property-panel entries.

**21. Accessibility audit panel**
*Rejected.* TUI applications target developers, not end users. WCAG-style contrast checks are not meaningful for 16-color ANSI palettes. The audience and use case don't match.

**22. "Simulate keypress" timeline playback**
*Rejected.* The timeline currently holds static step references, not animated screen flows. Building an in-editor playback engine that executes transitions in-browser would require significant new infrastructure (a simulated focus model, event loop…). Too expensive for this stage.

**23. Configurable undo history limit**
*Rejected.* The 50-step limit is a safe default that covers essentially all real workflows. A settings panel for this is yak-shaving.

**24. Multi-project management in localStorage**
*Rejected.* Adding a project-picker UI (list, create, rename, delete) doubles the surface area of the app. The current Import/Export JSON flow already handles project switching well enough.

**25. Smart resize handles on the canvas**
*Kept.* Currently the only way to set a component's width or height is through the Properties panel number inputs. Dragging the edge of a component directly on the canvas is the most natural interaction and dramatically improves the spatial editing experience.

**26. Conditional / show-hide bindings**
*Rejected.* This would require a runtime state model (variables, conditions) that goes far beyond static layout design. It would be a separate product feature.

**27. Editor chrome dark/light theme**
*Rejected.* The editor chrome is already dark. Adding a light mode for the chrome (not the canvas) is cosmetic polish with minimal value for developers, who universally prefer dark UIs.

**28. Auto-generate a README alongside exported code**
*Rejected.* The exported code already includes a docstring / comment block with installation instructions (`pip install textual && python app.py`). A separate README is redundant.

**29. Debounce / throttle `saveProject`**
*Kept.* `saveProject` calls `JSON.stringify` + `localStorage.setItem` on every single state mutation, including every keystroke in a text field. With a large project (100+ nodes) this can block the main thread. A 300 ms debounce is a simple, high-impact performance fix.

**30. Visual focus order overlay**
*Kept.* Tab order is crucial when designing keyboard-driven TUIs. Showing a number badge on each `focusable: true` component in document order gives TUI developers an immediate readout of the interaction flow without leaving the editor.

---

## Ideas That Passed (11 ideas — detailed plans below)

1. Canvas zoom / scale control
2. Rust / Ratatui exporter
4. Command Palette (⌘K)
7. Debounced / diff-aware undo for `updateProps`
8. Multi-select and group move
9. Shareable URL via project-in-hash
11. Visual ANSI color swatch picker
13. Export timeline transitions as routing code
16. Copy / paste component (⌘C / ⌘V)
17. Built-in template gallery
20. ASCII border style
25. Canvas resize handles
29. Debounce `saveProject`
30. Focus-order overlay

*(Some numbering from the brainstorm overlaps; ideas 7 and 29 are closely related but target different layers — the undo stack vs. the storage call.)*

---

## Detailed Plans

---

### Idea A — Canvas Zoom / Scale Control

**What it is**

Add a zoom slider (or `−` / `+` buttons) to the TopBar that scales the terminal canvas preview. Internally this multiplies the `fontSize` and `lineHeight` values passed to `CellGrid` and the pixel coordinates used by `Overlay` and `NodeHitbox`.

**Concrete plan**

1. Add `zoom: number` (default `1.0`) to a new `editorUiState` React context or a simple `useState` in `App.tsx` — it does not belong in the Zustand project store because zoom is ephemeral editor state, not part of the saved project.

2. Thread `zoom` down to `TerminalPreview`:
   ```tsx
   // In TerminalPreview.tsx
   const BASE_FONT_SIZE = 14;
   const BASE_LINE_HEIGHT = 18;
   const fontSize = BASE_FONT_SIZE * zoom;
   const lineHeight = Math.round(BASE_LINE_HEIGHT * zoom);
   ```

3. The hidden probe span already measures the actual rendered cell size; `useCellSize` already returns `{ w, h }`. Because we change the font size, the `ResizeObserver` on the probe fires automatically and recomputes the cell dimensions — overlays will self-correct.

4. Add zoom controls to `TopBar.tsx`:
   ```tsx
   <button className="btn" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}>−</button>
   <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
   <button className="btn" onClick={() => setZoom(z => Math.min(3.0, +(z + 0.25).toFixed(2)))}>+</button>
   <button className="btn text-[10px]" onClick={() => setZoom(1)} title="Reset zoom">⟳</button>
   ```

5. Persist zoom in `sessionStorage` (not the project) so it survives a page refresh but doesn't pollute the project JSON.

**Why it would be good**

The canvas is rendered at a fixed pixel size regardless of the user's monitor DPI and the terminal dimensions they're designing for. A 200-column, 60-row terminal looks extremely small on a 1440p display. Users currently have no way to zoom in for detail work or zoom out to see the full layout. This is a fundamental usability gap for any design canvas tool.

**Possible downsides**

- At very high zoom the canvas can extend past the viewport. This is already handled by `overflow-auto` on the containing div.
- At very low zoom, character glyphs become illegible. The `0.5` lower bound (~7px font) should be the minimum.
- The hidden probe span must also scale with the font size or the cell-size measurement will be wrong. Since `fontSize` is already passed as a style prop to the probe span implicitly via CSS inheritance, this is automatically correct.

**Confidence: 92%**

---

### Idea B — Rust / Ratatui Exporter

**What it is**

A new `ratatuiExporter.ts` that generates a self-contained Rust file using the `ratatui` crate (the dominant Rust TUI library) and the `crossterm` backend. It mirrors the structure of `bubbleTeaExporter.ts`.

**Concrete plan**

1. Create `/src/exporters/ratatuiExporter.ts` with a `exportRatatui(project: ProjectState): string` function.

2. Each component maps to a `ratatui::widgets` type:
   - `container` → `Block` with layout constraints via `Layout::default().direction().constraints()`
   - `text` → `Paragraph::new(text)`
   - `button` → `Paragraph::new(text).block(Block::bordered())`
   - `input` → `Paragraph::new(value).block(Block::bordered())`
   - `list` → `List::new(items)`
   - `table` → `Table::new(rows, widths)`
   - `progressbar` → `Gauge::default().percent(n)`
   - `tabs` → `Tabs::new(items)`
   - `statusbar` → `Paragraph::new(text)` docked to the bottom constraint

3. The layout walk differs from Go/Python: Ratatui uses a constraint-based layout system, not a simple join:
   ```rust
   let chunks = Layout::default()
       .direction(Direction::Horizontal)
       .constraints([Constraint::Fill(1), Constraint::Length(22)])
       .split(frame.area());
   ```
   The exporter needs to translate `fill`/`auto`/`number` sizes to `Constraint::Fill(1)`, `Constraint::Min(n)`, `Constraint::Length(n)`.

4. Add a `'ratatui'` tab to `CodeView.tsx` `TABS` array:
   ```tsx
   { value: 'ratatui', label: 'Rust · Ratatui', ext: 'rs' },
   ```

5. Add `Lang = 'textual' | 'bubbletea' | 'json' | 'ratatui'` and the corresponding `useMemo` branch.

6. The generated file includes a `main.rs` preamble and a full `crossterm` event loop scaffold with `q` to quit.

**Why it would be good**

Rust is the third major language after Python and Go in the TUI ecosystem, with a rapidly growing user base. `ratatui` has 12k+ GitHub stars. Adding a third export target makes TUI Builder useful to a significantly larger audience with near-zero runtime cost (generation is pure string templating).

**Possible downsides**

- Ratatui's constraint-based layout is more complex to generate than Lip Gloss's join helpers. Nested containers require recursive constraint arrays.
- Ratatui changes APIs between minor versions; the generated code may need updates as the library evolves.
- The exporter cannot cover advanced widgets (DataTable, Canvas widget) well in a static pass.

**Confidence: 83%**

---

### Idea C — Command Palette (⌘K)

**What it is**

A floating modal triggered by `⌘K` (or `Ctrl+K`) that lets users type to fuzzy-search over all component types, editor actions (undo, redo, reset, import, export, add screen, switch screen), and saved variants. Selecting an item adds the component at the current selection's parent, or executes the action.

**Concrete plan**

1. Add a `CommandPalette` component in `src/components/CommandPalette.tsx`:

```tsx
type Command =
  | { kind: 'component'; def: ComponentDef }
  | { kind: 'action'; label: string; run: () => void }
  | { kind: 'variant'; variant: ComponentVariant };
```

2. Build the command list by combining:
   - `COMPONENT_DEFS.map(def => ({ kind: 'component', def }))` — all 21 types
   - Actions: undo, redo, reset, export JSON, import, add screen, switch to screen N
   - Saved variants from `project.variants`

3. Fuzzy-filter with a simple `label.toLowerCase().includes(q.toLowerCase())` (no external dep).

4. On selecting a component: call `addChild(selectedId ?? rootId, def.type)`.

5. Register the global keydown listener in `App.tsx` (reuse the existing listener in `TerminalPreview.tsx` or unify them):
   ```ts
   if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
     e.preventDefault();
     setPaletteOpen(true);
   }
   ```

6. The palette dismisses on `Escape` or click-outside.

**Why it would be good**

Dragging from the palette to the canvas is fine for discovery but slow for experienced users. A keyboard-first flow where you type "butt" + Enter to insert a Button in the currently selected container is 3–5× faster. This is the single feature most requested in comparable visual builder tools (Figma, VS Code itself).

**Possible downsides**

- If no component is selected, the palette needs a sensible default parent (root container). This must be communicated clearly to avoid confusion.
- The palette adds a new modal layer whose z-index must be managed carefully against the existing timeline modal.

**Confidence: 90%**

---

### Idea D — Debounced / Diff-Aware `updateProps` Undo Entries

**What it is**

Currently `updateProps` unconditionally calls `pushHistory` on every invocation, including every keystroke in a text `<input>`. This creates an undo step per character. Fix this by: (a) only pushing history when a "commit" happens (on `blur` or `Enter`), or (b) coalescing updates within a time window using a debounce mechanism.

**Concrete plan**

The cleanest approach is option (a) — a "begin edit" / "end edit" transaction model in the store:

```ts
// In editorStore.ts — add to EditorState:
beginEdit: () => void;   // capture current state into a "pending" snapshot
commitEdit: () => void;  // push the pending snapshot to past[]
```

`beginEdit` is called on `onFocus` of each text input in `PropertiesPanel`.
`commitEdit` is called on `onBlur`.

Between `beginEdit` and `commitEdit`, each `updateProps` call updates the project normally but does NOT push to `past`. Only `commitEdit` does the push.

```ts
// In EditorState:
editBaseline: UndoEntry | null; // the snapshot taken by beginEdit

beginEdit: () => set((s) => ({
  editBaseline: { project: cloneProject(s.project), selectedId: s.selectedId },
})),

commitEdit: () => {
  const s = get();
  if (!s.editBaseline) return;
  const past = [...s.past, s.editBaseline].slice(-50);
  set({ past, future: [], editBaseline: null });
},
```

Update `updateProps` to skip `pushHistory` when `editBaseline` is not null.

In `PropertiesPanel`, wrap every text / number input:
```tsx
<input
  className="input"
  value={p.text ?? ''}
  onFocus={() => beginEdit()}
  onChange={(e) => setProp('text', e.target.value)}
  onBlur={() => commitEdit()}
/>
```

**Why it would be good**

This is a correctness fix as much as a UX fix. Currently undoing a rename step-by-step character-by-character is disorienting. The expected mental model for users is "undo the entire text I typed", not "undo each character". Every major design tool (Figma, Sketch, VS Code rename) uses commit-on-blur semantics.

**Possible downsides**

- `beginEdit` / `commitEdit` calls must be added to every relevant input in `PropertiesPanel`. If any are missed, that field's edits will generate per-keystroke undo entries. A systematic audit is required.
- If a user closes the tab mid-edit, `commitEdit` may not fire. The current auto-save already persists on every change, so the project is not lost — only the undo entry is.

**Confidence: 88%**

---

### Idea E — Multi-Select and Group Move

**What it is**

Allow the user to `Shift+Click` multiple components on the canvas or in the Layers panel to build a selection set, then move all of them together by dragging or nudging with arrow keys.

**Concrete plan**

1. Add `selectedIds: Set<string>` to editor state (replacing the single `selectedId` or supplementing it as a "multi-select overlay").

2. In `TerminalPreview.tsx`, modify `NodeHitbox` onClick:
   ```tsx
   onClick={(e) => {
     if (e.shiftKey) toggleSelected(id);
     else selectSingle(id);
   }}
   ```

3. Add a `moveGroup(ids: string[], dx: number, dy: number)` action to the store that updates `props.x` and `props.y` for all selected absolute-positioned nodes, or calls the tree `move` for non-absolute nodes (moving them to the same parent at a new index).

4. Render selection overlays for all ids in `selectedIds` (a different color from the single-select blue, e.g., a multi-select teal).

5. Delete key / Backspace deletes all selected nodes (respecting locks).

**Why it would be good**

Designing even a simple screen often involves positioning a cluster of related components together (e.g., a label + input + validation text). Being able to select and move them as a group is a table-stakes canvas editor feature.

**Possible downsides**

- Moving non-absolute nodes in a flex layout is ill-defined for a group spanning different parents. The safe initial implementation should only support group move for absolute-positioned nodes, with a graceful fallback (move only one at a time) for flex-layout nodes.
- The single-select `selectedId` is referenced in many places (`PropertiesPanel`, `LayersPanel`, keyboard shortcuts). Adding `selectedIds` must be done carefully to avoid regressions.

**Confidence: 75%** (useful but carries real implementation risk in a shared-state UI)

---

### Idea F — Shareable URL (Project-in-Hash)

**What it is**

Encode the current project as a compressed Base64 string in the URL hash (`#/project/<base64>`). Anyone who opens that URL gets the project pre-loaded. No backend required.

**Concrete plan**

1. Add LZ-string compression as a zero-dependency inline utility (the algorithm is ~100 lines). Alternatively, use the browser's `CompressionStream` API (available in all modern browsers since 2023):

```ts
async function compressProject(json: string): Promise<string> {
  const stream = new CompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  writer.write(new TextEncoder().encode(json));
  writer.close();
  const compressed = await new Response(stream.readable).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(compressed)));
}

async function decompressProject(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const text = await new Response(stream.readable).text();
  return text;
}
```

2. Add a "Share" button to `TopBar.tsx` that calls `compressProject(exportJson())`, then sets `window.location.hash = '/p/' + result` and copies the full URL to the clipboard.

3. On app startup in `main.tsx` or `editorStore.ts`, check for the hash and call `loadFromJson` if found:
   ```ts
   const hash = window.location.hash;
   if (hash.startsWith('#/p/')) {
     const b64 = hash.slice(4);
     decompressProject(b64).then(json => loadFromJson(json));
   }
   ```

4. Estimated URL lengths: a typical 20-component project JSON is ~8 kB; compressed + base64 ≈ 3–4 kB; a URL of that length works fine in all major browsers and shareable platforms.

**Why it would be good**

Sharing a design is currently a manual "Export JSON → email attachment → Import JSON" flow. A single click to copy a shareable link turns TUI Builder into a collaboration and teaching tool. This is zero-cost to maintain because there is no server state.

**Possible downsides**

- URLs over ~2 kB may not be linkable in some messaging apps (Slack, Twitter). This is mitigated by compression.
- The hash approach means changing the URL hash without a real router could conflict with future hash-based routing. Use a query parameter (`?p=…`) instead if a router is ever added.
- `CompressionStream` is unavailable in Firefox < 113 (released May 2023). Could fall back to uncompressed base64 for older browsers.

**Confidence: 87%**

---

### Idea G — Visual ANSI Color Swatch Picker

**What it is**

Replace every `<select>` for `AnsiColor` props in `PropertiesPanel.tsx` with a compact swatch grid that shows the 16 ANSI colors filled with their actual theme-resolved hex value, plus a "default" swatch.

**Concrete plan**

1. Create a `ColorPicker` component:

```tsx
function ColorPicker({ label, value, onChange }: {
  label: string;
  value?: AnsiColor;
  onChange: (v: AnsiColor) => void;
}) {
  const theme = getTheme(useEditor(s => s.project.theme));
  const [open, setOpen] = useState(false);
  const current = value ?? 'default';
  const currentHex = current === 'default' ? undefined : theme.ansi[current];

  return (
    <Field label={label}>
      <button
        className="input flex items-center gap-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span
          className="w-3 h-3 rounded-sm border border-ink-400 shrink-0"
          style={{ background: currentHex ?? 'transparent' }}
        />
        <span className="text-xs truncate">{current}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 p-1 bg-ink-800 border border-ink-500 rounded grid grid-cols-4 gap-0.5 shadow-xl">
          {ANSI_COLORS.map(c => (
            <button
              key={c}
              title={c}
              className={clsx(
                'w-6 h-6 rounded border text-[8px]',
                c === current ? 'border-white' : 'border-transparent',
              )}
              style={{
                background: c === 'default' ? 'transparent' : theme.ansi[c],
              }}
              onClick={() => { onChange(c); setOpen(false); }}
            >
              {c === 'default' ? '∅' : ''}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}
```

2. Replace all 5 `<ColorSelect>` calls in `PropertiesPanel.tsx` and the per-span color selects in `RichSpansEditor` with `<ColorPicker>`.

3. The swatch reacts to theme changes automatically because it reads `project.theme` from the store.

**Why it would be good**

Color names like "brightMagenta" and "brightBlack" are meaningless to users who haven't memorized the ANSI 16-color palette. Seeing a filled swatch in the actual theme colors makes color selection immediate and visual, which is the entire point of a design tool. The dropdown currently shows 17 text-only options; the swatch grid shows all 16+1 colors at once with zero scrolling.

**Possible downsides**

- The popup is absolutely positioned and may clip at the edge of the Properties panel. This needs a `useEffect` to reposition toward the visible area.
- When the theme changes, the same color name renders different hex values. This is correct behavior (the swatch shows theme-relative colors), but users should understand that their color choices are theme-relative.

**Confidence: 91%**

---

### Idea H — Export Timeline Transitions as Routing Code

**What it is**

The `timelineTransitions` array (e.g., `keypress "q"` → Screen 2) currently has zero representation in the exported code. Both exporters should generate working key-binding / routing scaffolding from this data.

**Concrete plan**

**Textual exporter** — In `textualExporter.ts`, add a screen-class-per-layer generation loop and `on_key` handlers:

```python
class Screen1(Screen):
    def compose(self) -> ComposeResult:
        yield ( ... )  # current compose body

    def on_key(self, event: events.Key) -> None:
        if event.key == "q":
            self.app.push_screen(Screen2())

class GeneratedApp(App):
    def on_mount(self) -> None:
        self.push_screen(Screen1())
```

Each layer becomes a `Screen` subclass. Each transition becomes an `on_key` / `on_button_pressed` handler. The `export` function needs access to `project.layers` and `project.timelineTransitions`, which it already has via `ProjectState`.

**Bubble Tea exporter** — The `model` struct gains a `currentScreen int` field, and the `Update` function switches on it:

```go
type model struct{ screen int }

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        switch msg.String() {
        case "q":
            if m.screen == 0 { return model{screen: 1}, nil }
        case "ctrl+c":
            return m, tea.Quit
        }
    }
    return m, nil
}

func (m model) View() string {
    switch m.screen {
    case 0: return renderScreen0()
    case 1: return renderScreen1()
    default: return ""
    }
}
```

**Why it would be good**

The Timeline is the most complex and underutilized feature in TUI Builder. Currently it is purely documentary — it shows you the flow but generates no code. Making transitions appear in the exported code turns TUI Builder into an actual app scaffold generator, not just a static mockup tool. This dramatically increases the practical value of the "multi-screen" and "timeline" features.

**Possible downsides**

- The exporter logic becomes significantly more complex for multi-screen projects. The current single-screen export path needs to branch cleanly into a multi-screen path.
- Textual `Screen` classes with full CSS inheritance are complex. The CSS scoping must be carefully handled (each Screen class needs its own CSS block).
- If the timeline has zero transitions, the exporter should fall back to the existing single-screen output to avoid regressions.

**Confidence: 82%**

---

### Idea I — Copy / Paste Component (⌘C / ⌘V)

**What it is**

`⌘C` copies the selected component (and its entire subtree) to an in-memory clipboard. `⌘V` pastes it as a sibling of the current selection in the same parent.

**Concrete plan**

1. Add `clipboard: ComponentVariant | null` to `EditorState` (reuse the `ComponentVariant` type since it already encodes a subtree snapshot).

2. Add `copy` and `paste` actions to the store:

```ts
copy: () => {
  const s = get();
  if (!s.selectedId) return;
  const node = s.project.components[s.selectedId];
  if (!node) return;
  const variant = variantFromSubtree(s.project.components, s.selectedId, 'clipboard');
  set({ clipboard: variant });
},

paste: () => {
  const s = get();
  if (!s.clipboard || !s.selectedId) return;
  const node = s.project.components[s.selectedId];
  const parentId = node?.parentId ?? s.project.rootId;
  // reuse existing instantiateVariant logic
  get().instantiateVariant_internal(s.clipboard, parentId);
},
```

3. Register in the global keydown handler (already in `TerminalPreview.tsx`):

```ts
if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedId) {
  useEditor.getState().copy();
  e.preventDefault();
}
if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
  useEditor.getState().paste();
  e.preventDefault();
}
```

4. Show a small indicator in the TopBar when the clipboard is non-empty: `"⧉ 1 copied"`.

**Why it would be good**

Copy/paste is arguably the most-used interaction in any design tool. The infrastructure is already present (`variantFromSubtree`, `cloneSubtreeWithNewIds`) — this is purely additive UI plumbing. The value/effort ratio is very high.

**Possible downsides**

- `⌘C` conflicts with the browser's native copy-text behavior. The handler must check that the target is not an `<input>` or `<textarea>` (which the existing keyboard handler already does).
- In-memory clipboard is lost on page refresh. This is acceptable for an in-session feature.

**Confidence: 94%**

---

### Idea J — Built-in Template Gallery

**What it is**

A "New from template" modal on first load (or via a TopBar button) that offers 6–8 pre-built project templates: Login Form, Dashboard, Settings Panel, Confirm Dialog, Error Screen, File Browser, Data Table viewer, Progress / Loading screen.

**Concrete plan**

1. Create `/src/lib/templates.ts` containing an array of `ProjectState` snapshots (exported as JSON literals, not generated at runtime). Each template is a minimal but realistic screen:

```ts
export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string; // short ASCII art thumbnail, ~20x6 chars
  project: ProjectState;
}

export const TEMPLATES: Template[] = [
  {
    id: 'login',
    name: 'Login Form',
    description: 'Username + password + submit button',
    preview: '┌─ Login ──────────┐\n│ User: [________] │\n│ Pass: [________] │\n│    [ Sign In ]   │\n└──────────────────┘',
    project: { /* pre-built ProjectState */ },
  },
  // ...
];
```

2. Add a `TemplateGallery` modal that shows a grid of cards. Each card displays the `preview` string in a `<pre>` block styled with the chosen theme colors, the template name, and description.

3. Show the gallery automatically on first load when `localStorage` has no saved project. Add a "Browse templates" button to the TopBar otherwise.

4. On selecting a template, call `loadFromJson(JSON.stringify(template.project))`.

**Why it would be good**

The biggest barrier for new users is the blank-canvas problem. The default project is a reasonable starting point but is generic. Templates give users a meaningful starting point for the most common TUI patterns (auth screens, dashboards, dialogs) and demonstrate what is possible in 5 seconds instead of 15 minutes.

**Possible downsides**

- Templates must be maintained as the component schema evolves. A migration function (already in `migrateProject`) should handle schema changes automatically.
- The `preview` ASCII art thumbnails must be hand-crafted and kept in sync with the actual template content. This is a maintenance burden.
- The file size of the templates module scales linearly with the number of templates. 8 templates at ~8 kB each = ~64 kB gzipped to ~8 kB, acceptable.

**Confidence: 86%**

---

### Idea K — ASCII Border Style

**What it is**

Add a fifth border style, `'ascii'`, that uses `+`, `-`, and `|` characters instead of Unicode box-drawing. This is important for terminals and fonts that render box-drawing characters poorly or not at all.

**Concrete plan**

1. Add `'ascii'` to the `BorderStyle` union in `types/component.ts`:

```ts
export type BorderStyle = 'none' | 'single' | 'double' | 'rounded' | 'thick' | 'ascii';
```

2. Add the character set to `renderer/boxStyles.ts`:

```ts
export const BOX: Record<Exclude<BorderStyle, 'none'>, BoxChars> = {
  // ...existing...
  ascii: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
};
```

3. Add `'ascii'` to the `BORDER_STYLES` array in `PropertiesPanel.tsx` — it is automatically picked up by the `<select>` that maps over `BORDER_STYLES`.

4. Update both exporters to handle `'ascii'`:
   - Textual: map to `border: ascii $primary;` (Textual supports this border type)
   - Bubble Tea: map to `lipgloss.ASCIIBorder()`

**Why it would be good**

ASCII borders are universally compatible — they render identically in every terminal font, every email client, and every Markdown renderer. Many real-world TUI applications (especially older ones or cross-platform tools) use ASCII borders by default. This is a 3-file change with a very small implementation cost and clear value for a subset of users.

**Possible downsides**

- The `BoxChars` type has only `tl/tr/bl/br/h/v` — all four corners are `+`, which is correct for ASCII. No type change needed.
- Some exporters generate framework-specific border style strings. Need to ensure `ascii` is mapped correctly in each exporter rather than falling through to a default.

**Confidence: 97%** (nearly trivial to implement correctly)

---

### Idea L — Canvas Resize Handles

**What it is**

Show visible resize handles at the edges and corners of the selected component's overlay. Dragging a handle updates `width` and/or `height` in real time.

**Concrete plan**

1. In `TerminalPreview.tsx`, extend the `Overlay` component to optionally render handle `<div>` elements at the 8 cardinal + diagonal positions when `onResize` is provided:

```tsx
function ResizeHandle({ pos, onDrag }: { pos: string; onDrag: (dx: number, dy: number) => void }) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className={`absolute w-3 h-3 bg-white border border-blue-400 rounded-sm cursor-${pos}-resize`}
      style={handleStyle(pos)} // positions the handle at the edge
      onMouseDown={(e) => {
        startRef.current = { x: e.clientX, y: e.clientY };
        const onMove = (ev: MouseEvent) => {
          if (!startRef.current) return;
          onDrag(ev.clientX - startRef.current.x, ev.clientY - startRef.current.y);
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          commitEdit(); // finalize undo entry
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        e.stopPropagation();
      }}
    />
  );
}
```

2. The drag delta in pixels is converted to character-cell delta using `cell.w` and `cell.h`:

```ts
const colDelta = Math.round(dx / cell.w);
const rowDelta = Math.round(dy / cell.h);
```

3. On drag, call `updateProps(selectedId, { width: currentW + colDelta, height: currentH + rowDelta })` (converting to numeric size, clamped to `1` minimum).

4. Show resize handles only when the selected node has a numeric (non-fill, non-auto) width or height, or offer to convert `fill` to the current computed pixel width when the drag starts.

**Why it would be good**

Typing numbers into the Properties panel width/height field is imprecise and disconnected from the spatial canvas. Direct manipulation (dragging an edge) is the most natural way to resize a UI element and is universally expected in design tools (Figma, Sketch, etc.).

**Possible downsides**

- Components with `fill` or `auto` sizes cannot be resized by dragging without first changing the size mode. A tooltip or confirmation prompt is needed.
- The resize delta must account for the component's minimum size constraints (e.g., a container must be at least `2×2` to show borders).
- The `mousemove` event listener spans the entire window, which can interfere with other drag operations if not carefully cleaned up.

**Confidence: 78%**

---

### Idea M — Debounce `saveProject` Calls

**What it is**

`saveProject` is called inside every state mutation in `editorStore.ts` — including every individual `updateProps` call triggered by typing. Each call runs `JSON.stringify` (potentially expensive for large projects) and `localStorage.setItem` (a synchronous I/O call). Replace these with a debounced write that fires at most once every 300 ms.

**Concrete plan**

Move `saveProject` out of the hot path and into a Zustand subscriber:

```ts
// In editorStore.ts — remove saveProject() calls from all action bodies.
// Instead, register a subscriber at module level:

let saveTimer: ReturnType<typeof setTimeout> | null = null;

useEditor.subscribe((state, prev) => {
  if (state.project === prev.project) return; // no-op on non-project changes
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveProject(state.project);
    saveTimer = null;
  }, 300);
});
```

Remove the individual `saveProject(project)` calls from all 20+ action bodies. This is a pure refactor — the observable behavior is identical, but the localStorage write happens at most 3–4× per second instead of potentially hundreds of times.

**Why it would be good**

`JSON.stringify` on a 100-node project produces a ~30 kB string. `localStorage.setItem` with a 30 kB value is a synchronous disk write. On slow machines or with large projects, this can add 10–30 ms of jank per keystroke. The debounce eliminates this entirely for the common case of rapid editing.

**Possible downsides**

- There is a 300 ms window where a crash (browser kill, power loss) would lose the last edit. This is acceptable — even the current approach loses edits that happen between keystrokes and the synchronous write completing.
- The Zustand subscriber fires on every state update, including `hoverId` and `selectedId` changes. The `state.project === prev.project` guard (reference equality, fast) ensures the debounce only triggers on actual project mutations.

**Confidence: 95%** (pure performance improvement, no UX change, straightforward implementation)

---

### Idea N — Visual Focus-Order Overlay

**What it is**

A toggleable overlay mode that renders a numbered badge on each `focusable: true` component in document order (depth-first traversal of the component tree). The number represents the tab order position.

**Concrete plan**

1. Add a `showFocusOrder: boolean` to local `App.tsx` state (not the project — this is editor-only).

2. Add a toggle button to the TopBar: `"⇥ Focus order"`.

3. Compute the focus order in `TerminalPreview.tsx`:

```ts
const focusOrder = useMemo(() => {
  if (!showFocusOrder) return new Map<string, number>();
  const order = new Map<string, number>();
  let n = 1;
  const walk = (id: string) => {
    const node = project.components[id];
    if (!node || node.hidden) return;
    if (node.props.focusable) order.set(id, n++);
    node.children.forEach(walk);
  };
  walk(project.rootId);
  return order;
}, [showFocusOrder, project]);
```

4. Render a badge per focused node in the `NodeHitbox` layer:

```tsx
{showFocusOrder && [...focusOrder.entries()].map(([id, n]) => {
  const r = result.rects[id];
  if (!r) return null;
  return (
    <div
      key={id}
      className="absolute flex items-center justify-center bg-yellow-400 text-black text-[10px] font-bold rounded-sm z-10"
      style={{
        left: r.x * cell.w,
        top: r.y * cell.h,
        width: 14,
        height: 14,
      }}
    >
      {n}
    </div>
  );
})}
```

**Why it would be good**

TUI applications are primarily keyboard-driven. A form with 8 inputs that tab in the wrong order is a broken user experience. Developers currently have no way to visualize tab order in TUI Builder without running the application. This overlay provides instant, actionable feedback at design time.

**Possible downsides**

- The computed focus order assumes depth-first tree traversal, which matches Textual's default focus behavior but may differ from Bubble Tea's (which requires manual focus management). This should be noted in the overlay tooltip.
- Badge positioning may overlap adjacent components in dense layouts. The badge is small (14×14 px) but for very compact layouts some overlap is unavoidable.

**Confidence: 85%**

---

## Summary Table

| # | Idea | Effort | Impact | Confidence |
|---|------|--------|--------|-----------|
| A | Canvas zoom control | Low | High | 92% |
| B | Rust / Ratatui exporter | Medium | High | 83% |
| C | Command Palette (⌘K) | Medium | High | 90% |
| D | Debounced undo for `updateProps` | Medium | High | 88% |
| E | Multi-select + group move | High | Medium | 75% |
| F | Shareable URL (project-in-hash) | Low | High | 87% |
| G | Visual ANSI color swatch picker | Low | High | 91% |
| H | Export timeline transitions as routing code | High | High | 82% |
| I | Copy / paste component (⌘C/⌘V) | Low | High | 94% |
| J | Built-in template gallery | Medium | High | 86% |
| K | ASCII border style | Very Low | Medium | 97% |
| L | Canvas resize handles | High | High | 78% |
| M | Debounce `saveProject` | Very Low | Medium | 95% |
| N | Visual focus-order overlay | Low | Medium | 85% |
