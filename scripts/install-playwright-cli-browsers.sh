#!/usr/bin/env bash
# Thin wrapper — delegates to the cross-platform Node.js installer.
# Kept for backwards compatibility with setup.sh and post-create.sh callers.
set -euo pipefail
node "$(dirname "$0")/install-playwright-cli-browsers.js" "${1:-$(pwd -P)}"
