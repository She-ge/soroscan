# SoroScan — Project Status & Implementation Report

**Last Updated:** October 17, 2026
**Project Type:** Blockchain Event Indexer & Monitoring Platform  
**Status:** Active Development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Current Implementation Status](#current-implementation-status)
5. [Testing & Quality](#testing--quality)
6. [Issues & Roadmap](#issues--roadmap)
7. [Development Setup](#development-setup)
8. [Deployment & DevOps](#deployment--devops)
9. [Contributing](#contributing)

---

## Project Overview

### What is SoroScan?

SoroScan is a **Stellar Soroban event indexer and monitoring platform** that:

- 🔍 **Indexes** smart contract events from Soroban ledger in real-time
- 📊 **Provides** GraphQL and REST APIs for event querying
- 🪝 **Delivers** events via webhooks to third-party systems
- 📈 **Tracks** contract lifecycle, invocations, and dependencies
- 🔐 **Verifies** contract source code and bytecode integrity
- 📱 **Exposes** multi-tenant operations dashboard for enterprises

### Target Users

- **Blockchain developers** monitoring contract events
- **DeFi platforms** syncing events to data warehouses
- **Enterprises** tracking compliance and audit trails
- **Operators** managing Soroban network monitoring infrastructure

### Key Differentiators

✅ **Tested** — Backend and frontend test suites are configured in CI; see the test inventory below.
✅ **Enterprise-ready** — Multi-tenancy, GDPR compliance, HA/DR  
✅ **Developer-friendly** — Interactive API docs, SDKs (Python, TypeScript), Webhooks  
✅ **Retro aesthetic** — Terminal-inspired UI with phosphor green on deep black  
✅ **Documented** — Current priorities are maintained in the project roadmap.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Soroban RPC / Horizon                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Celery Worker         │
                │  (Event Ingestion)      │
                └────────────┬────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐          ┌──────────┐         ┌──────────┐
   │ PostgreSQL        │  Redis   │         │ RabbitMQ │
   │ (Events)          │ (Cache)  │         │ (Tasks)  │
   └─────────┘          └──────────┘         └──────────┘
        │                    │
        └────────────┬───────┘
                     │
        ┌────────────▼────────────┐
        │   Django Backend        │
        │  (GraphQL + REST APIs)  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────────────┐
        │   Event Explorer Dashboard      │
        │   Administration UI             │
        │   Developer Portal              │
        │   (Next.js Frontend)            │
        └─────────────────────────────────┘
        
        ▼ (Webhooks)
   Third-Party Systems
   (Data Warehouses, Monitoring, APIs)
```

### Core Modules

**Backend (Django + Strawberry GraphQL)**
- `soroscan/ingest/` — Event ingestion from Horizon
- `soroscan/graphql/` — GraphQL schema and resolvers
- `soroscan/api/` — REST API endpoints
- `soroscan/webhooks/` — Webhook delivery and retry logic
- `soroscan/models/` — Core data models (Contract, Event, Webhook, etc.)
- `soroscan/tasks/` — Celery async tasks

**Frontend (Next.js + Apollo Client)**
- `app/` — Page routes (event explorer, dashboard, admin)
- `components/` — Reusable UI components (buttons, cards, tables, etc.)
- `lib/` — Utilities and GraphQL query builders
- `context/` — Global state (auth, theme, notifications)
- `providers/` — Apollo Client setup

**Smart Contracts (Rust/Soroban)**
- `soroban-contracts/soroscan_core/` — Contract verification logic

**SDKs**
- `sdk/python/` — Python client library
- `sdk/typescript/` — JavaScript/TypeScript client library

---

## Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Django | 5.2.10 |
| Language | Python | 3.11 in CI |
| GraphQL | Strawberry GraphQL | 0.289.0 |
| Database | PostgreSQL | 15 in CI |
| Cache | Redis | 7 in CI |
| Task Queue | Celery | 5.6.2 |
| Server | Gunicorn/Uvicorn | Latest |
| ORM | Django ORM | 5.2 |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| Runtime | Node.js | 20 in CI |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn CLI | 3.8.5 |
| Icons | Lucide React | 0.575.0 |
| GraphQL Client | Apollo Client | 3.14.0 |
| State | Zustand | 4.4.7 |
| i18n | next-intl | 4.8.3 |
| Testing | Jest + React Testing Library | 30.2.0 / 16.3.2 |
| Package Manager | pnpm | 10.5.2 |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (k8s manifests provided) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | Structured logging + Sentry |
| Package Managers | npm/pnpm (frontend), pip (backend) |

### Blockchain

| Component | Technology |
|-----------|-----------|
| Smart Contracts | Rust + Soroban SDK |
| Event Source | Stellar Horizon API |
| RPC | Soroban RPC endpoints |

---

## Current Implementation Status

### ✅ Completed Features

#### Core Indexing & Ingestion
- [x] Real-time event ingestion from Horizon
- [x] Ledger streaming with backfill support
- [x] Contract registration and tracking
- [x] Multi-network support (testnet, mainnet)
- [x] Event persistence to PostgreSQL

#### APIs
- [x] GraphQL schema with Strawberry
- [x] REST API endpoints for events and contracts
- [x] Cursor-based pagination
- [x] Event filtering by contract, type, date range
- [x] Schema introspection and documentation

#### Webhooks
- [x] Webhook subscription management
- [x] Event delivery to subscriber endpoints
- [x] Exponential backoff retry logic
- [x] Dead-letter queue for failed deliveries
- [x] HMAC-SHA256 signature verification

#### Authentication & Security
- [x] JWT token authentication for API
- [x] Rate limiting on REST and GraphQL
- [x] CORS configuration
- [x] Environment variable validation on startup

#### Observability
- [x] Structured logging throughout codebase
- [x] Error tracking with Sentry
- [x] Prometheus metrics endpoint
- [x] GraphQL query logging and monitoring
- [x] Request ID tracking across logs

#### Frontend
- [x] Event Explorer dashboard
- [x] Contract management UI
- [x] Webhook subscription manager
- [x] Authentication UI and token management
- [x] Admin dashboard
- [x] Design system with terminal aesthetic
- [x] Responsive mobile/tablet layout
- [x] Dark mode (terminal-inspired)

#### Testing
- [x] Backend and frontend test suites are run by GitHub Actions (see Testing & Quality)
- [x] GraphQL resolver tests
- [x] Model and task tests
- [x] API endpoint tests
- [x] Frontend component tests with Jest
- [x] End-to-end testing with Playwright (framework ready)

#### DevOps & Infrastructure
- [x] Docker Compose setup for local development
- [x] Kubernetes manifests for production
- [x] GitHub Actions CI/CD pipeline
- [x] Database migrations (76 migration files; 75 migration modules plus `__init__.py`)
- [x] Environment configuration via `.env`

#### Documentation
- [x] README files for each module
- [x] API documentation (OpenAPI/Swagger ready)
- [x] SDK documentation (Python, TypeScript)
- [x] CONTRIBUTING.md for contributors
- [x] Getting started guides

#### SDKs
- [x] Python client SDK (published)
- [x] TypeScript/JavaScript client SDK (published)
- [x] SDK examples and tests

---

### 🚧 In Progress / Planned Features
Feature priorities and issue status change over time; see the [project roadmap](ROADMAP.md) for the maintained list.

---

## Testing & Quality

### Test Coverage
### Test Inventory

- Python: 501 `test_` function/method declarations across 58 files named `test*.py` in the repository.
- Frontend: 2 Jest test modules.
- These are checked-in inventory counts, not a collected or passing test total. Parametrization and runner configuration affect the number of executed cases.

### Coverage and CI

- Backend CI runs pytest with coverage and enforces an 80% minimum; see [Django Tests](../.github/workflows/django-tests.yml).
- Frontend CI runs Jest with coverage; see [Frontend CI](../.github/workflows/frontend-ci.yml).
- Current pass counts and coverage percentages are produced by CI runs and are not asserted in this report.
- The Django workflow also checks for missing migrations with `makemigrations --check --dry-run`; there is no separate `migration-check.yml` workflow.

### Code Quality

- **Linting:** ESLint (frontend), Pylint (backend)
- **Formatting:** Prettier (frontend), Black (backend)
- **Type Checking:** TypeScript strict mode, Pylance
- **Pre-commit Hooks:** Husky configured

---

## Issues & Roadmap
See the [project roadmap](ROADMAP.md) for current priorities and issue status.

---

## Development Setup

### Prerequisites

```bash
# Backend
- Python 3.11 (version used by backend CI)
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

# Frontend
- Node.js 20 (version used by frontend CI)
- pnpm 10.5.2 (declared by the frontend package)
```

### Quick Start

```bash
# Clone repo
git clone https://github.com/SoroScan/soroscan.git
cd soroscan

# Backend
cd django-backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in new terminal)
cd soroscan-frontend
pnpm install
pnpm dev

# Docker Compose (all services)
docker-compose up --build
```

### Database Migrations

```bash
# Apply migrations
python manage.py migrate

# Create new migration
python manage.py makemigrations

# Check migration status
python manage.py showmigrations

# Revert to previous
python manage.py migrate <app_name> <previous_migration_name>
```

### Running Tests

```bash
# Backend
cd django-backend
pytest  # Run all tests
pytest --cov=soroscan --cov-report=term-missing  # With coverage

# Frontend
cd soroscan-frontend
pnpm test:ci  # Run Jest tests in CI mode
pnpm test:e2e  # Run Playwright tests
```

### Environment Variables

Key variables (see `ENVIRONMENT.md` for full list):

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/soroscan
REDIS_URL=redis://localhost:6379/0

# Stellar/Soroban
STELLAR_TESTNET_RPC_URL=https://soroban-testnet.stellar.org/
STELLAR_MAINNET_RPC_URL=https://soroban.stellar.org/

# Security
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# GraphQL
GRAPHQL_PLAYGROUND=True  # Development only
```

---

## Deployment & DevOps

### Docker

```bash
# Build images
docker build -f django-backend/Dockerfile -t soroscan-backend .
docker build -f soroscan-frontend/Dockerfile.frontend -t soroscan-frontend .

# Run with Compose
docker-compose up -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Kubernetes

Manifests provided in `/k8s/`:

```bash
# Deploy to Kubernetes (requires cluster)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret-reference.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment
kubectl get pods -n soroscan
kubectl logs -f deployment/soroscan-backend -n soroscan
```

### Monitoring

**Prometheus Metrics:**
- Endpoint: `http://localhost:8000/metrics`
- Scraped by Prometheus every 30 seconds

**Grafana Dashboards:**
- Example dashboard in `k8s/grafana-dashboard.json`

**Alerting:**
- Sentry integration for error tracking
- Custom alerts via Prometheus rules

### Backup & Recovery

**Automated Backups:**
- Daily PostgreSQL dumps (Kubernetes CronJob)
- Backup stored in cloud storage (configurable)
- Recovery tested quarterly

**Health Checks:**
```bash
GET /health  → Returns {"status": "ok"}
GET /ready   → Checks DB and Redis connectivity
```

---

## Contributing

### For New Contributors

1. **Pick a task** from the [project roadmap](ROADMAP.md)
2. **Read the issue** — all have clear acceptance criteria
3. **Set up dev environment** — see Development Setup above
4. **Create a branch:** `git checkout -b fix/issue-name`
5. **Implement & test:** All tests must pass
6. **Submit PR** — link to issue, describe changes

### For Experienced Contributors

1. **Choose a task** from the [project roadmap](ROADMAP.md)
2. **Understand dependencies** — each issue lists what it depends on
3. **Communicate progress** — update issue with status
4. **Follow patterns** — check existing code for style/architecture
5. **Document thoroughly** — add docstrings, update README if needed

### Code Review Process

- ✅ All tests pass
- ✅ Backend coverage gate passes in CI
- ✅ Code follows style guide
- ✅ Documentation updated
- ✅ No performance regressions

### Deployment Checklist

- [ ] Feature complete and tested
- [ ] Migration written (if DB changes)
- [ ] Documentation updated
- [ ] PR approved by maintainer
- [ ] Merged to main
- [ ] GitHub Actions pass
- [ ] Ready for production release

---

## Key Metrics
This report does not publish live performance, uptime, or coverage measurements. See current CI artifacts for test and coverage results, and the [performance playbook](PERFORMANCE_PLAYBOOK.md) for benchmark procedures.

---

## Next Steps
See the [project roadmap](ROADMAP.md) for current priorities.

---

## Resources

### Documentation
- 📖 [README.md](../README.md) — Project overview
- 🔧 [Getting Started](getting-started.md)
- 📋 [Project Roadmap](ROADMAP.md)
- 🎯 [Contributing](../CONTRIBUTING.md)
- 🧭 [Contributor Style Guide](contributing/style-guide.md)

### APIs
- GraphQL: http://localhost:8000/graphql
- REST: http://localhost:8000/api/
- Health: http://localhost:8000/health

### Team
---

**Last Updated:** October 17, 2026
