// @ts-check
/**
 * Playwright configuration
 * ========================
 * Run order:
 *   setup   → tests/auth.setup.js : tests the login page, saves the session (storageState)
 *   chrome  → all *.spec.js on Chromium, starting from the saved session
 *   safari  → all *.spec.js on WebKit,   starting from the saved session
 *
 * Environment (BASE_URL, credentials) comes from config/env.js (.env locally, secrets in CI).
 */
import { defineConfig } from '@playwright/test';
import reportingLabs from './reporting-labs.config';
const { ENV } = require('./config/env');

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',

  // ── Timeouts ──────────────────────────────────────────────────────
  timeout: 30 * 1000,                 // per test (long flows raise it with test.slow / test.setTimeout)
  expect: { timeout: 10 * 1000 },     // per web-first assertion

  // ── Execution ─────────────────────────────────────────────────────
  // Each worker gets its own POS terminal (utils/TerminalPool.js), so the number of workers can
  // be at most the number of terminals in testData/posData.json. Default 1; e.g. WORKERS=2.
  // Spec files are spread over the workers; tests inside a file still run in order.
  fullyParallel: false,
  workers: Number(process.env.WORKERS) || 1,
  retries: isCI ? 2 : 0,              // absorb flakiness on CI only
  forbidOnly: isCI,                   // a forgotten test.only fails the CI build

  // ── Reporting ─────────────────────────────────────────────────────
  // `github` → failure annotations on the Actions run; reporting-labs → HTML report (local + CI)
  reporter: [
    isCI ? ['github'] : ['list'],
    ['reporting-labs', reportingLabs]
  ],

  // ── Defaults for every project ────────────────────────────────────
  use: {
    baseURL: ENV.baseUrl,
    headless: isCI,                   // headed locally, headless on CI runners
    trace: 'retain-on-failure',
    viewport: { width: 1600, height: 800 },
  },

  // ── Projects ──────────────────────────────────────────────────────
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { browserName: 'chromium' },
    },
    {
      name: 'chrome',
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: ENV.authFile,     // start logged in
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'safari',
      dependencies: ['setup'],
      use: {
        browserName: 'webkit',
        storageState: ENV.authFile,     // start logged in
        screenshot: 'on',
      },
    },
  ],
});
