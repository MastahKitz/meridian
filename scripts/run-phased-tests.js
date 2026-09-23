#!/usr/bin/env node
// Runs the non-mutating then mutating Playwright projects as two genuinely
// sequential, separate child processes — deliberately not shell `&&`/`;`.
// `&&` short-circuits (phase 2 never runs if phase 1 has any failure, masking
// the mutating suite entirely), and `;` was silently absorbed by this
// machine's npm script-shell into a single `playwright test --project=X
// --project=Y` invocation — Playwright's `--project` flag is repeatable, so
// that ran both projects CONCURRENTLY with a shared worker pool, which is
// exactly the mutating/non-mutating race this split exists to prevent (see
// docs/qa/conventions.md rule 9). CI (playwright.yml) avoids this because each
// phase is its own workflow step; this script gives local `npm run
// test:functional` the same guarantee, shell-independently.
//
// Runs both phases regardless of whether the first failed (mirrors
// playwright.yml's `if: always()` on the mutating step) and exits non-zero if
// either did.
//
// Anything after `--` is passed through to both phases as-is — e.g.
// `npm run test:functional -- --grep @tenant` runs only @tenant tests, but
// still split across the two phases (mirrors playwright.yml's QA_TAG input,
// ANDed with each phase's own mutating/non-mutating grep).
//
// Each phase runs with PW_PHASE set, same as CI (playwright.yml) — that's
// what makes playwright.config.ts use the blob reporter and name the file
// after the phase, instead of both phases clobbering the same html/list/json
// report in test-report/. The two blobs are merged afterward into the single
// report `npm run test:functional:report` opens, same as CI's "Merge phase
// reports" step.
//
// Playwright's blob reporter clears its WHOLE outputDir on every write, not
// just its own file — so each phase's zip has to be moved out of blob-report/
// into a separate holding dir before the next phase starts, or it's wiped.
// This is exactly why the source framework's CI has its own "Collect X
// report" step between the two phases (initially skipped here as apparently
// redundant, which was wrong — this is the reason it exists).

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const phases = ['non-mutating', 'mutating'];
const extraArgs = process.argv.slice(2);
const mergeDir = 'blob-report-merged';
let exitCode = 0;

// Start clean — a stale zip here from an earlier, differently-filtered run
// would get merged into a report that doesn't reflect this run.
fs.rmSync(mergeDir, { recursive: true, force: true });
fs.mkdirSync(mergeDir, { recursive: true });

for (const phase of phases) {
  const result = spawnSync(
    'npx',
    ['playwright', 'test', `--project=${phase}`, '--pass-with-no-tests', ...extraArgs],
    { stdio: 'inherit', shell: true, env: { ...process.env, PW_PHASE: phase } },
  );
  if (result.status !== 0) exitCode = result.status || 1;

  const blobPath = path.join('blob-report', `${phase}.zip`);
  if (fs.existsSync(blobPath)) {
    fs.renameSync(blobPath, path.join(mergeDir, `${phase}.zip`));
  }
}

const merge = spawnSync(
  'npx',
  ['playwright', 'merge-reports', '--config=playwright.config.ts', mergeDir],
  { stdio: 'inherit', shell: true },
);
if (merge.status !== 0) exitCode = merge.status || 1;

process.exit(exitCode);
