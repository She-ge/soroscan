# Example: Querying Contract Events

This example demonstrates how to use the SoroScan SDKs to query events from a specific smart contract. We'll show how to filter by event type and use pagination to retrieve a large number of events.

## Scenario
We want to find all `transfer` events for a token contract (e.g., `CCAAA...`) that occurred after a specific ledger sequence.

---

### Python Example

```python
from soroscan import SoroScanClient

# Initialize the client
client = SoroScanClient(base_url="https://api.soroscan.io")

# Query events
events = client.get_events(
    contract_id="CCAAA...",
    event_type="transfer",
    ledger_min=100000,
    first=50
)

# Process results
for event in events.items:
    amount = event.data.get("amount")
    from_addr = event.data.get("from")
    to_addr = event.data.get("to")
    print(f"Transfer of {amount} from {from_addr} to {to_addr}")
```

---

### TypeScript Example

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io" });

async function queryTransfers() {
  const result = await client.getEvents({
    contractId: "CCAAA...",
    eventType: "transfer",
    startLedger: 100000,
    first: 50,
  });

  result.items.forEach(event => {
    const { amount, from, to } = event.data as any;
    console.log(`Transfer of ${amount} from ${from} to ${to}`);
  });
}

queryTransfers();
```

---

### Export Events From Django

Self-hosted operators can export indexed events from the backend:

```bash
cd django-backend
python manage.py export_events \
  --contract CCAAA... \
  --format csv \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --output events.csv
```

Supported formats are `csv`, `json`, `parquet`, and `avro`. Use `--contract-id`
instead of `--contract` if you prefer the original option name. Ledger filters
remain available via `--start-ledger` and `--end-ledger`.

---

## Best Practices

1. **Use Cursors**: For large datasets, always use the `after` or `before` parameters instead of just increasing the ledger range.
2. **Filter Early**: Use as many filters as possible (`eventType`, `contractId`) to reduce the amount of data transferred and processed.
3. **Handle Errors**: Always wrap your queries in try-catch blocks to handle potential network issues or rate limits.
4. **Type-Safety**: In TypeScript, use the provided `ContractEvent` type for better IDE support and runtime safety.
