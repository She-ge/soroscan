# SoroScan Django backend — development tasks
# Usage: make <target>
# Requires: Python env activated with requirements.txt installed.

PYTHON          := python
MANAGE          := $(PYTHON) manage.py
SETTINGS        := soroscan.settings
DOCS_DIR        := docs
API_DOCS_MD     := $(DOCS_DIR)/api_reference.md
API_DOCS_JSON   := $(DOCS_DIR)/api_reference.json

.PHONY: help install migrate run test lint format \
        docs docs-json docs-watch \
        celery celery-beat \
        seed reset-db \
        clean

# ──────────────────────────────────────────────────────────────────────────────
# Default target
# ──────────────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "SoroScan Django backend — available targets:"
	@echo ""
	@echo "  install        Install Python dependencies"
	@echo "  migrate        Run database migrations"
	@echo "  run            Start the Django dev server"
	@echo "  test           Run the test suite with pytest"
	@echo "  lint           Run ruff linter"
	@echo "  format         Run black + ruff formatter"
	@echo ""
	@echo "  docs           Generate Markdown API reference (default output: $(API_DOCS_MD))"
	@echo "  docs-json      Generate JSON API reference (output: $(API_DOCS_JSON))"
	@echo "  docs-watch     Regenerate docs whenever views.py or urls.py changes (requires entr)"
	@echo ""
	@echo "  celery         Start Celery worker"
	@echo "  celery-beat    Start Celery beat scheduler"
	@echo ""
	@echo "  seed           Seed the database with development fixture data"
	@echo "  seed-minimal   Seed with minimal scenario (single org, 3 contracts)"
	@echo "  seed-webhook   Seed with webhook-focused scenario"
	@echo "  reset-db       Clear seeded data and re-seed from fixture"
	@echo ""
	@echo "  clean          Remove __pycache__ and .pyc files"
	@echo ""

# ──────────────────────────────────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────────────────────────────────
install:
	pip install -r requirements.txt

migrate:
	$(MANAGE) migrate

# ──────────────────────────────────────────────────────────────────────────────
# Development server
# ──────────────────────────────────────────────────────────────────────────────
run:
	$(MANAGE) runserver

# ──────────────────────────────────────────────────────────────────────────────
# Tests
# ──────────────────────────────────────────────────────────────────────────────
test:
	pytest

# ──────────────────────────────────────────────────────────────────────────────
# Linting & formatting
# ──────────────────────────────────────────────────────────────────────────────
lint:
	ruff check .

format:
	black .
	ruff check --fix .

# ──────────────────────────────────────────────────────────────────────────────
# Documentation generation  (integrated build step)
# ──────────────────────────────────────────────────────────────────────────────

# Primary doc target: generate Markdown reference from view docstrings.
# This target runs unconditionally; make it a phony target so CI always
# produces a fresh output rather than relying on timestamps.
docs:
	@echo "📄  Generating API reference → $(API_DOCS_MD)"
	@mkdir -p $(DOCS_DIR)
	$(MANAGE) generate_api_docs \
		--output $(API_DOCS_MD) \
		--format markdown \
		--include-examples
	@echo "✅  Done. View with: cat $(API_DOCS_MD)"

# JSON variant — useful for downstream tooling / CI artefact upload.
docs-json:
	@echo "📄  Generating API reference → $(API_DOCS_JSON)"
	@mkdir -p $(DOCS_DIR)
	$(MANAGE) generate_api_docs \
		--output $(API_DOCS_JSON) \
		--format json
	@echo "✅  Done."

# Watch mode (requires `entr`):  brew install entr / apt-get install entr
docs-watch:
	@echo "👁️  Watching for changes in views.py / urls.py …"
	find soroscan -name "views.py" -o -name "urls.py" | \
		entr -r $(MAKE) docs

# ──────────────────────────────────────────────────────────────────────────────
# Celery workers
# ──────────────────────────────────────────────────────────────────────────────
celery:
	celery -A soroscan worker --loglevel=info

celery-beat:
	celery -A soroscan beat --loglevel=info

# ──────────────────────────────────────────────────────────────────────────────
# Database seeding
# ──────────────────────────────────────────────────────────────────────────────
seed:
	$(MANAGE) seed_database

seed-minimal:
	$(MANAGE) seed_database --scenario=minimal

seed-webhook:
	$(MANAGE) seed_database --scenario=webhook

reset-db:
	$(MANAGE) seed_database --clear
	$(MANAGE) seed_database

# ──────────────────────────────────────────────────────────────────────────────
# Cleanup
# ──────────────────────────────────────────────────────────────────────────────
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
