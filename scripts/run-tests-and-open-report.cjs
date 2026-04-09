#!/usr/bin/env node
/**
 * Cross-platform: run default Chromium UI suite, then open Smart Reporter (local only).
 * Pass-through args after `--` are forwarded to Playwright, e.g.:
 *   node scripts/run-tests-and-open-report.cjs -- --grep @smoke
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

require('./check-smart-reporter.cjs');

const dash = process.argv.indexOf('--');
const extra = dash >= 0 ? process.argv.slice(dash + 1) : [];
const pwArgs = ['playwright', 'test', '--project=chromium', '--workers=4', ...extra];

const result = spawnSync('npx', pwArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (process.env.CI) {
  process.exit(0);
}

require('./open-smart-report.cjs');
