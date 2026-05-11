---
title: Timeline
---

# Timeline Panel

The **Timeline** panel at the bottom of the workspace is a visual flow diagram that lets you model how a user moves between screens.

## How It Works

1. Each screen is automatically added as a **step** in the timeline.
2. Click **+ Transition** to connect two steps. Choose the event type: `keypress`, `click`, or `custom`, and optionally set a trigger string like `"q"` or `"enter"`.
3. Click any step in the timeline to jump directly to that screen in the canvas.
4. Double-click a step label to rename it.
5. Click **Export Mermaid** to get a Mermaid flowchart of the entire flow.

## Mermaid Export

Paste the exported Mermaid diagram into any Markdown file or the [Mermaid live editor](https://mermaid.live/):

```
flowchart LR
  Login --> Dashboard
  Login --> |keypress: enter| Dashboard
  Dashboard --> |keypress: q| Quit
  Dashboard --> |click| Detail
```
