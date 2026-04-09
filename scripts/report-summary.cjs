#!/usr/bin/env node
// report-summary.cjs — compact test count summary from the last JSON results
// Usage: npm run report:summary

const { readFileSync, existsSync } = require('fs');
const path = require('path');

const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');

if (!existsSync(resultsPath)) {
  console.error('[ERROR] test-results/results.json not found.');
  console.error('        Run npm test first, then npm run report:summary.');
  process.exit(1);
}

let results;
try {
  results = JSON.parse(readFileSync(resultsPath, 'utf8'));
} catch {
  console.error('[ERROR] Could not parse test-results/results.json.');
  process.exit(1);
}

let total = 0;
let passed = 0;
let failed = 0;
let skipped = 0;
let flaky = 0;

function walk(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      total++;
      const statuses = (test.results || []).map((r) => r.status);
      const last = statuses[statuses.length - 1];
      const hasFailure = statuses.some((s) => s === 'failed' || s === 'timedOut');
      const hasPass = statuses.some((s) => s === 'passed');

      if (hasFailure && hasPass) {
        flaky++;
        passed++;
      } else if (last === 'passed') {
        passed++;
      } else if (last === 'skipped' || last === 'pending') {
        skipped++;
      } else {
        failed++;
      }
    }
  }
  for (const child of suite.suites || []) {
    walk(child);
  }
}

walk(results);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const NC = '\x1b[0m';

const line = '─'.repeat(30);

console.log('');
console.log(`${BOLD}Test Summary${NC}`);
console.log(line);
console.log(`Total:    ${total}`);
console.log(
  `${passed > 0 ? GREEN : NC}Passed:   ${passed}${NC}${flaky > 0 ? YELLOW + ` (${flaky} flaky)` + NC : ''}`,
);
console.log(`${failed > 0 ? RED : NC}Failed:   ${failed}${NC}`);
console.log(`Skipped:  ${skipped}`);
console.log(line);
console.log('');
