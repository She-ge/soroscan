# SoroScan Webhook Simulator

A standalone webhook simulator for local testing without running the full SoroScan backend.

## Features

- Accept custom event payloads
- Deliver to local webhook endpoints
- Show delivery status, response, and timing
- HMAC signature support (SHA1 or SHA256)
- Pre-built templates for common event types
- Docker support

## Running Locally

### With Node.js

```bash
cd webhook-simulator
npm install
npm start
```

Then open http://localhost:3001 in your browser.

### With Docker Compose

```bash
docker-compose up webhook-simulator
```

## Usage

1. Enter your target webhook URL
2. (Optional) Enter your webhook secret for HMAC signing
3. Select signature algorithm (SHA256 or SHA1)
4. Enter or load a payload
5. Click "Send Webhook"

## Templates

- **Test Event**: Basic test payload
- **Transfer Event**: Simulate a token transfer
- **Mint Event**: Simulate a token mint

## API Endpoint

### POST /api/send-webhook

Send a webhook programmatically.

**Request Body:**
```json
{
  "targetUrl": "https://example.com/webhook",
  "payload": {
    "event_type": "test",
    "payload": { "message": "Hello" },
    "contract_id": "CD6Y4V5B7C6Y4V5B7C6Y4V5B7",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "secret": "your-secret",
  "signatureAlgorithm": "sha256"
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {},
  "body": "response body",
  "time": 123
}
```
