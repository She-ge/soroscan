# API Overview

SoroScan provides a dual-interface API to interact with indexed Soroban data. You can use our REST API for standard CRUD operations and our GraphQL API for complex, deeply nested queries.

## REST API

The REST API is ideal for simple integrations, managing webhooks, and retrieving specific contract details.

### Base URL
```
https://api.soroscan.io/api/ingest/
```

### Authentication
Most endpoints require an API Key passed in the `Authorization` header:
```
Authorization: Bearer <your-api-key>
```

### Core Resources
- **Contracts**: `/contracts/` — List and manage tracked contracts.
- **Events**: `/events/` — Query contract events with filtering metadata.
- **Webhooks**: `/webhooks/` — Subscribe to real-time event notifications.

---

## GraphQL API

For more advanced use cases, our GraphQL API allows you to fetch exactly the data you need in a single request.

### Endpoint
```
https://api.soroscan.io/graphql/
```

### Sample Query
```graphql
query GetContractWithEvents($id: String!) {
  contract(id: $id) {
    name
    description
    events(first: 10) {
      edges {
        node {
          eventType
          ledger
          txHash
        }
      }
    }
  }
}
```

---

## Status Codes

| Code | Meaning |
|---|---|
| `200` | **Success** — Request completed successfully. |
| `201` | **Created** — Resource successfully created. |
| `400` | **Bad Request** — Validation error or malformed input. |
| `401` | **Unauthorized** — Missing or invalid API key. |
| `404` | **Not Found** — Resource does not exist. |
| `429` | **Too Many Requests** — Rate limit exceeded. |
| `500` | **Server Error** — Internal issue in the SoroScan backend. |

---

## Rate Limiting

By default, the API is limited to:
- **60 requests per minute** for public endpoints.
- **500 requests per minute** for authenticated users.

All throttled endpoints return standard rate-limit headers:

```http
RateLimit-Limit: 500
RateLimit-Remaining: 432
RateLimit-Reset: 1714508459
```

- `RateLimit-Limit`: Total requests allowed in the active window.
- `RateLimit-Remaining`: Requests left in the active window.
- `RateLimit-Reset`: Unix timestamp when the current window resets.

If you need higher limits, please contact us at support@soroscan.io.
