# Soroban Event & Status Icon Set

This directory contains a monochrome SVG icon set for SoroScan contract events, data health indicators, and webhook delivery states.

The set is intentionally small-pixel friendly and terminal-theme compatible:

- `24 × 24` viewBox for consistent geometry.
- `1.75px` rounded strokes that remain legible at `16px` and `24px`.
- `currentColor` strokes so icons inherit SoroScan terminal theme colors.
- No embedded fills, gradients, fonts, or external assets.
- Standalone SVG files plus a single reusable `sprite.svg`.

## Icon inventory

### Contract event types

| File / symbol ID | Intended use |
| --- | --- |
| `event-transfer` | Token or value transfer |
| `event-mint` | Mint / issuance |
| `event-burn` | Burn / destruction |
| `event-approve` | Approval / allowance |
| `event-clawback` | Clawback / reversal |
| `event-set-admin` | Administrative role change |
| `event-set-authorized` | Authorization state change |
| `event-contract-invoke` | Contract function invocation |
| `event-contract-create` | Contract creation / deployment |
| `event-contract-upgrade` | Contract executable upgrade |
| `event-contract` | Generic contract event |
| `event-system` | Host / system event |
| `event-diagnostic` | Diagnostic / debugging event |

### Data health statuses

| File / symbol ID | Intended use |
| --- | --- |
| `health-healthy` | Healthy / available |
| `health-degraded` | Degraded but operational |
| `health-unhealthy` | Unhealthy / unavailable |
| `health-unknown` | Unknown / not yet evaluated |
| `health-syncing` | Catching up / syncing |
| `health-paused` | Monitoring or ingestion paused |

### Delivery states

| File / symbol ID | Intended use |
| --- | --- |
| `delivery-pending` | Queued / waiting |
| `delivery-delivering` | Delivery in progress |
| `delivery-delivered` | Successfully delivered |
| `delivery-retrying` | Retry scheduled / in progress |
| `delivery-failed` | Delivery failed |
| `delivery-dead-letter` | Moved to dead-letter handling |

## Standalone SVG usage

Use the standalone asset when an `<img>` is sufficient:

```html
<img
  src="/docs/design-specs/assets/soroban-event-status-icons/event-transfer.svg"
  width="16"
  height="16"
  alt=""
  aria-hidden="true"
/>
```

The SVG uses `currentColor`. If color inheritance through `<img>` is required, inline the SVG or use the sprite technique below instead.

## Sprite usage

Load an icon from `sprite.svg` with `<use>`:

```html
<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.75"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <use href="/docs/design-specs/assets/soroban-event-status-icons/sprite.svg#event-transfer"></use>
</svg>
```

For a `24px` icon, change only `width` and `height` to `24`.

## React example

```tsx
type SorobanIconProps = {
  id: string;
  size?: 16 | 24;
  className?: string;
  label?: string;
};

export function SorobanIcon({
  id,
  size = 16,
  className,
  label,
}: SorobanIconProps) {
  const labelled = Boolean(label);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={label}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <use
        href={`/docs/design-specs/assets/soroban-event-status-icons/sprite.svg#${id}`}
      />
    </svg>
  );
}
```

## Terminal-theme guidance

Icons are monochrome by design. Assign semantic meaning through the existing SoroScan text/color tokens instead of hard-coding color in the SVG:

- normal event icon: terminal green or inherited foreground;
- informational/system state: terminal cyan;
- degraded/retrying state: warning token;
- unhealthy/failed state: error token;
- disabled/unknown state: muted terminal gray.

Do not add color directly to the source SVG files. This keeps the same assets usable in dark mode, light mode, badges, table rows, and compact terminal views.

See also:

- [`../../color-palette.md`](../../color-palette.md)
- [`../../../architecture/frontend/DASHBOARD_LAYOUT_IA.md`](../../../architecture/frontend/DASHBOARD_LAYOUT_IA.md)

## Sizing and spacing

Use only the supported display sizes unless a component has a documented exception:

| Context | Size |
| --- | ---: |
| dense table row / inline metadata | `16 × 16` |
| buttons / badges / status cards | `16 × 16` |
| navigation or prominent status | `24 × 24` |

Keep at least `4px` between a `16px` icon and adjacent text, and at least `8px` between a `24px` icon and adjacent text.

## Accessibility

- Decorative icons: use `aria-hidden="true"` and do not repeat nearby visible text.
- Meaningful icons without visible text: provide an accessible label on the wrapping `<svg>`.
- Do not communicate health or delivery status by icon shape alone; pair the icon with visible status text where practical.

## Adding a new icon

1. Use the same `24 × 24` viewBox.
2. Use `fill="none"` and `stroke="currentColor"`.
3. Keep the stroke width at `1.75`.
4. Prefer simple geometry that remains recognizable at `16px`.
5. Add the standalone SVG.
6. Add the same paths as a `<symbol>` in `sprite.svg`.
7. Update the inventory in this document.
