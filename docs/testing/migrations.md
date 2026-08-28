# Database migration rollback testing

The ingest app is the only local Django app with project migrations. The
harness discovers every ingest migration from the Django graph rather than
hard-coding a subset.

Tests live in `django-backend/soroscan/ingest/tests/test_migration_rollbacks.py`
and are marked `@pytest.mark.migration`.

## What is verified

- Fresh database: all ingest migrations apply and schema matches model state.
- Each non-empty migration: migrate to dependencies → seed representative
  `TrackedContract` / `ContractEvent` rows → migrate forward → assert schema
  and data → migrate backward → assert surviving data → migrate forward again.
- Empty merge migrations are no-ops and are skipped for rollback cycles.
- Operations with `reversible=False` raise `IrreversibleError`. Those are
  skipped as rollback tests and must be listed by
  `test_irreversible_migrations_are_explicitly_identified`. The expected set
  is currently empty; a new irreversible migration fails CI until it is
  reviewed in this document.

Production and developer databases are never used. Django's test database
(created from `DATABASE_URL` / `settings_test`) is the only target.

## Run locally

```bash
cd django-backend
# Isolated disposable test DB (pytest-django)
python -m pytest -m migration -v

# Graph consistency (no rollback)
python -m pytest soroscan/ingest/tests/test_migration_graph.py -v

# Management command: migrate a throwaway DB
python manage.py validate_migrations
```

## Authoring conventions

1. Name files `NNNN_short_name.py` with a single leaf (`test_migration_graph.py`
   enforces this).
2. Prefer additive schema changes. Provide a reverse for `RunPython` /
   `RunSQL`.
3. If a change cannot be reversed, say so in the migration docstring and
   update `test_irreversible_migrations_are_explicitly_identified` plus this
   page after review.
4. Do not edit historical migrations to make rollback tests pass.
5. Seed data in tests must use historical model state (`state.apps.get_model`).

## Add a rollback case

Most new migrations are picked up automatically by
`_ordered_ingest_migrations()`. If you introduce a new model that should be
seeded across the boundary, extend `_seed_historical_data`.

## CI

`django-tests.yml` job `migration-rollbacks` runs `pytest -m migration` against
Postgres 16/15 and Redis. The main Django job still runs the full suite so
coverage is not weakened.

## Interpreting failures

- `IrreversibleError`: document the migration; do not invent a fake reverse.
- Schema mismatch: a column/table expected by the historical state is missing.
- IntegrityError on seed: a new NOT NULL column needs a default or seed update.
