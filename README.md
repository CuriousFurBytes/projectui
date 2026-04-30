# TUI Builder

A web-based visual builder for **terminal user interfaces**. Drag components onto a terminal canvas, edit their properties, preview the result live, and export runnable code for **Python (Textual)** or **Go (Bubble Tea)**.

The whole app runs in the browser. There is no backend.

## Features

- **Drag-and-drop canvas** with a faithful character-grid renderer (supports box-drawing borders, ANSI colors, padding, gap, fill/auto sizing).
- **Component library**: container · text · button · input · checkbox · select · list · textarea · table · tabs · status bar · progress bar · modal.
- **Layers panel** with reordering, visibility toggle, lock, and delete.
- **Properties panel** for layout, style, content, and behavior.
- **Live preview** with click-to-select and hover highlighting.
- **Code export** for:
  - Python · [Textual](https://github.com/Textualize/textual)
  - Go · [Bubble Tea](https://github.com/charmbracelet/bubbletea) + Lip Gloss
  - Project JSON (round-trippable via Import/Export)
- **WASM runtime** (optional): lazy-loads [Pyodide](https://pyodide.org) on demand to validate generated Python in-browser.
- **Themes**: Tokyo Night · Dracula · Solarized · Mono.
- **Undo/redo** and `localStorage` autosave.
- **Keyboard shortcuts**: `⌘Z` / `⌘⇧Z` undo/redo, `Backspace` deletes selected node.

## Architecture

```
src/
├── App.tsx                       — top-level shell (top bar + 3-pane layout)
├── store/editorStore.ts          — Zustand store, normalized component tree, undo/redo
├── types/component.ts            — schema (ComponentNode, ProjectState, etc.)
├── lib/
│   ├── componentDefs.ts          — palette definitions + factory for new nodes
│   ├── themes.ts                 — ANSI palette per theme
│   └── id.ts
├── renderer/
│   ├── render.ts                 — flex layout + 2D char-grid paint pass
│   └── boxStyles.ts              — box-drawing characters per border style
├── components/
│   ├── Layout/TopBar.tsx
│   ├── ComponentLibrary.tsx      — draggable palette
│   ├── LayersPanel.tsx           — tree, reorder, visibility, lock
│   ├── PropertiesPanel.tsx       — context-aware property editors
│   ├── TerminalPreview.tsx       — canvas, drop targets, selection overlay
│   └── CodeView.tsx              — code tabs + Pyodide runner
├── exporters/
│   ├── textualExporter.ts        — Python / Textual code generator
│   └── bubbleTeaExporter.ts      — Go / Bubble Tea + Lip Gloss generator
└── wasm/
    └── pyodideRunner.ts          — lazy Pyodide loader + sandboxed runner
```

The renderer is the heart of the preview: it walks the tree, computes a row/column flex layout into character-cell rectangles, then paints widgets into a 2D `Cell[][]` grid (including box-drawing borders, ANSI fg/bg, bold). The grid is rendered as styled `<span>`s for crisp monospace output and DOM efficiency (consecutive cells with the same style are coalesced into runs).

## Local development

```sh
npm install
npm run dev          # http://localhost:5173
npm run build
npm run typecheck
```

## Deployment

The build is **static-only** and works offline after first load.

### GitHub Pages

A workflow is included at `.github/workflows/deploy.yml`. On push to `main` it builds with `VITE_BASE=/<repo>/` (so asset paths resolve correctly on a project page) and deploys to Pages. To enable: in repo Settings → Pages, set Source = "GitHub Actions".

### Netlify

`netlify.toml` is included. Connect the repo and Netlify will run `npm run build` and serve `dist/`. The SPA fallback is configured.

### Anywhere else

Any static host works:

```sh
npm run build
# upload dist/ to your host (Cloudflare Pages, Vercel static, S3 + CloudFront, etc.)
```

## WASM strategy

The app's preview is a **simulated renderer** written in TypeScript — it does not run Textual or Bubble Tea directly, because:

- Textual emits ANSI escape sequences for a real TTY; reproducing that in-browser would require an ANSI emulator (xterm.js) plus async event loop bridging.
- Bubble Tea is interactive over `os.Stdin` / `os.Stdout`; running it in WASM is non-trivial.

Instead, the simulated renderer is a faithful approximation that's instant and zero-cost to update. For users who want to validate the generated Python, the **Code → Run in browser** button lazy-loads Pyodide (~10 MB, fetched once from jsDelivr) and parses + introspects the output. This gives confidence that the generated code is syntactically valid before downloading and running it locally.

The `src/wasm/` directory is intentionally isolated so a TinyGo `.wasm` runner could be added in the same shape (`loadGoRuntime` / `runGo`) without touching the editor.

## Project file format

Save / load uses a simple JSON shape:

```jsonc
{
  "rootId": "root_…",
  "components": {
    "<id>": { "id": "…", "type": "container", "parentId": null, "children": ["…"], "props": { … } }
  },
  "termCols": 100,
  "termRows": 30,
  "theme": "tokyo-night"
}
```

`Export JSON` and `Import` in the top bar round-trip the same shape.

## License

MIT (see `LICENSE`).
