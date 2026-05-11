---
title: Exporting Code
---

# Exporting Code

Click the **Code** tab (top bar) to open the export panel. Choose a language tab, then hit the **Copy** button. The exported code is self-contained and runnable with only the target framework installed.

## Language Targets

| Target | Framework | Install |
|--------|-----------|---------|
| Python | [Textual](https://github.com/Textualize/textual) | `pip install textual` |
| Go | [Bubble Tea](https://github.com/charmbracelet/bubbletea) + [Lip Gloss](https://github.com/charmbracelet/lipgloss) | `go get ...` |
| Rust | [Ratatui](https://github.com/ratatui-org/ratatui) + [Crossterm](https://github.com/crossterm-rs/crossterm) | `cargo add ratatui crossterm` |

::: info Live Python Validation
Click **Run in browser** in the Python tab to validate syntax using [Pyodide](https://pyodide.org/) (loaded on demand, ~10 MB). This confirms the generated Python parses and imports correctly — it does not execute the app.
:::

## JSON Round-Trip

Use **Export JSON** and **Import** in the top bar to save and load projects as files. The JSON format is documented in the [Project File Format](/reference/project-format) section.
