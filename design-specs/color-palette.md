# SoroScan — Color Palette & Contrast Specifications

> **Theme:** Terminal / Hacker Dark  
> **Source of truth:** `soroscan-frontend/app/globals.css` (`@theme inline` block)  
> **WCAG target:** AA (4.5:1 for body text, 3:1 for large text / UI components)

---

## 1. Design Token Reference

All values are defined as CSS custom properties and mapped to Tailwind utilities.

| Token name                    | CSS variable                        | Hex value   | Tailwind class              |
|-------------------------------|-------------------------------------|-------------|------------------------------|
| Terminal Black                | `--color-terminal-black`            | `#0a0e27`   | `bg-terminal-black`          |
| Terminal Dark                 | `--color-terminal-dark`             | `#1a1f3a`   | `bg-terminal-dark`           |
| Terminal Medium               | `--color-terminal-medium`           | `#2d3748`   | `bg-terminal-medium`         |
| Terminal Green (primary)      | `--color-terminal-green`            | `#00ff41`   | `text-terminal-green`        |
| Terminal Cyan (secondary)     | `--color-terminal-cyan`             | `#00d4ff`   | `text-terminal-cyan`         |
| Terminal Danger               | `--color-terminal-danger`           | `#ff3366`   | `text-terminal-danger`       |
| Terminal Warning              | `--color-terminal-warning`          | `#ffaa00`   | `text-terminal-warning`      |
| Terminal Info                 | `--color-terminal-info`             | `#38bdf8`   | `text-terminal-info`         |
| Terminal Gray (accessible)    | `--color-terminal-gray`             | `#94a3b8`   | `text-terminal-gray`         |
| Terminal Gray Muted           | `--color-terminal-gray-muted`       | `#64748b`   | —                            |
| Terminal Light                | `--color-terminal-light`            | `#e2e8f0`   | `text-terminal-light`        |
| Terminal White                | `--color-terminal-white`            | `#f8fafc`   | `text-terminal-white`        |

---

## 2. Background Surface Scale

Surfaces layer from darkest (base) to lightest (elevated).

```
┌──────────────────────────────────────────────────────────────┐
│  Level 0 — Page background     #0a0e27  terminal-black       │
│  Level 1 — Panel / card        #1a1f3a  terminal-dark        │
│  Level 2 — Elevated panel      #2d3748  terminal-medium      │
│  Level 3 — Code block bg       #050810  (hardcoded, darkest) │
│  Level 4 — Code titlebar       #0d1120  (hardcoded)          │
└──────────────────────────────────────────────────────────────┘
```

**Figma setup:** Create a "Surfaces" frame with five stacked rectangles (W:200, H:80 each) filled with the hex values above. Label each with the token name. Use Auto Layout with 0 gap to show the progression.

---

## 3. Semantic Color Roles

| Role         | Token               | Hex       | Usage                                           |
|--------------|---------------------|-----------|-------------------------------------------------|
| Primary      | `terminal-green`    | `#00ff41` | CTAs, active states, focus rings, links         |
| Secondary    | `terminal-cyan`     | `#00d4ff` | Secondary actions, hover accents, info badges   |
| Danger       | `terminal-danger`   | `#ff3366` | Errors, destructive actions, failed status      |
| Warning      | `terminal-warning`  | `#ffaa00` | Caution states, pending status, amber alerts    |
| Info         | `terminal-info`     | `#38bdf8` | Informational UI, sky-blue callouts             |
| Neutral      | `terminal-gray`     | `#94a3b8` | Inactive text, placeholders, disabled states    |
| Neutral Muted| `terminal-gray-muted`| `#64748b`| Decorative borders, line numbers, meta text    |

---

## 4. Contrast Ratio Table

All ratios calculated against the base surface `#0a0e27` (terminal-black) using WCAG 2.1 formula.

| Foreground color          | Hex       | Contrast ratio | WCAG AA (4.5:1) | WCAG AAA (7:1) | Notes                           |
|---------------------------|-----------|----------------|-----------------|----------------|---------------------------------|
| Terminal Green            | `#00ff41` | **15.3:1**     | ✅ Pass          | ✅ Pass        | Primary text, icons, borders    |
| Terminal Cyan             | `#00d4ff` | **12.4:1**     | ✅ Pass          | ✅ Pass        | Secondary text                  |
| Terminal Warning          | `#ffaa00` | **9.8:1**      | ✅ Pass          | ✅ Pass        | Warning text on dark bg         |
| Terminal Info             | `#38bdf8` | **8.7:1**      | ✅ Pass          | ✅ Pass        | Info text                       |
| Terminal Danger           | `#ff3366` | **5.2:1**      | ✅ Pass          | ❌ Fail        | Error text — AA body text only  |
| Terminal Light            | `#e2e8f0` | **14.7:1**     | ✅ Pass          | ✅ Pass        | General body text in dark mode  |
| Terminal White            | `#f8fafc` | **16.1:1**     | ✅ Pass          | ✅ Pass        | Maximum contrast text           |
| Terminal Gray             | `#94a3b8` | **7.41:1**     | ✅ Pass          | ✅ Pass        | Muted text — AAA compliant      |
| Terminal Gray Muted       | `#64748b` | **3.99:1**     | ❌ Fail          | ❌ Fail        | Decorative only — never body text |

> **Note on Terminal Gray Muted:** `#64748b` does not meet AA for body text on `#0a0e27`. It is **decorative-only** (line numbers, faint borders). The accessible gray for readable text is `#94a3b8`.

### Contrast on Panel Surfaces

Against `#1a1f3a` (terminal-dark):

| Foreground        | Hex       | Contrast ratio | AA Pass? |
|-------------------|-----------|----------------|----------|
| Terminal Green    | `#00ff41` | 13.1:1         | ✅       |
| Terminal Cyan     | `#00d4ff` | 10.6:1         | ✅       |
| Terminal Gray     | `#94a3b8` | 6.0:1          | ✅       |
| Terminal Warning  | `#ffaa00` | 8.3:1          | ✅       |
| Terminal Danger   | `#ff3366` | 4.4:1          | ❌ (use on large text/icons only) |

---

## 5. Opacity / Alpha Variants

Used extensively for borders, hover backgrounds, and glow effects.

| Base color      | Alpha  | Usage context                              |
|-----------------|--------|--------------------------------------------|
| `terminal-green`| 5%     | Nav link hover background                  |
| `terminal-green`| 10%    | Active nav background, badge fill          |
| `terminal-green`| 15%    | Panel flat border                          |
| `terminal-green`| 20%    | Code window titlebar border                |
| `terminal-green`| 30%    | Panel default border, header border        |
| `terminal-green`| 40%    | Sidebar border                             |
| `terminal-green`| 45%    | Panel elevated border, code block border   |
| `terminal-green`| 55%    | Semantic `--border` and `--input` in dark  |
| `terminal-cyan` | 10%    | Badge secondary fill                       |
| `terminal-danger`| 10%   | Badge danger fill                          |
| `terminal-warning`| 10%  | Badge warning fill                         |

**Figma tip:** Represent alphas as solid fills with reduced opacity rather than mixing colors. Use a shared color style library with opacity overrides per token.

---

## 6. Glow / Shadow Effects

| Token                    | CSS value                                                          | Usage                        |
|--------------------------|--------------------------------------------------------------------|------------------------------|
| `--shadow-glow-green`    | `0 0 16px rgba(0,255,65,0.45), 0 0 4px rgba(0,255,65,0.35)`       | Active buttons, focus rings  |
| `--shadow-glow-cyan`     | `0 0 16px rgba(0,212,255,0.45), 0 0 4px rgba(0,212,255,0.35)`     | Cyan accent elements         |
| `--shadow-glow-danger`   | `0 0 16px rgba(255,51,102,0.4), 0 0 4px rgba(255,51,102,0.3)`     | Error states, alerts         |
| `--shadow-glow-warning`  | `0 0 16px rgba(255,170,0,0.4), 0 0 4px rgba(255,170,0,0.3)`       | Warning alerts               |
| `--shadow-card`          | `0 0 20px rgba(0,255,65,0.1)`                                      | Default panel card shadow    |
| Panel default            | `0 0 20px rgba(0,255,65,0.1)`                                      | `DashboardPanel` default     |
| Panel elevated           | `0 0 24px rgba(0,255,65,0.16), 0 0 4px rgba(0,255,65,0.2)`        | `DashboardPanel` elevated    |
| Nav link active          | `0 0 12px rgba(0,255,65,0.15)`                                     | Sidebar active nav item      |

**Figma setup:** Create Drop Shadow effect styles for each glow token. Name them `glow/green`, `glow/cyan`, `glow/danger`, `glow/warning`, `glow/card`.

---

## 7. Syntax Highlighting Palette

Used in `CodeBlock` component. Background: `#050810`.

| Token type   | Color     | Hex       |
|--------------|-----------|-----------|
| Keyword      | Cyan      | `#00d4ff` |
| String       | Light green | `#a8ff78` |
| Comment      | Muted gray | `#4a5568` |
| Number       | Amber     | `#ffaa00` |
| Boolean      | Magenta   | `#ff66ff` |
| Null         | Gray      | `#888888` |
| Function     | Green     | `#00ff41` |
| Property     | Teal      | `#00ff9c` |
| Punctuation  | Slate     | `#8892a4` |
| Operator     | Cyan      | `#00d4ff` |
| Type         | Purple    | `#a855f7` |
| Variable     | Light     | `#e2e8f0` |
| Meta         | Steel blue | `#7ba8b5` |
| Body text    | Muted blue | `#b8c5d6` |

---

## 8. Figma Color Style Setup

Create a Figma color library with the following style hierarchy:

```
Brand/
  terminal-green      #00ff41
  terminal-cyan       #00d4ff

Surface/
  black               #0a0e27
  dark                #1a1f3a
  medium              #2d3748
  code-base           #050810
  code-header         #0d1120

Semantic/
  primary             #00ff41
  secondary           #00d4ff
  danger              #ff3366
  warning             #ffaa00
  info                #38bdf8
  neutral             #94a3b8
  neutral-muted       #64748b
  light               #e2e8f0
  white               #f8fafc

Syntax/
  keyword             #00d4ff
  string              #a8ff78
  comment             #4a5568
  number              #ffaa00
  boolean             #ff66ff
  function            #00ff41
  property            #00ff9c
  type                #a855f7
  variable            #e2e8f0
  body                #b8c5d6
  meta                #7ba8b5

Interactive/
  focus-ring          #00ff41  (2px solid, 2px offset)
  hover-bg-green      #00ff41  @ 5% opacity
  active-bg-green     #00ff41  @ 10% opacity
  border-default      #00ff41  @ 30% opacity
  border-elevated     #00ff41  @ 45% opacity

Status/
  active-dot          #00ff41
  failed-dot          #ff3366
  pending-dot         #ffaa00
  inactive-dot        #94a3b8
```

---

## 9. Dark Mode Semantic Mappings

These are the Shadcn/Radix CSS variable overrides applied when `.dark` class is present.

| Semantic var       | Dark mode value         |
|--------------------|-------------------------|
| `--background`     | `#0a0e27`               |
| `--foreground`     | `#00ff41`               |
| `--card`           | `#0a0e27`               |
| `--primary`        | `#00ff41`               |
| `--primary-foreground` | `#0a0e27`           |
| `--secondary`      | `#00d4ff`               |
| `--muted`          | `#1a1f3a`               |
| `--muted-foreground` | `#94a3b8`             |
| `--destructive`    | `#ff3366`               |
| `--ring`           | `#00ff41`               |
| `--border`         | `#00ff41` @ ~55%        |
| `--input`          | `#00ff41` @ ~55%        |

---

*Last updated: 2026-07-29 | Source: `soroscan-frontend/app/globals.css`*
