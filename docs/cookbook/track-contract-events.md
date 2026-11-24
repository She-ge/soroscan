# Track Contract Events

## Goal

Register a Soroban smart contract with SoroScan to begin indexing its events automatically and tracking them.

## Prerequisites

- SoroScan SDK installed
- A valid SoroScan API key
- A valid Soroban contract ID (starting with `C`)

## Code

```python
from soroscan import SoroScanClient

client = SoroScanClient(api_key='your_api_key')
contract = client.register_contract(
    contract_id='CCAAA...',
    name='MyToken',
    alias='my-token-1'
)
print(f'Tracking {contract.name}...')
```

## Expected Output

```json
{
  "id": 1,
  "contract_id": "CCAAA...",
  "name": "MyToken",
  "is_active": true
}
```

## Error Handling

If the `contract_id` is invalid or already registered, the API will return a `400 Bad Request`. Handle this using a
`try-except` block or by checking the response status.
