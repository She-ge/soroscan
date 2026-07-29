# Design Tokens — Visual Refinement (#909)

## Spacing scale

| Token | Rem | Px |
|-------|-----|----|
| `xs` | 0.25rem | 4 |
| `sm` | 0.5rem | 8 |
| `md` | 0.75rem | 12 |
| `lg` | 1rem | 16 |
| `xl` | 1.5rem | 24 |
| `2xl` | 2rem | 32 |

CSS: `--spacing-terminal-*` in `soroscan-frontend/app/globals.css`  
JS: `lib/design-tokens.ts` → `spacing`

## Typography hierarchy

| Level | Size | Weight | Line-height | Family |
|-------|------|--------|-------------|--------|
| H1 | 32px | 600 | 1.25 | JetBrains Mono |
| H2 | 24px | 600 | 1.3 | JetBrains Mono |
| H3 | 18px | 600 | 1.35 | IBM Plex Sans |
| Body | 14px | 400 | 1.55 | IBM Plex Sans |
| Caption | 12px | 400 | 1.4 | IBM Plex Sans |

## Color palette (semantic)

| Token | Hex | Use |
|-------|-----|-----|
| `terminal-black` | `#0a0e27` | Background |
| `terminal-dark` | `#1a1f3a` | Elevated surfaces |
| `terminal-green` / success | `#00ff41` | Primary / success |
| `terminal-cyan` | `#00d4ff` | Secondary accent |
| `terminal-info` | `#38bdf8` | Informational |
| `terminal-warning` | `#ffaa00` | Warning |
| `terminal-danger` / error | `#ff3366` | Error / destructive |
| `terminal-gray` | `#94a3b8` | Muted text (AA+) |

## Component sizing

| Control | Height |
|---------|--------|
| sm | 36px |
| md (default) | 44px (touch minimum) |
| lg | 48px |

## Glow effects

Refined box-shadows use a dual-layer glow (outer bloom + inner core) for green, cyan, danger, and warning. See `--shadow-glow-*` and `glows` in `lib/design-tokens.ts`.

## Before / after

| Area | Before | After |
|------|--------|-------|
| Muted text | `#64748b` (3.99:1 FAIL) | `#94a3b8` (7.41:1 PASS) |
| Glow | Single 20px bloom | Dual-layer calibrated glow |
| Spacing | Ad-hoc | Documented xs→2xl scale |
| Type | Partial | Full H1–Caption tokens |
| Controls | Mixed heights | sm/md/lg + 44px touch min |

## Export

- CSS variables: `app/globals.css` (`@theme inline` + `:root`)
- Tailwind theme hooks: `--color-terminal-*`, `--spacing-terminal-*`, `--animate-terminal-*`
- TypeScript: `lib/design-tokens.ts`
- Layout / IA tokens (#910): `layout` export — see [DASHBOARD_LAYOUT_IA.md](./DASHBOARD_LAYOUT_IA.md)
