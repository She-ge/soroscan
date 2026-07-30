# SoroScan — Typography Hierarchy

> **Source of truth:** `soroscan-frontend/app/globals.css` (`@theme inline` and `:root` blocks)  
> **Font loading:** `soroscan-frontend/app/layout.tsx` via `next/font/google`

---

## 1. Font Families

### Primary — Monospace (Terminal)

| Token                  | CSS variable              | Font stack                                                                      |
|------------------------|---------------------------|---------------------------------------------------------------------------------|
| `font-terminal-mono`   | `--font-terminal-mono`    | `"JetBrains Mono"`, `"IBM Plex Mono"`, `monospace`                             |

- **Role:** All headings, labels, navigation, code, badges, status indicators, button text
- **Loading:** `JetBrains Mono` loaded via `next/font/google` (variable font)
- **Fallback chain:** IBM Plex Mono → system monospace (Consolas, Monaco, Courier New)

### Secondary — Sans-Serif (Prose)

| Token                  | CSS variable              | Font stack                                                          |
|------------------------|---------------------------|---------------------------------------------------------------------|
| `font-terminal-sans`   | `--font-terminal-sans`    | `"IBM Plex Sans"`, `"Source Sans 3"`, `system-ui`, `sans-serif`    |

- **Role:** Long-form body copy, descriptions, documentation prose
- **Loading:** `Inter` loaded via `next/font/google` (variable font, used in admin)
- **Note:** The mono stack dominates the UI; sans is used sparingly for markdown/docs

---

## 2. Type Scale

All values defined as CSS custom properties in `:root`.

| Level     | Token                   | Size        | Weight | Line Height | Font family   | Tailwind equivalent       |
|-----------|-------------------------|-------------|--------|-------------|---------------|---------------------------|
| H1        | `--type-h1-size`        | `2rem` (32px)   | 600    | 1.25        | terminal-mono | `text-3xl font-semibold`  |
| H2        | `--type-h2-size`        | `1.5rem` (24px) | 600    | 1.3         | terminal-mono | `text-2xl font-semibold`  |
| H3        | `--type-h3-size`        | `1.125rem` (18px)| 600   | 1.35        | terminal-mono | `text-lg font-semibold`   |
| Body      | `--type-body-size`      | `0.875rem` (14px)| 400   | 1.55        | terminal-mono | `text-sm`                 |
| Caption   | `--type-caption-size`   | `0.75rem` (12px) | 400   | 1.4         | terminal-mono | `text-xs`                 |

### Additional in-component sizes

| Context                  | Size             | Weight | Letter spacing | Transform  | Component             |
|--------------------------|------------------|--------|----------------|------------|-----------------------|
| Panel title / label      | `0.75rem` (12px) | 700    | `0.1em` (wide) | uppercase  | `DashboardPanel`      |
| Nav link                 | `0.875rem` (14px)| 500    | normal         | —          | `AppShell`            |
| Header nav link          | `0.75rem` (12px) | 400    | `0.05em`       | uppercase  | `AppShell`            |
| Badge text (sm)          | `0.75rem` (12px) | 600    | `0.05em`       | uppercase  | `Badge`               |
| Badge text (md/lg)       | `0.75rem` (12px) | 600    | `0.05em`       | uppercase  | `Badge`               |
| Button (default)         | `0.875rem` (14px)| 500    | normal         | —          | `Button`              |
| Status indicator         | `0.75rem` (12px) | 400    | `0.05em` wider | uppercase  | `StatusIndicator`     |
| Code body                | `0.8rem` (12.8px)| 400    | normal         | —          | `CodeBlock`           |
| Code body (mobile)       | `0.72rem` (11.5px)| 400   | normal         | —          | `CodeBlock` < 640px   |
| Code header label        | `0.625rem` (10px)| 400    | `0.12em`       | uppercase  | `CodeBlock`           |

---

## 3. Type Hierarchy Visual Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│  H1  — JetBrains Mono  32px / 600 / lh 1.25                        │
│  ◆ SoroScan Event Indexer                                           │
│─────────────────────────────────────────────────────────────────────│
│  H2  — JetBrains Mono  24px / 600 / lh 1.3                         │
│  Contract Events                                                    │
│─────────────────────────────────────────────────────────────────────│
│  H3  — JetBrains Mono  18px / 600 / lh 1.35                        │
│  Live Stream                                                        │
│─────────────────────────────────────────────────────────────────────│
│  PANEL LABEL — 12px / 700 / tracking-widest / uppercase             │
│  EVENT RECORDS                                                      │
│─────────────────────────────────────────────────────────────────────│
│  Body — JetBrains Mono  14px / 400 / lh 1.55                       │
│  Indexed Soroban smart contract events with real-time streaming.    │
│─────────────────────────────────────────────────────────────────────│
│  Caption — JetBrains Mono  12px / 400 / lh 1.4                     │
│  Last updated 2 minutes ago                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Text Color Pairings

| Role                  | Color token          | Hex       | Background        | Contrast |
|-----------------------|----------------------|-----------|-------------------|----------|
| Primary heading       | `terminal-green`     | `#00ff41` | `terminal-black`  | 15.3:1   |
| Secondary heading     | `terminal-cyan`      | `#00d4ff` | `terminal-black`  | 12.4:1   |
| Panel title           | `terminal-green`     | `#00ff41` | `terminal-black`  | 15.3:1   |
| Body copy             | `terminal-light`     | `#e2e8f0` | `terminal-black`  | 14.7:1   |
| Muted / secondary     | `terminal-gray`      | `#94a3b8` | `terminal-black`  | 7.41:1   |
| Error text            | `terminal-danger`    | `#ff3366` | `terminal-black`  | 5.2:1    |
| Warning text          | `terminal-warning`   | `#ffaa00` | `terminal-black`  | 9.8:1    |
| Nav active            | `terminal-green`     | `#00ff41` | `terminal-green/10`| —       |
| Nav inactive          | `terminal-gray`      | `#94a3b8` | transparent       | 7.41:1   |
| Code body text        | `#b8c5d6`            | `#b8c5d6` | `#050810`         | ~8:1     |
| Code header label     | `#7ba8b5`            | `#7ba8b5` | `#0d1120`         | ~4.5:1   |

---

## 5. Text Style Definitions (Figma Setup)

Create these as **Text Styles** in Figma. Naming convention: `Scale/Role`.

### Heading Styles

```
Heading/H1
  Font:        JetBrains Mono
  Size:        32
  Weight:      SemiBold (600)
  Line height: 40 (1.25 × 32)
  Color:       #00ff41  (terminal-green)

Heading/H2
  Font:        JetBrains Mono
  Size:        24
  Weight:      SemiBold (600)
  Line height: 31.2 (1.3 × 24)
  Color:       #00ff41

Heading/H3
  Font:        JetBrains Mono
  Size:        18
  Weight:      SemiBold (600)
  Line height: 24.3 (1.35 × 18)
  Color:       #e2e8f0
```

### Label Styles

```
Label/Panel-Title
  Font:         JetBrains Mono
  Size:         12
  Weight:       Bold (700)
  Letter spacing: 10% (1.2px)
  Transform:    UPPERCASE
  Color:        #00ff41

Label/Nav-Link
  Font:         JetBrains Mono
  Size:         14
  Weight:       Medium (500)
  Color:        #94a3b8  (inactive) / #00ff41 (active)

Label/Nav-Header
  Font:         JetBrains Mono
  Size:         12
  Weight:       Regular (400)
  Letter spacing: 5%
  Transform:    UPPERCASE
  Color:        #94a3b8  (inactive) / #00ff41 (active)

Label/Badge
  Font:         JetBrains Mono
  Size:         12
  Weight:       SemiBold (600)
  Letter spacing: 5%
  Transform:    UPPERCASE

Label/Status
  Font:         JetBrains Mono
  Size:         12
  Weight:       Regular (400)
  Letter spacing: wider (tracking-wider ≈ 5%)
  Transform:    UPPERCASE
```

### Body Styles

```
Body/Default
  Font:         JetBrains Mono
  Size:         14
  Weight:       Regular (400)
  Line height:  21.7 (1.55 × 14)
  Color:        #e2e8f0

Body/Muted
  Font:         JetBrains Mono
  Size:         14
  Weight:       Regular (400)
  Line height:  21.7
  Color:        #94a3b8

Body/Small
  Font:         JetBrains Mono
  Size:         12
  Weight:       Regular (400)
  Line height:  16.8 (1.4 × 12)
  Color:        #e2e8f0
```

### Code Styles

```
Code/Body
  Font:         JetBrains Mono
  Size:         12.8  (0.8rem)
  Weight:       Regular (400)
  Line height:  21.8 (1.7 × 12.8)
  Color:        #b8c5d6

Code/Body-Mobile
  Font:         JetBrains Mono
  Size:         11.5  (0.72rem)
  Weight:       Regular (400)
  Line height:  19.6

Code/Header-Label
  Font:         JetBrains Mono
  Size:         10
  Weight:       Regular (400)
  Letter spacing: 12%
  Transform:    UPPERCASE
  Color:        #7ba8b5
```

### Button Styles

```
Button/Default
  Font:         JetBrains Mono
  Size:         14
  Weight:       Medium (500)
  Color:        (varies by variant)

Button/Small
  Font:         JetBrains Mono
  Size:         12
  Weight:       Medium (500)
```

---

## 6. Line Length Guidelines

| Context              | Max width       | Rationale                              |
|----------------------|-----------------|----------------------------------------|
| Body prose           | 65–75 characters | Optimal readability range             |
| Panel description    | 60ch            | Constrained by panel width            |
| Modal body           | `max-w-lg` (512px) | Set by ModalContent component       |
| Code block           | No limit (scroll) | Horizontal scroll enabled           |
| Alert description    | Full width      | Alerts span full container width      |

---

## 7. Responsive Font Adjustments

| Breakpoint     | Context          | Adjustment                     |
|----------------|------------------|--------------------------------|
| `< 640px`      | Code body        | 12.8px → 11.5px (0.72rem)      |
| `< 640px`      | Code padding     | 1rem → 0.75rem                 |
| All sizes      | Button height    | 44px min touch (mobile) → 36px (sm:) |
| All sizes      | Input height     | 44px min touch (mobile) → 36px (sm:) |

---

## 8. Letter Spacing Reference

| Tailwind utility    | Value      | Used in                                     |
|---------------------|------------|---------------------------------------------|
| `tracking-widest`   | `0.1em`    | Panel titles, `DashboardPanel` header       |
| `tracking-wider`    | `0.05em`   | Status indicators, header nav labels        |
| `tracking-wide`     | `0.025em`  | Badge text                                  |
| `tracking-normal`   | `0`        | Body text, nav links                        |
| Code header label   | `0.12em`   | `CodeBlock` file path label                 |

---

## 9. Figma Font Plugin Setup

To use `JetBrains Mono` in Figma:

1. Install the **Google Fonts** plugin or the **Figma Font Helper** desktop app.
2. Search for `JetBrains Mono` — available as a variable font with weights 100–800.
3. For `IBM Plex Mono` (fallback): available on Google Fonts.
4. Set document defaults:  
   - Default font: `JetBrains Mono`  
   - Default weight: Regular (400)  
   - Default size: 14  
   - Default color: `#e2e8f0`

---

*Last updated: 2026-07-29 | Source: `soroscan-frontend/app/globals.css`, `soroscan-frontend/app/layout.tsx`*
