const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT_DIR, resolveSmartReportPath } = require('./report-config-utils.cjs');

const reportArg = process.argv[2];
const reportPath = resolveSmartReportPath(reportArg);

if (!fs.existsSync(reportPath)) {
  console.error(`Smart report not found: ${path.relative(ROOT_DIR, reportPath)}`);
  process.exit(1);
}

const serveScriptPath = path.join(
  ROOT_DIR,
  'tools',
  'playwright-smart-reporter',
  'dist',
  'bin',
  'serve.js',
);

const result = spawnSync(process.execPath, [serveScriptPath, reportPath], {
  stdio: 'inherit',
});

process.exit(result.status ?? 0);
