# Empty States — Copy, CTAs & Illustration Assets

> Closes #969 — retro terminal-style empty state graphics and copywriting for data tables. **Source of truth:**
> `soroscan-frontend/components/ui/empty-state.tsx` (shared shell), consumed by `ContractEmptyState.tsx`,
> `EventTable.tsx`, and `WebhookTable.tsx`.

---

## 1. Shared Shell

All empty states render through the `EmptyState` component: an icon in a pulsing terminal-green ring (`EmptyStateIcon`),
an uppercase title, a muted description, an optional dashed divider, and up to two CTA buttons. `role="status"` +
`aria-live="polite"` announce the state to screen readers when a table transitions to empty (e.g. after a filter clears
the result set).

```
┌───────────────────────────────────┐
│                                    │
│           ⟨ ◎ ICON ⟩              │  ← 80×80 ring, animate-ping halo
│                                    │
│        TITLE (uppercase)          │
│   Description line, 1–2 sentences │
│    - - - - - - - - - - - - - -    │  ← dashed divider (terminal variant only)
│      [ PRIMARY CTA ]  [secondary] │
│         optional footer hint      │
│                                    │
└───────────────────────────────────┘
```

---

## 2. No Contracts

**Component:** `ContractEmptyState.tsx` · **Icon:** `FileCode2`

| Field       | Copy                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Title       | `No contracts found`                                                                              |
| Description | `You haven't registered any Soroban contracts yet. Register a contract to start indexing events.` |
| Primary CTA | `Register Contract` (primary, opens `RegisterModal`)                                              |
| Footer hint | `$ soroscan contracts register --id <CONTRACT_ID>`                                                |

---

## 3. No Events

**Component:** `EventTable.tsx` · Two variants depending on whether filters are active.

### 3a. No events at all (no filters applied)

| Field       | Copy                                                   |
| ----------- | ------------------------------------------------------ |
| Icon        | `Inbox`                                                |
| Title       | `No events found`                                      |
| Description | `Select a contract and adjust filters to view events.` |
| CTA         | `View Contracts` (secondary, links to `/contracts`)    |

### 3b. No events match the current filters

| Field       | Copy                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon        | `Search`                                                                                                                                     |
| Title       | `No events match your criteria`                                                                                                              |
| Description | `We couldn't find any events matching your current search and filter settings. Try adjusting them or clear all filters to see more results.` |
| CTA         | `Clear Filters` (secondary, calls `onClearFilters`)                                                                                          |

---

## 4. No Webhooks

**Component:** `WebhookTable.tsx` · **Icon:** `[ ]` glyph (terminal-style empty bracket)

| Field       | Copy                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| Title       | `No webhooks configured`                                                        |
| Description | `Subscribe an endpoint to start receiving real-time contract event deliveries.` |
| Primary CTA | `New Webhook` (primary, opens `CreateWebhookModal`)                             |

Previously this state had no call-to-action button (`NO_SUBSCRIPTIONS_FOUND` with no way to act from the empty state) —
the `New Webhook` CTA above was added to close that gap.

---

## 5. Call-to-Action Button Copy Guidelines

- Use an **imperative verb phrase**, 1–3 words: `Register Contract`, `New Webhook`, `Clear Filters`, `View Contracts` —
  not generic labels like `OK` or `Submit`.
- Primary CTA = the action that resolves the empty state (create/register something). Secondary CTA = a way out (clear
  filters, navigate elsewhere) when there's nothing to create yet.
- Every CTA button gets an explicit `aria-label` when the visible label alone doesn't convey full context (e.g.
  `"Register your first contract"` vs. the shorter visible `"Register Contract"`).
- Minimum touch target: 44×44px (`min-h-[44px]` on the rendered button/link), consistent with the rest of the terminal
  UI.

---

## 6. Illustration Assets

The icon ring (`EmptyStateIcon`) is the illustration primitive: a `lucide-react` icon (or literal ASCII glyph, as used
for webhooks) centered in an animated terminal-green ring — no bitmap/SVG illustration files are used, keeping empty
states in sync with the rest of the icon system automatically (icon swaps are a one-line change, no asset export step).

```
     .  .  .  .  .  .
   .                    .        ← animate-ping halo, terminal-green/20
  .   ┌──────────────┐    .
 .    │   FileCode2  │     .     ← 80×80px ring, border terminal-green/30
  .   │   (36×36px)  │    .        bg terminal-green/5
   .                    .
     .  .  .  .  .  .
```

Per-table icon reference:

| Table                    | Icon (`lucide-react`) |
| ------------------------ | --------------------- |
| Contracts                | `FileCode2`           |
| Events (no filters)      | `Inbox`               |
| Events (filtered, empty) | `Search`              |
| Webhooks                 | ASCII `[ ]` glyph     |

---

## 7. Figma Component

Out of scope for this pass — no Figma file was produced. The wireframe above and the token references in
`docs/design-specs/color-palette.md` (terminal-green ring / halo colors) are sufficient to reconstruct the component in
Figma as a follow-up.
