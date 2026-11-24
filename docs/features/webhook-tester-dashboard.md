# Webhook Tester & Contract Operations UI Specifications

This document defines the interface design and component hierarchy for the SoroScan Admin Webhook Tester and Contract
Detail surfaces.

## Webhook Tester Dashboard

Located at `admin/app/webhook-tester/`, the webhook testing interface enables interactive inspection and verification of
push notifications.

### Component Structure

- **WebhookSelector**: Dropdown list populated from registered webhook subscriptions. Displays active/paused status
  badges, destination URLs, and subscribed event types.
- **PayloadEditor**: Monaco/Prism JSON editor allowing manual editing of event simulation payloads. Includes quick
  templates for common Soroban events (Transfer, Mint, Custom Event).
- **ResponseViewer**: Two-tab layout showing:
  - _Response_: Status badge (200 OK, 4xx, 5xx), response headers, latency duration, response body.
  - _Request_: Dispatched headers, signature headers, payload size, timestamp.
- **HistoryPanel**: Side drawer showing chronological test executions during the active session.
- **DeliveryLogList**: Tabular display of recent delivery attempts, status indicators (success, failure, pending), and
  retry action triggers.

### State Management

- Controlled via React Context (`admin/app/webhook-tester/context.tsx`).
- Stores current active webhook, edited payload, execution history, and active tab state.
- Exposes `performSend(webhook, payload)` and `retryLastRequest()`.

## Responsive & Theme Conventions

- **Dark Theme Baseline**: Styled using Tailwind CSS dark mode palettes (`bg-zinc-950` surfaces, `zinc-400` neutral
  text).
- **Terminal Aesthetics**: Monospace font integration for headers, hashes, and payload inspectors.
- **Mobile Adaptations**: Single-column vertical stacks on viewports `< 768px`, collapsing sidebars into drawer
  overlays.
- **Accessibility**: ARIA labels on all icon-only buttons, accessible tablist controls, and high-contrast status badges.

## Related Documentation

- [Webhook Test UI Inspection](./webhook-test-inspection.md)
- [Webhook Subscriptions Tutorial](../cookbook/webhooks.md)
- [Frontend UI Design System](../architecture/UI-DESIGN.md)
