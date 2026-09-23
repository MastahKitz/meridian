import { defineConfig } from '@playwright/test';
import { environment } from './tests/functional/config/environments';

export default defineConfig({
  testDir: './tests/functional',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  globalSetup: './tests/functional/global.setup.ts',
  // PW_PHASE is set by each CI phase invocation (see .github/workflows/playwright.yml)
  // so every phase writes its own named blob file instead of clobbering a shared
  // one; those blobs are merged back into the normal html/list/json report
  // afterward. Unset (plain local `npm run test:functional`) keeps the normal
  // reporters.
  reporter: process.env.PW_PHASE
    ? [['blob', { outputDir: 'blob-report', fileName: `${process.env.PW_PHASE}.zip` }]]
    : [
        ['html', { outputFolder: 'test-report', open: 'never' }],
        ['list'],
        ['json', { outputFile: 'test-report/results.json' }],
      ],
  use: {
    baseURL: environment.apiBaseUrl,
  },
  outputDir: 'test-results',
  projects: [
    // Run as two separate `playwright test --project=X` invocations (CI:
    // non-mutating first, then mutating — see playwright.yml), never as one
    // bare invocation across both — a bare run lets workers interleave
    // mutating and non-mutating specs across the worker pool, which is exactly
    // the race @mutating exists to avoid (docs/qa/conventions.md rule 9).
    // `npm run test:functional` already runs them as two sequential
    // invocations for this reason.
    { name: 'non-mutating', grepInvert: /@mutating/ },
    { name: 'mutating', grep: /@mutating/ },
  ],
});
