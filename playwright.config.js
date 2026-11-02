import { defineConfig } from '@playwright/test';

// Smoke test against the production build. Uses the locally installed Chrome
// (channel: 'chrome') so no Playwright browser download is needed.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', channel: 'chrome', viewport: { width: 1400, height: 900 } },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
