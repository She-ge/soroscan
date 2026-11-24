# SoroScan SDK Quickstart

Get started with the SoroScan Python SDK in 5 minutes.

## Installation

```bash
pip install soroscan-sdk
```

## 1. Initialize the Client

```python
from soroscan import SoroScanClient

client = SoroScanClient(
    base_url="https://api.soroscan.io",
    api_key="your-api-key"  # Optional
)
```

## 2. Register a Contract

```python
contract = client.create_contract(
    contract_id="CCAAA...",
    name="My Token Contract",
    description="ERC-20 style token on Stellar"
)
print(f"Contract registered with ID: {contract.id}")
```

## 3. Query Events

```python
events = client.get_events(
    contract_id="CCAAA...",
    event_type="transfer",
    ledger_min=100000,
    page_size=50
)

for event in events.results:
    print(f"{event.event_type} at ledger {event.ledger}")
```

## 4. Create a Webhook

```python
webhook = client.create_webhook(
    contract_id=contract.id,
    target_url="https://myapp.com/webhook",
    event_type="transfer"
)
print(f"Webhook created: {webhook.id}")
```

## 5. Get Statistics

```python
stats = client.get_contract_stats(str(contract.id))
print(f"Total events: {stats.total_events}")
print(f"Event types: {stats.unique_event_types}")
```

## Async Usage

```python
import asyncio
from soroscan import AsyncSoroScanClient

async def main():
    async with AsyncSoroScanClient(base_url="https://api.soroscan.io") as client:
        events = await client.get_events(contract_id="CCAAA...", page_size=100)
        print(f"Found {events.count} events")

asyncio.run(main())
```

## Error Handling

```python
from soroscan.exceptions import SoroScanError, SoroScanNotFoundError

try:
    contract = client.get_contract("invalid-id")
except SoroScanNotFoundError:
    print("Contract not found")
except SoroScanError as e:
    print(f"Error: {e}")
```

## Next Steps

- Read the [full documentation](README.md)
- Check out [examples](examples/)
- Explore the [API reference](https://docs.soroscan.io)

## Support

- GitHub: <https://github.com/soroscan/soroscan/issues>
- Email: <team@soroscan.io>
