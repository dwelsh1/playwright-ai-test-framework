const fs = require('fs');
const path = require('path');
const reporterPath = path.join(
  __dirname,
  '..',
  'tools/playwright-smart-reporter/dist/smart-reporter.js',
);
if (!fs.existsSync(reporterPath)) {
  console.error('\nSmart reporter not built.\nRun: npm run build:smart-reporter\n');
  process.exit(1);
}
