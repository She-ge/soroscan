# Requirements Document

## Introduction

The Transaction Cost Analytics feature extends SoroScan's ingestion and analytics capabilities to capture, aggregate, and surface Soroban smart contract fee data. Every ingested transaction's fee breakdown — total fee in stroops, CPU instructions, memory bytes, and network bytes — is persisted to a new `TransactionCost` model. A scheduled Celery task pre-computes hourly cost aggregations grouped by contract and function. An outlier detection mechanism flags transactions whose costs exceed two standard deviations from the mean. A new REST endpoint exposes cost analytics with flexible grouping and date range filtering. Django admin provides operational visibility with outlier filtering. A Next.js frontend dashboard surfaces cost trends including week-over-week and month-over-month comparisons, and highlights high-variance functions for optimization guidance.

---

## Glossary

- **TransactionCost**: A database record capturing fee and resource usage for a single ingested Soroban transaction invocation.
- **Stroop**: The smallest unit of XLM (1 XLM = 10,000,000 stroops). All fee values are stored in stroops.
- **Outlier**: A `TransactionCost` record whose `total_fee_stroops` exceeds two standard deviations above the mean for its contract's function within the analysis window.
- **Aggregation**: A pre-computed summary (avg, min, max, total, count) of cost metrics grouped by contract and function over a time period.
- **CostAggregate**: A database record holding one pre-computed aggregation bucket (contract + function + period).
- **Ingest Pipeline**: The existing Celery-driven process in `tasks.py` that calls `SorobanClient` to fetch and store contract events and invocations.
- **SorobanClient**: The existing client class in `stellar_client.py` that communicates with the Soroban RPC; its `extract_fee_data()` method is already implemented.
- **TrackedContract**: The existing FK target model representing a registered Soroban contract.
- **ContractInvocation**: The existing model recording a contract function call; `TransactionCost` uses its `tx_hash` and `function_name` as a reference point.
- **Analyzer**: The Celery task `analyze_transaction_costs` that runs hourly aggregations and outlier detection.
- **Cost Analytics API**: The DRF ViewSet action at `GET /api/analytics/costs/`.
- **Dashboard**: The Next.js cost trends UI page in the frontend application.
- **2-sigma threshold**: The outlier detection rule: cost > (mean + 2 × standard deviation) for the same contract/function population.
- **WoW**: Week-over-week — a comparison of the current 7-day window against the previous 7-day window.
- **MoM**: Month-over-month — a comparison of the current 30-day window against the previous 30-day window.

---

## Requirements

### Requirement 1: TransactionCost Data Model

**User Story:** As a backend engineer, I want a dedicated `TransactionCost` model, so that fee and resource usage data for every ingested transaction is stored with the right structure and indexes for efficient analytics queries.

#### Acceptance Criteria

1. THE `TransactionCost` model SHALL include the fields: `contract` (ForeignKey to `TrackedContract`, CASCADE delete), `tx_hash` (CharField max 64), `function_name` (CharField max 128), `ledger_sequence` (PositiveBigIntegerField), `total_fee_stroops` (PositiveBigIntegerField), `cpu_instructions_used` (PositiveBigIntegerField), `memory_bytes_used` (PositiveBigIntegerField), `network_bytes_used` (PositiveBigIntegerField, derived as `read_bytes_used + write_bytes_used`), `is_outlier` (BooleanField default False), and `created_at` (DateTimeField auto_now_add).
2. THE `TransactionCost` model SHALL define a composite index on `(contract, -created_at)` and a single-column index on `function_name`.
3. THE `TransactionCost` model SHALL enforce a unique constraint on `(contract, tx_hash)` to prevent duplicate cost records per transaction.
4. WHEN a `TrackedContract` is deleted, THE `TransactionCost` model SHALL cascade-delete all associated `TransactionCost` records.
5. THE Django migration system SHALL include a new migration file that creates the `TransactionCost` table and all indexes defined in requirements 1.1–1.3.

---

### Requirement 2: Fee Extraction During Ingestion

**User Story:** As a backend engineer, I want the ingest pipeline to extract and persist fee data for every transaction it processes, so that cost records are always present for any ingested transaction without requiring a backfill.

#### Acceptance Criteria

1. WHEN the ingest pipeline processes a transaction that corresponds to a tracked contract invocation, THE Ingest Pipeline SHALL call `SorobanClient.extract_fee_data(tx_response)` to obtain the fee breakdown dictionary.
2. WHEN `SorobanClient.extract_fee_data()` returns a dictionary with a non-zero `total_fee_stroops`, THE Ingest Pipeline SHALL create a `TransactionCost` record using the returned values.
3. WHEN `SorobanClient.extract_fee_data()` returns a dictionary where all fee and resource values are zero, THE Ingest Pipeline SHALL still create a `TransactionCost` record with zero values rather than skipping the record.
4. WHEN a `TransactionCost` record for the same `(contract, tx_hash)` already exists, THE Ingest Pipeline SHALL skip creation and log the skip at DEBUG level to indicate the operation was intentionally bypassed rather than treating it as a successful creation.
5. IF an exception is raised during fee extraction or `TransactionCost` creation, THEN THE Ingest Pipeline SHALL log the error at WARNING level and continue processing the remaining pipeline steps without raising.
6. THE `network_bytes_used` field SHALL be computed as `read_bytes_used + write_bytes_used` from the `extract_fee_data()` result at creation time.

---

### Requirement 3: Hourly Cost Aggregation Task

**User Story:** As a backend engineer, I want a scheduled Celery task that pre-computes cost aggregations hourly, so that analytics queries are served from pre-computed data and do not impose on-demand aggregation costs.

#### Acceptance Criteria

1. THE Analyzer SHALL be implemented as a Celery `@shared_task` named `analyze_transaction_costs` in `tasks.py`, following the existing `@shared_task` pattern with profiling and timeout monitoring.
2. WHEN the Analyzer runs, THE Analyzer SHALL compute the following aggregation fields for each `(contract, function_name)` pair within the configured time window: `avg_fee_stroops`, `min_fee_stroops`, `max_fee_stroops`, `total_fee_stroops`, `call_count`.
3. THE Analyzer SHALL store or update aggregation results in a `CostAggregate` model with fields: `contract` (FK), `function_name`, `period_start` (DateTimeField), `period_hours` (PositiveIntegerField, default 1), and the five aggregation fields from 3.2.
4. THE Analyzer SHALL be registered in Celery Beat to run on an hourly schedule.
5. WHEN the Analyzer computes aggregations, THE Analyzer SHALL apply outlier detection: any `TransactionCost` record with `total_fee_stroops` > (mean + 2 × standard_deviation) for its `(contract, function_name)` group SHALL have its `is_outlier` field set to `True`.
6. WHEN a `(contract, function_name)` group contains fewer than 3 records, THE Analyzer SHALL skip outlier detection for that group and leave `is_outlier` as `False`.
7. IF the Analyzer raises an unhandled exception, THEN THE Analyzer SHALL log the full traceback at ERROR level and allow Celery to handle retry according to the existing task error policy.

---

### Requirement 4: Cost Analytics REST Endpoint

**User Story:** As a frontend developer and API consumer, I want a `GET /api/analytics/costs/` endpoint, so that I can retrieve pre-computed cost aggregations filtered by contract, grouped by function, and scoped to a configurable date range.

#### Acceptance Criteria

1. THE Cost Analytics API SHALL be implemented as a DRF ViewSet action registered at `GET /api/analytics/costs/` following the existing `get_or_set_json` / `stable_cache_key` caching pattern in `views.py`; the caching layer SHALL sit on top of pre-computed `CostAggregate` data so that both the caching pattern and the prohibition on on-demand aggregation are satisfied simultaneously.
2. THE Cost Analytics API SHALL accept the query parameters: `contract_id` (required, TrackedContract primary key or contract address), `groupby` (optional, default `"function"`, accepted values: `"function"`, `"ledger"`, `"day"`), and `range` (optional, default `"7d"`, accepted values: `"1d"`, `"7d"`, `"30d"`, `"90d"`).
3. WHEN a valid request is received, THE Cost Analytics API SHALL return a JSON array where each element contains: `function` (string), `avgCost` (integer, stroops), `minCost` (integer, stroops), `maxCost` (integer, stroops), `totalCost` (integer, stroops), `callCount` (integer).
4. WHEN `contract_id` references a `TrackedContract` that does not exist, THE Cost Analytics API SHALL return HTTP 404 with a descriptive error message.
5. WHEN an invalid `groupby` or `range` value is supplied, THE Cost Analytics API SHALL return HTTP 400 with a descriptive error message listing accepted values.
6. WHEN no cost data exists for the requested contract and range, THE Cost Analytics API SHALL return HTTP 200 with an empty JSON array.
7. THE Cost Analytics API SHALL serve results from pre-computed `CostAggregate` records; it SHALL NOT compute aggregations on-demand from raw `TransactionCost` records.
8. THE Cost Analytics API SHALL apply response caching using `get_or_set_json` / `stable_cache_key` with a TTL consistent with the hourly aggregation cadence (≤ 60 minutes).

---

### Requirement 5: Outlier Detection and Admin Visibility

**User Story:** As a system administrator, I want to see outlier transactions flagged in the Django admin interface, so that I can identify contracts or functions with anomalous cost spikes for investigation.

#### Acceptance Criteria

1. THE `TransactionCost` model SHALL be registered in `admin.py` as a `ModelAdmin` subclass following the existing `list_display`, `list_filter`, `search_fields` pattern.
2. THE `TransactionCostAdmin` SHALL include `list_display` fields: `contract`, `tx_hash`, `function_name`, `total_fee_stroops`, `cpu_instructions_used`, `memory_bytes_used`, `network_bytes_used`, `is_outlier`, `created_at`.
3. THE `TransactionCostAdmin` SHALL include a `list_filter` entry for `is_outlier` so admins can filter to show only flagged transactions.
4. THE `TransactionCostAdmin` SHALL include `search_fields` on `tx_hash` and `function_name`.
5. THE `TransactionCostAdmin` SHALL include an `ordering` of `["-created_at"]` so the most recent records appear first.
6. WHEN the Analyzer flags a `TransactionCost` record as an outlier, THE `TransactionCost` record's `is_outlier` field SHALL be `True` and SHALL be visible in the admin list immediately after the next page refresh.

---

### Requirement 6: Cost Trends Frontend Dashboard

**User Story:** As a developer using SoroScan, I want a cost trends dashboard in the frontend, so that I can understand how transaction costs for my contracts are evolving and identify functions that warrant optimization.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a page in the Next.js frontend application that fetches data from the `GET /api/analytics/costs/` endpoint.
2. THE Dashboard SHALL display a line or bar chart visualizing total fee trend over time for the selected contract, supporting at minimum a 7-day and 30-day view.
3. THE Dashboard SHALL display a summary table showing `avgCost`, `minCost`, `maxCost`, `totalCost`, and `callCount` per function name, sorted by `avgCost` descending.
4. THE Dashboard SHALL display a WoW (week-over-week) percentage change metric for total transaction costs, computed as `((currentWeekTotal - previousWeekTotal) / previousWeekTotal) × 100`.
5. THE Dashboard SHALL display a MoM (month-over-month) percentage change metric for total transaction costs, computed as `((currentMonthTotal - previousMonthTotal) / previousMonthTotal) × 100`.
6. WHEN `previousWeekTotal` or `previousMonthTotal` is zero, THE Dashboard SHALL display "N/A" instead of a computed percentage to avoid division-by-zero.
7. THE Dashboard SHALL display an "Optimization Candidates" section listing all functions whose `maxCost / avgCost` ratio exceeds 2.0, indicating high cost variance.
8. WHEN the Dashboard is loading data from the API, THE Dashboard SHALL display a loading skeleton or spinner in place of the chart and table.
9. WHEN the API returns an error or the fetch fails, THE Dashboard SHALL display a user-friendly error message without crashing the page; the loading state SHALL be cleared and replaced by the error message so the user is not left with a perpetual spinner.
10. THE Dashboard SHALL allow the user to select a contract from the list of tracked contracts and switch between `7d` and `30d` range views.
