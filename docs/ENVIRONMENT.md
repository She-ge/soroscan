# SoroScan Environment Variables

The Django backend reads variables from:

```text
django-backend/.env
```

Copy the provided example before starting the backend:

```bash
cp django-backend/.env.example django-backend/.env
```

Never commit a real `.env` file or production secrets.

## Required variables

The following six variables are validated before every non-test Django startup. The application raises `ImproperlyConfigured` when any of them is missing, even where a fallback value exists later in `settings.py`.

| Variable                     | Type         | Required | Code fallback                                                         | Description                                                                                                       |
| ---------------------------- | ------------ | -------: | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SECRET_KEY`                 | String       |      Yes | `django-insecure-change-this-in-production`                           | Django cryptographic signing key and JWT signing key. Use a unique value of at least 50 characters in production. |
| `DATABASE_URL`               | Database URL |      Yes | `sqlite:///django-backend/db.sqlite3`                                 | Database connection URL. PostgreSQL is recommended for development and required for production workloads.         |
| `REDIS_URL`                  | Redis URL    |      Yes | Redis database `1` for cache and database `0` for Channels and Celery | Shared Redis connection used by caching, Channels, Celery broker, and Celery result storage.                      |
| `SOROBAN_RPC_URL`            | URL          |      Yes | `https://soroban-testnet.stellar.org`                                 | Primary Soroban RPC endpoint used for contract and ledger access.                                                 |
| `STELLAR_NETWORK_PASSPHRASE` | String       |      Yes | `Test SDF Network ; September 2015`                                   | Stellar network passphrase associated with the primary Soroban RPC endpoint.                                      |
| `SOROSCAN_CONTRACT_ID`       | String       |      Yes | Empty string                                                          | Deployed SoroScan contract identifier.                                                                            |

Tests using `soroscan.settings_test` do not require these variables because the test settings use in-memory SQLite, cache, Channels, and Celery services.

## Core Django configuration

| Variable                 | Type                 | Required | Default                                    | Description                                                                                               |
| ------------------------ | -------------------- | -------: | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `DJANGO_SETTINGS_MODULE` | String               |       No | Selected by Django commands                | Django settings module. Use `soroscan.settings` normally and `soroscan.settings_test` for isolated tests. |
| `DEBUG`                  | Boolean              |       No | `False`                                    | Enables Django debug mode. Never enable it in production.                                                 |
| `ALLOWED_HOSTS`          | Comma-separated list |       No | `localhost,127.0.0.1`                      | Host names accepted by Django.                                                                            |
| `FRONTEND_BASE_URL`      | URL                  |       No | `http://localhost:3000`                    | Public frontend URL used by backend integrations.                                                         |
| `SOFTWARE_VERSION`       | String               |       No | Value from `VERSION.md`, otherwise `1.0.0` | Version exposed through API and platform metadata.                                                        |
| `ENABLE_SILK`            | Boolean              |       No | `False`                                    | Enables the Django Silk profiler and middleware.                                                          |

Accepted Boolean values include `True`/`False`, `true`/`false`, `1`/`0`, and `yes`/`no`.

## Database and connection-pool configuration

| Variable                    | Type            | Required | Default            | Description                                                                         |
| --------------------------- | --------------- | -------: | ------------------ | ----------------------------------------------------------------------------------- |
| `DB_CONN_MAX_AGE`           | Integer seconds |       No | `300`              | Maximum lifetime of a persistent Django database connection.                        |
| `DB_CONNECT_TIMEOUT`        | Integer seconds |       No | `5`                | PostgreSQL connection timeout. Applied only when PostgreSQL is used.                |
| `DB_APPLICATION_NAME`       | String          |       No | `soroscan-backend` | PostgreSQL application name shown in database monitoring tools.                     |
| `WEB_CONCURRENCY`           | Integer         |       No | `4`                | Expected number of web worker processes used when calculating database pool limits. |
| `DB_CONNECTIONS_PER_WORKER` | Integer         |       No | `4`                | Target number of database connections per worker.                                   |
| `DB_POOL_MIN_SIZE`          | Integer         |       No | `2`                | Minimum database connection-pool target.                                            |
| `DB_POOL_HARD_LIMIT`        | Integer         |       No | `40`               | Maximum database connection target across workers.                                  |

The calculated pool maximum is bounded by `DB_POOL_HARD_LIMIT`.

## Cache, Celery, and shutdown configuration

| Variable                   | Type            | Required | Default | Description                                                                 |
| -------------------------- | --------------- | -------: | ------- | --------------------------------------------------------------------------- |
| `QUERY_CACHE_TTL_SECONDS`  | Integer seconds |       No | `60`    | Cache lifetime for REST, GraphQL, statistics, search, and timeline results. |
| `SHUTDOWN_TIMEOUT_SECONDS` | Integer seconds |       No | `30`    | Graceful-shutdown timeout for active application work.                      |

`REDIS_URL` is also used as the Celery broker, Celery result backend, Channels backend, and Django Redis cache.

## Rate limiting

Rate values follow the `<requests>/<period>` format, such as `60/minute` or `1000/hour`.

| Variable                     | Type        | Required | Default      | Description                                   |
| ---------------------------- | ----------- | -------: | ------------ | --------------------------------------------- |
| `RATE_LIMIT_ANON`            | Rate string |       No | `60/minute`  | Default request rate for anonymous users.     |
| `RATE_LIMIT_USER`            | Rate string |       No | `300/minute` | Default request rate for authenticated users. |
| `RATE_LIMIT_INGEST`          | Rate string |       No | `10/minute`  | Event-ingestion endpoint rate.                |
| `RATE_LIMIT_GRAPHQL`         | Rate string |       No | `60/minute`  | GraphQL endpoint rate.                        |
| `ENDPOINT_RATE_LIMIT_SEARCH` | Rate string |       No | `30/minute`  | Event-search endpoint rate.                   |
| `ENDPOINT_RATE_LIMIT_STATS`  | Rate string |       No | `100/minute` | Contract-statistics endpoint rate.            |

## CORS configuration

| Variable          | Type                     | Required | Default | Description                                                                                                              |
| ----------------- | ------------------------ | -------: | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ALLOWED_ORIGINS` | Comma-separated URL list |       No | Empty   | Frontend origins permitted to make cross-origin requests. When empty, all origins are permitted only while `DEBUG=True`. |

Example:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Data retention and deduplication

| Variable                         | Type            | Required | Default | Description                                                          |
| -------------------------------- | --------------- | -------: | ------- | -------------------------------------------------------------------- |
| `DEDUP_LOG_RETENTION_DAYS`       | Integer days    |       No | `90`    | Number of days to retain event-deduplication logs.                   |
| `EVENT_RETENTION_DAYS`           | Integer days    |       No | `30`    | Number of days to retain contract events before archival or pruning. |
| `ALERT_DEDUP_WINDOW_SECONDS`     | Integer seconds |       No | `300`   | General alert deduplication window.                                  |
| `WEBHOOK_DEDUP_WINDOW_SECONDS`   | Integer seconds |       No | `300`   | Webhook delivery deduplication window.                               |
| `DOWNSTREAM_ALERT_DEDUP_SECONDS` | Integer seconds |       No | `3600`  | Deduplication window for downstream dependency alerts.               |

## Webhook escalation and signing

| Variable                              | Type            | Required | Default | Description                                                                           |
| ------------------------------------- | --------------- | -------: | ------- | ------------------------------------------------------------------------------------- |
| `WEBHOOK_ESCALATION_TIMEOUT_SECONDS`  | Integer seconds |       No | `10`    | Timeout for an escalation delivery attempt.                                           |
| `WEBHOOK_ESCALATION_DEDUP_SECONDS`    | Integer seconds |       No | `300`   | Deduplication window for escalation notifications.                                    |
| `WEBHOOK_ESCALATION_SLACK_TARGET`     | String          |       No | Empty   | Slack escalation destination or integration target.                                   |
| `WEBHOOK_ESCALATION_SMS_TARGET`       | String          |       No | Empty   | SMS escalation destination.                                                           |
| `WEBHOOK_ESCALATION_PAGERDUTY_TARGET` | String          |       No | Empty   | PagerDuty escalation destination or routing target.                                   |
| `WEBHOOK_ED25519_SIGNING_SEED`        | Hex string      |       No | Empty   | 32-byte hexadecimal Ed25519 seed used to sign webhook payloads. Treat it as a secret. |

## Cost-model configuration

Values are decimal amounts in U.S. dollars.

| Variable                    | Type           | Required | Default   | Description                               |
| --------------------------- | -------------- | -------: | --------- | ----------------------------------------- |
| `COST_RPC_PER_CALL_USD`     | Decimal string |       No | `0.00001` | Estimated cost of one RPC call.           |
| `COST_STORAGE_PER_GB_USD`   | Decimal string |       No | `0.10`    | Estimated storage cost per gigabyte.      |
| `COST_COMPUTE_PER_UNIT_USD` | Decimal string |       No | `0.00002` | Estimated compute cost per internal unit. |

## Stellar and Soroban configuration

| Variable             | Type          | Required | Default                                                | Description                                                         |
| -------------------- | ------------- | -------: | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `INDEXER_SECRET_KEY` | Secret string |       No | Empty                                                  | Secret key used by the indexer when a signing identity is required. |
| `TESTNET_RPC_URL`    | URL           |       No | `https://soroban-testnet.stellar.org`                  | RPC URL exposed for the configured testnet network.                 |
| `MAINNET_RPC_URL`    | URL           |       No | `https://mainnet.stellar.validationcloud.io/v1/public` | RPC URL exposed for the configured mainnet network.                 |
| `FUTURENET_RPC_URL`  | URL           |       No | `https://soroban-futurenet.stellar.org`                | RPC URL exposed for the configured futurenet network.               |

The required primary variables `SOROBAN_RPC_URL` and `STELLAR_NETWORK_PASSPHRASE` select the backend’s main active network. The three network-specific URL variables configure the network list returned by the API.

## GraphQL configuration

| Variable                        | Type             | Required | Default               | Description                                                                              |
| ------------------------------- | ---------------- | -------: | --------------------- | ---------------------------------------------------------------------------------------- |
| `GRAPHQL_INTROSPECTION_ENABLED` | Boolean          |       No | Same value as `DEBUG` | Enables GraphQL schema introspection. Disable it in production unless explicitly needed. |
| `GRAPHQL_MAX_COMPLEXITY`        | Integer          |       No | `1000`                | Maximum permitted GraphQL query-complexity score.                                        |
| `GRAPHQL_N1_DETECTION_ENABLED`  | Boolean          |       No | Same value as `DEBUG` | Enables development-time detection of possible N+1 resolver queries.                     |
| `GRAPHQL_RESOLVER_LOG_LEVEL`    | Log-level string |       No | `INFO`                | Logging level for GraphQL resolver activity.                                             |

## Contract snapshots

| Variable                      | Type            | Required | Default   | Description                                       |
| ----------------------------- | --------------- | -------: | --------- | ------------------------------------------------- |
| `CONTRACT_SNAPSHOT_INTERVAL`  | Integer ledgers |       No | `1000`    | Ledger interval between contract-state snapshots. |
| `CONTRACT_SNAPSHOT_MAX_BYTES` | Integer bytes   |       No | `1048576` | Maximum stored size of a contract snapshot.       |

## Logging and performance monitoring

| Variable                        | Type                 | Required | Default                        | Description                                                                           |
| ------------------------------- | -------------------- | -------: | ------------------------------ | ------------------------------------------------------------------------------------- |
| `LOG_FORMAT`                    | String               |       No | Empty                          | Set to `json` to enable structured JSON console logs. Any other value uses text logs. |
| `SLOW_QUERY_THRESHOLD_MS`       | Integer milliseconds |       No | `100`                          | Application slow-query logging threshold.                                             |
| `DATABASE_SLOW_QUERY_THRESHOLD` | Float seconds        |       No | `1.0`                          | Database-level slow-query threshold.                                                  |
| `SILK_PROFILER_LOG_DIR`         | Filesystem path      |       No | `django-backend/logs/profiler` | Output directory used by the Silk profiler.                                           |

## Email and alert delivery

| Variable                      | Type               | Required | Default                                       | Description                                    |
| ----------------------------- | ------------------ | -------: | --------------------------------------------- | ---------------------------------------------- |
| `EMAIL_BACKEND`               | Python import path |       No | `django.core.mail.backends.smtp.EmailBackend` | Django email backend implementation.           |
| `EMAIL_HOST`                  | Host name          |       No | `smtp.gmail.com`                              | SMTP server host.                              |
| `EMAIL_PORT`                  | Integer            |       No | `587`                                         | SMTP server port.                              |
| `EMAIL_USE_TLS`               | Boolean            |       No | `True`                                        | Enables TLS for SMTP delivery.                 |
| `EMAIL_HOST_USER`             | String             |       No | Empty                                         | SMTP account username.                         |
| `EMAIL_HOST_PASSWORD`         | Secret string      |       No | Empty                                         | SMTP account password or application password. |
| `DEFAULT_FROM_EMAIL`          | Email address      |       No | `noreply@soroscan.io`                         | Default sender address for application email.  |
| `SLACK_ALERT_TIMEOUT_SECONDS` | Integer seconds    |       No | `10`                                          | Timeout for Slack alert delivery.              |

## Event-streaming configuration

Event streaming is disabled by default.

| Variable                    | Type                 | Required | Default           | Description                                                 |
| --------------------------- | -------------------- | -------: | ----------------- | ----------------------------------------------------------- |
| `EVENT_STREAMING_ENABLED`   | Boolean              |       No | `False`           | Enables publishing events to an external streaming backend. |
| `EVENT_STREAMING_BACKEND`   | Enum                 |       No | `kafka`           | Streaming backend: `kafka`, `pubsub`, or `sqs`.             |
| `KAFKA_BOOTSTRAP_SERVERS`   | Comma-separated list |       No | `localhost:9092`  | Kafka broker addresses.                                     |
| `KAFKA_TOPIC`               | String               |       No | `soroscan.events` | Kafka topic receiving SoroScan events.                      |
| `KAFKA_SCHEMA_REGISTRY_URL` | URL                  |       No | Empty             | Optional Kafka schema-registry endpoint.                    |
| `PUBSUB_PROJECT_ID`         | String               |       No | Empty             | Google Cloud project ID used by Pub/Sub.                    |
| `PUBSUB_TOPIC`              | String               |       No | `soroscan.events` | Google Cloud Pub/Sub topic.                                 |
| `SQS_QUEUE_URL`             | URL                  |       No | Empty             | Amazon SQS queue URL.                                       |

When `EVENT_STREAMING_ENABLED=True`, configure the variables required by the selected backend.

## Archive and S3-compatible storage

| Variable                | Type          | Required | Default     | Description                                                              |
| ----------------------- | ------------- | -------: | ----------- | ------------------------------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`     | String        |       No | Empty       | Access-key identifier for S3 or an S3-compatible service.                |
| `AWS_SECRET_ACCESS_KEY` | Secret string |       No | Empty       | Secret access key for S3 or an S3-compatible service.                    |
| `AWS_S3_REGION_NAME`    | String        |       No | `us-east-1` | S3 region name.                                                          |
| `AWS_S3_ENDPOINT_URL`   | URL           |       No | Empty       | Custom endpoint for MinIO, LocalStack, or another S3-compatible service. |

## Sentry monitoring

Sentry is initialized only when `SENTRY_DSN` is non-empty.

| Variable                    | Type                  | Required | Default      | Description                                                |
| --------------------------- | --------------------- | -------: | ------------ | ---------------------------------------------------------- |
| `SENTRY_DSN`                | URL                   |       No | Empty        | Sentry project DSN. Leave empty to disable Sentry.         |
| `SENTRY_TRACES_SAMPLE_RATE` | Float from `0` to `1` |       No | `0.1`        | Fraction of transactions captured for performance tracing. |
| `SENTRY_ENVIRONMENT`        | String                |       No | `production` | Environment label attached to Sentry events.               |

## Request limits

| Variable                | Type          | Required | Default    | Description                                       |
| ----------------------- | ------------- | -------: | ---------- | ------------------------------------------------- |
| `MAX_REQUEST_BODY_SIZE` | Integer bytes |       No | `10485760` | Maximum request body size. The default is 10 MiB. |

## Docker Compose port overrides

These variables are consumed by `docker-compose.yml`, not Django settings.

| Variable        | Type         | Required | Default | Description                             |
| --------------- | ------------ | -------: | ------- | --------------------------------------- |
| `POSTGRES_PORT` | Integer port |       No | `5432`  | Host port mapped to PostgreSQL.         |
| `REDIS_PORT`    | Integer port |       No | `6379`  | Host port mapped to Redis.              |
| `WEB_PORT`      | Integer port |       No | `8000`  | Host port mapped to the Django backend. |

## Development example

```env
SECRET_KEY=django-insecure-development-key-change-before-production-1234567890
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
FRONTEND_BASE_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soroscan
REDIS_URL=redis://localhost:6379/0

SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
SOROSCAN_CONTRACT_ID=CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
INDEXER_SECRET_KEY=

ALLOWED_ORIGINS=http://localhost:3000
LOG_FORMAT=
SENTRY_DSN=
```

For Docker Compose, use database and Redis service names instead:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/soroscan
REDIS_URL=redis://redis:6379/0
```

## Testing example

The dedicated test settings do not require PostgreSQL, Redis, or contract credentials:

```env
DJANGO_SETTINGS_MODULE=soroscan.settings_test
```

Run tests with:

```bash
cd django-backend
DJANGO_SETTINGS_MODULE=soroscan.settings_test pytest
```

On Windows PowerShell:

```powershell
cd django-backend
$env:DJANGO_SETTINGS_MODULE = "soroscan.settings_test"
pytest
```

## Production example

Replace every placeholder before deployment:

```env
SECRET_KEY=replace-with-a-unique-random-secret-of-at-least-50-characters
DEBUG=False
ALLOWED_HOSTS=api.example.com
FRONTEND_BASE_URL=https://app.example.com
SOFTWARE_VERSION=1.0.0

DATABASE_URL=postgresql://soroscan:replace-password@postgres.example.com:5432/soroscan
DB_CONN_MAX_AGE=300
DB_CONNECT_TIMEOUT=5
DB_APPLICATION_NAME=soroscan-production

REDIS_URL=rediss://default:replace-password@redis.example.com:6379/0

SOROBAN_RPC_URL=https://your-production-soroban-rpc.example.com
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
SOROSCAN_CONTRACT_ID=CREPLACE_WITH_DEPLOYED_CONTRACT_ID
INDEXER_SECRET_KEY=replace-with-indexer-secret

ALLOWED_ORIGINS=https://app.example.com
GRAPHQL_INTROSPECTION_ENABLED=False
GRAPHQL_N1_DETECTION_ENABLED=False
LOG_FORMAT=json

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=alerts@example.com
EMAIL_HOST_PASSWORD=replace-with-email-password
DEFAULT_FROM_EMAIL=noreply@example.com

SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Secret-management guidance

Treat the following values as secrets:

* `SECRET_KEY`
* `DATABASE_URL` when it contains credentials
* `REDIS_URL` when it contains credentials
* `INDEXER_SECRET_KEY`
* `WEBHOOK_ED25519_SIGNING_SEED`
* `EMAIL_HOST_PASSWORD`
* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`
* `SENTRY_DSN`

For production, store secrets in a managed secret store or Kubernetes Secret rather than committing them to source control.

## Validation

After creating `django-backend/.env`, validate the Django configuration:

```bash
cd django-backend
python manage.py check
```

Run the isolated test configuration with:

```bash
DJANGO_SETTINGS_MODULE=soroscan.settings_test pytest
```
