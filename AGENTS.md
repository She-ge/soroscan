## Project Overview

**SoroScan** is a developer-focused indexing service for Soroban smart contract events on the Stellar blockchain. It
provides a hybrid on-chain/off-chain architecture to index, query, and subscribe to smart contract events in real-time.

### Key Components

- **Django Backend**: A Python-based ingestion layer and API provider using Django, Django Rest Framework (REST),
  Strawberry (GraphQL), and Celery (Webhook dispatching).
- **Next.js Frontend**: A modern web dashboard for exploring events, built with Next.js, Apollo Client, and Tailwind
  CSS.
- **Admin Dashboard**: A specialized Next.js application for administrative tasks.
- **Soroban Contracts**: Rust smart contracts that emit standardized events for indexing.
- **SDKs**: Client libraries for Python and TypeScript to interact with the SoroScan API.
- **Documentation**: Docusaurus-based documentation for users and developers.

### Architecture

1. **Smart Contract**: Emits structured `EventRecord` events.
1. **Ingestion Layer**: Streams events from Horizon/Soroban RPC and persists to PostgreSQL.
1. **Query Layer**: Exposes data via REST, GraphQL, and push-based webhooks.

---

## Building and Running

### Full Stack (Docker)

The easiest way to run the entire stack locally:

```bash
docker-compose up --build
```

### Django Backend

Located in `django-backend/`.

- **Setup**: `pip install -r requirements.txt`
- **Migrations**: `python manage.py migrate`
- **Run Server**: `python manage.py runserver`
- **Celery Worker**: `celery -A soroscan worker --loglevel=info`
- **Celery Beat**: `celery -A soroscan beat --loglevel=info`

### Soroscan Frontend

Located in `soroscan-frontend/`.

- **Setup**: `pnpm install`
- **Dev**: `pnpm dev`
- **Codegen**: `pnpm run codegen` (Required after GraphQL schema changes)
- **Build**: `pnpm build`

### Admin Dashboard

Located in `admin/`.

- **Setup**: `npm install`
- **Dev**: `npm run dev`

### Soroban Contracts

Located in `soroban-contracts/soroscan_core/`.

- **Build**: `cargo build --target wasm32-unknown-unknown --release`

---

## Testing

### Backend

Uses `pytest` with `pytest-django`.

```bash
cd django-backend
pytest
```

### Frontend

Uses `jest` and `React Testing Library`.

```bash
cd soroscan-frontend
pnpm test
```

### Contracts

Uses standard Rust `cargo test`.

```bash
cd soroban-contracts/soroscan_core
cargo test
```

---

## Development Conventions

### Environment Configuration

- Use `.env` files for local configuration. See `django-backend/.env.example` for reference.
- Important variables: `DATABASE_URL`, `REDIS_URL`, `SOROBAN_RPC_URL`, `SOROSCAN_CONTRACT_ID`.

### API Development

- **REST**: Implemented in `django-backend/soroscan/ingest/views.py` using DRF.
- **GraphQL**: Implemented in `django-backend/soroscan/ingest/schema.py` using Strawberry.
- **Frontend Integration**: Always run `pnpm run codegen` in `soroscan-frontend/` after modifying the backend GraphQL
  schema.

### Coding Standards

- **Python**: Follows PEP 8. Formatting tools like `black` and `ruff` are recommended.
- **TypeScript/React**: Next.js conventions with Tailwind CSS for styling.
- **Rust**: Standard `cargo fmt` and `clippy` for contracts.

### Version Control

- Do not commit `.env` files or local build artifacts.
- Sub-projects (backend, frontend, contracts) have their own `.gitignore` files.
