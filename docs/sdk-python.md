# Python SDK

The **SoroScan Python SDK** is the official library for integrating SoroScan into your Python applications. It supports both synchronous and asynchronous operations and is fully type-hinted.

## Installation

```bash
pip install soroscan-sdk
```

## Basic Usage

### Synchronous Client

```python
from soroscan import SoroScanClient

client = SoroScanClient(
    base_url="https://api.soroscan.io",
    api_key="your-api-key"
)

# Fetch events for a specific contract
events = client.get_events(
    contract_id="CCAAA...",
    event_type="transfer",
    first=50
)

for event in events.items:
    print(f"Ledger: {event.ledger} | Type: {event.event_type}")
```

### Asynchronous Client

```python
import asyncio
from soroscan import AsyncSoroScanClient

async def main():
    async with AsyncSoroScanClient(base_url="https://api.soroscan.io") as client:
        stats = await client.get_contract_stats("CCAAA...")
        print(f"Total Events: {stats.total_events}")

asyncio.run(main())
```

## Features

- **Type Safety**: Built with Pydantic v2 for robust data validation.
- **Full Coverage**: 100% endpoint coverage for Contracts, Events, and Webhooks.
- **Async Support**: Native support for `httpx` async clients.
- **Context Managers**: Clean resource management for both sync and async clients.

## Error Handling

The SDK raises specific exceptions for different error scenarios:

```python
from soroscan.exceptions import NotFoundError, ValidationError

try:
    client.get_contract("INVALID_ID")
except NotFoundError:
    print("Contract not found!")
except ValidationError as e:
    print(f"Input error: {e}")
```

For more detailed information, see the [official GitHub repository](https://github.com/Harbduls/soroscan/tree/main/sdk/python).

If you want to contribute new methods or releases, see the [SDK Development Guide](./contributing/sdk-development.md).
