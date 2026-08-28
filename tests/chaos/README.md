# Chaos tests

See [docs/testing/chaos-engineering.md](../../docs/testing/chaos-engineering.md).

```bash
PYTHONPATH=../.. python -m pytest -q
PYTHONPATH=../.. python run_chaos.py
```

Live execution is destructive. Requires `SOROSCAN_CHAOS_RUN=1` and a
non-production environment. Default namespace is `chaos-testing`.
