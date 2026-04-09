const fs = require('fs');
const path = require('path');
const { ROOT_DIR, resolveReportConfigPath } = require('./report-config-utils.cjs');

const configArg = process.argv[2];

if (!configArg) {
  console.error(
    'Usage: node scripts/set-report-config.cjs <coffee-cart|sauce-demo|all-apps|config-path>',
  );
  process.exit(1);
}

const sourcePath = resolveReportConfigPath(configArg);
if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error(`Report config not found: ${configArg}`);
  process.exit(1);
}

const destinationPath = path.join(ROOT_DIR, 'playwright-report-settings.json');
fs.copyFileSync(sourcePath, destinationPath);

console.log(
  `Copied ${path.relative(ROOT_DIR, sourcePath)} to ${path.relative(ROOT_DIR, destinationPath)}.`,
);
