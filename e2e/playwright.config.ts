import { defineConfig, devices } from '@playwright/test';
import { APP_URL, BACKEND_URL } from './tests/support/urls.js';

/**
 * The production web build, in a real browser, against the fake backend.
 *
 * `webServer` builds the app exactly as Pages does — `vite build` — with its
 * ordinary environment variables pointed at the fake, then serves the output
 * with `vite preview`. `globalSetup` starts the fake. See e2e/README.md.
 *
 * One worker, in order. The fake is one Postgres connection and the tests are
 * few; parallel runs would buy seconds and cost the ability to read a failure.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] === undefined ? 0 : 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: process.env['CI'] !== undefined,
  reporter:
    process.env['CI'] === undefined
      ? [['list']]
      : [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalSetup: './global-setup.ts',

  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // A phone, because that is where the app is used: touch, a narrow
      // screen, and the tab bar under a thumb. Chromium, because it is the
      // engine CI can install everywhere; WebKit is what iPhones run, and is
      // the next project to add once it runs OPFS headless on Linux.
      name: 'phone',
      use: {
        ...devices['Pixel 7'],
        // Locally, the Chrome that is already installed; in CI, Playwright's.
        ...(process.env['CI'] === undefined ? { channel: 'chrome' } : {}),
      },
    },
  ],

  webServer: {
    cwd: '../apps/web',
    command:
      'npx vite build --outDir dist-e2e --emptyOutDir && ' +
      'npx vite preview --outDir dist-e2e --host 127.0.0.1 --port 4380 --strictPort',
    url: APP_URL,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Public by design in production, and here not even real: they name the
      // fake backend, which is all the build needs to know.
      VITE_SUPABASE_URL: BACKEND_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-publishable-key-for-the-fake-backend',
      VITE_POWERSYNC_URL: BACKEND_URL,
    },
  },
});
