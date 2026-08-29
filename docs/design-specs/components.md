# SoroScan — Component Specs (Padding, Hover States, Variants)

> **Source of truth:** `soroscan-frontend/components/ui/` and `soroscan-frontend/components/layout/`  
> **Theme:** Terminal dark. All specs reference design tokens defined in `color-palette.md`.

---

## Contents

1. [Button](#1-button)
2. [Badge](#2-badge)
3. [Input](#3-input)
4. [Card / DashboardPanel](#4-card--dashboardpanel)
5. [StatusIndicator](#5-statusindicator)
6. [Alert](#6-alert)
7. [Modal](#7-modal)
8. [CodeBlock](#8-codeblock)
9. [Navigation (AppShell)](#9-navigation-appshell)
10. [Layout Dimensions](#10-layout-dimensions)

---

## 1. Button

**Source:** `soroscan-frontend/components/ui/button.tsx`  
**Library:** `class-variance-authority` (CVA)

### Size Variants

| Size token  | Height (mobile) | Height (sm:) | Padding H   | Gap   | Icon size  | Min touch  |
|-------------|-----------------|--------------|-------------|-------|------------|------------|
| `xs`        | 24px            | 24px         | px-2 (8px)  | 4px   | 12px       | —          |
| `sm`        | 44px            | 32px         | px-3 (12px) | 6px   | 16px       | 44px       |
| `default`   | 44px            | 36px         | px-4 (16px) | 8px   | 16px       | 44px       |
| `lg`        | 44px            | 44px         | px-6 (24px) | 8px   | 16px       | 44px       |
| `icon`      | 44×44px         | 36×36px      | —           | —     | 16px       | 44×44px    |
| `icon-xs`   | 24×24px         | 24×24px      | —           | —     | 12px       | —          |
| `icon-sm`   | 44×44px         | 32×32px      | —           | —     | 16px       | 44×44px    |
| `icon-lg`   | 44×44px         | 40×40px      | —           | —     | 16px       | 44×44px    |


### Variant Specs

| Variant       | Background        | Text color         | Border            | Hover bg              | Focus ring               |
|---------------|-------------------|--------------------|-------------------|-----------------------|--------------------------|
| `default`     | `terminal-green`  | `terminal-black`   | none              | `terminal-green/90`   | `ring/50` 3px            |
| `destructive` | `terminal-danger` | `#ffffff`          | none              | `terminal-danger/90`  | `destructive/20` 3px     |
| `outline`     | `background`      | foreground         | `border` (1px)    | `accent`              | `ring/50` 3px            |
| `secondary`   | `secondary`       | `secondary-fg`     | none              | `secondary/80`        | `ring/50` 3px            |
| `ghost`       | transparent       | foreground         | none              | `accent`              | `ring/50` 3px            |
| `link`        | transparent       | `primary`          | none (underline)  | underline visible     | `ring/50` 3px            |

### State Specs

```
Default:   bg-primary, text-primary-foreground
Hover:     bg-primary/90  (10% darkened)
Focus:     outline none; border-ring visible; ring-ring/50 3px spread
Active:    bg-primary/80  (pressed, implied)
Disabled:  pointer-events-none, opacity-50
```

### Border Radius

All button sizes: `rounded-md` = `calc(var(--radius) - 2px)` = **8px**

---

## 2. Badge

**Source:** `soroscan-frontend/components/ui/badge.tsx`

### Size Variants

| Size  | Height | Padding H   | Padding V    | Font size | Icon size |
|-------|--------|-------------|--------------|-----------|-----------|
| `sm`  | 20px   | px-2 (8px)  | py-0.5 (2px) | 12px      | 10px      |
| `md`  | 24px   | px-3 (12px) | py-1 (4px)   | 12px      | 12px      |
| `lg`  | 32px   | px-4 (16px) | py-1.5 (6px) | 14px      | 14px      |


### Color Variants

| Variant     | Fill (bg)              | Text color          | Border                    | Focus ring           |
|-------------|------------------------|---------------------|---------------------------|----------------------|
| `default`   | `terminal-gray/10`     | `terminal-gray`     | `terminal-gray/30`        | `terminal-gray`      |
| `primary`   | `terminal-green/10`    | `terminal-green`    | `terminal-green/30`       | `terminal-green`     |
| `secondary` | `terminal-cyan/10`     | `terminal-cyan`     | `terminal-cyan/30`        | `terminal-cyan`      |
| `success`   | `terminal-green/10`    | `terminal-green`    | `terminal-green/30`       | `terminal-green`     |
| `warning`   | `terminal-warning/10`  | `terminal-warning`  | `terminal-warning/30`     | `terminal-warning`   |
| `danger`    | `terminal-danger/10`   | `terminal-danger`   | `terminal-danger/30`      | `terminal-danger`    |
| `outline`   | transparent            | current color       | `current/30`              | current color        |

### Common Properties

- **Border radius:** `rounded-full` (pill shape)
- **Font:** JetBrains Mono, SemiBold (600), uppercase, tracking-wide
- **Gap (icon + text):** 6px (`gap-1.5`)
- **Transition:** `transition-all`

### Figma Component Setup

```
Badge [variant=primary, size=md]
├── Frame: Auto Layout, horizontal, gap=6, padding: 12/4
│   ├── Icon (optional): 12×12, color=terminal-green
│   └── Text: "LABEL", 12px/600/uppercase, color=terminal-green
├── Fill: #00ff41 @ 10% opacity
└── Border: 1px solid #00ff41 @ 30%
```

---

## 3. Input

**Source:** `soroscan-frontend/components/ui/input.tsx`

### Dimensions

| Property        | Mobile          | sm: breakpoint  |
|-----------------|-----------------|-----------------|
| Height          | 44px (`min-h`)  | 36px            |
| Padding H       | px-3 (12px)     | px-3 (12px)     |
| Padding V       | py-2 (8px)      | py-1 (4px)      |
| Width           | 100% (`w-full`) | 100%            |
| Border radius   | `rounded-md` 8px| 8px             |
| Border width    | 1px             | 1px             |

### State Variants

| State     | Border color      | Ring                           | Background          | Text              |
|-----------|-------------------|--------------------------------|---------------------|-------------------|
| Default   | `border-input`    | none                           | `bg-transparent`    | `foreground`      |
| Focus     | `ring`            | `ring-ring/50` 3px             | `bg-transparent`    | `foreground`      |
| Error     | `destructive`     | `ring-destructive/20` 3px      | `bg-transparent`    | `foreground`      |
| Success   | `green-500`       | `ring-green-500/20` 3px        | `bg-transparent`    | `foreground`      |
| Disabled  | `border-input`    | none                           | opaque              | opacity-50        |

### Other Properties

- **Placeholder text:** `text-muted-foreground` = `#94a3b8`
- **Shadow:** `shadow-xs` (subtle base shadow)
- **File input:** `h-7` (28px), borderless, `bg-transparent`
- **Transition:** `transition-[color,box-shadow]`


---

## 4. Card / DashboardPanel

### Card

**Source:** `soroscan-frontend/components/ui/card.tsx`

#### Padding & Structure

| Section       | Padding           | Border                            |
|---------------|-------------------|-----------------------------------|
| Card body     | p-4 (16px)        | none (internal)                   |
| Card header   | px-4 py-3 (16/12) | border-b 1px                      |
| Card footer   | px-4 py-3 (16/12) | border-t 1px                      |

#### Variant Specs

| Variant    | Shadow         | Border                      | Hover (hoverable=true)  |
|------------|----------------|-----------------------------|-------------------------|
| `default`  | `shadow-sm`    | 1px `gray-200` / `terminal-medium` | `hover:shadow-md` |
| `flat`     | none           | 1px `gray-200` / `terminal-medium` | `hover:shadow-md` |
| `elevated` | `shadow-lg`    | 1px `gray-200` / `terminal-medium` | `hover:shadow-xl` |

- **Border radius:** `rounded-lg` = `var(--radius)` = 10px
- **Hover transition:** `transition-shadow duration-200`

### DashboardPanel

**Source:** `soroscan-frontend/components/layout/DashboardPanel.tsx`

#### Elevation Variants

| Elevation   | Background         | Border                        | Box shadow                                                               |
|-------------|--------------------|-------------------------------|--------------------------------------------------------------------------|
| `flat`      | `terminal-black/40`| `terminal-green/15` (1px)     | none                                                                     |
| `default`   | `terminal-black/60`| `terminal-green/30` (1px)     | `0 0 20px rgba(0,255,65,0.1)`                                            |
| `elevated`  | `terminal-dark/80` | `terminal-green/45` (1px)     | `0 0 24px rgba(0,255,65,0.16), 0 0 4px rgba(0,255,65,0.2)`              |

#### Internal Layout

```
DashboardPanel
├── Padding:       16px (p-4) all sides
├── Gap:           16px (gap-4) flex-col
├── Border radius: rounded-sm (≈4px)
├── Border:        1px solid (elevation-dependent)
│
└── Header row (when title or actions exist)
    ├── Min height:  28px
    ├── Layout:      flex, justify-between, gap=12px
    ├── Title:       12px / Bold / uppercase / tracking-widest / terminal-green
    └── Actions:     flex, gap=8px, shrink-0
```

---

## 5. StatusIndicator

**Source:** `soroscan-frontend/components/ui/status-indicator.tsx`

### Dot Sizes

| Size   | Dot dimensions  |
|--------|-----------------|
| `sm`   | 6×6px           |
| `md`   | 8×8px (default) |
| `lg`   | 10×10px         |

### Status Configurations

| Status     | Dot color          | Hex       | Text color         | Animated  |
|------------|--------------------|-----------|--------------------|-----------|
| `active`   | `terminal-green`   | `#00ff41` | `terminal-green`   | ✅ pulse  |
| `failed`   | `terminal-danger`  | `#ff3366` | `terminal-danger`  | ❌        |
| `pending`  | `terminal-warning` | `#ffaa00` | `terminal-warning` | ✅ pulse  |
| `inactive` | `terminal-gray`    | `#94a3b8` | `terminal-gray`    | ❌        |

### Layout

- **Font:** JetBrains Mono, 12px, uppercase, `tracking-wider`
- **Gap (default):** 8px (`gap-2`)
- **Gap (compact):** 6px (`gap-1.5`)
- **Animation:** `animate-pulse` (Tailwind) on dot element only
- **Accessibility:** `role="status"`, `aria-label="Status: {label}"`

### Figma Variant Matrix

```
StatusIndicator [4 statuses × 3 sizes × 2 variants × dot-only toggle]
= 4 × 3 × 2 × 2 = 48 variants

Recommended Figma setup:
  Property: Status     → active | failed | pending | inactive
  Property: Size       → sm | md | lg
  Property: Variant    → default | compact
  Property: Dot Only   → true | false
```


---

## 6. Alert

**Source:** `soroscan-frontend/components/ui/alert.tsx`

### Variant Specs (Light mode / Dark mode)

| Variant   | Light bg       | Light text   | Light border  | Dark bg               | Dark text      | Dark border     |
|-----------|----------------|--------------|---------------|-----------------------|----------------|-----------------|
| `info`    | `blue-50`      | `blue-800`   | `blue-200`    | `blue-900/20`         | `blue-400`     | `blue-800`      |
| `success` | `green-50`     | `green-800`  | `green-200`   | `green-900/20`        | `green-400`    | `green-800`     |
| `warning` | `yellow-50`    | `yellow-800` | `yellow-200`  | `yellow-900/20`       | `yellow-400`   | `yellow-800`    |
| `error`   | `red-50`       | `red-800`    | `red-200`     | `red-900/20`          | `red-400`      | `red-800`       |

### Variant Icons

| Variant   | Icon component  | Size   |
|-----------|-----------------|--------|
| `info`    | `Info`          | 20×20px |
| `success` | `CheckCircle2`  | 20×20px |
| `warning` | `AlertCircle`   | 20×20px |
| `error`   | `XCircle`       | 20×20px |

### Layout Structure

```
Alert  — grid, cols=[icon | content | copy-btn | dismiss-btn], gap=12px
├── Icon:         20×20px, mt-0.5, shrink-0
├── Content:      flex-col, gap=4px, flex-1
│   ├── Title:    font-semibold, leading-none, tracking-tight
│   ├── Desc:     text-sm, opacity-90
│   └── Actions:  mt-8px, flex, gap=8px (optional)
├── Copy button:  p-4px, rounded-md, 20×20px icon (optional)
└── Dismiss btn:  p-4px, rounded-md, 20×20px icon (dismissible only)
```

### Padding

- Container: `px-4 py-3` = 16px / 12px
- Border: 1px, `rounded-lg` (10px radius)
- Action buttons: `p-1` (4px), `rounded-md` (8px)

### State — Copy button hover

```
Default:  transparent bg
Hover:    bg-black/5  (light) / bg-white/10 (dark)
Active:   icon swaps to CheckCircle2 for 2s after copy
```

---

## 7. Modal

**Source:** `soroscan-frontend/components/ui/modal.tsx`  
**Library:** Radix UI Dialog

### Dimensions

| Property       | Value                                  |
|----------------|----------------------------------------|
| Max width       | `max-w-lg` = 512px                    |
| Width           | `w-full` (fills to max-w-lg)          |
| Position        | `fixed`, centered (`left/top 50%`, translate -50%) |
| Z-index         | `z-50`                                |
| Padding         | `p-6` = 24px all sides                |
| Gap (internal)  | `gap-4` = 16px                        |
| Border radius   | `sm:rounded-lg` = 10px                |

### Overlay

- Background: `bg-black/80` (80% black)
- Z-index: `z-50`
- Animate in: `fade-in-0`
- Animate out: `fade-out-0`

### Close Button

| Property       | Value                                 |
|----------------|---------------------------------------|
| Position       | `absolute right-4 top-4` (16px inset)|
| Size           | 16×16px icon                          |
| Default opacity| 70%                                   |
| Hover opacity  | 100%                                  |
| Focus ring     | `ring-2 ring-ring ring-offset-2`      |

### Animation

```
Open:  fade-in-0 + zoom-in-95 + slide-in-from-left-1/2 + slide-in-from-top-48%
Close: fade-out-0 + zoom-out-95 + slide-out-to-left-1/2 + slide-out-to-top-48%
Duration: 200ms
```

### Sub-components Spacing

| Sub-component    | Padding / margin                     |
|------------------|--------------------------------------|
| `ModalHeader`    | flex-col, space-y-1.5 (6px)          |
| `ModalTitle`     | text-lg (18px), font-semibold, leading-none |
| `ModalDescription` | text-sm (14px), text-muted-foreground |


---

## 8. CodeBlock

**Source:** `soroscan-frontend/components/ui/CodeBlock.module.css`

### Chrome Dimensions

| Part              | Dimension / Value                                     |
|-------------------|-------------------------------------------------------|
| Window background | `#050810`                                             |
| Window border     | 1px solid `rgba(0,255,65,0.45)`                       |
| Window border-radius | 4px                                                |
| Window glow       | `0 0 0 1px rgba(0,255,156,0.08), 0 0 24px rgba(0,255,65,0.12)` |
| Titlebar bg       | `#0d1120`                                             |
| Titlebar border-b | 1px solid `rgba(0,255,65,0.2)`                        |
| Titlebar padding  | 8px 12px                                              |
| Titlebar min-h    | 44px                                                  |
| Body padding      | 1rem (16px) all sides                                 |
| Body padding (mobile) | 0.75rem (12px)                                    |

### Traffic-Light Dots

| Dot       | Color     | Size    | Gap between dots |
|-----------|-----------|---------|------------------|
| Red (close)   | `#ff5f57` | 10×10px | 6px             |
| Yellow (min)  | `#ffbd2e` | 10×10px | 6px             |
| Green (max)   | `#28c840` | 10×10px | 6px             |

### Copy Button

| State     | Text color  | Border                         | Box shadow                    |
|-----------|-------------|--------------------------------|-------------------------------|
| Default   | `#7ba8b5`   | 1px solid `rgba(123,168,181,0.35)` | none                      |
| Hover     | `#00ff9c`   | 1px solid `rgba(0,255,156,0.55)` | `0 0 12px rgba(0,255,156,0.15)` |
| Focus     | same as hover | same as hover               | same as hover                 |

Copy button padding: `0 12px`, min 44×44px, border-radius: 3px, font: 10px/uppercase/`tracking-0.08em`

### Line Numbers

- Width: `2ch`, text-align right, non-selectable
- Color: `rgba(123,168,181,0.45)` (~45% opacity `#7ba8b5`)
- Font size: `0.72rem` (11.5px)
- Gap from content: `1rem` (16px)

---

## 9. Navigation (AppShell)

**Source:** `soroscan-frontend/components/layout/AppShell.tsx`

### Header Bar

| Property         | Value                                                          |
|------------------|----------------------------------------------------------------|
| Height           | 60px (`h-[60px]`)                                             |
| Position         | `sticky top-0 z-30`                                           |
| Background       | `bg-gradient-to-r from-terminal-black to-[#1a1f3a]`          |
| Border bottom    | 1px solid `terminal-green/30`                                 |
| Padding H        | px-4 (16px)                                                   |
| Gap (items)      | gap-3 (12px)                                                  |

### Logo / Brand

| Property   | Value                                              |
|------------|----------------------------------------------------|
| Text       | `◆ SoroScan`                                      |
| Size       | text-lg (18px), font-bold, tracking-wider          |
| Color      | `terminal-green`                                   |
| Hover      | `terminal-cyan`                                    |
| Min height | 44px (touch target)                                |

### Sidebar

| Property    | Value                                         |
|-------------|-----------------------------------------------|
| Width        | 240px (`w-60`)                               |
| Position     | hidden < 640px, always visible ≥ 640px        |
| Background   | `terminal-black/95`                           |
| Border right | 1px solid `terminal-green/20`                 |
| Padding      | p-4 (16px)                                    |
| Min height   | `calc(100vh - 60px)`                          |

### Nav Link States

| State       | Left border         | Background              | Text color         | Shadow                               |
|-------------|---------------------|-------------------------|--------------------|--------------------------------------|
| Default     | 4px transparent     | transparent             | `terminal-gray`    | none                                 |
| Hover       | 4px `terminal-green/40` | `terminal-green/5`  | `terminal-green`   | none                                 |
| Active      | 4px `terminal-green` | `terminal-green/10`    | `terminal-green`   | `0 0 12px rgba(0,255,65,0.15)`       |
| Focus       | 4px transparent     | transparent             | `terminal-gray`    | ring-2 `terminal-green`              |

Nav link padding: `px-4 py-2` (16px / 8px), min-height: 44px, gap (icon + text): 12px (`gap-3`)

### Theme Toggle Button

- Size: min 44×44px
- Default color: `terminal-gray`
- Hover color: `terminal-green`
- Icon: Sun (warning amber) in dark mode / Moon (cyan) in light mode

---

## 10. Layout Dimensions

### Spacing Scale

| Token                      | Value         | Pixels  |
|----------------------------|---------------|---------|
| `--spacing-terminal-xs`    | `0.25rem`     | 4px     |
| `--spacing-terminal-sm`    | `0.5rem`      | 8px     |
| `--spacing-terminal-md`    | `0.75rem`     | 12px    |
| `--spacing-terminal-lg`    | `1rem`        | 16px    |
| `--spacing-terminal-xl`    | `1.5rem`      | 24px    |
| `--spacing-terminal-2xl`   | `2rem`        | 32px    |

### Control Sizing

| Token                  | Value         | Pixels | Usage                        |
|------------------------|---------------|--------|------------------------------|
| `--size-control-sm`    | `2.25rem`     | 36px   | sm: button/input height      |
| `--size-control-md`    | `2.75rem`     | 44px   | Default button/input height  |
| `--size-control-lg`    | `3rem`        | 48px   | Large button height          |
| `--size-touch-min`     | `2.75rem`     | 44px   | WCAG 2.5.5 touch target min  |

### Border Radius Scale

| Token           | Value                          | Pixels   |
|-----------------|--------------------------------|----------|
| `--radius`      | `0.625rem`                     | 10px     |
| `radius-sm`     | `calc(var(--radius) - 4px)`    | 6px      |
| `radius-md`     | `calc(var(--radius) - 2px)`    | 8px      |
| `radius-lg`     | `var(--radius)`                | 10px     |
| `radius-xl`     | `calc(var(--radius) + 4px)`    | 14px     |
| `radius-2xl`    | `calc(var(--radius) + 8px)`    | 18px     |
| CodeBlock       | 4px (hardcoded)                | 4px      |
| Copy button     | 3px (hardcoded)                | 3px      |

### Animation Timing

| Token                  | Value                               |
|------------------------|-------------------------------------|
| `--duration-fast`      | `100ms`                             |
| `--duration-normal`    | `300ms`                             |
| `--duration-slow`      | `500ms`                             |
| `--ease-standard`      | `cubic-bezier(0.4, 0, 0.2, 1)`      |
| `--ease-elastic`       | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` |
| Cursor blink           | `1s steps(1) infinite`              |
| Pulse                  | `1.4s ease-in-out infinite`         |

### Focus Ring

All interactive elements follow WCAG 2.1 AA §2.4.11 Focus Appearance:

```
:focus-visible {
  outline: 2px solid #00ff41;   /* terminal-green */
  outline-offset: 2px;
  border-radius: 2px;
}
```

---

## Figma Component Organization

Recommended page structure in Figma:

```
📄 Components
  ├── 🖼 Buttons         (all variants × sizes, 48 cells)
  ├── 🖼 Badges          (all variants × sizes, 21 cells)
  ├── 🖼 Inputs          (default/error/success + focus/disabled, 10 cells)
  ├── 🖼 Cards           (flat/default/elevated × hoverable, 6 cells)
  ├── 🖼 DashboardPanels (flat/default/elevated, 3 cells)
  ├── 🖼 StatusIndicators (active/failed/pending/inactive × sm/md/lg, 12 cells)
  ├── 🖼 Alerts          (info/success/warning/error × dismissible, 8 cells)
  ├── 🖼 Modals          (default + wide, 2 cells)
  └── 🖼 CodeBlocks      (with/without line numbers, 2 cells)

📄 Navigation
  ├── 🖼 Header bar
  ├── 🖼 Sidebar desktop
  ├── 🖼 Nav links (default/hover/active/focus)
  └── 🖼 Mobile drawer

📄 Layout
  ├── 🖼 Full-page shell (desktop 1440px)
  └── 🖼 Full-page shell (mobile 375px)
```

---

*Last updated: 2026-07-29 | Source: `soroscan-frontend/components/`*
