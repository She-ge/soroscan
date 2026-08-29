# Python SDK

The SoroScan Python SDK provides a convenient interface for querying events, managing contracts, and configuring webhooks.

## Installation

```bash
pip install soroscan
```

## Authentication

```python
from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_your_key_here")
```

## Listing Events

```python
from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

# Fetch events for a specific contract
events = await client.events.list(
    contract_id="CABC...9X4Z",
    limit=50
)

for event in events:
    print(f"Ledger {event.ledger}: {event.event_type}")
    print(f"  Data: {event.data}")
```

## Filtering Events

```python
from soroscan import SoroScanClient, EventFilter
from datetime import datetime, timedelta

client = SoroScanClient(api_key="sk_live_...")

events = await client.events.list(
    contract_id="CABC...9X4Z",
    filter=EventFilter(
        event_type="SWAP_COMPLETE",
        since=datetime.utcnow() - timedelta(hours=24),
        min_ledger=12000000
    ),
    limit=100
)
```

## Registering a Contract

```python
contract = await client.contracts.create(
    contract_id="CABC...9X4Z",
    label="my-amm-contract"
)
print(f"Registered: {contract.id}")
```

## Managing Webhooks

```python
# Create webhook subscription
webhook = await client.webhooks.create(
    url="https://your-app.com/webhook",
    event_type="SWAP_COMPLETE",
    contract_id="CABC...9X4Z",
    secret="your-hmac-secret"
)
print(f"Webhook ID: {webhook.id}")

# List webhooks
webhooks = await client.webhooks.list()

# Delete a webhook
await client.webhooks.delete(webhook_id="wh_abc123")
```

## GraphQL Queries

```python
result = await client.graphql.query("""
    query GetRecentEvents {
        events(contractId: "CABC...9X4Z", first: 10) {
            edges {
                node {
                    id
                    eventType
                    data
                    createdAt
                }
            }
        }
    }
""")
```

## Async Support

The SDK is fully async-compatible:

```python
import asyncio
from soroscan import SoroScanClient

async def main():
    client = SoroScanClient(api_key="sk_live_...")
    events = await client.events.list(contract_id="CABC...9X4Z", limit=10)
    for event in events:
        print(event)

asyncio.run(main())
```

## Error Handling

```python
from soroscan import SoroScanClient
from soroscan.exceptions import AuthenticationError, RateLimitError, NotFoundError

client = SoroScanClient(api_key="sk_live_...")

try:
    events = await client.events.list(contract_id="INVALID")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except NotFoundError:
    print("Contract not found")
```

## Configuration

```python
from soroscan import SoroScanClient, SoroScanConfig

config = SoroScanConfig(
    base_url="https://soroscan.io",  # Default
    timeout=30,                        # Request timeout in seconds
    max_retries=3,                     # Auto-retry on network errors
    retry_delay=1.0,                   # Base delay between retries
)

client = SoroScanClient(api_key="sk_live_...", config=config)
```
