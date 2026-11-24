# Monitor Contract Activity

## Goal

Get aggregated statistics about a contract, such as total events, unique event types, and last activity ledger.

## Prerequisites

- The contract must be actively tracked by SoroScan.

## Code

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ apiKey: "your_api_key" });
const stats = await client.getContractStats("CCAAA...");
console.log(`Total Events: ${stats.total_events}, Last Ledger: ${stats.latest_ledger}`);
```

## Expected Output

```json
{
  "total_events": 45000,
  "unique_event_types": 4,
  "latest_ledger": 1234567,
  "last_activity": "2024-05-01T12:00:00Z"
}
```

## Error Handling

If the contract has no events yet, the stats might return `0` for counts and `null` for the latest ledger. Check for
nullability in your app logic.
