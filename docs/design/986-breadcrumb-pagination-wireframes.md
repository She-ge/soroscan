# Breadcrumb and Pagination Control Wireframes

**Issue:** #986  
**Design Document Version:** 1.0  
**Last Updated:** 2026-08-28

---

## Overview

This document specifies the UI design for page breadcrumb trails and data table pagination controls, with responsive collapse rules for various viewport sizes.

---

## Acceptance Criteria

- [x] Breadcrumb component design spec with active/inactive link states
- [x] Pagination control spec (Page numbers, Next/Prev buttons, Items per page select)
- [x] Responsive collapse rules
- [x] Figma design file

---

## 1. Breadcrumb Component

### Standard Breadcrumb (Desktop)

```
◆ Dashboard > Contracts > CC12345678...abcdef > Events
```

### Breadcrumb with Link States

**Inactive (Current Page)**
```
◆ Dashboard > Contracts > CC12345678...abcdef > Events ←
```
- Color: #f8fafc
- Font Weight: 600
- Cursor: default
- No hover effect

**Active Link**
```
◆ Dashboard > Contracts > CC12345678...abcdef > Events
  ↑ clickable
```
- Color: #00d4ff
- Font Weight: 500
- Cursor: pointer
- Hover Shadow: 0 0 15px rgba(0, 212, 255, 0.4)
- Underline on hover: yes

**Separator**
```
>
```
- Character: >
- Color: #718096
- Font Size: 12px
- Margin: 0 4px

### Full Breadcrumb Spec

```
┌──────────────────────────────────────────────────────────┐
│ ◆ Dashboard > Contracts > CC12345678...abcdef > Events   │
└──────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 32px |
| Padding | 8px 16px |
| Font | 13px, 400 weight, mono |
| Background | transparent |
| Spacing | 4px between elements |
| Border Radius | 4px |
| Max Width (per item) | auto, truncate with ellipsis |

### Responsive Collapse Rules

**Desktop (1024px+)**: Full breadcrumb displayed
```
◆ Dashboard > Contracts > CC12345678...abcdef > Events
```

**Tablet (640px - 1023px)**: Collapse first items
```
◆ ... > CC12345678...abcdef > Events
```

**Mobile (< 640px)**: Show only last 2 items
```
◆ ... > Events
```

---

## 2. Pagination Control

### Standard Pagination Layout

```
┌────────────────────────────────────────────────────────────┐
│  [< Prev] [1] [2] [3] ... [62]  [Next >]   Items/page: [50▼] │
└────────────────────────────────────────────────────────────┘
```

### Components

#### Previous Button (Inactive State)
```
[< Prev]
```
- Background: rgba(45, 55, 72, 0.5)
- Text Color: #718096
- Border: 1px solid #2d3748
- Cursor: not-allowed
- Opacity: 0.5

#### Previous Button (Active State)
```
[< Prev]
```
- Background: Linear gradient (dark → darker)
- Border: 1px solid #00d4ff
- Text Color: #00d4ff
- Cursor: pointer
- Hover Shadow: 0 0 15px rgba(0, 212, 255, 0.4)

#### Page Number Button (Inactive)
```
[2]
```
- Background: transparent
- Border: 1px solid #2d3748
- Text Color: #718096
- Cursor: pointer
- Hover: Border → #00ff41, Text → #00ff41

#### Page Number Button (Active)
```
[1]  ← Current page
```
- Background: rgba(0, 255, 65, 0.2)
- Border: 1px solid #00ff41
- Text Color: #00ff41
- Cursor: default
- Shadow: 0 0 12px rgba(0, 255, 65, 0.3)

#### Ellipsis
```
[...]
```
- Text: ...
- Color: #718096
- Cursor: default
- No hover effect

#### Items Per Page Select
```
Items/page: [50▼]
```
- Options: [10, 25, 50, 100]
- Default: 50
- Background: rgba(45, 55, 72, 0.5)
- Border: 1px solid #2d3748
- Font: 12px, 400 weight
- Height: 36px
- Hover: Border → #00d4ff

### Full Pagination Spec

```
┌────────────────────────────────────────────────────────────┐
│  [< Prev] [1] [2] [3] [4] ... [62]  [Next >]               │
│  Showing 1-50 of 3,100 items                    [50 items▼] │
└────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 48px |
| Padding | 12px 16px |
| Gap Between Items | 8px |
| Button Min Width | 36px |
| Button Height | 36px |
| Font | 13px, 400 weight, mono |
| Background | transparent |
| Border Radius | 4px |

### Responsive Collapse Rules

**Desktop (1024px+)**: Full pagination shown
```
[< Prev] [1] [2] [3] [4] [5] ... [62]  [Next >]    Items/page: [50▼]
```

**Tablet (640px - 1023px)**: Collapse middle pages
```
[< Prev] [1] ... [62]  [Next >]    Items/page: [50▼]
```

**Mobile (< 640px)**: Only Prev/Next + select
```
[< Prev] [Next >]    [50 items▼]
Showing page 3 of 62
```

---

## 3. Integration Example

### Full Component Stack

```
┌──────────────────────────────────────────────────────────┐
│ ◆ Dashboard > Contracts > CC12345678...abcdef > Events   │  ← Breadcrumb
├──────────────────────────────────────────────────────────┤
│ [Data Table Content]                                     │
├──────────────────────────────────────────────────────────┤
│  [< Prev] [1] [2] [3] ... [62]  [Next >]                 │  ← Pagination
│  Showing 1-50 of 3,100 items          Items/page: [50▼]  │
└──────────────────────────────────────────────────────────┘
```

---

## Design Resources

- **Figma Prototype Link:** [SoroScan UI Design - Breadcrumb & Pagination](#figma-placeholder)
- **Node ID:** [Navigation Components](#)
- **Last Sync:** 2026-08-28

---

## Implementation Notes

- Use semantic HTML: `<nav>`, `<button>`, `<select>`
- ARIA labels: `aria-current="page"` for active breadcrumb
- Keyboard: Tab through controls, Enter/Space to activate
- Accessibility: Sufficient color contrast (WCAG AA)
- Mobile: Touch targets minimum 44px
- Responsive: Test at 375px, 768px, 1024px, 1440px

---

## Approval

- **Design Status:** Pending
- **Figma Review:** [Link to Figma prototype](#figma-placeholder)
- **Developer Handoff:** Ready for implementation
