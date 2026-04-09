#!/usr/bin/env bash
# Interactive onboarding for new contributors.
#
# Assumes: npm ci done, Coffee Cart app running at http://localhost:5273
# Usage:   bash scripts/onboard.sh
#          npm run onboard

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC}  $1"; }
step()  { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }
tip()   { echo -e "${CYAN}💡  $1${NC}"; }
warn()  { echo -e "${YELLOW}⚠  $1${NC}"; }
pause() { echo -e "${YELLOW}↵   Press Enter to continue...${NC}"; read -r; }

echo ""
echo "════════════════════════════════════════════"
echo "  Playwright AI Framework — Onboarding"
echo "════════════════════════════════════════════"
echo ""
echo "  This script walks through the key framework features."
echo "  Each step runs a live command so you can see real output."
echo ""
tip "Read docs/framework-onboarding.md for the full written guide."
echo ""
pause

# ── Pre-flight: app must be running ─────────────────────────
step "Pre-flight — Checking Coffee Cart is reachable"
API_URL="${API_URL:-http://localhost:3002}"
APP_URL="${APP_URL:-http://localhost:5273}"

if curl --silent --fail --max-time 5 --output /dev/null "${API_URL}/api/coffees"; then
  info "Coffee Cart API is reachable at ${API_URL}"
else
  warn "Coffee Cart API is not reachable at ${API_URL}"
  echo ""
  echo "  Start the app first (in a separate terminal):"
  echo ""
  echo "    cd d:/gitrepos/coffee-cart"
  echo "    npm run dev"
  echo ""
  echo "  Then re-run this script."
  exit 1
fi
pause

# ── Step 1: Smoke tests ──────────────────────────────────────
step "Step 1/6 — Run smoke tests (fastest path to green)"
tip "Smoke tests cover the critical path and run in under 30 seconds."
tip "These run on every pull request — if they fail, nothing merges."
echo ""
echo "  Command: npx playwright test --project=chromium --grep @smoke"
echo ""
pause
npx playwright test --project=chromium --grep "@smoke"
info "Smoke tests passed."
pause

# ── Step 2: Accessibility tests ──────────────────────────────
step "Step 2/6 — Run accessibility tests (@a11y)"
tip "These scan each page for WCAG 2.1 AA violations using axe-core."
tip "The [DEMO] test proves the scanner catches real violations — it always passes."
echo ""
echo "  Command: npx playwright test --project=chromium --grep @a11y"
echo ""
pause
npx playwright test --project=chromium --grep "@a11y"
info "Accessibility tests passed."
echo ""
tip "Open Smart Reporter to see the axe violation count annotations:"
echo "  npm run report:smart"
pause

# ── Step 3: Visual regression tests ─────────────────────────
step "Step 3/6 — Run visual regression tests (@visual)"
tip "Compares screenshots against committed baselines (chromium-win32)."
tip "The [DEMO] test shows the diff between normal and broken — it always passes."
echo ""
echo "  Command: npx playwright test --project=chromium --grep @visual"
echo ""
pause
npx playwright test --project=chromium --grep "@visual"
info "Visual regression tests passed."
pause

# ── Step 4: Smart Reporter ───────────────────────────────────
step "Step 4/6 — Explore the Smart Reporter"
tip "Smart Reporter shows stability scores, trend charts, and AI failure analysis."
echo ""
echo "  Your most recent report is at: playwright-report/smart-report.html"
echo ""
echo "  To open it:"
echo "    npm run report:smart"
echo ""
echo "  What to look for:"
echo "    • Step timeline per test (GIVEN / WHEN / THEN)"
echo "    • Axe violation count annotations on @a11y tests"
echo "    • Stability score and run history"
echo "    • Trace viewer embedded in failed test cards"
echo ""
pause

# ── Step 5: playwright-cli exploration ──────────────────────
step "Step 5/6 — Explore a page with playwright-cli"
tip "Before writing any selector, explore the live page to discover roles and labels."
tip "This is a MUST rule: Explore Before Generate."
echo ""
echo "  Try it now (Ctrl+C to skip, then press Enter):"
echo ""
echo "    playwright-cli open ${APP_URL}/login"
echo "    playwright-cli snapshot"
echo "    playwright-cli close"
echo ""
pause

# ── Step 6: Generate a test stub ────────────────────────────
step "Step 6/6 — Generate a test stub from a template"
tip "Use the generator to create a framework-compliant test file skeleton."
echo ""
echo "  Available types: functional, api, e2e"
echo ""
echo "  Example:"
echo "    npm run generate:test -- --type functional --area coffee-cart --name my-feature"
echo ""
echo "  This creates tests/coffee-cart/functional/my-feature.spec.ts"
echo "  with all imports, describe block, beforeEach, and GWT steps pre-filled."
echo "  Replace the TODO placeholders, then run the file to verify."
echo ""
pause

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  Onboarding complete!"
echo "════════════════════════════════════════════"
echo ""
info "Full written guide:     docs/framework-onboarding.md"
info "Developer reference:    docs/developer.md"
info "AI skills browser:      docs/usage/skills-guide.md"
echo ""
echo "  Quick commands:"
echo "    npm test                          — full test suite"
echo "    npm run test:smoke                — smoke tests only"
echo "    make regression                   — chromium regression via Makefile"
echo "    playwright-cli open <url>         — explore a page before writing selectors"
echo "    npm run generate:test -- --help   — create a test stub"
echo ""
