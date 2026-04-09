const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { REPORT_CONFIG_ALIASES, resolveSmartReportPath } = require('./report-config-utils.cjs');

if (process.env.CI) process.exit(0);

const candidatePaths = [
  resolveSmartReportPath(process.argv[2]),
  resolveSmartReportPath(),
  ...Object.values(REPORT_CONFIG_ALIASES).map((preset) => preset.reportPath),
].filter(Boolean);

const reportPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

if (!reportPath) {
  const searched = candidatePaths
    .map((candidate) => path.relative(process.cwd(), candidate))
    .join(', ');
  console.error(`No smart report found. Searched: ${searched}`);
  process.exit(1);
}

const platform = process.platform;
const cmd =
  platform === 'win32'
    ? `start "" "${reportPath}"`
    : platform === 'darwin'
      ? `open "${reportPath}"`
      : `xdg-open "${reportPath}"`;

execSync(cmd, { stdio: 'ignore' });
