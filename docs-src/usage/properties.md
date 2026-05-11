---
title: Properties Panel
---

# Properties Panel

The right panel shows all editable props for the selected component. Sections include:

- **Label / Value** — the text content.
- **Colors** — `fg` (text), `bg` (fill), `border color`, `title color`. All ANSI palette.
- **Border** — style (solid, rounded, double, thick, ascii), visibility, title text and alignment.
- **Layout** — direction, width, height, padding, gap, alignment, justification.
- **Absolute position** — X/Y character offsets.
- **Color animation** — solid, gradient, or rainbow; with direction (ltr, rtl, center-out, sides-in). Available on `progressbar`, `text`, and more.
- **Rich spans** — for `text` and `statusbar`: define per-word `fg`, `bg`, and `bold`.

## Rich Spans

Rich spans let you color individual words or segments of text independently. In the status bar below, each section has a different foreground color:

```
┌───────────────────────────────────────────────────┐
│                                                   │
└───────────────────────────────────────────────────┘
 NORMAL  main.py   Ln 42, Col 8   ✗ 2 errors
```

Each segment (`NORMAL`, `main.py`, `Ln 42, Col 8`, `✗ 2 errors`) can have its own `fg`, `bg`, and `bold` settings.
