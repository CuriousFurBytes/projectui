---
title: Libraries & Frameworks
---

# Libraries & Frameworks

## TUI Export Targets

| Framework | Language | Description |
|-----------|----------|-------------|
| [Textual](https://github.com/Textualize/textual) | Python | Rich TUI framework with CSS-like layout. Built on [Rich](https://github.com/Textualize/rich). [Docs →](https://textual.textualize.io/) |
| [Bubble Tea](https://github.com/charmbracelet/bubbletea) | Go | Elm-architecture TUI framework from [Charm](https://charm.sh/). [Examples →](https://github.com/charmbracelet/bubbletea/tree/master/examples) |
| [Lip Gloss](https://github.com/charmbracelet/lipgloss) | Go | CSS-like layout and styling companion to Bubble Tea. |
| [Ratatui](https://github.com/ratatui-org/ratatui) | Rust | Immediate-mode TUI library. Fork of the archived tui-rs. [Docs →](https://ratatui.rs/) |
| [Crossterm](https://github.com/crossterm-rs/crossterm) | Rust | Cross-platform terminal backend for Ratatui. |

## Related TUI Libraries

Not used in ProjecTUI, but part of the ecosystem:

| Framework | Language | Notes |
|-----------|----------|-------|
| [Ink](https://github.com/vadimdemedes/ink) | Node.js | React for interactive command-line apps. |
| [Bubbles](https://github.com/charmbracelet/bubbles) | Go | Reusable Bubble Tea components (spinner, progress, viewport, textinput). |
| [Huh](https://github.com/charmbracelet/huh) | Go | Forms and prompts built on Bubble Tea. |
| [Gum](https://github.com/charmbracelet/gum) | Go | Glamorous shell script components (fuzzy search, confirm, spin). |
| [tview](https://github.com/rivo/tview) | Go | Rich interactive widgets for the terminal. |
| [urwid](https://urwid.org/) | Python | Mature Python TUI library predating Textual. |
| [Rich](https://github.com/Textualize/rich) | Python | Rich text and beautiful formatting in the terminal. Foundation for Textual. |
| [ncurses](https://invisible-island.net/ncurses/) | C | The foundational terminal library most TUI toolkits build on. |

## ProjecTUI's Own Stack

| Library | Purpose |
|---------|---------|
| [React 18](https://react.dev/) | UI framework for the editor |
| [Zustand](https://github.com/pmndrs/zustand) | Global state management (editor store, undo/redo) |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling for the editor UI |
| [Vite](https://vitejs.dev/) | Build tool and dev server |
| [Pyodide](https://pyodide.org/) | Python runtime via WebAssembly (optional live validation) |
| [Vitest](https://vitest.dev/) | Unit testing |
| [Playwright](https://playwright.dev/) | End-to-end testing |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development throughout |

## Fonts

ProjecTUI uses **[Nerd Fonts](https://www.nerdfonts.com/)** — patched fonts that bundle thousands of icons and glyphs for use in terminal UIs. The editor UI and all text inputs render with **FiraCode Nerd Font** (a patched build of [Fira Code](https://github.com/tonsky/FiraCode)) so that nerd font glyphs display correctly inside the designer.

| Resource | Description |
|----------|-------------|
| [Nerd Fonts](https://www.nerdfonts.com/) | Home page — downloads, cheat sheet, and documentation |
| [Nerd Fonts Cheat Sheet](https://www.nerdfonts.com/cheat-sheet) | Searchable reference of all 10 000+ glyphs |
| [ryanoasis/nerd-fonts on GitHub](https://github.com/ryanoasis/nerd-fonts) | Source repository with font patcher and releases |
| [FiraCode Nerd Font](https://github.com/ryanoasis/nerd-fonts/tree/master/patched-fonts/FiraCode) | The specific variant used by ProjecTUI — Fira Code patched with Nerd Font glyphs |
