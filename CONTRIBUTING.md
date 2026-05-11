# Contributing to ProjecTUI

## Overview

ProjecTUI is a browser-based visual designer for terminal UIs. Users drag components onto a character-grid canvas, wire screens into a flow with the Timeline panel, and export runnable code for Python (Textual), Go (Bubble Tea + Lip Gloss), or Rust (Ratatui). It runs entirely in the browser — no backend, no install required.

## Setup

```sh
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest unit tests (watch mode)
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
npm run test:e2e   # Playwright end-to-end tests
```

## Architecture

```
src/
├── App.tsx                   — top-level shell (layout, panels)
├── store/editorStore.ts      — Zustand store: components, layers, timeline, undo/redo
├── types/component.ts        — shared schema (ComponentNode, ProjectState, …)
├── lib/
│   ├── componentDefs.ts      — component palette + node factory
│   ├── exporterUtils.ts      — shared helpers + exporter capability matrix
│   ├── templates.ts          — built-in starter templates
│   └── …                    — themes, animations, shareUrl, etc.
├── renderer/
│   ├── render.ts             — flex/grid layout engine + 2D char-grid paint pass
│   └── boxStyles.ts          — box-drawing character sets per border style
├── components/               — React UI panels (editor, properties, timeline, …)
├── exporters/
│   ├── textualExporter.ts    — Python / Textual
│   ├── bubbleTeaExporter.ts  — Go / Bubble Tea + Lip Gloss
│   └── ratauiExporter.ts     — Rust / Ratatui
└── wasm/
    └── pyodideRunner.ts      — lazy Pyodide loader for in-browser Python validation
```

The canvas is a **simulated renderer**: `render.ts` allocates a 2D character grid, runs a flex/grid layout pass over the component tree, then paints each node onto the grid using box-drawing characters and ANSI palette colors. Exporters walk the same tree and emit framework-specific source code; they share helpers from `exporterUtils.ts`.

State lives entirely in Zustand (`editorStore.ts`) and is persisted to `localStorage`. Undo/redo is a stack of serialized snapshots.

## Coding Standards

### Test-Driven Development

Write a failing test first, then implement. Unit tests live in `src/__tests__/` and use Vitest. E2E tests live in `e2e/` and use Playwright. Every new feature or bug fix should have a corresponding test.

### Comments

No comments unless the *why* is non-obvious. Code that explains itself doesn't need a prose companion.

### Abstractions

Prefer three similar lines of code over a premature abstraction. Extract a helper only when you have a concrete third caller and the abstraction pays for itself.

### Files

Prefer editing an existing file over creating a new one. Don't add a module just to wrap one function.

### TypeScript

Strict mode is on. `any` is banned — use `unknown` and narrow, or define the proper type. No `@ts-ignore` without a comment explaining why.

### File placement

| What | Where |
|---|---|
| React components | `src/components/` |
| Pure logic / utilities | `src/lib/` |
| Code exporters | `src/exporters/` |
| Unit tests | `src/__tests__/` |
| E2E tests | `e2e/` |

## PR Process

1. Branch from `main`. Name branches descriptively: `feat/xxx`, `fix/xxx`, `refactor/xxx`.
2. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
3. Keep commits atomic — one logical change per commit.
4. PR description must include a **Test plan** section listing the specific tests added or the manual steps used to verify the change.
5. All CI checks (typecheck, unit tests, E2E) must be green before merge.

## Adding a New Component Type

1. **Add to the union** in `src/types/component.ts` — extend `ComponentType`.
2. **Register in `componentDefs.ts`** — add a palette entry (icon, label, category) and a factory function that returns a default `ComponentNode`.
3. **Handle in `renderer/render.ts`** — add a paint case that writes the component's visual representation into the char grid.
4. **Handle in each exporter** — add a code-generation case in `textualExporter.ts`, `bubbleTeaExporter.ts`, and `ratauiExporter.ts`. Update the capability matrix in `exporterUtils.ts` to declare the component as `supported`, `partial`, or `unsupported` for each exporter.
5. **Add to `PropertiesPanel.tsx`** — expose the relevant props as property editors.
6. **Write tests** — at minimum a render test in `src/__tests__/render.test.ts` and an exporter test for each exporter that supports it.

## Adding a New Exporter

1. **Create `src/exporters/xxxExporter.ts`** — export a `generateXxx(project: ProjectState): string` function. Walk the component tree with `collectSubtree` from `exporterUtils.ts`.
2. **Add to the capability matrix** in `exporterUtils.ts` — declare every `ComponentType` as `supported`, `partial`, or `unsupported`.
3. **Add a tab in `CodeView.tsx`** — import and call the new generator; wire up the tab label and copy/download buttons.
4. **Write tests** in `src/__tests__/xxxExporter.test.ts` — cover the component types you claim to support; use snapshot tests for stable output.
