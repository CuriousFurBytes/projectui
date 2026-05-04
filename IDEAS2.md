# TUI Builder — Improvement Ideas

## Initial brainstorm (30 ideas)

1. Rust/WASM renderer — compile the character-grid renderer to WebAssembly for faster layout passes on large canvases.
2. Copy/paste components — clipboard-style Ctrl+C / Ctrl+V for selected subtrees.
3. Multi-select and group operations — shift-click or rubber-band to select multiple nodes at once.
4. Keyboard-driven nudge — arrow keys move absolute-positioned components one character at a time.
5. Inline canvas resize handles — drag the terminal border to resize `termCols`/`termRows` instead of typing numbers.
6. Elixir/Ratatui exporter — export a third target language (Rust + Ratatui or Elixir + Owl).
7. Share URL — serialize the entire project as a compressed base64 fragment so designs can be shared via a link.
8. Component search in layers panel — filter the layers tree by name/type to find nodes in deep hierarchies.
9. Color picker with hex input — replace the 16-color ANSI dropdown with a swatch that also accepts hex values.
10. Project templates / starter kits — ship 4–6 pre-built layouts (dashboard, form, log viewer) accessible from a "New from template" dialog.
11. Diff-aware autosave — only write to `localStorage` when the serialized JSON actually changes to reduce I/O.
12. IndexedDB persistence — store multiple named projects and allow opening/closing them like files.
13. Accessibility improvements — keyboard-navigable component library, focus traps in modals, ARIA labels on all icon-only buttons.
14. Zoom/pan the canvas — allow users to zoom in on the character-grid preview without changing `termCols`/`termRows`.
15. Inline node rename in layers panel — F2 to rename any node in the tree without opening the properties panel.
16. Align & distribute toolbar — auto-align selected components to edges or distribute them evenly.
17. Timeline graph visualization — replace the flat timeline strip with an SVG node-and-edge diagram connecting screens.
18. Tab-content binding — link a Tabs component so switching selected tab index also switches the visible layer.
19. Custom border characters — let users define their own box-drawing character sets beyond the 4 presets.
20. Responsive preview modes — add preset terminal sizes (80×24, 132×43, full-screen) as one-click buttons.
21. Duplicate layer (screen) — one-click "Duplicate screen" that deep-copies all components to a new layer.
22. Component lock improvement — visually grey out locked components in the canvas to reinforce their locked state.
23. Undo/redo history panel — a visible list of the last N operations with labels so users can jump to any point.
24. Export all screens at once — a "Download ZIP" button that exports every screen's code in one archive.
25. In-canvas text editing — double-click a text/button node on the canvas to edit its label in-place.
26. Animation preview toggle — a play/pause button to start/stop color animations without needing to touch the properties panel.
27. Go module scaffolding — instead of a single `main.go`, export a full Go project with `go.mod`, proper package structure, and Makefile.
28. Variant description field — let users add a freeform description to saved variants so they are self-documenting.
29. Focus-order visualization — overlay numbers on focusable components showing their tab order.
30. Dark/light UI mode — an alternative light-colored editor shell (distinct from the terminal themes which affect the canvas only).

---

## Systematic evaluation

Each idea is evaluated against these criteria:
- **Concrete value:** Does it solve a real friction point or gap for the target user (designer/developer building TUI prototypes)?
- **Scope fit:** Can it be implemented with reasonable effort as a self-contained improvement?
- **Risk:** Any significant performance, maintainability, or UX downside?

---

### Idea 1 — Rust/WASM renderer

**Verdict: REJECTED**

The renderer is called at most once per state update and operates on a grid of ~100×30 = 3 000 cells. Profiling any React app shows the bottleneck is the DOM reconciliation, not the layout algorithm. Rewriting in Rust/WASM would add a multi-step build pipeline, inflate the bundle, complicate debugging, and is premature optimization for a problem that does not exist at the current scale. The existing TypeScript renderer is already fast enough; the effort is entirely unjustified.

---

### Idea 2 — Copy/paste components ✅ PASSED

**Verdict: KEPT**

---

### Idea 3 — Multi-select and group operations

**Verdict: REJECTED**

Multi-select requires significant changes across the renderer (which assumes a single `selectedId`), the properties panel (needs to merge or disable props for heterogeneous types), the layers panel, and all action reducers. The benefit for a *prototype tool* is moderate — users typically manipulate one component at a time. The implementation complexity is high and would likely introduce subtle inconsistencies between what the overlay shows and what the store actually holds. Multi-select is better deferred until the architecture explicitly supports it. Not excellent enough relative to cost.

---

### Idea 4 — Keyboard-driven nudge for absolute-positioned components ✅ PASSED

**Verdict: KEPT**

---

### Idea 5 — Inline canvas resize handles ✅ PASSED

**Verdict: KEPT**

---

### Idea 6 — Rust/Ratatui or Elixir/Owl exporter

**Verdict: REJECTED**

Both Ratatui (Rust) and Ratatouille/Owl (Elixir) have niche adoption compared to Textual and Bubble Tea. The existing exporters are already complex, and each new target language requires maintaining feature parity indefinitely. The marginal user value does not justify adding an exporter that most users will never use, especially when the codebase currently has no abstraction layer for multi-language export. A better path is to first stabilize the two existing exporters.

---

### Idea 7 — Share URL (compressed base64 fragment) ✅ PASSED

**Verdict: KEPT**

---

### Idea 8 — Component search in layers panel ✅ PASSED

**Verdict: KEPT**

---

### Idea 9 — Color picker with hex input

**Verdict: REJECTED**

The terminal preview is entirely constrained to the 16 ANSI palette. Hex colors entered by the user would have no faithful representation in the character-grid renderer unless the renderer is extended to handle arbitrary CSS colors. That extension would also break the Textual/Bubble Tea exporters which map named ANSI colors to framework-specific values. Hex input would create an illusion of support that breaks on export. The 16-color constraint is fundamental and intentional.

---

### Idea 10 — Project templates / starter kits ✅ PASSED

**Verdict: KEPT**

---

### Idea 11 — Diff-aware autosave

**Verdict: REJECTED**

The current `saveProject` already runs synchronously and `JSON.stringify` on a ~3 000-cell project is microseconds. The localStorage write is async from the browser's perspective. Implementing a diff check (which would also require `JSON.stringify` to compare) adds complexity with no measurable user-visible benefit. Classic over-optimization of something that is not a real problem.

---

### Idea 12 — IndexedDB persistence (multiple named projects) ✅ PASSED

**Verdict: KEPT**

---

### Idea 13 — Accessibility improvements ✅ PASSED

**Verdict: KEPT**

---

### Idea 14 — Zoom/pan the canvas ✅ PASSED

**Verdict: KEPT**

---

### Idea 15 — Inline node rename in layers panel (F2)

**Verdict: REJECTED**

The layers panel already supports double-click rename on screen tabs. For individual nodes, the Properties panel's "Name" field already handles renaming and is immediately accessible after a single click. Adding a parallel F2-rename shortcut in the layers tree would require managing conflicting edit states between the layers panel and the properties panel. It duplicates existing functionality without adding enough value to justify the interaction complexity.

---

### Idea 16 — Align & distribute toolbar

**Verdict: REJECTED**

This is a classical graphical editor feature that applies cleanly to pixel-coordinate tools like Figma. In TUI Builder, layout is driven by the flex/grid engine, not by raw coordinates. Only `absolute`-positioned nodes have free X/Y placement. The fraction of components that would benefit is tiny, and "aligning" flex children would require converting them to absolute positions — destroying their layout semantics. Not a good fit for this tool.

---

### Idea 17 — Timeline graph visualization (SVG node-and-edge diagram)

**Verdict: REJECTED**

The current timeline panel already shows steps and transitions in a linear, readable form. Building an SVG graph layout engine (handling node placement, edge routing, zoom, pan) is a substantial subproject. For a tool where users typically have 3–8 screens, the added cognitive overhead of a graph outweighs the benefits. The linear view already communicates the flow. This would be scope creep.

---

### Idea 18 — Tab-content binding (Tabs component switches active layer) ✅ PASSED

**Verdict: KEPT**

---

### Idea 19 — Custom border characters

**Verdict: REJECTED**

The box-drawing character set in `boxStyles.ts` covers the four most common terminal border styles. Custom borders would require adding a new prop type, a UI for entering Unicode glyphs, and changes to the exporter for each target language. Almost no TUI framework exposes custom box-character sets at the API level; the exporters would need to fall back to the nearest preset. The user value is extremely niche (perhaps 1% of users want something beyond single/double/rounded/thick), and it cannot be round-tripped cleanly through export.

---

### Idea 20 — Responsive preview modes (preset terminal sizes) ✅ PASSED

**Verdict: KEPT**

---

### Idea 21 — Duplicate layer (screen) ✅ PASSED

**Verdict: KEPT**

---

### Idea 22 — Visually grey out locked components in the canvas

**Verdict: REJECTED**

Locked nodes are a *selection and editing* guard, not a visibility state. Greying them out on the character-grid canvas would require a post-processing pass over rendered cells to apply a visual dimming effect that does not correspond to any actual terminal rendering. It would make the preview less faithful to what the exported code produces. The layers panel already has the lock icon for each node; that is the correct place for lock feedback. Visual dimming on the canvas would mislead users into thinking the TUI itself renders dimly.

---

### Idea 23 — Undo/redo history panel ✅ PASSED

**Verdict: KEPT**

---

### Idea 24 — Export all screens at once (Download ZIP)

**Verdict: REJECTED**

The generated code for multi-screen Textual apps does not currently produce multiple files — each screen is a separate `compose()` function or class. A meaningful ZIP export requires first designing a multi-screen code architecture (e.g., separate Python files per screen with a router, or Go screens as separate views). Without that architectural work, a ZIP would just be `screen1.py`, `screen2.py`, etc. as independent apps — which is confusing and unhelpful. This idea depends on a prior, larger refactor that is out of scope.

---

### Idea 25 — In-canvas text editing (double-click to edit label) ✅ PASSED

**Verdict: KEPT**

---

### Idea 26 — Animation preview toggle (play/pause) ✅ PASSED

**Verdict: KEPT**

---

### Idea 27 — Go module scaffolding (full project with go.mod) ✅ PASSED

**Verdict: KEPT**

---

### Idea 28 — Variant description field

**Verdict: REJECTED**

The variant system already has a `name` field and the `description` field is typed in `ComponentVariant` but unused in the UI. Adding a textarea for description is a one-line UI change but the underlying need is minor: most users will have fewer than 10 variants and names alone are sufficient. This is a very minor polish item rather than an improvement that changes user outcomes. Worth doing as a 5-minute fix but not significant enough to merit a detailed plan.

---

### Idea 29 — Focus-order visualization ✅ PASSED

**Verdict: KEPT**

---

### Idea 30 — Dark/light UI mode for the editor shell

**Verdict: REJECTED**

The editor is deliberately styled as a dark terminal-aesthetic interface to match the terminal UIs being designed. A light mode would require converting every `bg-ink-*` class and the custom Tailwind palette, maintaining two color systems, and persisting the preference. The user base for this tool (TUI developers) almost universally prefers dark interfaces. The effort is high and the demand is low. It would also visually clash with the dark character-grid preview canvas.

---

## Final shortlist of passed ideas

13 ideas passed the evaluation:

| # | Idea |
|---|------|
| 2 | Copy/paste components |
| 4 | Keyboard-driven nudge for absolute-positioned components |
| 5 | Inline canvas resize handles |
| 7 | Share URL (compressed base64 fragment) |
| 8 | Component search in layers panel |
| 10 | Project templates / starter kits |
| 12 | IndexedDB persistence (multiple named projects) |
| 13 | Accessibility improvements |
| 14 | Zoom/pan the canvas |
| 18 | Tab-content binding |
| 20 | Responsive preview modes (preset terminal sizes) |
| 21 | Duplicate layer (screen) |
| 23 | Undo/redo history panel |
| 25 | In-canvas text editing |
| 26 | Animation preview toggle |
| 27 | Go module scaffolding |
| 29 | Focus-order visualization |

---

## Detailed plans for passing ideas

---

### 2. Copy/paste components

**What it is**

When a node is selected, `Ctrl+C` (or `⌘C`) deep-copies its entire subtree into an in-memory clipboard. `Ctrl+V` (or `⌘V`) inserts the copy as a sibling of the currently selected node (or as a child of the root if nothing is selected), assigning fresh IDs to the cloned subtree via the existing `cloneSubtreeWithNewIds` utility.

**Implementation plan**

1. Add a `clipboard: ComponentNode[] | null` field to `EditorState` (ephemeral — not persisted).
2. Add two actions:
   ```ts
   // in editorStore.ts
   copyNode: (id: string) => void;
   pasteNode: (parentId: string, index?: number) => void;
   ```
   `copyNode` calls `collectSubtree` and stores a deep clone. `pasteNode` calls `cloneSubtreeWithNewIds` to create a fresh copy and inserts it.
3. Wire keyboard handler in `TerminalPreview.tsx` (the existing `onKey` handler):
   ```ts
   if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedId) {
     useEditor.getState().copyNode(selectedId);
     e.preventDefault();
   }
   if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
     const { clipboard, selectedId, project } = useEditor.getState();
     if (!clipboard) return;
     const targetParentId = selectedId
       ? (project.components[selectedId]?.parentId ?? project.rootId)
       : project.rootId;
     useEditor.getState().pasteNode(targetParentId);
     e.preventDefault();
   }
   ```
4. Show a small "Copied" toast in the TopBar (reuse existing 1.5s `setCopied` pattern) to provide feedback.

**Why it's good**

It is by far the most-requested missing feature in visual editors. Currently duplicating a component requires re-dragging from the library and re-entering all properties. All building blocks (`cloneSubtreeWithNewIds`, keyboard listener infrastructure) are already present.

**Downsides**

The clipboard is in-memory only (not the OS clipboard) so cross-tab or cross-window paste is not supported. That is an acceptable limitation given the browser security model around clipboard access.

**Confidence: 95%**

---

### 4. Keyboard-driven nudge for absolute-positioned components

**What it is**

When a node with `absolute: true` is selected, pressing `←` `→` `↑` `↓` increments/decrements its `x` or `y` prop by 1 character (or 5 characters when `Shift` is held). This is standard behavior in any design tool.

**Implementation plan**

1. Extend the `onKey` handler in `TerminalPreview.tsx`:
   ```ts
   if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key) && selectedId) {
     const node = useEditor.getState().project.components[selectedId];
     if (!node?.props.absolute) return;
     e.preventDefault();
     const step = e.shiftKey ? 5 : 1;
     const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
     const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
     useEditor.getState().updateProps(selectedId, {
       x: Math.max(0, (node.props.x ?? 0) + dx),
       y: Math.max(0, (node.props.y ?? 0) + dy),
     });
   }
   ```
2. Guard: only act if the focused element is not an `<input>` or `<textarea>` (existing guard already in place).
3. Update the Properties Panel to show the current X/Y values reactively (they already do — no extra work needed).
4. Add tooltip/hint text in the Properties panel near the X/Y fields: `Arrow keys nudge when selected`.

**Why it's good**

Pixel-nudging with keyboard is a fundamental affordance in any visual editor. Without it, users must type X/Y values in tiny number inputs, which is slow and imprecise when iterating on layout.

**Downsides**

Each arrow key press creates an undo entry. Holding the key down will create many entries. Consider batching rapid nudges into a single undo entry using a `setTimeout` debounce that merges consecutive nudge actions. This complexity is manageable.

**Confidence: 92%**

---

### 5. Inline canvas resize handles

**What it is**

Render a draggable handle on the right edge and bottom edge of the terminal canvas. Dragging the right handle changes `termCols`; dragging the bottom handle changes `termRows`. The terminal canvas is the `div.relative.inline-block` in `TerminalPreview.tsx`.

**Implementation plan**

1. Add two `ResizeHandle` components after the existing `<CellGrid>` in `TerminalPreview.tsx`:
   ```tsx
   <ResizeHandle
     direction="horizontal"
     onResize={(delta) => {
       const newCols = Math.max(20, Math.min(300, project.termCols + Math.round(delta / cell.w)));
       setTermSize(newCols, project.termRows);
     }}
   />
   <ResizeHandle
     direction="vertical"
     onResize={(delta) => {
       const newRows = Math.max(5, Math.min(100, project.termRows + Math.round(delta / cell.h)));
       setTermSize(project.termCols, newRows);
     }}
   />
   ```
2. `ResizeHandle` is a positioned `div` with `cursor-ew-resize` or `cursor-ns-resize` that handles `onMouseDown` and attaches window-level `mousemove`/`mouseup` listeners for delta tracking:
   ```tsx
   function ResizeHandle({ direction, onResize }: { direction: 'horizontal' | 'vertical'; onResize: (delta: number) => void }) {
     const startRef = useRef<number | null>(null);
     const onMouseDown = (e: MouseEvent) => {
       startRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
       // attach window listeners...
     };
     // ...
   }
   ```
3. Display a small dimension badge (`100×30`) that updates live during drag.
4. Clamp values to the existing min/max ranges (20–300 cols, 5–100 rows).

**Why it's good**

Typing numbers in the TopBar is unintuitive when you just want to make the canvas "a bit wider." Drag-to-resize is the natural metaphor from every design tool. The underlying `setTermSize` action already exists.

**Downsides**

The canvas is `overflow-auto` inside a flex container, so handle positioning needs careful CSS. On small browser windows the handle might be partially obscured. This is solvable with `position: sticky` or a min-width constraint.

**Confidence: 88%**

---

### 7. Share URL (compressed base64 fragment)

**What it is**

A "Share" button in the TopBar that serializes the current project JSON, compresses it with `CompressionStream` (browser-native API, no dependency), base64-encodes the result, and writes it to `window.location.hash`. On load, the app checks for a non-empty hash and offers to import it.

**Implementation plan**

1. Add `serializeToHash` and `deserializeFromHash` utilities in `src/lib/shareUrl.ts`:
   ```ts
   export async function serializeToHash(json: string): Promise<string> {
     const bytes = new TextEncoder().encode(json);
     const cs = new CompressionStream('deflate-raw');
     const writer = cs.writable.getWriter();
     writer.write(bytes);
     writer.close();
     const compressed = await new Response(cs.readable).arrayBuffer();
     return btoa(String.fromCharCode(...new Uint8Array(compressed)));
   }

   export async function deserializeFromHash(hash: string): Promise<string> {
     const bin = atob(hash);
     const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
     const ds = new DecompressionStream('deflate-raw');
     const writer = ds.writable.getWriter();
     writer.write(bytes);
     writer.close();
     const decompressed = await new Response(ds.readable).arrayBuffer();
     return new TextDecoder().decode(decompressed);
   }
   ```
2. In `TopBar.tsx`, add a "Share" button. On click: serialize, set hash, copy the full URL to clipboard, and show a "Link copied!" toast.
3. In `App.tsx` `useEffect` on mount: check `window.location.hash`. If non-empty, deserialize and call `loadFromJson`. Show a confirmation dialog first so users don't accidentally overwrite their current work.
4. Cap the uncompressed project at ~500 KB before sharing (warn otherwise) — typical projects are 5–20 KB uncompressed.

**Why it's good**

Zero infrastructure required (no backend, no storage service). The app is already static-only. Sharing a design is the single biggest collaboration barrier for the current tool. `CompressionStream` is available in all modern browsers (Chrome 80+, Firefox 113+, Safari 16.4+). A 20 KB project compresses to ~4 KB, giving a URL under 6 000 characters — well within browser limits.

**Downsides**

Very large projects (many screens, rich span data) could exceed URL limits. `CompressionStream`/`DecompressionStream` are not available in older browsers, though the fallback (raw base64 without compression) is easy to implement. The shared URL encodes the full project state — any sensitive prop values (e.g., sample data in tables) would be visible in the URL.

**Confidence: 90%**

---

### 8. Component search in layers panel

**What it is**

A small search/filter input at the top of the Layers tree section that filters visible nodes to only those whose `name`, `type`, or `id` contain the query string. Non-matching nodes are hidden; matching nodes are shown with their ancestors expanded (so the result stays in context).

**Implementation plan**

1. Add a `searchQuery` state (`string`) to `LayersPanel.tsx`.
2. Add a compact `<input>` below the "Layers" header with `placeholder="Filter…"`.
3. Before rendering the tree, compute a `Set<string>` of IDs that match or are ancestors of matching nodes:
   ```ts
   function getVisibleIds(
     components: Record<string, ComponentNode>,
     rootId: string,
     query: string,
   ): Set<string> {
     const q = query.toLowerCase();
     const visible = new Set<string>();
     const traverse = (id: string, ancestorPath: string[]): boolean => {
       const node = components[id];
       if (!node) return false;
       const matches =
         node.name?.toLowerCase().includes(q) ||
         node.type.includes(q) ||
         node.id.includes(q);
       const childMatches = node.children.some(cid => traverse(cid, [...ancestorPath, id]));
       if (matches || childMatches) {
         visible.add(id);
         ancestorPath.forEach(pid => visible.add(pid));
       }
       return matches || childMatches;
     };
     traverse(rootId, []);
     return visible;
   }
   ```
4. In `renderNode`, skip nodes not in `visibleIds` when `searchQuery` is non-empty.
5. Highlight matching text in the node label using a simple `<mark>` wrapper.

**Why it's good**

Projects with 20+ components in a deep hierarchy become very hard to navigate. This is a standard feature in every IDE tree view. The existing recursive `renderNode` function is already the right place to add the filter. Implementation is approximately 40 lines of new code.

**Downsides**

When the filter is active, the tree's hierarchy context might be confusing if an ancestor is shown only because of a child match. Clear visual distinction (e.g., dimmed ancestor rows) would help. This is a UI polish concern, not a blocking issue.

**Confidence: 97%**

---

### 10. Project templates / starter kits

**What it is**

A "New from Template" dialog (accessible from the TopBar "Reset" dropdown, or a dedicated button) that offers 5–6 pre-built `ProjectState` objects representing common TUI patterns:

- **Dashboard** — header + sidebar list + main area with progress bars
- **Login form** — centered container with inputs, checkbox, submit button
- **Log viewer** — header, scrollable list, status bar
- **Settings page** — tabs + form fields
- **Wizard** — three linked screens with timeline transitions
- **Data table** — table + filter input + status bar

**Implementation plan**

1. Create `src/lib/templates.ts` exporting `PROJECT_TEMPLATES: { id: string; name: string; description: string; project: ProjectState }[]`.
2. Each template is a hand-crafted `ProjectState` literal (or a factory function that calls `makeNode` for each component). Templates should use meaningful names and realistic placeholder data.
3. Add a `<TemplateDialog>` modal component that shows a grid of template cards with names and descriptions. Clicking a card calls `loadFromJson(JSON.stringify(template.project))`.
4. Add a "Templates" button in the TopBar next to "Reset":
   ```tsx
   <button className="btn" onClick={() => setTemplateDialogOpen(true)}>
     Templates
   </button>
   ```
5. Confirm before replacing the current project (same pattern as the existing "Reset").

**Why it's good**

New users face a blank canvas problem — they don't know which components to use together or what realistic layouts look like. Templates dramatically reduce time-to-first-useful-result. All the plumbing (`loadFromJson`, `makeNode`, the store) already exists. Templates are pure data, easy to add and maintain.

**Downsides**

Templates become out-of-date if new component types are added. They need to be maintained alongside the component definitions. Initial creation requires hand-crafting ~6 `ProjectState` objects, which is tedious but straightforward.

**Confidence: 92%**

---

### 12. IndexedDB persistence (multiple named projects)

**What it is**

Replace the single-slot `localStorage` autosave with an IndexedDB store keyed by project ID. The TopBar gains a project switcher dropdown showing all saved projects with timestamps. A "New project" button creates a fresh slot. The "active project ID" is stored in `localStorage` as a lightweight pointer.

**Implementation plan**

1. Create `src/lib/projectStorage.ts`:
   ```ts
   const DB_NAME = 'tui-builder';
   const STORE = 'projects';

   export interface StoredProject {
     id: string;
     name: string;
     updatedAt: number;
     data: ProjectState;
   }

   export async function openDB(): Promise<IDBDatabase> { /* ... */ }
   export async function listProjects(): Promise<StoredProject[]> { /* ... */ }
   export async function loadProject(id: string): Promise<StoredProject | undefined> { /* ... */ }
   export async function saveProject(p: StoredProject): Promise<void> { /* ... */ }
   export async function deleteProject(id: string): Promise<void> { /* ... */ }
   ```
2. Migrate the existing `editorStore.ts` `saveProject`/`loadProject` functions to use this async API. Add a `projectId` and `projectName` field to `EditorState`.
3. Add a `<ProjectPicker>` dropdown in the TopBar. It lists all saved projects, with the active one highlighted. Clicking a different project confirms (if unsaved changes exist) and loads it.
4. Migrate existing `localStorage` data on first run: detect the `STORAGE_KEY` key, import it as a project named "Recovered Project", delete the old key.
5. Add a project rename button (pencil icon next to the project name in the TopBar).

**Why it's good**

The current single-project model is a significant limitation for any user who works on more than one TUI design. IndexedDB supports values up to hundreds of MB, eliminating the risk of quota errors on complex projects. The migration path is clean.

**Downsides**

IndexedDB is async, which requires refactoring the currently synchronous `saveProject`/`loadProject` calls in the store. This is a moderately large refactor (touching `editorStore.ts` and adding async `useEffect` initialization). Data loss risk during migration must be handled carefully. This idea carries higher implementation risk than most others.

**Confidence: 78%**

---

### 13. Accessibility improvements

**What it is**

A systematic pass to make the editor usable with keyboard-only navigation and screen readers:

1. Add `aria-label` to all icon-only buttons (`↶`, `↷`, `●`, `🔒`, `✕`, etc.).
2. Add `role="tree"` and `role="treeitem"` with `aria-expanded`, `aria-selected` to the layers panel tree.
3. Add `role="toolbar"` to the TopBar action group.
4. Ensure the component library palette items have descriptive `title` (already partially done) and `aria-label`.
5. Make the terminal canvas `aria-label="Terminal preview"` with `role="img"` and a dynamic description like "100 columns × 30 rows, Tokyo Night theme".
6. Add focus management: when a modal dialog opens (e.g., "Add Transition"), trap focus within it and return focus to the trigger on close.
7. Add visible focus rings (currently suppressed by Tailwind's `focus:outline-none` on `.input`).

**Implementation plan**

Each item above is a targeted change in the relevant component file. The focus ring fix is a single CSS change:
```css
/* in index.css — remove the suppression or replace with a styled ring */
.input:focus {
  outline: none;
  box-shadow: 0 0 0 2px theme('colors.accent.DEFAULT');
}
```
Focus trapping in the timeline "Add Transition" modal uses a small custom hook or the `focus-trap-react` library (or a lightweight custom implementation using `querySelectorAll` on focusable elements).

**Why it's good**

Accessibility is a correctness issue, not a feature. Many developers use screen readers or navigate entirely by keyboard. The changes are mostly additive (ARIA attributes and CSS) and do not risk breaking existing functionality. Several of the icon-only buttons are currently completely invisible to screen readers.

**Downsides**

Full WCAG 2.1 AA compliance is a long journey beyond these fixes. The character-grid canvas cannot be made meaningfully accessible (it's a grid of styled spans) without a separate semantic representation. The improvements listed are achievable and impactful without requiring a full rewrite.

**Confidence: 94%**

---

### 14. Zoom/pan the canvas

**What it is**

Add CSS `transform: scale(zoom)` to the terminal canvas `div` in `TerminalPreview.tsx`, controlled by a zoom level state (`0.5×`, `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`). The selection/hover overlays and hit-boxes are computed in character coordinates and then scaled by CSS, so no coordinate math changes are needed. Panning is handled by the existing `overflow: auto` on the outer container.

**Implementation plan**

1. Add `zoom` state to `TerminalPreview` (default `1`).
2. Add zoom control buttons (`−` / `reset` / `+`) in a floating badge overlaid on the preview area (bottom-right corner):
   ```tsx
   <div className="absolute bottom-3 right-3 flex gap-1 bg-ink-800/80 rounded px-1">
     <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
     <span>{Math.round(zoom * 100)}%</span>
     <button onClick={() => setZoom(1)}>↺</button>
     <button onClick={() => setZoom(z => Math.min(2, z + 0.25))}>+</button>
   </div>
   ```
3. Apply zoom to the canvas wrapper:
   ```tsx
   <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
     {/* CellGrid, overlays, hitboxes */}
   </div>
   ```
4. Compensate the outer container's scroll area by adjusting its width/height to `cols * cell.w * zoom` and `rows * cell.h * zoom`.
5. Add `Ctrl+scroll` (or `⌘+scroll`) to zoom:
   ```ts
   onWheel={(e) => {
     if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       setZoom(z => Math.max(0.5, Math.min(2, z + (e.deltaY < 0 ? 0.1 : -0.1))));
     }
   }}
   ```

**Why it's good**

At the default 14px font size, a 100×30 canvas is approximately 1 400×540 px. On a 1 080p monitor with sidebars, this barely fits. Zoom-out allows seeing the full design at once; zoom-in allows precisely editing small components. The CSS `scale` approach requires zero changes to the renderer or store.

**Downsides**

CSS `scale` does not change the element's layout box size, so the outer scroll container needs manual size compensation. Click coordinates on the hit-boxes must be divided by zoom before being converted to character coordinates — the `findDropTarget` function in `TerminalPreview.tsx` would need a zoom factor applied. This is a one-line fix but easy to miss.

**Confidence: 87%**

---

### 18. Tab-content binding

**What it is**

When a `tabs` component is selected, show a new "Tab content" section in the Properties panel where each tab item can be linked to a screen (layer). In the timeline, this creates a logical connection. When the selected tab index changes, clicking a "Preview tab" button in the Properties panel switches the active layer to the linked screen.

**Implementation plan**

1. Add a `tabLayerBindings?: Record<number, string>` prop to `ComponentProps` (maps tab index → layer ID).
2. In `PropertiesPanel.tsx`, add a "Tab bindings" sub-section inside the `select`/`list`/`tabs` `ContentSection`:
   ```tsx
   {node.type === 'tabs' && (
     <div className="col-span-2">
       <div className="label mb-1">Tab → Screen bindings</div>
       {(p.items ?? []).map((item, idx) => (
         <div key={idx} className="flex gap-1 items-center mb-1">
           <span className="text-xs text-ink-200 w-20 truncate">{item}</span>
           <select
             className="input flex-1 text-xs"
             value={p.tabLayerBindings?.[idx] ?? ''}
             onChange={(e) => setProp('tabLayerBindings', { ...p.tabLayerBindings, [idx]: e.target.value })}
           >
             <option value="">— none —</option>
             {layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
           </select>
           {p.tabLayerBindings?.[idx] && (
             <button className="btn text-xs" onClick={() => {
               const idx2 = layers.findIndex(l => l.id === p.tabLayerBindings![idx]);
               if (idx2 >= 0) switchLayer(idx2);
             }}>▶</button>
           )}
         </div>
       ))}
     </div>
   )}
   ```
3. Use the bindings in the Textual exporter: when a `tabs` node has bindings, emit a `on_tabs_changed` handler that mounts/unmounts the appropriate sub-app or screen.

**Why it's good**

The existing `tabs` component renders a static tab strip but has no relationship to the multi-screen system. This binding creates the conceptual link between a UI navigation pattern and the actual screen structure, making the timeline more meaningful and the generated code more useful.

**Downsides**

Adds complexity to `ComponentProps` (another optional field). The Textual exporter would need non-trivial changes to generate the event handler. This should be scoped to the binding UI first, with exporter support as a follow-on.

**Confidence: 80%**

---

### 20. Responsive preview modes (preset terminal sizes)

**What it is**

Replace the raw `termCols`/`termRows` number inputs in the TopBar with a dropdown of named presets plus a "Custom" option that reveals the inputs. Presets:

| Name | Cols | Rows |
|------|------|------|
| Classic 80×24 | 80 | 24 |
| Standard 100×30 | 100 | 30 |
| Wide 132×43 | 132 | 43 |
| Full HD 220×55 | 220 | 55 |
| Compact 60×20 | 60 | 20 |
| Custom | — | — |

**Implementation plan**

1. Define `TERM_PRESETS` array in `TopBar.tsx`.
2. Replace the two `<input type="number">` elements with a `<select>` that detects whether the current `termCols×termRows` matches a preset and shows "Custom" otherwise.
3. When "Custom" is selected, show the two number inputs inline.
4. Selecting a preset calls `setTermSize(preset.cols, preset.rows)`.

```tsx
const TERM_PRESETS = [
  { label: 'Classic 80×24', cols: 80, rows: 24 },
  { label: 'Standard 100×30', cols: 100, rows: 30 },
  { label: 'Wide 132×43', cols: 132, rows: 43 },
  { label: 'Full HD 220×55', cols: 220, rows: 55 },
  { label: 'Compact 60×20', cols: 60, rows: 20 },
];
const currentPreset = TERM_PRESETS.find(p => p.cols === project.termCols && p.rows === project.termRows);
```

**Why it's good**

Most TUI frameworks target well-known terminal sizes. Typing `80` and `24` separately is error-prone and slow. A single select click is faster and teaches users what the common sizes are. The TopBar is currently cluttered; consolidating into a dropdown reclaims space.

**Downsides**

Users who need unusual sizes still need the custom fields, which adds a conditional UI element. The preset list is opinionated — different users may want different defaults.

**Confidence: 96%**

---

### 21. Duplicate layer (screen)

**What it is**

Add a "Duplicate" button next to each screen tab in the `LayersPanel`. Clicking it creates a new layer whose `components` map is a deep clone of the source layer, with fresh IDs for all nodes.

**Implementation plan**

1. Add `duplicateLayer: (index: number) => void` to `EditorState` and the store:
   ```ts
   duplicateLayer: (index) => {
     const state = get();
     const savedLayers = syncLayersArray(state.project);
     const source = savedLayers[index];
     if (!source) return;
     // Deep-clone all nodes with new IDs
     const { nodes: cloned, rootId: newRootId } = cloneSubtreeWithNewIds(
       source.components,
       source.rootId,
       null,
     );
     const newLayer: Layer = {
       id: uid('layer'),
       name: `${source.name} (copy)`,
       rootId: newRootId,
       components: cloned,
     };
     // Fix parentIds: root's parentId should remain null
     cloned[newRootId] = { ...cloned[newRootId], parentId: null };
     const newLayers = [...savedLayers, newLayer];
     const newIdx = newLayers.length - 1;
     const next = pushHistory(state);
     const newStep: TimelineStep = { id: uid('step'), layerId: newLayer.id, label: newLayer.name };
     const project: ProjectState = {
       ...state.project,
       rootId: newLayer.rootId,
       components: newLayer.components,
       layers: newLayers,
       activeLayerIndex: newIdx,
       timelineSteps: [...(state.project.timelineSteps ?? []), newStep],
     };
     saveProject(project);
     set({ ...next, project, selectedId: null });
   },
   ```
2. In `LayersPanel.tsx`, add a duplicate button next to the existing delete button for each screen tab:
   ```tsx
   <button
     className="text-[10px] text-ink-400 hover:text-accent"
     title="Duplicate screen"
     onClick={() => duplicateLayer(idx)}
   >
     ⧉
   </button>
   ```

**Why it's good**

Duplicating a screen is a very common workflow: design a base screen, duplicate it, then modify the copy for a "loading state" or "error state" variant. `cloneSubtreeWithNewIds` already handles all the ID remapping logic. The implementation is roughly 20 lines in the store and 5 lines in the UI.

**Downsides**

The duplicated layer's component nodes need their `parentId` chains corrected. `cloneSubtreeWithNewIds` handles the tree structure but the root node's `parentId` will be `null` (correct) — but the function signature takes `newParentId` which is used for the root; passing `null` requires a small adjustment. This edge case is easy to test.

**Confidence: 97%**

---

### 23. Undo/redo history panel

**What it is**

An expandable "History" panel (accessible via a button in the TopBar or as a collapsible section in the left sidebar) that shows a numbered list of the last 50 undo entries with human-readable labels (e.g., "Added button", "Updated props on input_abc", "Deleted container_xyz").

**Implementation plan**

1. Augment `UndoEntry` with an optional `label: string`:
   ```ts
   interface UndoEntry {
     project: ProjectState;
     selectedId: string | null;
     label: string; // e.g., "Add button", "Update text"
   }
   ```
2. Update all `pushHistory` call sites to pass a label. Most mutations happen in named actions (`addChild`, `remove`, `updateProps`, `move`) so adding labels there is straightforward:
   ```ts
   addChild: (parentId, type, index) => {
     const label = `Add ${type}`;
     const next = pushHistory(state, label);
     // ...
   }
   ```
3. Add a `<HistoryPanel>` component that reads `past` and `future` from the store and renders a scrollable list. Clicking an entry jumps to that state by repeatedly calling `undo()` or `redo()`.
4. Alternatively (simpler first version): display the list read-only, without click-to-jump. This is still valuable as it shows what operations have been done.
5. Show the panel as a popover triggered by hovering/clicking the undo button area.

**Why it's good**

The current undo/redo implementation is a black box — users have no idea how many steps they can undo or what those steps are. A visible history list is standard in professional tools (Photoshop, Figma, VS Code). The `past` and `future` arrays are already in the store state; this is a pure UI addition.

**Downsides**

Adding `label` to `UndoEntry` requires touching every `pushHistory` call site (there are ~15). For the click-to-jump variant, jumping to an arbitrary history point by repeated undo/redo calls is O(n) and may cause brief UI flicker; a direct state assignment would be cleaner but requires more store changes.

**Confidence: 85%**

---

### 25. In-canvas text editing (double-click to edit)

**What it is**

When the user double-clicks a `text`, `button`, `input`, or `asciitext` node on the canvas, a transparent floating `<input>` (or `<textarea>`) appears positioned over the node's character-grid rect, pre-filled with the current content. On blur or Enter, the value is committed via `updateProps`.

**Implementation plan**

1. Add `editingId: string | null` and `editingValue: string` state to `TerminalPreview`.
2. In `NodeHitbox`, add `onDoubleClick`:
   ```tsx
   onDoubleClick={(e) => {
     e.stopPropagation();
     const node = project.components[id];
     if (!['text','button','input','asciitext'].includes(node?.type ?? '')) return;
     const val = node.props.text ?? node.props.value ?? '';
     setEditingId(id);
     setEditingValue(String(val));
   }}
   ```
3. When `editingId` is non-null, render a floating overlay input positioned at `rect.x * cell.w`, `rect.y * cell.h`:
   ```tsx
   {editingId && result.rects[editingId] && (
     <div
       className="absolute"
       style={{
         left: result.rects[editingId].x * cell.w,
         top: result.rects[editingId].y * cell.h,
         width: result.rects[editingId].w * cell.w,
       }}
     >
       <input
         autoFocus
         className="w-full bg-transparent text-white font-mono outline-none border-b-2 border-accent"
         style={{ fontSize: 14, lineHeight: '18px' }}
         value={editingValue}
         onChange={(e) => setEditingValue(e.target.value)}
         onBlur={() => {
           if (editingId) {
             const node = project.components[editingId];
             const propKey = node?.type === 'button' || node?.type === 'text' || node?.type === 'asciitext' ? 'text' : 'value';
             updateProps(editingId, { [propKey]: editingValue });
           }
           setEditingId(null);
         }}
         onKeyDown={(e) => {
           if (e.key === 'Enter' || e.key === 'Escape') {
             e.currentTarget.blur();
           }
         }}
       />
     </div>
   )}
   ```
4. The Properties Panel stays open during editing, providing a parallel way to edit.

**Why it's good**

Double-clicking to edit text is a universal WYSIWYG metaphor. The current workflow requires: click node, find "Text" field in properties panel, click into the tiny input, type. That is 4 steps vs. a single double-click. For `text` and `button` nodes specifically, this is the most common edit operation.

**Downsides**

The floating input does not render in the terminal's monospace font at the exact pixel dimensions, so there is a brief visual mismatch during editing. The edit completes and the grid re-renders with the new value, so the final result is always correct. For `asciitext`, editing changes the source text and the ASCII art regenerates on commit — this is actually intuitive.

**Confidence: 88%**

---

### 26. Animation preview toggle (play/pause)

**What it is**

Currently, color animations run whenever any node has `animation.enabled = true`. There is no way to pause all animations in the preview to inspect the static layout. Add a global Play/Pause toggle button (a `⏸` / `▶` icon) in the preview area that freezes `nowMs` (the animation epoch) and stops the `setInterval`.

**Implementation plan**

1. Add `animPlaying: boolean` state (default `true`) to `TerminalPreview`.
2. The existing animation loop in `TerminalPreview.tsx`:
   ```ts
   useEffect(() => {
     if (!hasAnimations || !animPlaying) return;
     const id = setInterval(() => setNowMs(performance.now()), 50);
     return () => clearInterval(id);
   }, [hasAnimations, animPlaying]);
   ```
3. Add a floating toggle button in the top-right corner of the preview area:
   ```tsx
   {hasAnimations && (
     <button
       className="absolute top-2 right-2 btn text-xs z-10"
       onClick={() => setAnimPlaying(p => !p)}
       title={animPlaying ? 'Pause animations' : 'Play animations'}
     >
       {animPlaying ? '⏸' : '▶'}
     </button>
   )}
   ```
4. When paused, `nowMs` is frozen at its last value, so all animated components display their last animated frame. The button is only visible when at least one node has animations enabled.

**Why it's good**

Animations make it hard to inspect the layout and select components precisely because cells keep changing color. A single pause button solves this without requiring the user to dig into the Properties panel to disable animations. The implementation is 8 lines.

**Downsides**

The toggle only affects the preview, not the actual animation configuration. Users might expect "pause" to stop the animation permanently. Clear button labeling (Play/Pause vs. Enable/Disable) mitigates this. Very minor implementation, minimal risk.

**Confidence: 98%**

---

### 27. Go module scaffolding

**What it is**

Instead of exporting a single flat `main.go` file, the Bubble Tea exporter offers a "Download Go Project" option that produces a ZIP file containing:

```
tui-app/
├── go.mod
├── go.sum         (populated after `go mod tidy`)
├── main.go
└── Makefile
```

The `go.mod` is pre-filled with the correct module name and Bubble Tea / Lip Gloss dependencies. The `Makefile` has `run`, `build`, and `tidy` targets.

**Implementation plan**

1. Add a lightweight in-browser ZIP builder. The `fflate` library (~27 KB gzipped) or a minimal custom implementation using `CompressionStream` handles this. Alternatively, use the existing `Blob` download approach to produce individual files (one per download button) without a ZIP.
2. Add a `generateGoProject(project: ProjectState): Record<string, string>` function in `bubbleTeaExporter.ts` that returns a map of filename → content:
   ```ts
   export function generateGoProject(project: ProjectState): Record<string, string> {
     return {
       'main.go': exportBubbleTea(project),
       'go.mod': generateGoMod(),
       'Makefile': generateMakefile(),
     };
   }

   function generateGoMod(): string {
     return `module tui-app\n\ngo 1.22\n\nrequire (\n\tgithub.com/charmbracelet/bubbletea v0.27.0\n\tgithub.com/charmbracelet/lipgloss v0.12.1\n)\n`;
   }

   function generateMakefile(): string {
     return `run:\n\tgo run .\n\nbuild:\n\tgo build -o tui-app .\n\ntidy:\n\tgo mod tidy\n`;
   }
   ```
3. In `CodeView.tsx`, when `lang === 'bubbletea'`, add a "Download Go Project" button beside the existing "Download main.go":
   ```tsx
   <button className="btn" onClick={downloadGoProject}>
     Download Go Project
   </button>
   ```
4. The download function creates multiple `<a>` clicks in sequence (one per file) — no ZIP required. Users get `main.go`, `go.mod`, and `Makefile` as separate downloads. Or use `JSZip`/`fflate` for a single archive.

**Why it's good**

The current `main.go` export requires users to manually create `go.mod`, run `go get`, etc. New Go developers are often confused by module setup. Providing a complete project makes the "copy → run" experience instant. The `go.mod` template is tiny (10 lines) but saves 5–10 minutes of setup for every user.

**Downsides**

The `go.sum` file cannot be pre-generated without running `go mod tidy`. The downloaded project requires running `go mod tidy` before `go run .` — but this is exactly what the Makefile's `tidy` target does, so the UX is still `make tidy && make run`. Pinning specific Bubble Tea / Lip Gloss versions in `go.mod` requires maintenance as those libraries release new versions.

**Confidence: 91%**

---

### 29. Focus-order visualization

**What it is**

A "Focus order" toggle button in the TopBar (or Properties panel) that overlays numbered badges on all `focusable: true` components in the current screen, showing their tab order. The order is determined by a depth-first traversal of the component tree (which matches how most TUI frameworks assign focus). Clicking a badge selects that component.

**Implementation plan**

1. Add `showFocusOrder: boolean` state to `TerminalPreview` (default `false`).
2. Compute focusable nodes in order:
   ```ts
   function getFocusOrder(
     components: Record<string, ComponentNode>,
     rootId: string,
   ): string[] {
     const order: string[] = [];
     const traverse = (id: string) => {
       const node = components[id];
       if (!node || node.hidden) return;
       if (node.props.focusable && !node.props.disabled) order.push(id);
       node.children.forEach(traverse);
     };
     traverse(rootId);
     return order;
   }
   ```
3. When `showFocusOrder` is true, render numbered `<div>` badges in `TerminalPreview` for each focusable node at the top-left corner of its rect:
   ```tsx
   {showFocusOrder && focusOrder.map((id, idx) => {
     const r = result.rects[id];
     if (!r) return null;
     return (
       <div
         key={id}
         className="absolute flex items-center justify-center w-4 h-4 text-[9px] bg-accent text-ink-900 rounded-full font-bold pointer-events-auto cursor-pointer z-20"
         style={{ left: r.x * cell.w - 4, top: r.y * cell.h - 4 }}
         onClick={(e) => { e.stopPropagation(); select(id); }}
       >
         {idx + 1}
       </div>
     );
   })}
   ```
4. Add a toggle button in the preview area (or TopBar):
   ```tsx
   <button className="btn" onClick={() => setShowFocusOrder(v => !v)}>
     {showFocusOrder ? 'Hide focus order' : 'Focus order'}
   </button>
   ```
5. The badge for the currently selected node is highlighted differently (e.g., white background instead of accent).

**Why it's good**

TUI applications are keyboard-driven; tab order matters enormously. No current tooling makes it easy to visualize and audit focus order in a TUI design. This feature is unique to TUI Builder (Figma has no concept of terminal focus order). It directly supports the tool's core use case — designing keyboard-navigable TUI applications. The implementation is roughly 40 lines.

**Downsides**

The focus order computed by depth-first traversal is an approximation. Actual Textual/Bubble Tea focus management can be customized by the application (e.g., Textual's `focus_next`). The visualization shows a *default* focus order, which is explicitly labeled as such. This is a useful approximation even if not always exact.

**Confidence: 93%**
