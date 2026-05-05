# ProjecTUI

A web-based **visual builder for terminal user interfaces**. Drag components onto a faithful character-grid canvas, edit their properties, and export runnable code for **Python (Textual)**, **Go (Bubble Tea + Lip Gloss)**, or **Rust (Ratatui)**.

Runs entirely in the browser — no backend, no install.

→ **[Full documentation](docs/index.html)**

---

## ⚠️ AI Usage Disclaimer

This project was developed with **heavy use of large language models and AI coding agents** (Claude/Anthropic). LLMs assisted with architecture decisions, feature implementation, code generation, test writing, and documentation. The TDD workflow (red/green cycles) was driven iteratively with agent assistance. All generated code was reviewed and tested by the author, but readers should be aware of this context when evaluating the codebase.

---

## Features

- **Drag-and-drop canvas** with a faithful character-grid renderer (box-drawing borders, ANSI colors, padding, gap, fill/auto/absolute sizing).
- **Component library** (23 types):
  - **Layout:** Container · Grid · Viewport
  - **Basic:** Text · Button · Input · Checkbox · Select · List · TextArea · Divider
  - **Advanced:** Table · Tabs · Status bar · Progress bar · Spinner · Timer · Toast · File Picker · ASCII Text · Modal · TreeView · MetricCard · Markdown Text
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
  - **Color animations**: solid, gradient, rainbow — with direction control (ltr, rtl, center-out, sides-in).
  - **List customization**: selection colors and icons.
- **Live preview** with click-to-select and hover highlighting.
- **Code export** for:
  - Python · [Textual](https://github.com/Textualize/textual)
  - Go · [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss)
  - Rust · [Ratatui](https://github.com/ratatui-org/ratatui)
  - Project JSON (round-trippable via Import/Export)
- **WASM runtime** (optional): lazy-loads [Pyodide](https://pyodide.org) on demand to validate generated Python in-browser.
- **Themes**: Tokyo Night · Dracula · Solarized · Mono.
- **Undo/redo** and `localStorage` autosave.
- **Command palette** (`⌘K`) for quick access to all actions.
- **Template gallery** with 10+ starter templates.
- **Keyboard shortcuts**: `⌘Z` / `⌘⇧Z` undo/redo, `Backspace` deletes selected node.
- **URL-based project sharing**: projects are compressed into the URL fragment.
- **Mermaid export**: export the timeline as a Mermaid flowchart diagram.
- **Design tokens**: exportable color/spacing token system.
- **Accessibility helpers**: focus order visualization (experimental).
- **Syntax highlighting** in code export view.

## Component Reference

| Type | Icon | Description |
|------|------|-------------|
| `container` | ▢ | Flex container. Direction, gap, padding, alignment, border. Root of every layout. |
| `grid` | ⊞ | 2D grid layout. Children placed in columns. Set `gridCols` and `gridGap`. |
| `viewport` | ⬜ | Scrollable content area (static in preview). |
| `text` | T | Inline text with optional rich spans (per-word fg/bg/bold). |
| `button` | ⬛ | Focusable button with label. |
| `input` | ▭ | Text input field with placeholder. |
| `checkbox` | ☑ | Checkbox with label and checked state. |
| `select` | ▾ | Dropdown selector with option list. |
| `list` | ≡ | Scrollable item list with configurable selection colors and icons. |
| `textarea` | ≣ | Multi-line text input. |
| `divider` | ─ | Horizontal or vertical separator. Optional label with `left`/`center`/`right` alignment. |
| `table` | ⊟ | Data table with configurable columns and rows. |
| `tabs` | ⊤ | Tabbed panel with switchable content areas. |
| `statusbar` | ▬ | Status bar with rich spans for multi-color segments. |
| `progressbar` | ▰ | Progress bar with animated color effects. |
| `spinner` | ⠋ | Animated loading indicator. Styles: `dots`, `line`, `braille`, `arc`. |
| `timer` | ⏱ | Time display (e.g. `01:23:45`). Set `timerValue`. |
| `toast` | 💬 | Notification box. Variants: `info`, `success`, `warning`, `error`. |
| `filepicker` | 📂 | File browser widget with configurable items. |
| `asciitext` | A | Large figlet-style ASCII art banner. Renders letters and digits in a 3-row glyph font. |
| `modal` | ⬜ | Dialog overlay with title and content. |
| `treeview` | 🌲 | Hierarchical tree view with expandable nodes. |
| `metriccard` | 📊 | Metric display card with value and label. |

## Multi-screen & Timeline

Screens (layers) are independent canvases within a single project. Switch between them using the tab strip at the top of the **Layers** panel.

The **Timeline panel** at the bottom lets you wire screens into a flow:

1. Each screen automatically becomes a step in the timeline.
2. Add **transitions** between steps: choose the from/to steps, the event type (`keypress`, `click`, `custom`), and an optional trigger string (e.g. `"q"`, `"enter"`).
3. Click a step in the timeline to jump directly to that screen.
4. Double-click a step label to rename it.
5. Export the timeline as a **Mermaid diagram** for documentation.

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
│   ├── templates.ts              — 10+ starter project templates
│   ├── colorAnimation.ts         — animated color effects (solid, gradient, rainbow)
│   ├── designTokens.ts           — design token system
│   ├── shareUrl.ts               — URL-based project sharing
│   ├── mermaidExporter.ts        — timeline → Mermaid diagram
│   ├── validation.ts             — project linting
│   ├── actionRegistry.ts         — command palette action registry
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
│   ├── CodeView.tsx              — code tabs + Pyodide runner
│   ├── CommandPalette.tsx        — ⌘K global search/actions
│   ├── TemplateGallery.tsx       — starter template picker
│   ├── UndoHistoryPanel.tsx      — undo/redo history visualization
│   └── TextualLivePreview.tsx    — live Python validation (Pyodide)
├── exporters/
│   ├── textualExporter.ts        — Python / Textual code generator
│   ├── bubbleTeaExporter.ts      — Go / Bubble Tea + Lip Gloss generator
│   └── ratauiExporter.ts         — Rust / Ratatui code generator
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

The app's preview is a **simulated renderer** written in TypeScript — not a real Textual or Bubble Tea runtime. For users who want to validate the generated Python, the **Code → Run in browser** button lazy-loads [Pyodide](https://pyodide.org) (~10 MB, fetched once from jsDelivr) and parses the output in-browser.

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

## References

### TUI Frameworks (export targets)

| Framework | Language | Links |
|-----------|----------|-------|
| [Textual](https://github.com/Textualize/textual) | Python | [docs](https://textual.textualize.io/) · [gallery](https://www.textualize.io/blog/textual-0-1-0/) |
| [Bubble Tea](https://github.com/charmbracelet/bubbletea) | Go | [examples](https://github.com/charmbracelet/bubbletea/tree/master/examples) |
| [Lip Gloss](https://github.com/charmbracelet/lipgloss) | Go | Layout & styling companion to Bubble Tea |
| [Ratatui](https://github.com/ratatui-org/ratatui) | Rust | [docs](https://ratatui.rs/) · [templates](https://github.com/ratatui-org/templates) |
| [Crossterm](https://github.com/crossterm-rs/crossterm) | Rust | Cross-platform terminal backend for Ratatui |

### Other notable TUI frameworks (not used but related)

| Framework | Language | Notes |
|-----------|----------|-------|
| [Ink](https://github.com/vadimdemedes/ink) | Node.js | React for interactive CLI apps |
| [Charm/Bubbles](https://github.com/charmbracelet/bubbles) | Go | Reusable Bubble Tea components |
| [Huh](https://github.com/charmbracelet/huh) | Go | Forms and prompts built on Bubble Tea |
| [Rich](https://github.com/Textualize/rich) | Python | Rich text in the terminal (underpins Textual) |
| [urwid](https://urwid.org/) | Python | Classic Python TUI library |
| [ncurses](https://invisible-island.net/ncurses/) | C | Foundation for most TUI toolkits |
| [tview](https://github.com/rivo/tview) | Go | Rich interactive widgets for terminals |
| [tcell](https://github.com/gdamore/tcell) | Go | Low-level cell-based terminal library |

### Runtime / Build

| Library | Purpose |
|---------|---------|
| [React](https://react.dev/) | UI framework |
| [Zustand](https://github.com/pmndrs/zustand) | State management |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Pyodide](https://pyodide.org/) | Python runtime via WebAssembly |
| [Vitest](https://vitest.dev/) | Unit testing |
| [Playwright](https://playwright.dev/) | End-to-end testing |

## Similar Projects & Inspiration

| Project | Notes |
|---------|-------|
| [ascii-motion.app](https://ascii-motion.app/) | ASCII art animation editor in the browser |
| [tui.builders](https://tui.builders) | Another web-based TUI design tool |
| [Lazygit](https://github.com/jesseduffield/lazygit) | Exemplary TUI application in Go — a major design inspiration |
| [ttyd](https://github.com/tsl0922/ttyd) | Share terminal in the browser (shows what real TUIs look like in-browser) |
| [xterm.js](https://xtermjs.org/) | Terminal emulator for the web |
| [blessed](https://github.com/chjj/blessed) | Node.js curses-like library |
| [gum](https://github.com/charmbracelet/gum) | Charm's tool for glamorous shell scripts |

## License

MIT (see `LICENSE`).
