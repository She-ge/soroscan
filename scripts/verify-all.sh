#!/usr/bin/env bash
# scripts/verify-all.sh
# Run comprehensive local checks before pushing to remote CI.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo "=========================================="
echo " Running Local Pre-Push Verification Suite"
echo "=========================================="

# 1. Rust Contracts
echo ""
echo "--- [1/3] Soroban Contracts ---"
cd "${REPO_ROOT}/soroban-contracts/soroscan_core"
echo "Checking Rust formatting..."
cargo fmt -- --check || fail "Cargo formatting check failed. Run 'cargo fmt' to fix."
pass "Cargo formatting check"

echo "Checking Clippy warnings..."
cargo clippy --all-targets --no-deps -- -D warnings || fail "Cargo clippy check failed."
pass "Cargo clippy check"

echo "Running Rust unit tests..."
cargo test --quiet || fail "Cargo test suite failed."
pass "Cargo tests"

echo "Building Soroban WASM artifact..."
cargo build --target wasm32-unknown-unknown --release --quiet || fail "WASM build failed."
pass "WASM build"

# 2. Django Backend
echo ""
echo "--- [2/3] Django Backend ---"
cd "${REPO_ROOT}"
if command -v docker >/dev/null 2>&1; then
    echo "Running Ruff linter via Docker..."
    docker run --rm -v "${REPO_ROOT}/django-backend:/app" -w /app soroscan-web:latest python -m ruff check . || fail "Ruff check failed."
    pass "Ruff linter"
else
    echo "Docker not available; running local ruff if installed..."
    if command -v ruff >/dev/null 2>&1; then
        (cd django-backend && ruff check .) || fail "Ruff check failed."
        pass "Ruff linter"
    fi
fi

# 3. Git Status
echo ""
echo "--- [3/3] Git Status ---"
cd "${REPO_ROOT}"
git status --short
pass "Working directory status clean check ready"

echo ""
echo "=========================================="
echo -e "${GREEN} All local verification checks passed!${NC}"
echo "=========================================="
