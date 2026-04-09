#!/usr/bin/env node
/**
 * merge-axe-results.cjs
 *
 * Merges per-test axe result files (written by a11y-fixture.ts teardown)
 * into a single test-results/axe-results.json artifact for CI tooling.
 *
 * Each parallel worker writes its own file under test-results/axe-results/
 * to avoid concurrent write race conditions. This script merges them.
 *
 * Usage:  node scripts/merge-axe-results.cjs
 * npm:    npm run report:axe
 */

'use strict';

const fs = require('fs');
const path = require('path');

const dir = path.resolve('test-results/axe-results');
const outFile = path.resolve('test-results/axe-results.json');

if (!fs.existsSync(dir)) {
  console.log(
    '[axe-merge] No per-test files found — skipping (test-results/axe-results/ does not exist)',
  );
  process.exit(0);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.log('[axe-merge] No .json files found in test-results/axe-results/ — skipping');
  process.exit(0);
}

const entries = [];
for (const file of files) {
  try {
    const entry = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    entries.push(entry);
  } catch (err) {
    console.warn(`[axe-merge] Could not parse ${file}: ${err.message}`);
  }
}

// Sort alphabetically by test title for stable output
entries.sort((a, b) => (a.test ?? '').localeCompare(b.test ?? ''));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(entries, null, 2));

const violating = entries.filter((e) => e.violations > 0);
console.log(
  `[axe-merge] Merged ${entries.length} axe result entries → test-results/axe-results.json` +
    (violating.length > 0 ? ` (${violating.length} with violations)` : ' (all clean)'),
);
