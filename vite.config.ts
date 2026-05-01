import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// `base` is configurable via env so the same build works for Netlify (`/`)
// and GitHub Pages project sites (`/<repo>/`).
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: process.env.SOURCEMAP === 'true',
  },
  test: {
    environment: 'node',
  },
});
