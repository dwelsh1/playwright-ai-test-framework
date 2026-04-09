#!/usr/bin/env node
// clean.cjs — remove test artifacts for a fresh run
// Deletes: test-results/, playwright-report/, .auth/
// Usage: npm run clean

const { rmSync, existsSync } = require('fs');
const path = require('path');

const targets = [
  { dir: 'test-results', description: 'test results and traces' },
  { dir: 'playwright-report', description: 'HTML and Smart Reporter output' },
  { dir: '.auth', description: 'auth storage state' },
];

let removed = 0;

for (const { dir, description } of targets) {
  const fullPath = path.join(process.cwd(), dir);
  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true, force: true });
    console.log(`[OK] Removed ${dir}/ (${description})`);
    removed++;
  } else {
    console.log(`[--] ${dir}/ not found — skipped`);
  }
}

console.log('');
if (removed > 0) {
  console.log(`[OK] Clean complete — ${removed} director${removed === 1 ? 'y' : 'ies'} removed.`);
  console.log('     Run npm test to generate fresh results.');
} else {
  console.log('[OK] Nothing to clean.');
}
