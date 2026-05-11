---
layout: home

hero:
  name: "ProjecTUI"
  text: "Visual TUI Editor"
  tagline: Design terminal user interfaces in the browser. Drag components onto a faithful character-grid canvas, wire up multi-screen flows, and export runnable code for Python, Go, or Rust — no install required.
  actions:
    - theme: brand
      text: Getting Started →
      link: /introduction/getting-started
    - theme: alt
      text: Component Reference
      link: /reference/component-reference

features:
  - icon: 🎨
    title: Faithful Terminal Renderer
    details: Box-drawing borders, ANSI colors, padding, gap, fill/auto/absolute sizing — rendered exactly as a real terminal would show it.
  - icon: 📦
    title: 23 Component Types
    details: From basic text and buttons to tables, spinners, ASCII art banners, and tree views — all draggable onto the canvas.
  - icon: 🖥️
    title: Multi-Screen Flows
    details: Design entire apps with named screens, then wire them together with a visual timeline editor.
  - icon: ⚡
    title: 3 Export Targets
    details: Python (Textual), Go (Bubble Tea + Lip Gloss), Rust (Ratatui). All idiomatic and runnable with only the target framework installed.
  - icon: 🔒
    title: No Backend Required
    details: Everything runs in the browser. No accounts, no servers, no data sent anywhere. Works offline after first load.
  - icon: 🐍
    title: Live Python Validation
    details: Optional WASM runtime (Pyodide) validates generated Python syntax in-browser, loaded on demand.
---

<div style="text-align:center;padding:1.5rem 0 0">
  <a href="/" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1.25rem;border:1px solid var(--vp-c-border);border-radius:6px;font-family:var(--vp-font-family-mono);font-size:13px;color:var(--vp-c-text-2);text-decoration:none">▶ Open Editor</a>
</div>
