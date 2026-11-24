# Paginate Events

## Goal

Extract large amounts of event data systematically by paginating through historical events using cursors or offsets.

## Prerequisites

- SoroScan SDK installed
- Contract is registered and active

## Code

```python
from soroscan import SoroScanClient

client = SoroScanClient(api_key='your_api_key')
page = 1
all_events = []

while True:
    res = client.search_events(contract_id='CCAAA...', page=page, page_size=100)
    if not res['results']:
        break
    all_events.extend(res['results'])
    page += 1

print(f"Retrieved {len(all_events)} total events.")
```

## Expected Output

```text
Retrieved 342 total events.
```

## Error Handling

Implement rate limit handling. SoroScan enforces rate limits; if you receive a `429 Too Many Requests`, pause the script
using `time.sleep()` before retrying the same page.
