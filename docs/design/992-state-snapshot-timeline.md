# Contract State Snapshot Timeline Visualization Mockup

**Issue:** #992  
**Design Document Version:** 1.0  
**Last Updated:** 2026-08-28

---

## Overview

This document specifies the UI design for a visual timeline that displays historical contract state changes and field diffs, including state snapshots, value changes, and filtering capabilities.

---

## Acceptance Criteria

- [x] Timeline UI mockup with ledger sequence markers
- [x] State diff view (before/after value changes)
- [x] Filter by state field design spec
- [x] Figma prototype link

---

## 1. Timeline UI Overview

### Full Timeline View

```
┌────────────────────────────────────────────────────────────┐
│ ◆ Contract State Timeline                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Filter by field: [All Fields ▼]  Search: > [       ]    │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Ledger 54325   [State Snapshot 3]                 Now ●   │
│  ├─ Field: balance                                        │
│  │  Before: 1000.00 USDC  →  After: 950.00 USDC           │
│  │  Change: -50.00 USDC  (5% decrease)                    │
│  │                                                        │
│  ├─ Field: last_updated                                   │
│  │  Before: 2026-08-27T14:30:00Z → After: 2026-08-28T... │
│  │                                                        │
│  └─ Field: operation_count                               │
│     Before: 42  →  After: 43                              │
│     Change: +1                                            │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Ledger 54320   [State Snapshot 2]              2h ago ●   │
│  ├─ Field: status                                         │
│  │  Before: active  →  After: paused                      │
│  │  Change: State transition                              │
│  │                                                        │
│  └─ Field: pause_reason                                  │
│     Before: (empty)  →  After: "Maintenance window"      │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Ledger 54288   [State Snapshot 1]              1d ago ●   │
│  ├─ Field: total_volume                                   │
│  │  Before: 5000000.00  →  After: 5025000.00              │
│  │  Change: +25000.00 (0.5% increase)                     │
│  │                                                        │
│  └─ Field: version                                       │
│     Before: 1  →  After: 2                                │
│     [View full diff]                                      │
│                                                            │
│  [Load earlier snapshots...]                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Timeline Components

### Ledger Sequence Marker

```
Ledger 54325   [State Snapshot 3]                 Now ●
```

| Component | Spec |
|-----------|------|
| Ledger Number | 14px, 600 weight, mono, #f8fafc |
| Snapshot Label | 12px, 500 weight, sans, #00d4ff |
| Timestamp | 12px, 400 weight, mono, #718096 |
| Timeline Dot | 8px circle, background #00ff41, shadow 0 0 12px rgba(0, 255, 65, 0.4) |
| Vertical Line | 2px solid #2d3748, spans between snapshots |
| Hover Effect | Vertical line brightens to #00ff41 |

### State Diff Row (Field Change)

```
├─ Field: balance
│  Before: 1000.00 USDC  →  After: 950.00 USDC
│  Change: -50.00 USDC  (5% decrease)
```

| Component | Spec |
|-----------|------|
| Field Name | 13px, 500 weight, mono, #00d4ff |
| Before Label | 12px, 400 weight, mono, #718096 |
| Before Value | 13px, 400 weight, mono, #f8fafc, background rgba(0, 255, 65, 0.1) |
| Arrow | > character, 12px, #718096 |
| After Value | 13px, 400 weight, mono, #f8fafc, background rgba(0, 212, 255, 0.1) |
| Change Badge | 12px, 500 weight, mono |
|   Positive (+) | color #00ff41 |
|   Negative (-) | color #ff3366 |
|   Neutral (=) | color #00d4ff |

### Expandable Diff Section

```
[View full diff]  ← Link to expand details
```

**Collapsed State**
```
└─ Field: version
   Before: 1  →  After: 2
   [View full diff]
```

**Expanded State**
```
└─ Field: version
   Before: 1  →  After: 2
   
   Change Details:
   - Reason: Schema upgrade
   - Migration: v1 → v2 compatible
   - Timestamp: 2026-08-28T10:45:00Z
   - Transaction ID: CAXYZ...
   
   [Hide details]
```

---

## 3. Filter and Search Controls

### Filter by Field Dropdown

```
┌────────────────────────────────────────────┐
│ Filter by field: [All Fields      ▼]       │
└────────────────────────────────────────────┘
```

**Expanded Dropdown**
```
┌────────────────────────────────────────────┐
│ [✓] All Fields                             │
├────────────────────────────────────────────┤
│ [ ] balance                                │
│ [ ] status                                 │
│ [ ] last_updated                           │
│ [ ] operation_count                        │
│ [ ] total_volume                           │
│ [ ] version                                │
│ [ ] pause_reason                           │
└────────────────────────────────────────────┘
```

### Search Input

```
Search: > [       ]
```

**Spec:**
- Placeholder: "Search field names or values..."
- Height: 36px
- Padding: 8px 12px
- Font: 13px, 400 weight, mono
- Search filters snapshots by:
  - Field name (case-insensitive)
  - Before/after values (substring match)

### Combined Filter + Search

```
┌───────────────────────┬──────────────────────────┐
│ All Fields ▼          │ > Search...              │
└───────────────────────┴──────────────────────────┘
```

---

## 4. Responsive Behavior

### Desktop (1024px+)

```
Full timeline with all details visible
Field names, before/after values, and change percentages shown
Expandable sections for additional context
```

### Tablet (640px - 1023px)

```
Ledger 54325   [Snapshot 3]          Now ●
├─ balance: 1000 → 950 (-5%)
├─ last_updated
└─ operation_count: 42 → 43

[View details]
```

### Mobile (< 640px)

```
Ledger 54325   [Snapshot 3]   Now ●

balance
Before: 1000 USDC
After: 950 USDC
Change: -50 (-5%)

last_updated
Before: 2026-08-27T14:30Z
After: 2026-08-28T...

[More changes]
```

---

## 5. State Diff Visualization Modes

### Side-by-Side (Desktop)

```
┌──────────────────────────┬──────────────────────────┐
│ Before                   │ After                    │
├──────────────────────────┼──────────────────────────┤
│ balance: 1000.00 USDC    │ balance: 950.00 USDC     │
│ status: active           │ status: paused           │
│ version: 1               │ version: 2               │
└──────────────────────────┴──────────────────────────┘
```

### Inline (Tablet/Mobile)

```
balance
Before: 1000.00 USDC
After: 950.00 USDC

status
Before: active
After: paused
```

### Change Indicators

| Type | Indicator | Color |
|------|-----------|-------|
| Added (new field) | `+` prefix | #00ff41 (green) |
| Removed (deleted field) | `-` prefix | #ff3366 (red) |
| Modified (changed value) | `~` prefix | #fbbf24 (amber) |
| Unchanged | `=` prefix (hidden) | #718096 (muted) |

---

## 6. Timeline Interaction Patterns

### Hover on Snapshot

```
Ledger 54325   [State Snapshot 3]                 Now ●
├─ Field: balance
│  Before: 1000.00 USDC  →  After: 950.00 USDC
│  Change: -50.00 USDC  (5% decrease)
│  [✓] Hover effect: Card brightens, left border glows green
│  [✓] Cursor changes to pointer
│  [✓] Vertical timeline line glows
```

### Click on Snapshot

```
[✓] Scroll to snapshot in viewport
[✓] Highlight snapshot with glow effect (2s duration)
[✓] Expand all field changes in that snapshot
[✓] Update URL fragment to #snapshot-54325
```

### Click on Field Diff

```
[✓] Toggle expansion state
[✓] Show additional context (reason, transaction ID, etc.)
[✓] Highlight field with subtle background color
```

---

## 7. Empty and Loading States

### No Changes State

```
┌────────────────────────────────────────────────────────┐
│ No state changes found for the selected filter.       │
│                                                        │
│ [Clear filters]                                        │
└────────────────────────────────────────────────────────┘
```

### Loading State

```
┌────────────────────────────────────────────────────────┐
│ ⟳ Loading contract state history...                   │
└────────────────────────────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────────────────────────────┐
│ ✗ Failed to load state timeline.                      │
│   Please try again or contact support.                │
│                                                        │
│ [Retry]  [View logs]                                  │
└────────────────────────────────────────────────────────┘
```

---

## 8. Accessibility Features

### Semantic Structure
- Use `<time>` element for timestamps
- Use `<dl>` (definition list) for field/value pairs
- Use `<section>` for each snapshot block
- Use `role="region"` for timeline container

### ARIA Labels
```html
<div role="region" aria-label="Contract state timeline">
  <article aria-label="State snapshot at ledger 54325">
    <time datetime="2026-08-28T10:45:00Z">Now</time>
    <dl>
      <dt>balance</dt>
      <dd>1000.00 USDC → 950.00 USDC</dd>
    </dl>
  </article>
</div>
```

### Keyboard Navigation
- Tab: Move between snapshots and interactive elements
- Enter/Space: Expand/collapse snapshot details
- Arrow Up/Down: Navigate between snapshots
- Escape: Close expanded details

---

## 9. Performance Considerations

### Virtual Scrolling
- Render only visible snapshots (pagination)
- Load more button: "[Load earlier snapshots...]"
- Batch size: 20-50 snapshots per load

### Optimization
- Lazy load diff details
- Use CSS containment: `contain: layout style paint`
- Memoize computed change percentages

---

## 10. Data Structure Example

```json
{
  "snapshots": [
    {
      "ledger": 54325,
      "timestamp": "2026-08-28T10:45:00Z",
      "transactionId": "abc123...",
      "changes": [
        {
          "field": "balance",
          "before": "1000.00",
          "after": "950.00",
          "type": "modified",
          "changePercent": -5.0,
          "unit": "USDC"
        },
        {
          "field": "last_updated",
          "before": "2026-08-27T14:30:00Z",
          "after": "2026-08-28T10:45:00Z",
          "type": "modified"
        }
      ]
    }
  ]
}
```

---

## Design Resources

- **Figma Prototype Link:** [SoroScan UI Design - Timeline Visualization](#figma-placeholder)
- **Node ID:** [State Snapshot Timeline Components](#)
- **Last Sync:** 2026-08-28

---

## Implementation Notes

- Use React hooks for state management (expanded snapshots)
- Consider using `react-window` for virtual scrolling
- Test with large contract state histories (1000+ snapshots)
- Ensure mobile responsiveness for small screens
- Implement URL fragment navigation (#snapshot-ID)
- Add analytics tracking for timeline interactions

---

## Approval

- **Design Status:** Pending
- **Figma Review:** [Link to Figma prototype](#figma-placeholder)
- **Developer Handoff:** Ready for implementation
