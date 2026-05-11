---
title: The Canvas
---

# The Canvas

The center panel is a **character-grid terminal emulator** — a 2D array of cells rendered as styled `<span>` elements in the browser. Each cell is one character wide, faithfully mimicking a monospace terminal. What you see is as close as possible to what your real framework will render at runtime.

## Navigation

- **Drag** a component from the library onto any container to add it.
- **Click** a component on the canvas to select it and open its properties.
- **Hover** to see a dashed border around the hovered component.
- **Multi-select** with <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + click.
- **Zoom** with the `−` / `+` controls in the top bar.
- <kbd>Backspace</kbd> or <kbd>Delete</kbd> removes the selected component.

## Viewport Presets

The top bar lets you switch between common terminal dimensions — 80×24, 100×30, 120×40, and more — as well as enter a custom width and height. The canvas reflows instantly.

## Themes

Choose a color palette from the top bar:

| Theme | Description |
|-------|-------------|
| **Tokyo Night** | Default dark theme — deep blues and purples |
| **Dracula** | Classic dark theme with vibrant accents |
| **Solarized Dark** | Low-contrast dark palette |
| **Mono** | Monochromatic black and white |

Themes affect both the canvas preview colors and the color values in generated code.
