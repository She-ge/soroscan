# Playbook: RPC Endpoint Unavailable

**Alert:** `SoroScanRpcEndpointUnavailable` / remediation condition `rpc_endpoint_unavailable`  
**Severity:** critical  
**SLO impact:** Event ingestion halted

## Detection

- Burst of `IngestError` rows with `error_type=rpc_error`.
- Readiness / health checks failing against `SOROBAN_RPC_URL`.
- Circuit breaker open for Soroban RPC calls.

## Alert → action mapping

| Step | Owner | Action |
|------|-------|--------|
| 1 | Automation | `send_alert` with RPC error counts |
| 2 | Automation (after grace) | `pause_contract` to avoid poison retries |
| 3 | On-call | Verify primary RPC / Horizon endpoints |
| 4 | On-call | Fail over to secondary RPC URL if configured |
| 5 | On-call | Resume contracts and backfill missed ledgers |

## Investigation commands

```bash
curl -sS "$SOROBAN_RPC_URL" -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
curl -H "Authorization: Bearer $TOKEN" \
  "https://api/api/ingest/admin/ingest-errors/?error_type=rpc_error"
```

## Automation

```json
{"type": "rpc_endpoint_unavailable", "window_minutes": 10, "min_errors": 5}
```

Actions: `[{"type": "send_alert"}, {"type": "pause_contract"}]`

## Resolution checklist

- [ ] RPC health restored or failover complete
- [ ] Ingest workers processing again
- [ ] Contracts resumed
- [ ] Missed range backfilled
