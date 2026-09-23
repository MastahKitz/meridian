import { defineConfig } from '@playwright/test';
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
  outputDir: 'test-results',
});
