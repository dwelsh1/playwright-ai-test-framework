#!/usr/bin/env node
// reset-auth.cjs — delete stale auth storage state files
// Forces Playwright to re-run the auth setup on the next test run.
// Usage: npm run reset:auth

const { rmSync, existsSync, readdirSync } = require('fs');
const path = require('path');

const authDir = path.join(process.cwd(), '.auth');

if (!existsSync(authDir)) {
  console.log('[OK] No .auth/ directory found — nothing to clear.');
  process.exit(0);
}

let count = 0;

function deleteJsonFiles(dir) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      deleteJsonFiles(fullPath);
    } else if (entry.name.endsWith('.json')) {
      rmSync(fullPath);
      console.log(`[OK] Deleted ${path.relative(process.cwd(), fullPath)}`);
      count++;
    }
  }
}

deleteJsonFiles(authDir);

if (count === 0) {
  console.log('[OK] No auth state files found — nothing to clear.');
} else {
  console.log(`\n[OK] ${count} auth state file(s) deleted.`);
  console.log('     Auth state will be regenerated on the next test run.');
}
