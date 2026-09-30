# SoroScan Django Backend

REST and GraphQL API for indexing Soroban smart contract events.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
daphne -b 0.0.0.0 -p 8000 soroscan.asgi:application

# For development with auto-reload
python manage.py runserver
```

## Running with ASGI (Production)

For WebSocket support in production, use an ASGI server:

```bash
# Using Daphne
daphne -b 0.0.0.0 -p 8000 soroscan.asgi:application

# Using Uvicorn
uvicorn soroscan.asgi:application --host 0.0.0.0 --port 8000
```

## Environment Variables

Create a `.env` file:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgres://user:pass@localhost:5432/soroscan
REDIS_URL=redis://localhost:6379/0
FRONTEND_BASE_URL=http://localhost:3000

# Stellar
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SOROSCAN_CONTRACT_ID=CCAAAA...
INDEXER_SECRET_KEY=SCXXXX...
```

## Running Celery Workers

```bash
# Start worker
celery -A soroscan worker -l info

# Start beat scheduler
celery -A soroscan beat -l info
```

### Periodic Tasks

Celery Beat uses interval schedules configured in seconds (not cron expressions).

| Task Name | Schedule | Purpose |
| --- | --- | --- |
| `cleanup-webhook-delivery-logs` | Daily | Removes expired webhook delivery logs. |
| `cleanup-old-dedup-logs` | Daily | Removes expired event deduplication records. |
| `cleanup-silk-data` | Weekly | Removes old Silk profiling data. |
| `archive-old-events` | Daily | Archives old event records. |
| `evaluate-remediation-rules` | Every 5 minutes | Evaluates configured remediation rules. |
| `aggregate-event-statistics` | Hourly | Aggregates event statistics. |
| `aggregate-organization-costs` | Hourly | Aggregates organization usage costs. |
| `reconcile-event-completeness` | Every 5 minutes | Reconciles event completeness and detects gaps. |
| `recompute-call-graph` | Hourly | Recomputes the contract call graph. |
| `warm-event-count-cache` | Every 5 minutes | Refreshes the event-count cache. |
| `snapshot-contract-state` | Every 10 minutes | Saves contract state snapshots. |
| `auto-resume-paused-contracts` | Every 5 minutes | Resumes contracts whose pause conditions have cleared. |
| `warm-contract-name-cache` | Daily | Refreshes cached contract names. |
| `create-upcoming-event-partitions` | Not configured | Creates upcoming event table partitions; no interval is defined. |
| `detach-expired-event-partitions` | Daily | Detaches event partitions older than the retention cutoff. |

The current Beat schedule does not declare dedicated periodic health-check or telemetry tasks.

## CDC Streaming

SoroScan can publish indexed events to Kafka, Pub/Sub, or SQS for downstream warehouses.

- default Kafka topic: `soroscan.events`
- schema subject: `soroscan.events-value`
- integration guide: `docs/cdc-streaming.md`

## Logging and Sentry

- **Log format**: Set `LOG_FORMAT=json` to emit structured JSON logs (one JSON object per line). Omit or leave unset for human-readable logs. Each JSON line includes `timestamp`, `levelname`, `name` (logger), and `message`; ingest logs also include `request_id`, `contract_id`, and `ledger_sequence` when available.
- **Sentry**: Optional. Set `SENTRY_DSN` to enable error and performance monitoring. If unset, the application starts normally and Sentry is not initialised. Celery task failures are reported to Sentry with task name context when the integration is enabled.
- **Performance traces**: When Sentry is enabled, `SENTRY_TRACES_SAMPLE_RATE` defaults to `0.1` (10%) to control cost; set in `.env` if needed.
- **PII**: Do not log personally identifiable information. Keep log messages and structured fields free of user emails, secret keys, or other sensitive data.

## API Endpoints

### Authentication

SoroScan uses JWT (JSON Web Token) authentication for write operations. Read endpoints remain public.

#### Obtaining Tokens

```bash
# Get access and refresh tokens
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Using Access Tokens

```bash
# Include the access token in the Authorization header
curl -X POST http://localhost:8000/api/ingest/record/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "CABC...", "event_type": "swap", "payload_hash": "abc123..."}'
```

#### Refreshing Tokens

```bash
# Get a new access token using the refresh token
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Token Lifetimes

- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Tokens are signed using the SECRET_KEY environment variable

#### GraphQL Authentication

For GraphQL mutations, include the JWT token in the Authorization header:

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { registerContract(contractId: \"CABC...\", name: \"My Contract\") { id contractId name } }"}'
```

### Interactive Documentation (Swagger / ReDoc)

SoroScan REST API comes with auto-generated interactive documentation:
- **Swagger UI**: `/api/docs/`
- **ReDoc UI**: `/api/redoc/`
- **OpenAPI Schema (JSON/YAML)**: `/api/schema/`

To export the schema to a local file:

```bash
cd django-backend
python manage.py spectacular --file schema.yml
```

This generates a valid OpenAPI 3.0 YAML file that can be imported into Postman, used to generate client SDKs, or published as part of your API contract.

### Auto-Generated Endpoint Reference (from docstrings)

View docstrings are the source of truth for human-readable REST endpoint docs.
A management command walks all URL patterns, extracts docstrings from views and
ViewSet actions, and writes a Markdown (or JSON) reference file.

```bash
cd django-backend

# Markdown reference (default) → docs/api_reference.md
python manage.py generate_api_docs

# JSON output for downstream tooling
python manage.py generate_api_docs --format json --output docs/api_reference.json

# Print to stdout (useful in CI)
python manage.py generate_api_docs --stdout --no-examples

# Makefile shortcut
make docs
```

Standalone script (same behaviour):

```bash
python scripts/generate_api_docs.py --output docs/api_reference.md
```

**Docstring format** — the parser recognises these sections:

```
One-line summary shown as the endpoint title.

Optional description paragraph.

Query params:
- param_name (type) - Description (required)

Request body:
- field_name (type) - Description

- 200: Success response description
- 401: Unauthorized
```

Re-run after changing `views.py` or `urls.py`. Do not edit `docs/api_reference.md`
by hand — it is regenerated on every run.

### REST API

#### Public Endpoints (No Authentication Required)

- `GET /api/events/` - List events
- `GET /api/contracts/` - List tracked contracts
- `GET /api/ingest/health/` - Health check
- `GET /api/ingest/contracts/{id}/completeness/` - Contract completeness and gap summary
- `GET /api/ingest/contracts/completeness_dashboard/` - Completeness dashboard across visible contracts

#### Protected Endpoints (Authentication Required)

- `POST /api/ingest/record/` - Record a new event (requires JWT token)
- `POST /api/contracts/` - Create a tracked contract (requires JWT token)
- `PUT /api/contracts/{id}/` - Update a contract (requires JWT token)
- `PATCH /api/contracts/{id}/` - Partially update a contract (requires JWT token)
- `DELETE /api/contracts/{id}/` - Delete a contract (requires JWT token)
- `POST /api/webhooks/` - Create a webhook subscription (requires JWT token)
- `PUT /api/webhooks/{id}/` - Update a webhook (requires JWT token)
- `DELETE /api/webhooks/{id}/` - Delete a webhook (requires JWT token)

#### Authentication Endpoints

- `POST /api/token/` - Obtain JWT access and refresh tokens
- `POST /api/token/refresh/` - Refresh an access token

### GraphQL

- `POST /graphql/` - GraphQL endpoint

#### Public Queries (No Authentication Required)

- `contracts` - List all tracked contracts
- `contract(contractId)` - Get a specific contract
- `events(...)` - Query events with filtering and pagination
- `event(id)` - Get a specific event
- `contractStats(contractId)` - Get contract statistics
- `eventTypes(contractId)` - Get unique event types
- `eventTimeline(...)` - Grouped timeline query with bucket zoom/filter support

#### Protected Mutations (Authentication Required)

- `registerContract(contractId, name, description)` - Register a new contract
- `updateContract(contractId, name, description, isActive)` - Update a contract

Mutations require a valid JWT token in the Authorization header. Unauthenticated requests will receive an error response.

### WebSocket

- `ws://host/ws/events/<contract_id>/` - Real-time event streaming

## Rate Limiting & Throttle Policies

SoroScan enforces rate limits at multiple layers to protect the API from abuse and ensure fair usage.

### Rate Limit Headers (IETF Draft Standard)

All responses include standardized rate limit headers following the [IETF draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/):

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed in the current window |
| `RateLimit-Remaining` | Requests remaining in the current window |
| `RateLimit-Reset` | Unix timestamp (UTC) when the window resets |

**Example Response Headers:**
```
RateLimit-Limit: 60
RateLimit-Remaining: 59
RateLimit-Reset: 1700000000
```

### Default Tier Limits (Environment Configurable)

Configure via environment variables in `.env`:

| Variable | Default | Scope |
|----------|---------|-------|
| `RATE_LIMIT_ANON` | `60/minute` | Anonymous users (no auth) |
| `RATE_LIMIT_USER` | `300/minute` | Authenticated JWT users |
| `RATE_LIMIT_INGEST` | `10/minute` | POST `/api/ingest/record/` |
| `RATE_LIMIT_GRAPHQL` | `60/minute` | GraphQL endpoint (`/graphql/`) |
| `RATE_LIMIT_UNAUTHENTICATED_IP` | `30/minute` | IP-based for unauthenticated requests |

### Endpoint-Specific Limits

| Endpoint | Scope | Default |
|----------|-------|---------|
| `GET /api/events/` (search) | `events_search` | `30/minute` |
| `GET /api/contracts/{id}/stats/` | `contract_stats` | `100/minute` |
| `POST /graphql/` | `graphql` | `60/minute` |
| `POST /api/ingest/record/` | `ingest` | `10/minute` |
| `POST /api/admin/db-explain/` | `db_explain` | `10/minute` |
| `POST /api/webhooks/replay/` | `webhook_replay` | `10/hour` |
| `POST /api/contracts/bulk-import/` | `contract_bulk_import` | `20/hour` |
| `POST /api/admin/dedup/test/` | `dedup_test` | `60/hour` |

### API Key Throttling

API keys have per-hour quotas configured per key (default 1000/hour). Contract-level overrides can further reduce quotas for specific contracts.

Headers for API key requests:
```
RateLimit-Limit: 1000
RateLimit-Remaining: 999
RateLimit-Reset: 1700000000
```

### 429 Too Many Requests Response

When a rate limit is exceeded, the API returns **HTTP 429** with a JSON error body:

```json
{
  "detail": "Request was throttled. Expected available in 45 seconds.",
  "retry_after": 45
}
```

**Handling 429 in Clients:**
1. Read `Retry-After` header (seconds) or `RateLimit-Reset` (Unix timestamp)
2. Back off exponentially with jitter
3. Respect `RateLimit-Remaining: 0` as a signal to pause

### Throttle Priority Order

Throttles are evaluated in this order (first match wins):
1. **APIKeyThrottle** — API key tier quotas (highest priority)
2. **DynamicEndpointThrottle** — Endpoint-specific scopes
3. **IngestRateThrottle** — Ingest endpoint strict limit
4. **GraphQLRateThrottle** — GraphQL endpoint
5. **DBExplainThrottle** — Admin DB EXPLAIN
6. **UnauthenticatedIPRateThrottle** — IP-based for unauthenticated
7. **AnonRateThrottle** — Anonymous user default
8. **UserRateThrottle** — Authenticated user default

### Configuration Reference

```env
# .env rate limit overrides
RATE_LIMIT_ANON=60/minute
RATE_LIMIT_USER=300/minute
RATE_LIMIT_INGEST=10/minute
RATE_LIMIT_GRAPHQL=60/minute
ENDPOINT_RATE_LIMIT_SEARCH=30/minute
ENDPOINT_RATE_LIMIT_STATS=100/minute
ENDPOINT_RATE_LIMIT_DB_EXPLAIN=10/minute
RATE_LIMIT_UNAUTHENTICATED_IP=30/minute
```

### Monitoring Rate Limits

- **Grafana Dashboard**: `RateLimit-*` headers are exported as Prometheus metrics
- **SlowQueryMiddleware**: Logs requests exceeding 2s with rate limit context
- **Admin Panel**: API Key quota usage visible at `/admin/ingest/apikey/`


## WebSocket Usage

Connect to a contract's event stream:

```javascript
// JavaScript example
const ws = new WebSocket("ws://localhost:8000/ws/events/CABC123.../");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("New event:", data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = (event) => {
  console.log("WebSocket closed:", event.code);
};
```

Filter by event type using query parameters:

```javascript
const ws = new WebSocket(
  "ws://localhost:8000/ws/events/CABC123.../?event_type=swap",
);
```

Python client example:

```python
import asyncio
import websockets
import json

async def listen_to_events():
    uri = "ws://localhost:8000/ws/events/CABC123.../"
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            event = json.loads(message)
            print(f"Received event: {event}")

asyncio.run(listen_to_events())
```
