# TUI Builder

A web-based visual builder for **terminal user interfaces**. Drag components onto a terminal canvas, edit their properties, preview the result live, and export runnable code for **Python (Textual)** or **Go (Bubble Tea)**.

The whole app runs in the browser. There is no backend.

## Features

- **Drag-and-drop canvas** with a faithful character-grid renderer (box-drawing borders, ANSI colors, padding, gap, fill/auto/absolute sizing).
- **Component library** (21 types):
  - **Layout:** Container · Grid · Viewport
  - **Basic:** Text · Button · Input · Checkbox · Select · List · TextArea · Divider
  - **Advanced:** Table · Tabs · Status bar · Progress bar · Spinner · Timer · Toast · File Picker · ASCII Text · Modal
- **Multi-screen (layers):** Add/rename/remove named screens from the Layers panel. Each screen is an independent canvas. Double-click a tab to rename.
- **Timeline panel:** Build a flow diagram at the bottom of the canvas. Add steps (linked to screens), add transitions between steps (keypress / click / custom events), and click a step to jump to that screen.
- **Layers panel** with reordering, visibility toggle, lock, and delete.
- **Properties panel** with context-aware editors for every prop, including:
  - **Border color** and **Title color** — per-component, independent of the text `fg`.
  - **Title alignment** (left / center / right) for borders.
  - **Absolute positioning** (X / Y offsets from the parent's inner area).
  - **Rich spans** (text + statusbar): define per-word `fg` / `bg` / `bold`.
  - **Grid columns / gap** for the Grid container type.
  - **Spinner style**, **Toast variant**, **Timer value**, **Divider orientation & label alignment**.
- **Live preview** with click-to-select and hover highlighting.
- **Code export** for:
  - Python · [Textual](https://github.com/Textualize/textual)
  - Go · [Bubble Tea](https://github.com/charmbracelet/bubbletea) + Lip Gloss
  - Project JSON (round-trippable via Import/Export)
- **WASM runtime** (optional): lazy-loads [Pyodide](https://pyodide.org) on demand to validate generated Python in-browser.
- **Themes**: Tokyo Night · Dracula · Solarized · Mono.
- **Undo/redo** and `localStorage` autosave.
- **Keyboard shortcuts**: `⌘Z` / `⌘⇧Z` undo/redo, `Backspace` deletes selected node.

## New components

| Type | Icon | Description |
|------|------|-------------|
| `grid` | ⊞ | 2D grid layout. Children are placed in columns. Set `gridCols` and `gridGap`. Fill-width children belong here or in the root container. |
| `viewport` | ⬜ | Scrollable content area (static in preview). |
| `spinner` | ⠋ | Animated loading indicator — static first frame in preview. Styles: `dots`, `line`, `braille`, `arc`. |
| `divider` | ─ | Horizontal or vertical separator. Optional label with `left` / `center` / `right` alignment. |
| `toast` | 💬 | Notification box. Variants: `info`, `success`, `warning`, `error` — each auto-applies an icon and color scheme. |
| `timer` | ⏱ | Time display (e.g. `01:23:45`). Set `timerValue`. |
| `filepicker` | 📂 | File browser widget. Provide items as a list. |
| `asciitext` | A | Large figlet-style ASCII art banner. Renders uppercase letters and digits in a 3-row glyph font. |

## Multi-screen & Timeline

Screens (layers) are independent canvases within a single project. Switch between them using the tab strip at the top of the **Layers** panel.

The **Timeline panel** at the bottom of the workspace lets you wire screens into a flow:

1. Each screen automatically becomes a step in the timeline.
2. Add **transitions** between steps: choose the from/to steps, the event type (`keypress`, `click`, `custom`), and an optional trigger string (e.g. `"q"`, `"enter"`).
3. Click a step in the timeline to jump directly to that screen.
4. Double-click a step label to rename it.

## Rich text / per-character colors

`text` and `statusbar` components support a **Rich spans** editor in the Properties panel. Each span has its own `fg`, `bg`, and `bold` — letting you create multi-colored status bars or inline-highlighted labels without needing separate text components.

## Architecture

```
src/
├── App.tsx                       — top-level shell (top bar + 3-pane layout + timeline)
├── store/editorStore.ts          — Zustand store, multi-screen, timeline, undo/redo
├── types/component.ts            — schema (ComponentNode, ProjectState, Layer, Timeline…)
├── lib/
│   ├── componentDefs.ts          — palette definitions + factory for new nodes
│   ├── themes.ts                 — ANSI palette per theme
│   └── id.ts
├── renderer/
│   ├── render.ts                 — flex / grid layout + 2D char-grid paint pass
│   └── boxStyles.ts              — box-drawing characters per border style
├── components/
│   ├── Layout/TopBar.tsx
│   ├── ComponentLibrary.tsx      — draggable palette
│   ├── LayersPanel.tsx           — screen tabs + tree, reorder, visibility, lock
│   ├── PropertiesPanel.tsx       — context-aware property editors (incl. rich spans)
│   ├── TerminalPreview.tsx       — canvas, drop targets, selection overlay
│   ├── TimelinePanel.tsx         — flow timeline: steps, transitions, screen links
│   └── CodeView.tsx              — code tabs + Pyodide runner
├── exporters/
│   ├── textualExporter.ts        — Python / Textual code generator
│   └── bubbleTeaExporter.ts      — Go / Bubble Tea + Lip Gloss generator
└── wasm/
    └── pyodideRunner.ts          — lazy Pyodide loader + sandboxed runner
```

## Local development

```sh
npm install
npm run dev          # http://localhost:5173
npm run build
npm run typecheck
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Deployment

The build is **static-only** and works offline after first load.

### GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. On push to `main` it builds with `VITE_BASE=/<repo>/` and deploys to Pages. Enable in repo Settings → Pages → Source = "GitHub Actions".

### Netlify

`netlify.toml` is included. Connect the repo and Netlify runs `npm run build` and serves `dist/`.

### Anywhere else

```sh
npm run build
# upload dist/ to Cloudflare Pages, Vercel, S3 + CloudFront, etc.
```

## WASM strategy

The app's preview is a **simulated renderer** written in TypeScript — not a real Textual or Bubble Tea runtime. For users who want to validate the generated Python, the **Code → Run in browser** button lazy-loads Pyodide (~10 MB, fetched once from jsDelivr) and parses the output in-browser.

## Project file format

```jsonc
{
  "rootId": "root_…",
  "components": { "<id>": { "id": "…", "type": "container", … } },
  "termCols": 100,
  "termRows": 30,
  "theme": "tokyo-night",
  "layers": [
    { "id": "layer_…", "name": "Screen 1", "rootId": "root_…", "components": { … } }
  ],
  "activeLayerIndex": 0,
  "timelineSteps": [
    { "id": "step_…", "layerId": "layer_…", "label": "Screen 1" }
  ],
  "timelineTransitions": [
    { "id": "trans_…", "fromStepId": "step_…", "toStepId": "step_…", "event": "keypress", "trigger": "enter" }
  ]
}
```

`Export JSON` and `Import` in the top bar round-trip the same shape. Old files without `layers`/`timeline` are auto-migrated on load.

## License

MIT (see `LICENSE`).
