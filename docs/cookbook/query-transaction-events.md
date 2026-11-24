# Query Transaction Events

## Goal

Find all events or invocations initiated by a specific Stellar account (caller/sender).

## Prerequisites

- SoroScan SDK installed
- The caller's public key (starting with `G`)

## Code

```python
from soroscan import SoroScanClient

client = SoroScanClient(api_key='your_api_key')
invocations = client.get_invocations(
    caller='GAAA...',
    include_events=True
)
print(f"Found {len(invocations)} invocations.")
```

## Expected Output

```json
[
  {
    "caller": "GAAA...",
    "function_name": "swap",
    "ledger_sequence": 123456
  }
]
```

## Error Handling

Malformed caller addresses will result in a validation error (`400 Bad Request`). Use `try-except` to catch `ValidationError`.
