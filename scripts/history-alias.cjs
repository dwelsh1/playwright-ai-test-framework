#!/usr/bin/env node
/**
 * history-alias.cjs
 *
 * Adds or updates an alias entry in test-history-aliases.json so that history
 * for a moved or renamed test is carried forward under its new test ID.
 *
 * The alias file lives alongside test-history.json in playwright-report/.
 * The Smart Reporter reads it automatically on startup.
 *
 * Usage:
 *   npm run history:alias -- \
 *     --from "[chromium] tests/old/path.spec.ts::Test Title" \
 *     --to   "[chromium] tests/new/path.spec.ts::Test Title"
 *
 * Test ID format: "[ProjectName] relative/path/to/file.spec.ts::Test Title"
 * (The [ProjectName] prefix is omitted when there is only one Playwright project.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Parse --from and --to arguments
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let fromId = null;
let toId = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from' && args[i + 1]) {
    fromId = args[++i];
  } else if (args[i] === '--to' && args[i + 1]) {
    toId = args[++i];
  } else if (args[i].startsWith('--from=')) {
    fromId = args[i].substring('--from='.length);
  } else if (args[i].startsWith('--to=')) {
    toId = args[i].substring('--to='.length);
  }
}

if (!fromId || !toId) {
  console.error('Usage: npm run history:alias -- --from "<old test ID>" --to "<new test ID>"');
  console.error('');
  console.error('Example (test file moved):');
  console.error('  npm run history:alias -- \\');
  console.error(
    '    --from "[chromium] tests/coffee-cart/old-login.spec.ts::login page meets WCAG 2.1 AA" \\',
  );
  console.error(
    '    --to   "[chromium] tests/coffee-cart/functional/accessibility.spec.ts::login page meets WCAG 2.1 AA"',
  );
  console.error('');
  console.error('Example (test renamed):');
  console.error('  npm run history:alias -- \\');
  console.error(
    '    --from "[chromium] tests/coffee-cart/functional/menu.spec.ts::should add Espresso to cart" \\',
  );
  console.error(
    '    --to   "[chromium] tests/coffee-cart/functional/menu.spec.ts::should add espresso to cart"',
  );
  process.exit(1);
}

if (fromId === toId) {
  console.error('[error] --from and --to are identical — no alias needed.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Resolve paths
// ---------------------------------------------------------------------------
const historyPath = path.resolve('playwright-report/test-history.json');
const aliasesPath = path.resolve('playwright-report/test-history-aliases.json');

// ---------------------------------------------------------------------------
// Load existing aliases
// ---------------------------------------------------------------------------
let aliases = {};
if (fs.existsSync(aliasesPath)) {
  try {
    aliases = JSON.parse(fs.readFileSync(aliasesPath, 'utf-8'));
  } catch (err) {
    console.error(`[error] Failed to parse test-history-aliases.json: ${err.message}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Validate --from against test-history.json (advisory only)
// ---------------------------------------------------------------------------
if (fs.existsSync(historyPath)) {
  try {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    const tests = history.tests ?? history; // support both old and new history format
    if (!tests[fromId]) {
      console.warn(`[warn] Old ID not found in test-history.json — verify the ID is correct:`);
      console.warn(`       ${fromId}`);
      console.warn(
        `       (The alias will still be written. The warning can be ignored if the test`,
      );
      console.warn(`        was recently added or history has already been migrated.)`);
    }
  } catch {
    console.warn('[warn] Could not read test-history.json — skipping --from validation');
  }
}

// ---------------------------------------------------------------------------
// Write alias (idempotent)
// ---------------------------------------------------------------------------
const existed = Object.prototype.hasOwnProperty.call(aliases, fromId);
aliases[fromId] = toId;

fs.mkdirSync(path.dirname(aliasesPath), { recursive: true });
fs.writeFileSync(aliasesPath, JSON.stringify(aliases, null, 2));

const total = Object.keys(aliases).length;
console.log(
  `[history:alias] ${existed ? 'Updated' : 'Added'} alias entry (${total} total in file)`,
);
console.log(`  FROM: ${fromId}`);
console.log(`  TO:   ${toId}`);
console.log(`  File: ${aliasesPath}`);
