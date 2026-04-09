#!/usr/bin/env bash
# ============================================================
# PW Scaffold - Local Development Setup
# Detects OS and installs all dependencies.
# Safe to run multiple times (idempotent).
#
# Usage: bash scripts/setup.sh
#    or: npm run setup
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
step()  { echo -e "\n${BLUE}--- $1 ---${NC}"; }

# ----------------------------------------------------------
# Detect OS
# ----------------------------------------------------------
detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

OS=$(detect_os)

if [ "$OS" = "windows" ]; then
    error "Windows detected. Please use WSL2 and run this script from within WSL."
    error "See: https://docs.microsoft.com/en-us/windows/wsl/install"
    exit 1
fi

if [ "$OS" = "unknown" ]; then
    error "Unsupported OS: $(uname -s)"
    exit 1
fi

echo ""
echo "=========================================="
echo "  PW Scaffold - Local Setup"
echo "  OS: $OS"
echo "=========================================="

# ----------------------------------------------------------
# Step 1: Node.js
# ----------------------------------------------------------
step "Step 1/5: Node.js"

check_node() {
    if command -v node &> /dev/null; then
        local version
        version=$(node --version | sed 's/v//' | cut -d. -f1)
        if [ "$version" -ge 20 ]; then
            info "Node.js $(node --version) (meets >=20 requirement)"
            return 0
        else
            warn "Node.js $(node --version) found but >=20 is required"
            return 1
        fi
    else
        warn "Node.js not found"
        return 1
    fi
}

install_node() {
    info "Installing Node.js via nvm..."
    export NVM_DIR="${HOME}/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
    else
        info "Installing nvm first..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
        export NVM_DIR="${HOME}/.nvm"
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
    fi

    if [ -f ".nvmrc" ]; then
        nvm install
    else
        nvm install 22
    fi
    nvm use
}

if ! check_node; then
    install_node
fi

# ----------------------------------------------------------
# Step 2: npm dependencies
# ----------------------------------------------------------
step "Step 2/5: npm dependencies"
npm ci
info "npm dependencies installed"

# ----------------------------------------------------------
# Step 3: Playwright browsers
# ----------------------------------------------------------
step "Step 3/5: Playwright browsers"
npx playwright install --with-deps
info "Playwright browsers installed"

# ----------------------------------------------------------
# Step 4: CLI links
# ----------------------------------------------------------
step "Step 4/5: CLI links"

bash scripts/link-cli.sh "$(pwd -P)"
info "CLI links refreshed"

bash scripts/install-playwright-cli-browsers.sh "$(pwd -P)"
info "playwright-cli Chromium install refreshed"

# ----------------------------------------------------------
# Step 5: Environment file
# ----------------------------------------------------------
step "Step 5/5: Environment file"

if [ ! -f "env/.env.dev" ]; then
    cp env/.env.example env/.env.dev
    info "Created env/.env.dev from example"
    warn "Edit env/.env.dev with your application's configuration"
else
    info "env/.env.dev already exists, skipping"
fi

# ----------------------------------------------------------
# Runtime directories
# ----------------------------------------------------------

mkdir -p .auth/app
info ".auth/app directory ready"

# ----------------------------------------------------------
# Summary
# ----------------------------------------------------------
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
info "Node.js:     $(node --version)"
info "npm:         $(npm --version)"
if command -v playwright &> /dev/null; then
    info "Playwright:  $(playwright --version)"
    info "playwright:  $(which playwright)"
else
    warn "Playwright not found on PATH"
fi
if command -v playwright-cli &> /dev/null; then
    info "playwright-cli: $(playwright-cli --version)"
    info "playwright-cli: $(which playwright-cli)"
else
    warn "playwright-cli not found on PATH"
fi
echo ""
if ! command -v playwright &> /dev/null || ! command -v playwright-cli &> /dev/null; then
    warn "Expected ~/.local/bin to be on your PATH for direct CLI access."
    echo ""
fi
info "Next steps:"
echo "  1. Edit env/.env.dev with your app configuration"
echo "  2. Run 'npm test' to execute tests"
echo "  3. Run 'playwright-cli --version' to verify Playwright CLI"
echo ""
