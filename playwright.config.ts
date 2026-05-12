import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/test-results',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'on',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Use the built output so VitePress docs at /docs/ are also served.
    // In CI, `npm run build` runs before the E2E step.
    // For local dev, fall back to the running dev server if one is already up.
    command: 'vite preview --port 5173 --strictPort',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
