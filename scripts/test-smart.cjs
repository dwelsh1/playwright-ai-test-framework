'use strict';
/**
 * Wrapper that runs `npx playwright test` with a specific smart reporter config file,
 * bypassing the shared playwright-report-settings.json so concurrent runs don't overwrite
 * each other's settings.
 *
 * Usage: node scripts/test-smart.cjs <config-alias|config-file> [playwright args...]
 * Example: node scripts/test-smart.cjs coffee-cart --project=chromium --workers=4
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const { resolveReportConfigPath } = require('./report-config-utils.cjs');

const configFile = process.argv[2];
const playwrightArgs = process.argv.slice(3);

if (!configFile) {
  console.error(
    'Usage: test-smart.cjs <coffee-cart|sauce-demo|all-apps|config-file> [playwright args...]',
  );
  process.exit(1);
}

const resolvedConfigFile = resolveReportConfigPath(configFile);
if (!resolvedConfigFile || !fs.existsSync(resolvedConfigFile)) {
  console.error(`Smart reporter config not found: ${configFile}`);
  process.exit(1);
}

process.env['SMART_REPORTER_CONFIG'] = resolvedConfigFile;

const result = spawnSync('npx', ['playwright', 'test', ...playwrightArgs], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 0);
