---
title: Getting Started
---

# Getting Started

## Use Online

Open the editor directly — no install required. Your work is auto-saved to `localStorage` and persists across reloads.

<a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.55rem 1.2rem;background:var(--vp-c-brand-1);color:#1a1b26;border-radius:6px;font-family:var(--vp-font-family-mono);font-size:13px;font-weight:600;text-decoration:none;margin:0.5rem 0 1.5rem">▶ Open Editor</a>

## Run Locally

Clone the repo and start the development server:

```bash
# Clone and install
git clone https://github.com/lucasqueiroz/projectui
cd projectui
npm install

# Start dev server
npm run dev          # → http://localhost:5173

# Other commands
npm run build        # production build → dist/
npm run typecheck    # TypeScript check
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Quick Start Workflow

1. **Pick a template** — click **Templates** in the top bar to start from a pre-built layout like Dashboard, Login Form, or Modal Dialog.
2. **Drag components** — from the left panel onto the canvas, or onto an existing container to nest them.
3. **Edit properties** — click any component to select it, then adjust colors, size, border, text, and layout in the right panel.
4. **Add screens** — click **+ Screen** in the Layers panel to add a new screen and wire up a multi-screen flow.
5. **Export** — open the **Code** tab and choose Python, Go, or Rust. Click the copy button and paste into your project.

::: info Auto-save
Your project is automatically saved to `localStorage` on every change. Use **Export JSON** in the top bar to save a portable file, and **Import** to load it back.
:::
