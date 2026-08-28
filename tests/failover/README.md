# Failover testing

See [docs/testing/failover.md](../../docs/testing/failover.md) for the full
guide. This directory holds scenario YAML and the live/dry-run harness.

```bash
PYTHONPATH=../.. python -m pytest -q
PYTHONPATH=../.. python run_failover.py
SOROSCAN_FAILOVER_RUN=1 PYTHONPATH=../.. python run_failover.py --execute
```

Never execute against production. `SOROSCAN_FAILOVER_RUN=1` is required for
live probes; production URLs are rejected unless
`ALLOW_PRODUCTION_FAILOVER=true`.
