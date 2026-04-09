const fs = require('fs');
const { execSync } = require('child_process');

// 1. Check build exists
if (!fs.existsSync('tools/playwright-smart-reporter/dist/smart-reporter.js')) {
  console.error('ERROR: Smart reporter not built. Run: npm run build:smart-reporter');
  process.exit(1);
}

// 2. Run a minimal test
try {
  execSync('npx playwright test --project=chromium --grep @smoke -x', {
    stdio: 'inherit',
    timeout: 120_000,
  });
} catch {
  console.warn('WARN: Test run had failures (expected for verification).');
}

// 3. Verify report was generated
const reportPath = 'playwright-report/smart-report.html';
if (!fs.existsSync(reportPath)) {
  console.error(`ERROR: ${reportPath} was not generated.`);
  process.exit(1);
}

const content = fs.readFileSync(reportPath, 'utf-8');
if (!content.includes('Overview') || !content.includes('Tests')) {
  console.error('ERROR: Report is missing expected sections.');
  process.exit(1);
}

console.log('Smart reporter verified successfully.');
