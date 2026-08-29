# Code Snippets & Templates

A collection of copy-pasteable snippets for interacting with the SoroScan API.

## 1. REST API Client Template (Python)

A reusable Python class for interacting with the REST API.

```python
import requests

class SoroScanClient:
    def __init__(self, base_url="https://api.soroscan.com/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()

    def get_events(self, contract_id=None, limit=100, **kwargs):
        params = {"limit": limit}
        if contract_id:
            params["contract_id"] = contract_id
        params.update(kwargs)
        
        response = self.session.get(f"{self.base_url}/events/", params=params)
        response.raise_for_status()
        return response.json()

    def get_event_by_id(self, event_id):
        response = self.session.get(f"{self.base_url}/events/{event_id}/")
        response.raise_for_status()
        return response.json()

# Usage
# client = SoroScanClient()
# events = client.get_events(contract_id="CC...", limit=10)
```

## 2. GraphQL Query Template (TypeScript)

Using `graphql-request` to fetch specific data points.

```typescript
import { request, gql } from 'graphql-request';

const API_URL = 'https://api.soroscan.com/graphql';

const GET_CONTRACT_EVENTS = gql`
  query GetEvents($contractId: String!, $first: Int!) {
    allEvents(contractId: $contractId, first: $first) {
      edges {
        node {
          id
          topics
          data
          ledger
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function fetchEvents(contractId: string) {
  const variables = { contractId, first: 10 };
  try {
    const data = await request(API_URL, GET_CONTRACT_EVENTS, variables);
    console.log(data.allEvents.edges.map(e => e.node));
  } catch (error) {
    console.error("GraphQL Error:", error);
  }
}
```

## 3. Error Handling Patterns

Robust error handling for REST requests.

```javascript
async function safeFetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After') || 2;
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
}
```

## 4. Pagination Patterns

Handling cursor-based pagination in the REST API.

```python
def fetch_all_pages(start_url):
    results = []
    url = start_url
    
    while url:
        print(f"Fetching {url}...")
        data = requests.get(url).json()
        results.extend(data['results'])
        url = data.get('next') # 'next' will be null on the last page
        
    return results
```

## 5. cURL Command Library

Quick commands for terminal testing.

**Get latest 5 events for a contract:**
```bash
curl -X GET "https://api.soroscan.com/api/v1/events/?contract_id=CC_YOUR_CONTRACT&limit=5" -H "Accept: application/json"
```

**Filter by specific ledger range:**
```bash
curl -X GET "https://api.soroscan.com/api/v1/events/?min_ledger=100000&max_ledger=100500" -H "Accept: application/json"
```

**GraphQL POST via cURL:**
```bash
curl -X POST "https://api.soroscan.com/graphql" \
-H "Content-Type: application/json" \
-d '{"query": "query { allEvents(first: 5) { edges { node { id contractId } } } }"}'
```
