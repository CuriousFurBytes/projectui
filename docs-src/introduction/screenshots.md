---
title: Screenshots
---

# Screenshots

All screenshots are captured automatically by the Playwright E2E test suite on each CI run.

## Full Application

![ProjecTUI full app — canvas, layers panel, and properties panel](/screenshots/zz-full-app.png)

*Full editor — canvas (center), component library (left), properties panel (right).*

## Canvas & Components

![App on first load](/screenshots/01-app-loaded.png)

*App on first load with default layout.*

![Spinner component on canvas](/screenshots/f2-02-spinner-on-canvas.png)

*Spinner widget placed on canvas.*

![Toast notification on canvas](/screenshots/f2-03-toast-on-canvas.png)

*Toast notification widget.*

![ASCII text banner on canvas](/screenshots/f2-04-asciitext-on-canvas.png)

*Large ASCII art banner (figlet-style).*

## Panels

![Border properties panel](/screenshots/f5-01-border-props.png)

*Border style and color options in the Properties panel.*

![Timeline panel](/screenshots/f10-01-timeline-visible.png)

*Timeline panel for multi-screen flows.*

![Layers panel](/screenshots/06-layers-panel.png)

*Layers panel showing the component tree.*

![Rich spans on status bar](/screenshots/f3-01-rich-spans.png)

*Rich spans: per-word colors on a status bar.*

![Grid component in library](/screenshots/f9-01-grid-in-library.png)

*Grid layout component.*

::: tip
Screenshots are auto-generated — run `npm run test:e2e` locally to regenerate them in `e2e/screenshots/`.
:::
