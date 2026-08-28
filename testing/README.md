# Shared reliability helpers

Python helpers used by `tests/failover`, `tests/chaos`, and documentation
examples. They are not a Django app.

```bash
python -m pytest -q testing/tests
```

Modules:

- `testing.reliability.safety` — production URL/environment/namespace guards
- `testing.reliability.wait` — bounded polling
- `testing.reliability.health` — HTTP probe helpers
- `testing.reliability.inject` — Docker/Compose failure injection
