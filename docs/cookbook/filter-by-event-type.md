# Filter By Event Type

## Goal

Retrieve all events of a specific type (e.g., `transfer` or `mint`) emitted by a contract.

## Prerequisites

- SoroScan SDK installed
- Contract is registered and active

## Code

```typescript
import { SoroScanClient } from '@soroscan/sdk';

const client = new SoroScanClient({ apiKey: 'your_api_key' });
const events = await client.getEvents({
  contractId: 'CCAAA...',
  eventType: 'transfer',
  first: 50
});
console.log(events.items);
```

## Expected Output

```json
[
  {
    "event_type": "transfer",
    "ledger": 123456,
    "payload": { "from": "GAAA...", "to": "GBBB...", "amount": "100" }
  }
]
```

## Error Handling

If no events match the type, an empty array is returned. If the contract is not found, a `404 Not Found` is thrown.
