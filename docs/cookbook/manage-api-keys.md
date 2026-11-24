# Manage API Keys

## Goal

Create, list, and revoke API keys for programmatic access to the SoroScan API.

## Prerequisites

- You must be authenticated as a registered user (via UI or an admin token).

## Code

```python
from soroscan import SoroScanClient

# Assuming an admin client or a UI interface
client = SoroScanClient(api_key='admin_api_key')

# Create a new key
new_key = client.create_api_key(name='Data Pipeline Key')
print(f"New Key (save this!): {new_key['key']}")

# Revoke an old key
client.revoke_api_key(key_id=new_key['id'])
```

## Expected Output

```json
{
  "id": 42,
  "name": "Data Pipeline Key",
  "key": "sk_live_xyz123...",
  "created_at": "2024-05-01T12:00:00Z"
}
```

## Error Handling

Attempting to retrieve the actual key string later is not possible. If you lose the key, you must create a new one.
Ensure you store the key securely upon creation.
