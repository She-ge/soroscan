# Mobile Filter Bar and Search Control Wireframes

**Issue:** #995  
**Design Document Version:** 1.0  
**Last Updated:** 2026-08-28

---

## Overview

This document specifies the UI design for mobile filter drawer and multi-select filter chips for the SoroScan event explorer on mobile devices (375px viewport).

---

## Acceptance Criteria

- [x] Mobile filter drawer wireframe (375px viewport)
- [x] Filter chip active and dismiss states
- [x] Contract select dropdown mobile behavior
- [x] Figma design specs

---

## 1. Mobile Filter Drawer (375px Viewport)

### Layout Structure

```
┌─────────────────────────────────┐
│ ◆ Filters              [×]      │  ← Header with close button
├─────────────────────────────────┤
│                                 │
│ Search Filters                  │
│ > Search contracts...    [⌕]    │
│                                 │
│ ────────────────────────────────│
│                                 │
│ Event Type                      │
│ ◇ All Events                    │  ← Select dropdown
│                                 │
│ ────────────────────────────────│
│                                 │
│ Contract                        │
│ ◇ Select contract...    [⌕]     │  ← Searchable dropdown
│                                 │
│ ────────────────────────────────│
│                                 │
│ Status                          │
│ [ ✓ ] Active                    │
│ [ ✓ ] Inactive                  │
│ [ ✓ ] Archived                  │
│                                 │
│ ────────────────────────────────│
│                                 │
│ Ledger Range                    │
│ From: > [____________]          │
│ To:   > [____________]          │
│                                 │
├─────────────────────────────────┤
│ [> Reset] [> Apply Filters]     │  ← Action buttons
└─────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Viewport Width | 375px |
| Safe Area Padding | 16px |
| Header Height | 48px |
| Section Spacing | 16px |
| Input Height | 44px |
| Button Height | 44px |
| Font (Label) | 12px, 600 weight, sans |
| Font (Input) | 14px, 400 weight, mono |
| Background | #0a0e27 |
| Border Color | #2d3748 |
| Accent Color | #00ff41 |

### Behaviors

- **Overlay**: Semi-transparent backdrop (rgba(0, 0, 0, 0.8)) with swipe-to-close
- **Scroll**: Drawer scrollable when content exceeds viewport
- **Touch**: 44px minimum touch targets for all interactive elements
- **Animation**: Slide up 300ms ease-out on open; slide down 200ms ease-in on close

---

## 2. Filter Chip States

### Active Chip

```
┌──────────────────┐
│ ◆ Contract: ABC  │
└──────────────────┘
```

**Specifications:**
- Background: rgba(0, 255, 65, 0.2)
- Border: 1px solid #00ff41
- Text Color: #00ff41
- Font: 12px, 500 weight
- Padding: 6px 12px
- Border Radius: 4px
- Shadow: 0 0 12px rgba(0, 255, 65, 0.3)

### Inactive Chip

```
┌──────────────────┐
│ Contract: ABC    │
└──────────────────┘
```

**Specifications:**
- Background: transparent
- Border: 1px solid #2d3748
- Text Color: #718096
- Font: 12px, 400 weight
- Padding: 6px 12px
- Border Radius: 4px
- Shadow: none

### Dismiss State (with ×)

```
┌──────────────────────┐
│ ◆ Contract: ABC  [×] │
└──────────────────────┘
```

**Specifications:**
- Same as Active Chip
- Right-aligned × icon (12px, clickable)
- Click action: Remove filter and chip
- Hover: × becomes brighter (#00ff41)

---

## 3. Contract Select Dropdown (Mobile Behavior)

### Collapsed State

```
┌───────────────────────────────────┐
│ ◇ Select contract...      [▼]     │
└───────────────────────────────────┘
```

### Expanded State (Mobile Sheet)

```
┌───────────────────────────────────┐
│ > Search contracts...       [⌕]   │
├───────────────────────────────────┤
│ CC12345678...abcdef               │
│ CC87654321...zyxwvu               │
│ CCAabbccdd...eeff                 │
│ [Scroll for more]                 │
└───────────────────────────────────┘
```

**Specifications:**
- Opens as bottom sheet (not dropdown) on mobile
- Search input at top (always visible)
- Virtual scrolling for 500+ contracts
- Tap to select; selection closes sheet
- Swipe down to dismiss without selection

---

## Design Resources

- **Figma Prototype Link:** [SoroScan UI Design - Mobile Filter Bar](#figma-placeholder)
- **Node ID:** [Filter Bar Mobile Components](#)
- **Last Sync:** 2026-08-28

---

## Implementation Notes

- Use `dialog` ARIA role for accessibility
- Implement `@media (max-width: 640px)` breakpoint
- Focus management: trap focus within drawer
- Keyboard: Esc to close, Tab navigation between controls
- Testing: Verify on iPhone 12 (390px), iPhone SE (375px), Android devices

---

## Approval

- **Design Status:** Pending
- **Figma Review:** [Link to Figma prototype](#figma-placeholder)
- **Developer Handoff:** Ready for implementation
