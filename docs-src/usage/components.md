---
title: Components
---

# Components

The left panel shows the **Component Library** — 23 draggable types grouped by category. Drag any component onto the canvas or into the tree in the Layers panel.

## Layout Components

All layout is driven by **containers**. A container is a flex box: set direction (`row`/`column`), gap, padding, alignment, and justification. Nest containers to build complex layouts.

| Component | Description |
|-----------|-------------|
| `container` | Flex layout root. The canvas has one implicit root container. |
| `grid` | 2D grid layout. Set `gridCols` and `gridGap`. |
| `viewport` | Scrollable content area. Static in preview. |

## Sizing

Each component has a `width` and `height` prop that accepts:

- `fill` — expand to fill available space (like CSS `flex: 1`)
- `auto` — shrink-wrap to content
- `N` — fixed character count (e.g. `40`)

## Absolute Positioning

Enable **Absolute** in the Properties panel to place a component at a fixed X/Y offset within its parent's inner area. Useful for overlays, modals, and status bars pinned to a corner.

## Full Component List

See the [Component Reference](/reference/component-reference) for a complete table of all 23 types with descriptions.
