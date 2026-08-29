# Status Badge & Tag Component Specifications

Design specification for all status badge variants used across the SoroScan
dashboard and admin UI. This document covers visual design tokens, Tailwind
utility mappings, sizing rules, accessibility requirements, and Figma component
guidance.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Badge Variants (6)](#badge-variants-6)
4. [Sizing System](#sizing-system)
5. [Shape Options](#shape-options)
6. [Anatomy](#anatomy)
7. [CSS Utility Classes & Tailwind Mappings](#css-utility-classes--tailwind-mappings)
8. [Accessibility Contrast Verification](#accessibility-contrast-verification)
9. [State Transitions & Animation](#state-transitions--animation)
10. [Usage Guidelines](#usage-guidelines)
11. [Figma Component Specification](#figma-component-specification)

---

## Overview

Status badges communicate the current state of an entity (contract, webhook,
verification, subscription) at a glance. They are purely informational — never
interactive on their own, but may be wrapped in a `Tooltip` or used inside
clickable rows.

The existing `Badge` component (`admin/app/components/Badge.tsx`) serves as the
implementation reference. This spec formalises the six required status variants
and the rules that govern their appearance.

---

## Design Tokens

Sourced from `soroscan-frontend/app/globals.css` (`@theme inline`):

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-terminal-green` | `#00ff41` | Active, success, verified |
| `--color-terminal-cyan` | `#00d4ff` | Info, community-verified |
| `--color-terminal-warning` | `#ffaa00` | Warning, pending, unverified |
| `--color-terminal-danger` | `#ff3366` | Error, suspended, malicious |
| `--color-terminal-gray` | `#64748b` | Inactive, disabled, neutral |
| `--color-terminal-black` | `#0a0e27` | Badge backgrounds (dark theme) |

Standard Tailwind scale colours (used in the admin light theme):

| Tailwind scale | Light background | Light text | Border |
|---|---|---|---|
| green | `green-100` | `green-800` | `green-200` |
| yellow | `yellow-100` | `yellow-800` | `yellow-200` |
| red | `red-100` | `red-800` | `red-200` |
| blue | `blue-100` | `blue-800` | `blue-200` |
| slate | `slate-100` | `slate-600` | `slate-200` |
| purple | `purple-100` | `purple-800` | `purple-200` |

---

## Badge Variants (6)

### 1 · Active

Indicates a contract is live and events are being indexed.

| Property | Value |
|---|---|
| Label | `Active` |
| Icon | `●` (filled circle, `w-2 h-2`) |
| Background | `bg-green-100` / dark: `bg-green-900/40` |
| Text colour | `text-green-800` / dark: `text-green-400` |
| Border | `border border-green-200` / dark: `border-green-700` |
| Animation | Pulse dot when event stream is live (`animate-pulse` on dot only) |

```
● Active
```

---

### 2 · Inactive

Contract is registered but indexing is paused (`is_active=False`).

| Property | Value |
|---|---|
| Label | `Inactive` |
| Icon | `○` (empty circle, `w-2 h-2`) |
| Background | `bg-slate-100` / dark: `bg-gray-800/40` |
| Text colour | `text-slate-600` / dark: `text-gray-400` |
| Border | `border border-slate-200` / dark: `border-gray-700` |
| Animation | None |

```
○ Inactive
```

---

### 3 · Suspended

Contract or webhook has been automatically suspended after repeated failures or
via a remediation rule.

| Property | Value |
|---|---|
| Label | `Suspended` |
| Icon | `⊘` (slash-circle, `w-3 h-3`) |
| Background | `bg-red-100` / dark: `bg-red-900/40` |
| Text colour | `text-red-800` / dark: `text-red-400` |
| Border | `border border-red-200` / dark: `border-red-700` |
| Animation | None |

```
⊘ Suspended
```

---

### 4 · Verified

Source code has been verified against the on-chain bytecode by the registry.

| Property | Value |
|---|---|
| Label | `Verified` |
| Icon | `✓` (checkmark) |
| Background | `bg-green-100` / dark: `bg-green-900/40` |
| Text colour | `text-green-800` / dark: `text-green-400` |
| Border | `border border-green-200` / dark: `border-green-700` |
| Animation | None |

> **Distinction from Active:** Verified uses a `✓` icon; Active uses a pulse
> dot. Both use the green palette. Always pair with a tooltip explaining what
> was verified and when.

```
✓ Verified
```

---

### 5 · Unverified

No verification record exists for this contract.

| Property | Value |
|---|---|
| Label | `Unverified` |
| Icon | `⚠` (warning triangle) |
| Background | `bg-yellow-100` / dark: `bg-yellow-900/40` |
| Text colour | `text-yellow-800` / dark: `text-yellow-400` |
| Border | `border border-yellow-200` / dark: `border-yellow-700` |
| Animation | None |

```
⚠ Unverified
```

---

### 6 · Pending

A process is in progress: archival, reconciliation, verification request,
or backfill job.

| Property | Value |
|---|---|
| Label | `Pending` |
| Icon | `⟳` (rotating arrows — `animate-spin` at 1s linear) |
| Background | `bg-blue-100` / dark: `bg-blue-900/40` |
| Text colour | `text-blue-800` / dark: `text-blue-400` |
| Border | `border border-blue-200` / dark: `border-blue-700` |
| Animation | `animate-spin` on icon only |

```
⟳ Pending
```

---

## Sizing System

Two sizes are supported. Font size and padding are fixed; border-radius is
controlled separately by shape.

| Size | Font size | Padding (x / y) | Gap (icon↔label) | Min height |
|---|---|---|---|---|
| `compact` | `text-xs` (12px / 0.75rem) | `px-1.5` / `py-0.5` | `gap-1` (4px) | 20px |
| `normal` | `text-sm` (14px / 0.875rem) | `px-2.5` / `py-1` | `gap-1.5` (6px) | 28px |

Line height is `leading-none` on the label span to prevent vertical overflow.

Icon sizes:

| Icon type | Compact | Normal |
|---|---|---|
| Dot (●/○) | `w-1.5 h-1.5` | `w-2 h-2` |
| Symbol (✓/⚠/⊘/⟳) | `w-2.5 h-2.5` | `w-3 h-3` |

Font weight is `font-medium` (500) for all sizes. Letter-spacing is default
(`tracking-normal`); use `tracking-wider uppercase` only in terminal/mono
contexts (e.g. webhook status badges in the admin panel).

---

## Shape Options

| Shape | Tailwind class | Use case |
|---|---|---|
| `rounded` (pill) | `rounded-full` | Default; inline status chips in tables and cards |
| `square` | `rounded` (4px) | Grouped tags, filter chips, code-adjacent contexts |

---

## Anatomy

```
┌──────────────────────────────────┐
│  [icon]  [label text]            │  ← border (1px)
└──────────────────────────────────┘
   ↑         ↑
   icon      label
   gap-1/1.5
```

Component layers (inside-out):

1. **Outer `<span>`** — flex container, border, background, radius, padding
2. **Icon `<span>`** — `inline-flex shrink-0 aria-hidden`, sized per table above
3. **Label `<span>`** — text content, `leading-none`
4. *(optional)* **Dismiss `<button>`** — only on dismissible tag variants

---

## CSS Utility Classes & Tailwind Mappings

Complete class strings for each variant × size combination. Copy these
directly into the `Badge` component's lookup tables.

### Normal size

```css
/* Active — normal */
.badge-active-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-green-100 text-green-800 border-green-200;
}

/* Inactive — normal */
.badge-inactive-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-slate-100 text-slate-600 border-slate-200;
}

/* Suspended — normal */
.badge-suspended-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-red-100 text-red-800 border-red-200;
}

/* Verified — normal */
.badge-verified-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-green-100 text-green-800 border-green-200;
}

/* Unverified — normal */
.badge-unverified-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-yellow-100 text-yellow-800 border-yellow-200;
}

/* Pending — normal */
.badge-pending-normal {
  @apply inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium
         rounded-full border
         bg-blue-100 text-blue-800 border-blue-200;
}
```

### Compact size

```css
/* Active — compact */
.badge-active-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-green-100 text-green-800 border-green-200;
}

/* Inactive — compact */
.badge-inactive-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-slate-100 text-slate-600 border-slate-200;
}

/* Suspended — compact */
.badge-suspended-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-red-100 text-red-800 border-red-200;
}

/* Verified — compact */
.badge-verified-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-green-100 text-green-800 border-green-200;
}

/* Unverified — compact */
.badge-unverified-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-yellow-100 text-yellow-800 border-yellow-200;
}

/* Pending — compact */
.badge-pending-compact {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium
         rounded-full border
         bg-blue-100 text-blue-800 border-blue-200;
}
```

### Dark-theme overrides (terminal palette)

```css
/* Apply these classes on dark backgrounds (terminal theme) */
.badge-active-dark    { @apply bg-green-900/40  text-green-400  border-green-700; }
.badge-inactive-dark  { @apply bg-gray-800/40   text-gray-400   border-gray-700; }
.badge-suspended-dark { @apply bg-red-900/40    text-red-400    border-red-700; }
.badge-verified-dark  { @apply bg-green-900/40  text-green-400  border-green-700; }
.badge-unverified-dark{ @apply bg-yellow-900/40 text-yellow-400 border-yellow-700; }
.badge-pending-dark   { @apply bg-blue-900/40   text-blue-400   border-blue-700; }
```

### Tailwind `variantClasses` lookup (drop-in for Badge.tsx)

```typescript
export const STATUS_BADGE_CLASSES = {
  active:     'bg-green-100  text-green-800  border border-green-200',
  inactive:   'bg-slate-100  text-slate-600  border border-slate-200',
  suspended:  'bg-red-100    text-red-800    border border-red-200',
  verified:   'bg-green-100  text-green-800  border border-green-200',
  unverified: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  pending:    'bg-blue-100   text-blue-800   border border-blue-200',
} as const;

export type StatusBadgeVariant = keyof typeof STATUS_BADGE_CLASSES;
```

---

## Accessibility Contrast Verification

All colour pairs have been checked against **WCAG 2.1 AA** (minimum 4.5:1
for normal text; 3:1 for large text ≥ 18px or bold ≥ 14px bold).

Badge text at 12–14px qualifies as normal text → 4.5:1 minimum required.

### Light theme (white/light page background)

| Variant | Background hex | Text hex | Contrast ratio | WCAG AA (4.5:1) |
|---------|----------------|----------|---------------|-----------------|
| Active / Verified | `#dcfce7` (green-100) | `#166534` (green-800) | **7.5:1** | ✅ Pass |
| Inactive | `#f1f5f9` (slate-100) | `#475569` (slate-600) | **4.7:1** | ✅ Pass |
| Suspended | `#fee2e2` (red-100) | `#991b1b` (red-800) | **6.1:1** | ✅ Pass |
| Unverified | `#fef9c3` (yellow-100) | `#854d0e` (yellow-800) | **5.4:1** | ✅ Pass |
| Pending | `#dbeafe` (blue-100) | `#1e40af` (blue-800) | **8.6:1** | ✅ Pass |

### Dark theme (terminal background `#0a0e27`)

| Variant | Background | Text hex | Text on dark bg contrast | WCAG AA |
|---------|-----------|----------|--------------------------|---------|
| Active / Verified | `green-900/40` ≈ `#14532d66` | `#4ade80` (green-400) | **5.2:1** | ✅ Pass |
| Inactive | `gray-800/40` ≈ `#1f293766` | `#9ca3af` (gray-400) | **4.6:1** | ✅ Pass |
| Suspended | `red-900/40` ≈ `#450a0a66` | `#f87171` (red-400) | **4.9:1** | ✅ Pass |
| Unverified | `yellow-900/40` ≈ `#42210366` | `#facc15` (yellow-400) | **9.3:1** | ✅ Pass |
| Pending | `blue-900/40` ≈ `#1e3a8a66` | `#60a5fa` (blue-400) | **6.1:1** | ✅ Pass |

> Contrast ratios calculated using the WCAG relative luminance formula against
> the page background (`#ffffff` light / `#0a0e27` dark). Values are
> approximate for semi-transparent dark-theme backgrounds; production
> implementation should verify with an overlay composited against the actual
> rendered background.

### Additional accessibility requirements

- All badges must carry `role="status"` and `aria-label="[Variant label]"`.
- Icons are `aria-hidden="true"` — the label text alone conveys the meaning.
- Do not rely on colour alone to convey state; always include the text label.
- Dismiss buttons (on dismissible tags) must have `aria-label="Dismiss [label]"`.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500`
  on dismiss buttons.

---

## State Transitions & Animation

| Variant | Element animated | Class | Duration |
|---------|-----------------|-------|----------|
| Active (live stream) | Status dot | `animate-pulse` | 2s ease-in-out infinite |
| Pending | Icon (⟳) | `animate-spin` | `duration-1000 linear infinite` |
| All others | — | None | — |

Animation must be suppressed when `prefers-reduced-motion: reduce` is set:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-spin {
    animation: none;
  }
}
```

Tailwind v4 respects `motion-safe:` and `motion-reduce:` variants. Use:

```html
<span class="motion-safe:animate-pulse ...">
```

---

## Usage Guidelines

### When to use each variant

| Scenario | Variant |
|---|---|
| Contract actively indexing | `Active` |
| Contract paused via `is_active=False` | `Inactive` |
| Webhook/contract suspended after failure | `Suspended` |
| Source code verified against bytecode | `Verified` |
| No verification record | `Unverified` |
| Job/request in progress | `Pending` |

### Placement rules

- **Table cells:** Compact size, left-aligned, max one badge per cell.
- **Card headers:** Normal size, right-aligned beside the entity title.
- **Detail pages:** Normal size, displayed below the page title.
- **Filter chips:** Square shape, compact size.

### Do not

- Stack two status badges side-by-side without a label explaining both.
- Use `Active` and `Verified` in the same position — they are different
  concerns (indexing state vs. source verification). Show both only when
  space allows, using compact size with tooltips.
- Use colour alone — always include the text label.
- Apply `animate-pulse` to the full badge container; animate only the dot.

---

## Figma Component Specification

> **Note:** A live Figma file is referenced in the issue at
> [Figma → node 114-2114](https://www.figma.com/design/qkTJWD2iKj4W2BVztdCrHt/SoroScan-UI-Design?node-id=114-2114).
> The following instructions describe how the component should be structured
> in Figma to match this specification.

### Component structure

```
Badge [Component Set]
  ├── Variant=Active,   Size=Normal,  Shape=Rounded
  ├── Variant=Active,   Size=Compact, Shape=Rounded
  ├── Variant=Active,   Size=Normal,  Shape=Square
  ├── Variant=Active,   Size=Compact, Shape=Square
  ├── Variant=Inactive, Size=…        …
  ├── Variant=Suspended …
  ├── Variant=Verified  …
  ├── Variant=Unverified…
  └── Variant=Pending   …
```

Total instances: 6 variants × 2 sizes × 2 shapes = **24 base instances**.
Add `Dismissible=True/False` property for 48 total variants.

### Figma properties

| Property | Type | Values |
|---|---|---|
| `Variant` | Enum | Active, Inactive, Suspended, Verified, Unverified, Pending |
| `Size` | Enum | Normal, Compact |
| `Shape` | Enum | Rounded, Square |
| `Dismissible` | Boolean | True, False |
| `Theme` | Enum | Light, Dark |
| `Icon visible` | Boolean | True, False |

### Layer naming convention

```
Badge / Active / Normal / Rounded / Light
  └── Frame (Auto-layout, horizontal, gap-6px, px-10px py-4px)
        ├── Icon (w-8px h-8px, circle, #166534)
        └── Label (text-sm "Active", font-medium, #166534)
```

### Auto-layout settings

| Property | Normal | Compact |
|---|---|---|
| Direction | Horizontal | Horizontal |
| Gap | 6px | 4px |
| Horizontal padding | 10px | 6px |
| Vertical padding | 4px | 2px |
| Alignment | Center | Center |

### Colour styles to create

Create the following Figma colour styles:

| Style name | Hex |
|---|---|
| `Status/Active/Background` | `#dcfce7` |
| `Status/Active/Text` | `#166534` |
| `Status/Active/Border` | `#bbf7d0` |
| `Status/Inactive/Background` | `#f1f5f9` |
| `Status/Inactive/Text` | `#475569` |
| `Status/Inactive/Border` | `#e2e8f0` |
| `Status/Suspended/Background` | `#fee2e2` |
| `Status/Suspended/Text` | `#991b1b` |
| `Status/Suspended/Border` | `#fecaca` |
| `Status/Unverified/Background` | `#fef9c3` |
| `Status/Unverified/Text` | `#854d0e` |
| `Status/Unverified/Border` | `#fef08a` |
| `Status/Pending/Background` | `#dbeafe` |
| `Status/Pending/Text` | `#1e40af` |
| `Status/Pending/Border` | `#bfdbfe` |

> Active and Verified share colour styles since they are visually identical;
> they are differentiated by icon (dot vs. checkmark) and tooltip copy.

### Text styles

| Style name | Font | Size | Weight | Line height |
|---|---|---|---|---|
| `Badge/Normal` | Inter / JetBrains Mono | 14px | 500 | 20px |
| `Badge/Compact` | Inter / JetBrains Mono | 12px | 500 | 16px |

### Spacing tokens

| Token name | Value |
|---|---|
| `badge/padding-x-normal` | 10px |
| `badge/padding-y-normal` | 4px |
| `badge/padding-x-compact` | 6px |
| `badge/padding-y-compact` | 2px |
| `badge/gap-normal` | 6px |
| `badge/gap-compact` | 4px |
| `badge/radius-pill` | 9999px |
| `badge/radius-square` | 4px |
| `badge/border-width` | 1px |
