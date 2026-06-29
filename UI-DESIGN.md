# SoroScan Frontend — Comprehensive UI Design System

> A retro-futuristic terminal-inspired design system for Web3 event indexing

---

## 🎨 Design Philosophy

**Theme:** Retro-futuristic terminal aesthetic  
**Audience:** Developers, blockchain indexers, operators  
**Mood:** Technical, trustworthy, immersive  
**Primary Use Case:** Real-time event monitoring and contract indexing

---

## 🧩 Figma Source

Figma file: https://www.figma.com/file/qkTJWD2iKj4W2BVztdCrHt/SoroScan-UI-Design?node-id=0-1

This repository follows the Figma master file as the single source of truth for colors, typography, spacing, and component behavior.

---

## 📱 Responsive System

- Mobile: single-column stacked cards, large touch targets, high-contrast controls
- Tablet: grouped panels with compact button rows
- Desktop: wider layouts with side-by-side sections and status surfaces
- Breakpoints: mobile first, then `sm` and `md` scale-up layouts across the UI

---

## 📐 Design System Foundation

### Color Palette

```
┌─────────────────────────────────────────────────────────┐
│ PRIMARY COLORS (Terminal Aesthetic)                     │
├─────────────────────────────────────────────────────────┤
│ Terminal Black:    #0a0e27  (Deep background)           │
│ Terminal Green:    #00ff41  (Primary action, success)   │
│ Terminal Cyan:     #00d4ff  (Secondary, info)           │
│ Terminal Purple:   #a855f7  (Tertiary, accent)          │
│                                                          │
│ SEMANTIC COLORS                                         │
├─────────────────────────────────────────────────────────┤
│ Success:           #00ff41  (Green)                      │
│ Warning:           #fbbf24  (Amber)                      │
│ Danger:            #ff3366  (Red)                        │
│ Info:              #00d4ff  (Cyan)                       │
│                                                          │
│ GRAYSCALE                                               │
├─────────────────────────────────────────────────────────┤
│ Black (bg):        #0a0e27                              │
│ Dark:              #1a1f3a                              │
│ Medium:            #2d3748                              │
│ Light:             #e2e8f0                              │
│ White (text):      #f8fafc                              │
└─────────────────────────────────────────────────────────┘
```

### Typography

```
┌─────────────────────────────────────────────────────────┐
│ FONT STACK                                              │
├─────────────────────────────────────────────────────────┤
│ Monospace (Code):  JetBrains Mono, IBM Plex Mono        │
│ Sans (UI):         Inter, -apple-system, sans-serif     │
│                                                          │
│ SCALE & WEIGHTS                                         │
├─────────────────────────────────────────────────────────┤
│ H1 (Hero):         32px, 600 weight, mono               │
│ H2 (Section):      24px, 600 weight, mono               │
│ H3 (Subsection):   18px, 600 weight, sans               │
│ Body (Regular):    14px, 400 weight, sans               │
│ Small (Helper):    12px, 400 weight, san                │
│ Code (Inline):     13px, 400 weight, mono               │
│ Code (Block):      12px, 400 weight, mono               │
└─────────────────────────────────────────────────────────┘
```

### Spacing Scale

```
┌─────────────────────────────────────┐
│ 0    → 0px                          │
│ 1    → 4px                          │
│ 2    → 8px                          │
│ 3    → 12px                         │
│ 4    → 16px                         │
│ 6    → 24px                         │
│ 8    → 32px                         │
│ 12   → 48px                         │
│ 16   → 64px                         │
└─────────────────────────────────────┘
```

### Elevation & Shadows

```
┌──────────────────────────────────────────────────────────┐
│ CARD SHADOW                                              │
│ box-shadow: 0 0 20px rgba(0, 255, 65, 0.1)              │
│                                                          │
│ HOVER GLOW (Green)                                       │
│ box-shadow: 0 0 20px rgba(0, 255, 65, 0.5)              │
│                                                          │
│ ACTIVE GLOW (Cyan)                                       │
│ box-shadow: 0 0 25px rgba(0, 212, 255, 0.6)             │
│                                                          │
│ ERROR GLOW (Red)                                         │
│ box-shadow: 0 0 20px rgba(255, 51, 102, 0.4)            │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Components

### 1. Button Component

```
┌─────────────────────────────────────────────────────────┐
│ BUTTON VARIANTS                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ PRIMARY (Green)                                         │
│ ┌──────────────────┐                                    │
│ │  > Execute·····  │  ← Terminal prompt prefix          │
│ └──────────────────┘                                    │
│ Background: Linear gradient (dark → darker)             │
│ Border: 1px solid #00ff41                               │
│ Glow on hover: 0 0 20px rgba(0, 255, 65, 0.5)          │
│                                                          │
│ SECONDARY (Cyan)                                        │
│ ┌──────────────────┐                                    │
│ │  > Navigate      │                                    │
│ └──────────────────┘                                    │
│ Border: 1px solid #00d4ff                               │
│ Glow on hover: 0 0 20px rgba(0, 212, 255, 0.5)         │
│                                                          │
│ DANGER (Red)                                            │
│ ┌──────────────────┐                                    │
│ │  > Delete        │                                    │
│ └──────────────────┘                                    │
│ Border: 1px solid #ff3366                               │
│ Glow on hover: 0 0 20px rgba(255, 51, 102, 0.5)        │
│                                                          │
│ GHOST (Minimal)                                         │
│ > View Details                                          │
│ Border: none, text only, hover: underline              │
│                                                          │
│ SPECS                                                   │
├─────────────────────────────────────────────────────────┤
│ Min Height:     44px (touch-friendly)                   │
│ Padding:        12px 16px                               │
│ Border Radius:  4px (subtle, not rounded)               │
│ Font:           14px, 600 weight, mono                  │
│ Cursor:         pointer                                 │
│ Transition:     all 200ms cubic-bezier(0.4, 0, 0.2, 1) │
└─────────────────────────────────────────────────────────┘
```

### 2. Card Component

```
┌────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────┐  │
│ │ ◆ Card Title                    [⊡] [×]     │  │
│ ├──────────────────────────────────────────────┤  │
│ │                                              │  │
│ │ Card content goes here. Cards use box-       │  │
│ │ drawing characters for borders and maintain │  │
│ │ the terminal aesthetic.                      │  │
│ │                                              │  │
│ │ Status: ● Active                             │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ SPECS                                              │
├────────────────────────────────────────────────────┤
│ Background:     rgba(26, 31, 58, 0.5) backdrop    │
│ Border:         1px solid #2d3748                  │
│ Box Shadow:     0 0 20px rgba(0, 255, 65, 0.1)    │
│ Padding:        20px                              │
│ Border Radius:  6px                               │
│ Heading Color:  #00ff41 with ◆ prefix             │
│ On Hover:       Box shadow → glow-green           │
│ Transition:     200ms ease                        │
└────────────────────────────────────────────────────┘
```

### 3. Input / Form Field

```
┌─────────────────────────────────────────┐
│ > Search contracts...          [⌕]      │
│                                          │
│ SPECS                                    │
├─────────────────────────────────────────┤
│ Height:           44px                   │
│ Padding:          12px 16px              │
│ Border:           1px solid #2d3748      │
│ Background:       rgba(10, 14, 39, 0.8) │
│ Text Color:       #f8fafc                │
│ Placeholder:      #718096 (muted)        │
│ Focus Border:     #00ff41 (green)        │
│ Focus Shadow:     0 0 15px rgba(...)     │
│ Font:             14px, mono             │
│ Terminal Prefix:  ">" in muted color    │
│ Icon Right:       search/close icon      │
└─────────────────────────────────────────┘
```

### 4. Data Table

```
┌──────────────────────────────────────────────────────────┐
│ ◆ Contract Events                                        │
├──────────────────────────────────────────────────────────┤
│ Contract ID      │ Event Type  │ Ledger │ Timestamp      │
├──────────────────────────────────────────────────────────┤
│ CCAA...8a9b      │ Transfer    │ 54321  │ 2m ago   >>>   │ ← Hover glow
│ CCBB...4c1d      │ Init        │ 54320  │ 5m ago         │
│ CCCC...9e2f      │ Burn        │ 54319  │ 8m ago         │
├──────────────────────────────────────────────────────────┤
│ [◄ Prev] Page 1 of 62  [Next ►]                          │
└──────────────────────────────────────────────────────────┘

SPECS
├──────────────────────────────────────────────────────────┤
│ Header:          Background #1a1f3a, bold mono text     │
│ Rows:            Alternate bg: transparent/rgba(...)    │
│ Borders:         Box-drawing: ─, │, ┌, ┐, └, ┘, ├, ┤   │
│ Row Hover:       Background brightens, glow-green       │
│ Text:            14px mono, #f8fafc                     │
│ Cell Padding:    12px 16px                              │
│ Max Content:     Truncate with ellipsis (...)           │
│ Linked Items:    Color #00d4ff, cursor pointer          │
│ Status Badge:    ● Active (#00ff41) or ● Inactive      │
│ Actions Col:     [View] [Edit] [Delete] buttons         │
└──────────────────────────────────────────────────────────┘
```

## 📊 Comparison & Diff View

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [EVENT A]                        │ [EVENT B]                          │
├───────────────────────────────────────────────────────────────────────────┤
│ Timestamp:  2026-05-29 12:24    │ Timestamp:  2026-05-29 12:44       │
│ Event Type: Transfer           │ Event Type: Transfer               │
├───────────────────────────────────────────────────────────────────────────┤
│ Field           │ A Value             │ B Value             │ Status     │
├───────────────────────────────────────────────────────────────────────────┤
│ from            │ 0xabc...123          │ 0xabc...123          │ unchanged  │
│ to              │ 0xdef...456          │ 0xdef...789          │ modified   │
│ amount          │ 100                 │ 250                 │ modified   │
│ memo            │ "swap"             │ —                   │ deleted    │
│ reward          │ —                   │ 10                  │ added      │
└───────────────────────────────────────────────────────────────────────────┘
```

- Side-by-side layout shows event details in parallel columns.
- Additions: green background, deletions: red, modified: amber, unchanged: neutral.
- Alternative unified diff option uses inline change markers (+/−) with syntax-highlighted JSON/code blocks.
- Mobile stacks event sections vertically with clear headers and toggle buttons to switch between A/B views.
- Includes summary metrics: lines added, removed, changed.
- Supports expandable rows for large payloads and collapsed sections for unchanged fields.

### 5. Modal / Dialog

```
┌─────────────────────────────────────────────────────┐
│ [MODAL] Register New Contract       [×]             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Contract ID:                                       │
│  > CABC...                           [Copy]         │
│                                                     │
│  Name:                                              │
│  > [Enter contract name..............]             │
│                                                     │
│  Description:                                       │
│  > [Optional description.....................]     │
│                                                     │
│                                                     │
│         [Cancel]           [> Register]             │
│                                                     │
└─────────────────────────────────────────────────────┘

SPECS
├─────────────────────────────────────────────────────┤
│ Overlay:         rgba(0, 0, 0, 0.7) (semi-opaque)  │
│ Background:      #0a0e27 with border glow          │
│ Header:          [MODAL] prefix, green accent      │
│ Close Button:    [×] top-right, clickable          │
│ Width:           90% (mobile) → 500px (desktop)    │
│ Border:          1px solid #00ff41                 │
│ Box Shadow:      0 0 30px rgba(0, 255, 65, 0.3)   │
│ Z-Index:         1000+                             │
│ Animation:       Fade in 200ms                     │
└─────────────────────────────────────────────────────┘
```

### 6. Badge / Status Indicator

```
┌─────────────────────────────────┐
│ ● Active      (Green glow)      │
│ ● Inactive    (Gray)            │
│ ● Pending     (Yellow glow)     │
│ ● Error       (Red glow)        │
│                                 │
│ SPECS                           │
├─────────────────────────────────┤
│ Size:        12px × 12px dot    │
│ Text:        12px, mono         │
│ Padding:     4px 8px            │
│ Border Rad:  12px (pill)        │
│ Glow:        0 0 8px rgba(...)  │
│ BG:          rgba(color, 0.1)   │
│ Border:      1px solid color    │
└─────────────────────────────────┘
```

### 7. Alert / Notification

```
┌──────────────────────────────────────┐
│ ✓ Event exported successfully!       │
│   Download file: events_2024-02-19   │ ← Success (green)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ ⚠ Warning: Webhook suspended         │
│   Max retries exceeded. Check logs.   │ ← Warning (yellow)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ ✗ Error: Connection failed           │
│   Unable to reach backend. Retry...   │ ← Error (red)
└──────────────────────────────────────┘

SPECS
├──────────────────────────────────────┤
│ Padding:         12px 16px           │
│ Border Radius:   4px                 │
│ Border Left:     4px solid (color)   │
│ Icon:            Left side           │
│ Close Button:    [×] right side      │
│ Animation:       Slide in 300ms      │
│ Auto-dismiss:    5s (success/info)   │
└──────────────────────────────────────┘
```

---

## 🏗️ Layout Patterns

### 1. Main Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  ◆ SoroScan          [🔍] [⚙] [👤] [×]                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◄ Dashboard        ┌─────────────────────────────────┐  │
│    Events           │                                 │  │
│    Contracts        │   Event Explorer Dashboard      │  │
│    Webhooks         │   ┌──────────────────────────┐  │  │
│    Admin            │   │ Filter: [Contract ▼]     │  │  │
│    Settings         │   │         [Type ▼]        │  │  │
│                     │   │ Search: [...............]   │  │  │
│                     │   └──────────────────────────┘  │  │
│                     │                                 │  │
│                     │   Event Table:                  │  │
│                     │   [Table rows...]               │  │
│                     │                                 │  │
│                     │   Pagination & Actions          │  │
│                     └─────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘

LAYOUT STRUCTURE
├────────────────────────────────────────────────────────────┤
│ Header:        Fixed, gradient border-bottom, 60px height  │
│ Sidebar:       Responsive (collapse on mobile)            │
│ Main Area:     Flex-grow, scrollable vertical             │
│ Footer:        Optional, status bar at bottom             │
│ Responsive:    Hamburger menu < 768px                     │
└────────────────────────────────────────────────────────────┘
```

### 2. Header Component

```
┌──────────────────────────────────────────────────────────┐
│  ◆ SoroScan    [🔍] [⚙] [👤] [□] [×]                   │
├──────────────────────────────────────────────────────────┤

SPECS
├──────────────────────────────────────────────────────────┤
│ Height:        60px                                       │
│ Background:    Linear gradient #0a0e27 → #1a1f3a         │
│ Border:        Bottom 1px solid #00ff41                  │
│ Logo:          ◆ prefix + "SoroScan" text (mono, bold)   │
│ Spacing:       Logo (24px gap) [Icons (16px gap)]        │
│ Icons:         32px size, clickable, hover glow          │
│ Icon Colors:   #f8fafc (hover: #00ff41)                  │
│ Alignment:     Logo left → Icons right                   │
└──────────────────────────────────────────────────────────┘
```

### 3. Sidebar Navigation

```
┌──────────────━──────┐
│  ◄ Dashboard        │
│     ┌──────────────┐│
│     │ Events       ││ ← Active (green bg + left border)
│     └──────────────┘│
│     ┌──────────────┐│
│     │ Contracts    ││
│     └──────────────┘│
│     ┌──────────────┐│
│     │ Webhooks     ││
│     └──────────────┘│
│     ┌──────────────┐│
│     │ Admin        ││
│     └──────────────┘│
│     ┌──────────────┐│
│     │ Settings     ││
│     └──────────────┘│
│                     │
│  Account            │
│  ┌─────────────────┐│
│  │ user@domain.com ││
│  │ Logout [>]      ││
│  └─────────────────┘│
│                     │
└─────────────────────┘

SPECS
├─────────────────────┤
│ Width:    240px     │
│ (mobile:  show/hide)│
│ Background: #0a0e27 │
│ Item Height: 44px   │
│ Padding: 12px 16px  │
│ Font: 14px mono     │
│ Active Item:        │
│  - BG: rgba(0,255,41,0.1) │
│  - Left border: 4px #00ff41 │
│ Hover: Light glow   │
│ Icon + Text layout  │
└─────────────────────┘
```

---

## 📱 Page Designs

### Landing Page

```
┌─────────────────────────────────────────────────────────┐
│              ◆ SoroScan                                 │
│     [Minimal Navigation Bar]                            │
│                                                         │
│  ╔════════════════════════════════════════════════════╗ │
│  ║                                                    ║ │
│  ║       Soroban Event Indexing, Reimagined          ║ │
│  ║                                                    ║ │
│  ║  No The Graph for Soroban. We built it.           ║ │
│  ║                                                    ║ │
│  ║          [> Get Started]    [→ Docs]              ║ │
│  ║                                                    ║ │
│  ╚════════════════════════════════════════════════════╝ │
│                                                         │
│  ┌─ FEATURES ──────────────────────────────────────┐   │
│  │  ◆ GraphQL API          ◆ REST Endpoints        │   │
│  │  ◆ Webhooks             ◆ Real-Time Events      │   │
│  │  ◆ SDKs (Python, TS)    ◆ Open Source           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ CODE EXAMPLE ───────────────────────────────────┐   │
│  │                                                  │   │
│  │  query GetEvents($contractId: String!) {        │   │
│  │    events(contractId: $contractId) {            │   │
│  │      edges { node { id eventType data } }       │   │
│  │    }                                            │   │
│  │  }                                              │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ PRICING ────────────────────────────────────────┐   │
│  │                                                  │   │
│  │  ◆ Open Source & Self-Hosted                    │   │
│  │  Start for free, scale as you grow              │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Footer: Links, Copyright, Status                      │
└─────────────────────────────────────────────────────────┘

DESIGN SPECS
├─────────────────────────────────────────────────────────┤
│ Hero:          72px H1 mono, green accent               │
│ Subheading:    24px sans, muted gray                    │
│ Feature Cards: Terminal border style, 3-column grid     │
│ Code Block:    Syntax-highlighted, scrollable           │
│ CTA Buttons:   Primary green, secondary ghost           │
│ Responsive:    Full-width mobile, centered content      │
└─────────────────────────────────────────────────────────┘
```

### Event Explorer Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  ◆ SoroScan [🔍] [⚙] [👤]                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◄ Events                                                  │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ ◆ Contract Events                      [⟳ Refresh] │
│  ├──────────────────────────────────────────────────┤     │
│  │                                                  │     │
│  │ Filters:                                        │     │
│  │ > Contract: [Select Contract........] ▼          │     │
│  │ > Event Type: [Transfer ] [Init ] [Burn ] [X]   │     │
│  │ > Date Range: [From: ________] [To: ________]    │     │
│  │ > Search: [type:transfer amount:>1000...] ⌕      │     │
│  │ [Apply Filters]        [Clear]                   │     │
│  │                                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Contract ID    │ Type     │ Ledger │ Time    │ ··│     │
│  ├──────────────────────────────────────────────────┤     │
│  │ CCAA·8a9b      │ Transfer │ 54321  │ 2m ago  │❑❑│ ←hover: glow  │
│  │ CCBB·4c1d      │ Init     │ 54320  │ 5m ago  │ │     │
│  │ CCCC·9e2f      │ Burn     │ 54319  │ 8m ago  │ │     │
│  │ CCDD·3f6e      │ Approve  │ 54318  │ 12m ago │ │     │
│  │ CCEE·7b2a      │ Transfer │ 54317  │ 15m ago │ │     │
│  ├──────────────────────────────────────────────────┤     │
│  │ [◄ Prev] Page 1 of 62  [Next ►]  [Export ▼]      │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌─ RECENT ACTIVITY ────────────────────────────────┐     │
│  │ [21:45] CCAA transferred 1000 USDC               │     │
│  │ [21:40] CCBB initialized protocol v2             │     │
│  │ [21:35] CCCC burned 500 tokens                   │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Contract Management Page

```
┌────────────────────────────────────────────────────────────┐
│  ◆ SoroScan [🔍] [⚙] [👤]                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◄ Contracts                                               │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ ◆ Tracked Contracts           [+ Register]      │     │
│  ├──────────────────────────────────────────────────┤     │
│  │                                                  │     │
│  │ [Search contracts................] ⌕              │     │
│  │                                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  CONTRACTS (Grid):                                         │
│  ┌──────────────────┬──────────────────┬──────────────┐   │
│  │                  │                  │              │   │
│  │  CCAA...8a9b     │  CCBB...4c1d     │  CCCC...9e2f │   │
│  │  Uniswap V4      │  Soroswap Pool   │  Stellar Core│   │
│  │                  │                  │              │   │
│  │  Events: 1,234   │  Events: 567     │  Events: 89  │   │
│  │  Active: ● Yes   │  Active: ● Yes   │  Active: ● No│   │
│  │                  │                  │              │   │
│  │  [View] [Edit]   │  [View] [Edit]   │  [View][Edit]│   │
│  │  [Delete]        │  [Delete]        │  [Delete]    │   │
│  │                  │                  │              │   │
│  └──────────────────┴──────────────────┴──────────────┘   │
│                                                            │
│  Pagination: [◄] 1 2 3 ... [►]                            │
└────────────────────────────────────────────────────────────┘

REGISTER MODAL:
┌─────────────────────────────────────────┐
│ [MODAL] Register New Contract  [×]      │
├─────────────────────────────────────────┤
│                                         │
│ Contract ID: *                          │
│ > CABC...                    [Copy] [QR]│
│                                         │
│ Name: *                                 │
│ > [Official Contract Name.....]        │
│                                         │
│ Description:                            │
│ > [Optional contract description...]   │
│                                         │
│ Tags (optional):                        │
│ [Uniswap] [DEX] [Swap] [+ Add Tag]      │
│                                         │
│           [Cancel]  [> Register]        │
│                                         │
└─────────────────────────────────────────┘
```

### Webhook Manager

```
┌────────────────────────────────────────────────────────────┐
│  ◆ SoroScan [🔍] [⚙] [👤]                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◄ Webhooks                                                │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ ◆ Webhook Subscriptions        [+ Create]       │     │
│  ├──────────────────────────────────────────────────┤     │
│  │                                                  │     │
│  │ Webhooks: [All ▼] Status: [Active ▼]            │     │
│  │                                                  │     │
│  │ URL              │ Events   │ Status │ Last Sent │     │
│  ├──────────────────────────────────────────────────┤     │
│  │ https://api...   │ All      │ ✓ OK   │ 2m ago   ║     │
│  │ https://app...   │ Transfer │ ⚠ Warn │ Failed   ║     │
│  │ https://web...   │ Init     │ ✗ Error│ 5m ago   ║     │
│  │ [Actions][Test]  │ [Edit]   │[Delete]│          │     │
│  ├──────────────────────────────────────────────────┤     │
│  │ [◄ Prev] Page 1 of 3 [Next ►]                    │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Delivery Logs (Last 5)                          │     │
│  ├─────────────────────────────────────────────────┤     │
│  │ Timestamp    │ URL │ Code │ Time │ Attempt     │     │
│  │ 21:45:32     │ ··· │ 200  │ 42ms │ 1 ✓        │     │
│  │ 21:40:15     │ ··· │ 500  │ -    │ 3 ✗        │     │
│  └─────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Admin Dashboard

```
┌────────────────────────────────────────────────────────────┐
│  ◆ SoroScan [🔍] [⚙] [👤]                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ◄ Admin Dashboard                                         │
│                                                            │
│  ┌─────────────┬─────────────┬─────────────┬──────────┐   │
│  │ Events/min  │ Webhooks    │ Avg Latency │ Errors   │   │
│  │   1,234     │   85%       │    42ms     │    3     │   │
│  │ (↑ 12%)     │ (↑ 5%)      │  (↓ 8%)     │ (↔ 0%)   │   │
│  └─────────────┴─────────────┴─────────────┴──────────┘   │
│                                                            │
│  ┌──────────────────────────┬──────────────────────────┐   │
│  │ Events (24h)             │ Webhook Delivery (24h)  │   │
│  │                          │                         │   │
│  │  /|                      │   100% ─────────────    │   │
│  │ / |                      │    80% ──┐           ┌─ │   │
│  │/  |__/|__/|_____         │    60% ──┘─────────┬─┘   │   │
│  │   12h   6h   Now|        │    40%          ┌─┘      │   │
│  │                          │    20%        ┌─┘        │   │
│  │   Peak: 2,340 @ 12:30    │     0%______┌─┘         │   │
│  │   Avg:  1,540 total      │          Now            │   │
│  └──────────────────────────┴──────────────────────────┘   │
│                                                            │
│  ┌─ CONTRACT INDEXING PROGRESS ──────────────────────┐   │
│  │                                                  │   │
│  │ CCAA...8a9b: [████████████░░] 85%  ⟳ Running  │   │
│  │ CCBB...4c1d: [██████████████] 100% ✓ Complete │   │
│  │ CCCC...9e2f: [██░░░░░░░░░░░░] 12%  ⟳ Running  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─ RECENT ERRORS ──────────────────────────────────┐   │
│  │ [21:45] Connection timeout (DB)                  │   │
│  │ [21:30] Webhook retry exceeded (webhook_id: 5)   │   │
│  │ [21:15] Invalid event payload (CCAA, type=swap)  │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Login Page

```
┌──────────────────────────────────────────────────────────┐
│              ◆ SoroScan                                  │
│                                                          │
│              Sign In to Dashboard                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │ Email Address: *                                  │  │
│  │ > [user@domain.com........................]      │  │
│  │                                                    │  │
│  │ Password: *                                       │  │
│  │ > [••••••••••••••••••••] [👁]                   │  │
│  │                                                    │  │
│  │ [✓] Remember me                                  │  │
│  │                                                    │  │
│  │ [> Sign In]       [Forgot Password?]             │  │
│  │                                                    │  │
│  │ ─────────────────────────────────────────────     │  │
│  │                                                    │  │
│  │ Don't have an account? [Contact us]              │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Status: Connected to backend ✓                         │
│  Testnet Detected: Soroban Testnet                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Special Effects & Animations

### Glow Effects

```css
/* Terminal Green Glow (Primary) */
box-shadow: 0 0 10px rgba(0, 255, 65, 0.3),
            0 0 20px rgba(0, 255, 65, 0.2);

/* Terminal Cyan Glow (Secondary) */
box-shadow: 0 0 10px rgba(0, 212, 255, 0.3),
            0 0 20px rgba(0, 212, 255, 0.2);

/* Pulse Animation (for live events) */
@keyframes pulse {
  0%   { opacity: 1; }
  50%  { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Scanlines Effect (overlay) */
background-image: 
  repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
```

### Transitions

```
Button Hover:         200ms cubic-bezier(0.4, 0, 0.2, 1)
Card Glow Expand:     300ms ease-out
Modal Fade In:        200ms ease-out
Table Row Highlight:  150ms ease
Sidebar Slide:        250ms ease-out
Toast Notification:   300ms ease-out (enter), 0ms (exit)
```

### Interactive States

```
Hover:    Increased glow, slight scale (1.02x), lighter bg
Active:   Solid glow, scale (1.0), saturated colors
Focus:    Cyan border, ring outline, glow
Disabled: Opacity 0.5, no glow, cursor not-allowed
Loading:  Pulse animation, spinner icon
Error:    Red glow, invalid state styling
```

---

## 📊 Responsive Design Breakpoints

```
MOBILE (< 640px)
├─ Single column layout
├─ Hamburger sidebar menu
├─ Table → Card view conversion
├─ Stacked form fields
├─ Full-width modals
├─ 16px base padding
└─ Touch-friendly 44px+ buttons

TABLET (640px - 1023px)
├─ Two column grid (events, contracts)
├─ Sidebar collapsible
├─ Table with horizontal scroll
├─ Multi-column forms
├─ 80% width modals
├─ 20px base padding
└─ Balanced spacing

DESKTOP (≥ 1024px)
├─ Three+ column grids
├─ Fixed sidebar (240px)
├─ Full tables with pagination
├─ Complex layouts
├─ 90% width capped modals
├─ 24px base padding
└─ Optimal reading width 120ch
```

---

## 🎯 Key Design Principles

### 1. **Functionality First**
- Clear information hierarchy
- Actions obvious and accessible
- Error states and feedback immediate

### 2. **Terminal Aesthetic Consistency**
- Green (#00ff41) for success/primary
- Cyan (#00d4ff) for secondary/info
- Monospace fonts for authenticity
- Box-drawing characters for borders
- Glow effects for visual depth

### 3. **Developer-Friendly**
- Technical language and jargon
- Code snippets displayed prominently
- API references easily accessible
- Status indicators clear and color-coded

### 4. **Performance-Conscious**
- Lightweight animations (200-300ms)
- Efficient gradient usage
- SVG icons (not raster images)
- Minimal JavaScript for effects

### 5. **Accessibility**
- WCAG 2.1 AA compliant
- Sufficient color contrast (4.5:1 text)
- Focus states visible and obvious
- Semantic HTML with ARIA labels
- Keyboard navigation support

---

## 🎬 Final Rendering Output

This design system provides:

✅ **Cohesive visual language** across all SoroScan interfaces  
✅ **Retro-futuristic terminal aesthetic** for Web3 developers  
✅ **Reusable component library** for fast feature development  
✅ **Responsive design** supporting all devices  
✅ **Accessibility compliance** with modern standards  
✅ **Performance optimized** with GPU-accelerated effects  
✅ **Developer experience** with clear documentation  

---

**Design System Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation (FE-1 → FE-2 workflow)