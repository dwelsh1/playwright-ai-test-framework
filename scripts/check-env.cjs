#!/usr/bin/env node
// check-env.cjs — pre-flight environment check
// Verifies env/.env.dev exists, Smart Reporter is built, and Coffee Cart ports are reachable.
// Run manually: npm run check:env
// Does NOT fail tests — informational only.

const { existsSync } = require('fs');
const path = require('path');
const net = require('net');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const NC = '\x1b[0m';

const ok = (msg) => console.log(`${GREEN}[OK]${NC}    ${msg}`);
const warn = (msg) => console.log(`${YELLOW}[WARN]${NC}  ${msg}`);
const err = (msg) => console.log(`${RED}[ERROR]${NC} ${msg}`);

let exitCode = 0;

// 1. Check env/.env.dev exists
const envFile = path.join(process.cwd(), 'env', '.env.dev');
if (existsSync(envFile)) {
  ok('env/.env.dev found');
} else {
  err('env/.env.dev not found — run: cp env/.env.example env/.env.dev');
  exitCode = 1;
}

// 2. Check Smart Reporter dist
const reporterDist = path.join(
  process.cwd(),
  'tools',
  'playwright-smart-reporter',
  'dist',
  'smart-reporter.js',
);
if (existsSync(reporterDist)) {
  ok('Smart Reporter dist found');
} else {
  warn('Smart Reporter not built — run: npm run build:smart-reporter');
}

// 3. Check .auth directory
const authDir = path.join(process.cwd(), '.auth');
if (existsSync(authDir)) {
  ok('.auth/ directory found');
} else {
  warn('.auth/ not found — auth will be generated on the first npm test');
}

// 4. Port checks for Coffee Cart (informational — warns but does not fail)
function checkPort(port, name) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, 'localhost');
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      ok(`${name} reachable on port ${port}`);
      resolve(true);
    });
    socket.on('error', () => {
      warn(`${name} not reachable on port ${port} — run "npm start" from coffee-cart/`);
      resolve(false);
    });
    socket.on('timeout', () => {
      socket.destroy();
      warn(`${name} timed out on port ${port} — run "npm start" from coffee-cart/`);
      resolve(false);
    });
  });
}

Promise.all([checkPort(5273, 'Coffee Cart frontend'), checkPort(3002, 'Coffee Cart API')]).then(
  () => {
    console.log('');
    if (exitCode !== 0) {
      err('Environment check found errors. Fix them before running tests.');
    } else {
      ok('Environment check passed.');
    }
    process.exit(exitCode);
  },
);
