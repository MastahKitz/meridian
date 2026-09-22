import { defineConfig } from '@playwright/test';
import { environment } from './tests/functional/config/environments';

export default defineConfig({
  testDir: './tests/functional',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  globalSetup: './tests/functional/global.setup.ts',
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: environment.apiBaseUrl,
  },
  outputDir: 'test-results',
});
