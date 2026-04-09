import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const resultsPath = 'test-results/results.json';

if (!existsSync(resultsPath)) {
  console.log('No results.json found — skipping flaky detection.');
  writeFileSync('test-results/flaky-tests.json', JSON.stringify([], null, 2));
  process.exit(0);
}

const results = JSON.parse(readFileSync(resultsPath, 'utf-8'));
const flaky = [];

function walkSuites(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const statuses = (test.results ?? []).map((r) => r.status);
        const hasFail = statuses.some((s) => s === 'failed' || s === 'timedOut');
        const hasPass = statuses.some((s) => s === 'passed');
        if (hasFail && hasPass) {
          flaky.push({
            title: spec.title,
            file: spec.file,
            attempts: statuses,
          });
        }
      }
    }
    // Recurse into nested suites
    walkSuites(suite.suites);
  }
}

walkSuites(results.suites ?? []);

mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/flaky-tests.json', JSON.stringify(flaky, null, 2));

if (flaky.length > 0) {
  console.warn(`⚠️  ${flaky.length} flaky test(s) detected:`);
  for (const t of flaky) {
    console.warn(`  • ${t.title}  (${t.file})  attempts: ${t.attempts.join(' → ')}`);
  }
} else {
  console.log('✅  No flaky tests detected.');
}
