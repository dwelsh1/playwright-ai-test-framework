#!/usr/bin/env bash
# Post-create script for Dev Container setup
set -euo pipefail

echo "=== Post-create: Installing dependencies ==="
npm ci --prefer-offline

echo "=== Post-create: Building Smart Reporter ==="
npm run build:smart-reporter

echo "=== Post-create: Installing Playwright CLI browsers ==="
if [ -f scripts/install-playwright-cli-browsers.sh ]; then
    bash scripts/install-playwright-cli-browsers.sh "$(pwd -P)"
fi

echo "=== Post-create: Setting up environment ==="
if [ ! -f "env/.env.dev" ] && [ -f "env/.env.example" ]; then
    cp env/.env.example env/.env.dev
    echo "Created env/.env.dev from example"
fi

mkdir -p .auth/app

echo "=== Dev Container setup complete! ==="
echo "Run 'npm test' to execute tests."
