# Dashboard Layout & Information Architecture (#910)

**Status**: Implemented  
**References**: Desktop 1920px · Mobile 375px  
**Depends on**: Design tokens (#909), AppShell / Event Explorer foundation

---

## Goals

Make the Event Explorer and Admin Dashboard scannable with clear hierarchy:

1. Filter controls live in a dedicated sidebar (desktop) / drawer (mobile).
2. Primary content (tables, charts, logs) occupies the main column.
3. Navigation uses icon + label with visible hover/active states.
4. Cards/panels share one spacing, border, and elevation system.
5. Data tables use consistent column widths and row height.

---

## Layout measurements (hand-off)

### App chrome

| Element | Value |
|---------|------:|
| Header height | 60px |
| Nav sidebar width | 240px |
| Nav item height | 44px (touch min) |
| Nav item padding | 8px 16px |
| Nav icon size | 18px |
| Nav icon↔label gap | 12px |
| Active left border | 4px `#00ff41` |
| Hover | `bg-terminal-green/5` + border tint |

### Event Explorer (filter sidebar + main)

| Element | Desktop (1920) | Mobile (375) |
|---------|---------------:|-------------:|
| Page padding | 24px | 16px |
| Workspace max width | 1920px | 100% |
| Filter sidebar | 280px sticky | Drawer (right) |
| Main column | `1fr` | Full width stack |
| Grid gap | 16px | 16px |
| Header band | Title left / actions right | Stacked |

**CSS**: `sm:grid-cols-[280px_minmax(0,1fr)]` via `DashboardWorkspace`.

### Admin Dashboard (metrics → charts → logs)

| Band | Desktop | Mobile |
|------|---------|--------|
| Metrics | 4-column grid | 1→2 cols |
| Charts | 2/3 + 1/3 (`lg:grid-cols-3`) | Stacked |
| Logs | 2/3 + status panels | Stacked |
| Section gap | 24px | 24px |

### Card / panel hierarchy

| Elevation | Border | Shadow | Use |
|-----------|--------|--------|-----|
| `flat` | green/15 | none | Nested / quiet |
| `default` | green/30 | `0 0 20px rgba(0,255,65,0.1)` | Primary panels |
| `elevated` | green/45 | dual glow | Status / focus panels |

Shared: padding **16px**, gap **16px**, radius **2px**, border **1px**.

Component: `components/layout/DashboardPanel.tsx`.

### Data table

| Spec | Value |
|------|------:|
| Header height | 40px |
| Row height | 48px |
| Cell padding | 10px 12px |
| Min table width | 680px |
| Select col | 44px |
| Contract col | 160px |
| Type col | 120px |
| Ledger col | 96px |
| Time col | 140px |
| Tags col | 160px |
| Actions col | 88px |

Tokens: `layout.table` in `lib/design-tokens.ts`.  
CSS: `.eventTable` in `ingest-terminal.module.css`.

---

## Component map

| Concern | File |
|---------|------|
| Layout tokens | `soroscan-frontend/lib/design-tokens.ts` → `layout` |
| Workspace shell | `components/layout/DashboardWorkspace.tsx` |
| Admin bands | `AdminDashboardLayout` (same file) |
| Panel primitive | `components/layout/DashboardPanel.tsx` |
| Nav shell | `components/layout/AppShell.tsx` |
| Event Explorer | `app/dashboard/components/EventExplorerDashboard.tsx` |
| Filter sidebar | `FilterBar` `variant="sidebar"` |
| Admin page | `app/admin/page.tsx` + `app/admin/layout.tsx` |

---

## Mockups

Wireframe SVGs (placeholder content, not interactive):

- [event-explorer-desktop-1920.svg](./mockups/event-explorer-desktop-1920.svg)
- [event-explorer-mobile-375.svg](./mockups/event-explorer-mobile-375.svg)
- [admin-dashboard-desktop-1920.svg](./mockups/admin-dashboard-desktop-1920.svg)
- [admin-dashboard-mobile-375.svg](./mockups/admin-dashboard-mobile-375.svg)

Import these into Figma as SVG frames if a Figma file is required for design review.

---

## Responsive rules

1. `<640px`: hide desktop nav sidebar; hamburger + drawer. Filters → toggle + right drawer. Content stacks.
2. `≥640px`: show nav sidebar (240px) and filter sidebar (280px).
3. `≥1024px`: admin charts/logs use 3-column split.
4. Touch targets ≥44×44px on all interactive chrome.

---

## Developer checklist

- [x] Event Explorer: filter sidebar + main content
- [x] Admin Dashboard: metrics + charts + logs bands
- [x] Sidebar nav: icon + label + hover/active
- [x] Mobile stacking
- [x] Panel elevation spacing guide
- [x] Data table row/column specs
- [x] Hand-off document (this file) + SVG mockups
