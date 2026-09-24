#!/usr/bin/env node
// Writes a small unit-test coverage table to the GitHub Actions job summary,
// read from Jest's coverage-summary.json (the 'json-summary' reporter in
// apps/api/jest.config.js). Mirrors how the Playwright workflow's own
// scripts/build-report-dashboard.js writes its step summary.

const fs = require('fs');

const summaryPath = process.argv[2] || 'apps/api/coverage/coverage-summary.json';
const file = process.env.GITHUB_STEP_SUMMARY;

function fmt(metric) {
  return `${metric.pct}% (${metric.covered}/${metric.total})`;
}

let total;
try {
  total = JSON.parse(fs.readFileSync(summaryPath, 'utf8')).total;
} catch (err) {
  console.warn(`Could not read ${summaryPath}: ${err.message}`);
  process.exit(0);
}

const lines = [
  '## Unit test coverage',
  '',
  '| Metric | Coverage |',
  '|---|---|',
  `| Statements | ${fmt(total.statements)} |`,
  `| Branches | ${fmt(total.branches)} |`,
  `| Functions | ${fmt(total.functions)} |`,
  `| Lines | ${fmt(total.lines)} |`,
  '',
];

if (file) {
  fs.appendFileSync(file, lines.join('\n'));
} else {
  console.log(lines.join('\n'));
}
