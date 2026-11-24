# Webhook Test UI & Request/Response Inspection

This document describes the architecture and capabilities of the Webhook Testing interface in the SoroScan Admin
Dashboard (`admin/app/webhook-tester/`).

## Overview

The Webhook Tester interface provides administrators and developers with real-time tooling to test, inspect, and
troubleshoot webhook endpoints. It supports payload editing, live execution, detailed request/response header
inspection, latency timing breakdowns, and one-click replay.

## Key Capabilities

### 1. Payload Editor & Override

- Pre-populates sample payloads based on selected event types (e.g., token transfer, mint, burn).
- Supports ad-hoc JSON payload modifications prior to dispatch.
- Provides immediate JSON syntax validation before firing HTTP requests.

### 2. Request & Response Inspection

The response viewer provides tabbed inspection:

- **Response Tab**: Displays the HTTP response status code, status text, response headers, and formatted JSON response
  body.
- **Request Tab**: Displays the exact HTTP request headers transmitted (e.g., `Content-Type`, `X-SoroScan-Signature`,
  `X-SoroScan-Event-ID`) and request metadata.

### 3. Timing & Latency Breakdown

The inspection panel surfaces timing metrics:

- **DNS Resolution**: Time to resolve target hostname.
- **TCP Connection**: Time to establish initial socket connection.
- **TLS Handshake**: Time taken to negotiate SSL/TLS encryption.
- **Time to First Byte (TTFB)**: Server processing time before the first byte is returned.
- **Content Download**: Duration to transfer the full HTTP response body.

### 4. One-Click Retry with Same Payload

When testing or debugging intermittent subscriber failures:

- The `retryLastRequest()` function retains the last-sent webhook configuration and payload in state.
- A dedicated **Retry** button is available in the payload editor footer, the response viewer header, and error
  notification banners.
- Clicking Retry re-executes the exact payload without requiring manual re-entry or copy-pasting.

## Component Architecture

The interface is structured in `admin/app/webhook-tester/`:

```text
admin/app/webhook-tester/
├── page.tsx               # Main layout and view coordinator
├── context.tsx            # State provider, request tracking, retry logic
├── types.ts               # Webhook, delivery, and timing interfaces
└── components/
    ├── WebhookSelector.tsx   # Select active webhook endpoint
    ├── PayloadEditor.tsx     # JSON editor with retry trigger
    ├── ResponseViewer.tsx    # Tabbed request/response inspector
    ├── HistoryPanel.tsx      # Past dispatch history log
    └── DeliveryLogList.tsx   # Recent delivery attempts and statuses
```

## Related Documentation

- [Webhook Testing Guide](../cookbook/webhook_testing.md)
- [Webhook Subscriptions Tutorial](../cookbook/webhooks.md)
- [Architecture Overview](../architecture/README.md)
