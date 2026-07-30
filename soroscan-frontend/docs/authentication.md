# Authentication

SoroScan uses JWT (JSON Web Token) based authentication. All API endpoints require a valid Bearer token.

## Obtaining Tokens

POST to `/api/auth/token/` with your credentials:

```bash
curl -X POST https://soroscan.io/api/auth/token/ \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "secret"}'
```

Response:
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

- **Access token**: Short-lived (15 minutes). Use this in all API requests.
- **Refresh token**: Long-lived (7 days). Use to get new access tokens.

## Using the Token

Include the access token in the `Authorization` header:

```bash
curl https://soroscan.io/api/events/ \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

## Refreshing Tokens

When your access token expires, use the refresh token to get a new one:

```bash
curl -X POST https://soroscan.io/api/auth/token/refresh/ \
  -H 'Content-Type: application/json' \
  -d '{"refresh": "YOUR_REFRESH_TOKEN"}'
```

## Token Generation via SDK

### Python

```python
from soroscan import SoroScanClient

# Authenticate once
client = SoroScanClient.from_credentials(
    email="user@example.com",
    password="secret"
)
# Tokens are automatically managed and refreshed
```

### TypeScript / JavaScript

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({
  email: "user@example.com",
  password: "secret",
  // SDK handles token refresh automatically
})
```

## Error Responses

| Status | Meaning |
|--------|---------|
| `401 Unauthorized` | Missing or expired token |
| `403 Forbidden` | Valid token but insufficient permissions |

```json
{
  "detail": "Authentication credentials were not provided."
}
```

## Rate Limits

Authenticated requests are rate-limited per API key:

- **Free tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

Rate limit headers are included in every response:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1706745600
```
