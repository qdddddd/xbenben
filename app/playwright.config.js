import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 30000,
  expect: { timeout: 6000 }, reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 402, height: 874 },
    timezoneId: 'Asia/Taipei', locale: 'en-US',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined),
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 90000,
  },
});
