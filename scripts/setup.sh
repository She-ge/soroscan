#!/usr/bin/env bash
# setup.sh — Bootstrap the SoroScan local development environment.
#
# Usage:   ./scripts/setup.sh
#
# What it does:
#   1. Checks for required system dependencies (Docker, Docker Compose, Python 3.11+)
#   2. Copies django-backend/.env.example → django-backend/.env  (if .env does not exist)
#   3. Builds Docker images with docker compose build
#   4. Starts db and redis services so migrations can run
#   5. Applies Django database migrations
#   6. Prints local endpoint URLs
#
# Idempotent: safe to run multiple times.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/django-backend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_EXAMPLE="$BACKEND_DIR/.env.example"

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # no colour

info()    { echo -e "${CYAN}[setup]${NC} $*"; }
success() { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[setup]${NC} $*"; }
error()   { echo -e "${RED}[setup] ERROR:${NC} $*" >&2; }

# ── 1. Prerequisite checks ────────────────────────────────────────────────────
check_command() {
    local cmd="$1"
    local install_hint="$2"
    if ! command -v "$cmd" &>/dev/null; then
        error "Required dependency not found: $cmd"
        error "Install it with: $install_hint"
        exit 1
    fi
    success "$cmd found ($(command -v "$cmd"))"
}

info "Checking system prerequisites..."

check_command docker       "https://docs.docker.com/get-docker/"
check_command docker-compose \
    "pip install docker-compose  OR  install Docker Desktop which bundles it"  2>/dev/null \
|| check_command "docker" "Docker Desktop (includes 'docker compose' subcommand)"

# Confirm Docker daemon is running
if ! docker info &>/dev/null; then
    error "Docker daemon is not running. Please start Docker and try again."
    exit 1
fi
success "Docker daemon is running"

# Python 3.11+ check (needed for local linting / management commands outside Docker)
PYTHON_BIN=""
for candidate in python3.13 python3.12 python3.11 python3 python; do
    if command -v "$candidate" &>/dev/null; then
        py_version=$("$candidate" -c "import sys; print(sys.version_info[:2])" 2>/dev/null || true)
        # Accept 3.11 or higher
        if "$candidate" -c "import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)" 2>/dev/null; then
            PYTHON_BIN="$candidate"
            success "Python 3.11+ found: $PYTHON_BIN ($("$PYTHON_BIN" --version))"
            break
        fi
    fi
done
if [ -z "$PYTHON_BIN" ]; then
    warn "Python 3.11+ not found on PATH. It is only needed for running management commands outside Docker."
    warn "The Docker-based setup will still work without it."
fi

# ── 2. Copy .env.example → .env ───────────────────────────────────────────────
info "Checking environment file..."
if [ -f "$ENV_FILE" ]; then
    warn ".env already exists — skipping copy (delete it and re-run to reset)"
else
    if [ ! -f "$ENV_EXAMPLE" ]; then
        error ".env.example not found at $ENV_EXAMPLE"
        exit 1
    fi
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    success "Copied .env.example → .env"
    warn "Review $ENV_FILE and update SOROSCAN_CONTRACT_ID and INDEXER_SECRET_KEY before running in production."
fi

# ── 3. Docker Compose build ───────────────────────────────────────────────────
info "Building Docker images (this may take a few minutes on first run)..."
cd "$REPO_ROOT"

# Support both 'docker-compose' (v1) and 'docker compose' (v2 plugin)
if command -v docker-compose &>/dev/null; then
    COMPOSE="docker-compose"
else
    COMPOSE="docker compose"
fi

$COMPOSE build --parallel
success "Docker images built"

# ── 4. Start infrastructure services (db + redis) ────────────────────────────
info "Starting db and redis services..."
$COMPOSE up -d db redis

info "Waiting for Postgres to be ready..."
_retries=30
until $COMPOSE exec -T db pg_isready -U postgres -q 2>/dev/null; do
    _retries=$(( _retries - 1 ))
    if [ "$_retries" -le 0 ]; then
        error "Postgres did not become ready in time."
        $COMPOSE logs db | tail -20
        exit 1
    fi
    sleep 1
done
success "Postgres is ready"

# ── 5. Apply Django migrations ────────────────────────────────────────────────
info "Applying database migrations..."
$COMPOSE run --rm web python manage.py migrate --noinput
success "Migrations applied"

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  SoroScan local environment is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Start all services:   ${CYAN}$COMPOSE up${NC}"
echo ""
echo -e "  Local endpoints:"
echo -e "    Backend API  →  ${CYAN}http://localhost:8000/api/${NC}"
echo -e "    GraphQL      →  ${CYAN}http://localhost:8000/graphql/${NC}"
echo -e "    Frontend     →  ${CYAN}http://localhost:3000${NC}"
echo -e "    Django admin →  ${CYAN}http://localhost:8000/admin/${NC}"
echo ""
echo -e "  Useful commands:"
echo -e "    Run tests      →  ${CYAN}$COMPOSE run --rm web pytest${NC}"
echo -e "    Create admin   →  ${CYAN}$COMPOSE run --rm web python manage.py createsuperuser${NC}"
echo -e "    View logs      →  ${CYAN}$COMPOSE logs -f web${NC}"
echo ""
