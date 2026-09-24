import { defineConfig, devices } from '@playwright/test';
import { environment } from './tests/functional/config/environments';

export default defineConfig({
  testDir: './tests/functional',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  workers: 5,
  globalSetup: './tests/functional/global.setup.ts',
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-report/results.json' }],
  ],
  use: {
    baseURL: environment.apiBaseUrl,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  // Cross-browser only matters for @ui specs, which actually render in a
  // browser — @api specs make raw HTTP requests via APIRequestContext, which
  // doesn't touch a browser engine at all, so running those three times over
  // would just triple the suite's runtime for no added coverage.
  projects: [
    { name: 'api', grep: /@api/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grep: /@ui/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grep: /@ui/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grep: /@ui/ },
  ],
  outputDir: 'test-results',
});
