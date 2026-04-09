#!/usr/bin/env node
// Cross-platform installer for @playwright/cli's bundled Chromium.
// Bash equivalent: scripts/install-playwright-cli-browsers.sh
//
// LOCAL machines: installs to the default Playwright browser directory so
// `playwright-cli` works directly — no wrapper, no custom env var.
//
// DEV CONTAINER (DEVCONTAINER=true): installs to an isolated cache
// (PLAYWRIGHT_CLI_BROWSERS_PATH or ~/.cache/playwright-cli-browsers)
// because the container sets PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
// globally and that path is read-only (baked into the Docker image).
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const root = process.argv[2] || process.cwd();
const cliPw = path.join(root, 'node_modules', '@playwright', 'cli', 'node_modules', 'playwright');

if (!fs.existsSync(cliPw)) {
  console.log(`Skipping playwright-cli browsers: ${cliPw} not found (run npm ci first).`);
  process.exit(0);
}

const inContainer = process.env.DEVCONTAINER === 'true';
const browsersPath = inContainer
  ? process.env.PLAYWRIGHT_CLI_BROWSERS_PATH ||
    path.join(os.homedir(), '.cache', 'playwright-cli-browsers')
  : undefined;

const env = { ...process.env };
if (browsersPath) {
  fs.mkdirSync(browsersPath, { recursive: true });
  env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;
} else {
  delete env.PLAYWRIGHT_BROWSERS_PATH;
}

const displayPath = browsersPath || '(default Playwright location)';
const pkg = JSON.parse(fs.readFileSync(path.join(cliPw, 'package.json'), 'utf8'));

if (browsersPath) {
  const marker = path.join(browsersPath, `.pw-cli-browsers.${pkg.version}`);
  if (fs.existsSync(marker)) {
    console.log(
      `playwright-cli browsers already cached for Playwright ${pkg.version} at ${browsersPath} — skipping download.`,
    );
    process.exit(0);
  }

  console.log(`Installing Chromium for playwright-cli into ${browsersPath} ...`);
  execFileSync('node', [path.join(cliPw, 'cli.js'), 'install', 'chromium'], {
    stdio: 'inherit',
    env,
  });
  fs.writeFileSync(marker, '');
} else {
  console.log(`Installing Chromium for playwright-cli ${pkg.version} into ${displayPath} ...`);
  execFileSync('node', [path.join(cliPw, 'cli.js'), 'install', 'chromium'], {
    stdio: 'inherit',
    env,
  });
}
