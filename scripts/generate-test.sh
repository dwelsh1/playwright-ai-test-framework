#!/usr/bin/env bash
# Generates a framework-compliant test stub from a template.
#
# Usage:
#   scripts/generate-test.sh --type functional --area coffee-cart --name login
#   scripts/generate-test.sh --type api        --area coffee-cart --name orders
#   scripts/generate-test.sh --type e2e        --area coffee-cart --name checkout-flow
#
# Or via npm:
#   npm run generate:test -- --type functional --area coffee-cart --name stores

set -euo pipefail

TYPE=""
AREA=""
NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) TYPE="$2"; shift 2 ;;
    --area) AREA="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 --type <functional|api|e2e> --area <area> --name <name>"
      echo ""
      echo "  --type   Test type: functional, api, or e2e"
      echo "  --area   App area directory (e.g. coffee-cart, sauce-demo)"
      echo "  --name   Test file name without extension (e.g. login, orders, checkout-flow)"
      echo ""
      echo "Examples:"
      echo "  $0 --type functional --area coffee-cart --name stores"
      echo "  $0 --type api        --area coffee-cart --name orders"
      echo "  $0 --type e2e        --area coffee-cart --name full-purchase"
      exit 0
      ;;
    *) echo "Unknown argument: $1"; echo "Run $0 --help for usage."; exit 1 ;;
  esac
done

if [[ -z "$TYPE" || -z "$AREA" || -z "$NAME" ]]; then
  echo "Error: --type, --area, and --name are all required."
  echo "Run $0 --help for usage."
  exit 1
fi

# Validate type
case "$TYPE" in
  functional|api|e2e) ;;
  *) echo "Error: --type must be one of: functional, api, e2e"; exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TPL="${SCRIPT_DIR}/templates/${TYPE}.spec.ts.tpl"

if [[ ! -f "$TPL" ]]; then
  echo "Error: Template not found: $TPL"
  exit 1
fi

OUT="tests/${AREA}/${TYPE}/${NAME}.spec.ts"

if [[ -f "$OUT" ]]; then
  echo "Error: File already exists: $OUT"
  echo "Delete it first or choose a different name."
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

# Title-case helper: "coffee-cart" → "Coffee Cart"
title_case() {
  echo "$1" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1'
}

AREA_TITLE=$(title_case "$AREA")
NAME_TITLE=$(title_case "$NAME")

sed \
  -e "s/{{AREA}}/${AREA}/g" \
  -e "s/{{AREA_TITLE}}/${AREA_TITLE}/g" \
  -e "s/{{PAGE_TITLE}}/${NAME_TITLE}/g" \
  -e "s/{{JOURNEY_TITLE}}/${NAME_TITLE}/g" \
  -e "s/{{ENDPOINT_TITLE}}/${NAME_TITLE}/g" \
  -e "s/{{TEST_NAME}}/TODO: describe what this test verifies/g" \
  -e "s/{{PAGE_FIXTURE}}/TODO_pageFixture/g" \
  -e "s/{{READY_LOCATOR}}/TODO_readyLocator/g" \
  -e "s/{{FIXTURES}}/TODO_fixtures/g" \
  -e "s/{{SCHEMA_NAME}}/TODO_Schema/g" \
  -e "s/{{SCHEMA_FILE}}/TODO_schema.ts/g" \
  -e "s/{{ENDPOINT}}/\/api\/TODO/g" \
  -e "s/{{GIVEN}}/TODO/g" \
  -e "s/{{WHEN}}/TODO/g" \
  -e "s/{{THEN}}/TODO/g" \
  "$TPL" > "$OUT"

echo ""
echo "  Created: $OUT"
echo ""
echo "  Next steps:"
echo "    1. Explore the page with playwright-cli:"
echo "       playwright-cli open http://localhost:5273"
echo "       playwright-cli snapshot"
echo "    2. Replace all TODO placeholders in $OUT"
echo "    3. Run: npx playwright test $OUT --project=chromium"
echo ""
