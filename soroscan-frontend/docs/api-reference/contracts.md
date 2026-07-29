# Contracts API Reference

## Endpoints

### List Contracts

```
GET /api/contracts/
```

Returns all contracts registered for indexing.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of results (default: 20, max: 100) |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "count": 42,
  "next": "/api/contracts/?offset=20",
  "previous": null,
  "results": [
    {
      "id": "1",
      "contract_id": "CABC...9X4Z",
      "label": "my-amm",
      "created_at": "2024-01-15T10:00:00Z",
      "event_count": 15234
    }
  ]
}
```

### Register Contract

```
POST /api/contracts/
```

Register a new contract for event indexing.

**Request Body:**
```json
{
  "contract_id": "CABC...9X4Z",
  "label": "my-amm"
}
```

**Response (201):**
```json
{
  "id": "1",
  "contract_id": "CABC...9X4Z",
  "label": "my-amm",
  "created_at": "2024-01-15T10:00:00Z",
  "event_count": 0
}
```

### Get Contract

```
GET /api/contracts/{id}/
```

**Response:**
```json
{
  "id": "1",
  "contract_id": "CABC...9X4Z",
  "label": "my-amm",
  "created_at": "2024-01-15T10:00:00Z",
  "event_count": 15234,
  "last_event_at": "2024-01-15T11:30:00Z"
}
```

### Update Contract

```
PATCH /api/contracts/{id}/
```

**Request Body (partial):**
```json
{
  "label": "new-label"
}
```

### Delete Contract

```
DELETE /api/contracts/{id}/
```

Returns `204 No Content` on success.

## GraphQL

```graphql
query ListContracts {
  contracts {
    id
    name
    address
    riskScore
    vulnerabilities {
      severity
      title
    }
  }
}
```

## Code Examples

### Python

```python
client = SoroScanClient(api_key="sk_live_...")

# List contracts
contracts = await client.contracts.list(limit=20)

# Register
contract = await client.contracts.create(
    contract_id="CABC...9X4Z",
    label="my-amm"
)

# Delete
await client.contracts.delete(contract_id=contract.id)
```

### TypeScript

```typescript
const client = new SoroScanClient({ apiKey: "sk_live_..." })

// List contracts
const { contracts } = await client.contracts.list({ limit: 20 })

// Register
const contract = await client.contracts.create({
  contractId: "CABC...9X4Z",
  label: "my-amm"
})

// Delete
await client.contracts.delete({ contractId: contract.id })
```

### Go

```go
contracts, err := client.Contracts.List(ctx, &soroscan.ContractListOptions{
    Limit: 20,
})

contract, err := client.Contracts.Create(ctx, &soroscan.ContractCreateInput{
    ContractID: "CABC...9X4Z",
    Label:      "my-amm",
})

err = client.Contracts.Delete(ctx, contract.ID)
```
