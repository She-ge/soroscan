# Python SDK

The **SoroScan Python SDK** is the official library for integrating SoroScan into your Python applications. It supports
both synchronous and asynchronous operations and is fully type-hinted.

## Installation

```bash
pip install soroscan-sdk
```

This also installs the `soroscan` CLI for querying events, webhooks, and contracts locally.

## CLI

```bash
export SOROSCAN_API_KEY="your-api-key"
export SOROSCAN_BASE_URL="https://api.soroscan.io"

soroscan events --contract ABC123 --event-type transfer --limit 10
soroscan webhooks list
soroscan webhooks test 1
soroscan contracts list --output json
```

Use `--output table` (default) or `--output json`. Point `--base-url` at a local SoroScan instance when developing
against a self-hosted stack.

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

### Fluent Builder Pattern (issue #1281)

Construct complex queries with a chainable, type-hinted builder. Every method returns `Self` for fluency; call `build()`
to inspect params or `execute()` to run.

```python
from soroscan import SoroScanClient

client = SoroScanClient(base_url="https://api.soroscan.io", api_key="...")

# Events — inspect query without network call
query = (SoroScanClient()
    .events()
    .filter_by_contract("ABC123")
    .filter_by_event_type("transfer")
    .paginate(limit=50, offset=0)
    .build())
# {'contract_id': 'ABC123', 'event_type': 'transfer', 'ordering': '-timestamp', 'page': 1, 'page_size': 50}

# Execute with additional filters
events = (client.events()
    .filter_by_contract("ABC123")
    .filter_by_event_type("transfer")
    .filter_by_ledger_range(min=1000, max=2000)
    .order_by("-timestamp")
    .paginate(limit=50, offset=0)
    .execute())

# Contracts
contracts = (client.contracts()
    .filter_by_active(True)
    .search("token")
    .page(1, 20)
    .execute())

# Webhooks
webhooks = (client.webhooks()
    .filter_by_active(True)
    .filter_by_event_type("transfer")
    .paginate(limit=20, offset=0)
    .execute())
```

Async (with `await`):

```python
import asyncio
from soroscan import AsyncSoroScanClient

async def main():
    async with AsyncSoroScanClient(base_url="https://api.soroscan.io") as client:
        events = await (client.events()
            .filter_by_contract("ABC123")
            .filter_by_event_type("transfer")
            .paginate(limit=50, offset=0)
            .execute())

asyncio.run(main())
```

> Builders are unit-tested in `sdk/python/tests/test_builder.py` and verified with `mypy --strict`.

### Tagged Events (SC-24)

SoroScan supports recording and indexing events with up to 4 producer-defined tags. This allows off-chain indexers to
categorize and filter events efficiently:

```python
# Submit a tagged event
response = client.record_tagged_event(
    contract_id="CCAAA...",
    event_type="transfer",
    payload_hash="a" * 64,
    tags=["defi", "token"]
)
print(f"Status: {response.status} | Echoed Tags: {response.tags}")
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

For more detailed information, see the
[official GitHub repository](https://github.com/Harbduls/soroscan/tree/main/sdk/python).

If you want to contribute new methods or releases, see the [SDK Development Guide](./contributing/sdk-development.md)
and the comprehensive [SDK & Library Development Guide](./sdk/sdk-development-guide.md).
