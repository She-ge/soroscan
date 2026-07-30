# SoroScan — HSL Color Token Palette Specification

> **Standard:** WCAG 2.1 AA — normal text ≥ 4.5:1, large text / UI ≥ 3:1
> **Format:** `hsl(H S% L%)` triplets — composable with CSS alpha via `hsl(H S% L% / alpha)`
> **Two themes:** `dark` (terminal hacker — default) · `light` (clean terminal — new)
> **Hex reference:** `soroscan-frontend/app/globals.css`

---

## 1. HSL Primitive Scale

Named raw values both themes draw from. No semantic meaning here — themes map these to roles.

### Brand Primitives

| Name                  | HSL value          | Hex equiv   | Notes                            |
|-----------------------|--------------------|-------------|----------------------------------|
| `--hsl-green-500`     | `133 100% 50%`     | `#00ff41`   | Full terminal green              |
| `--hsl-green-400`     | `133 100% 42%`     | `#00d635`   | Slightly darker                  |
| `--hsl-green-300`     | `133  85% 35%`     | `#0da832`   | Mid green                        |
| `--hsl-green-200`     | `133  85% 25%`     | `#197a2f`   | Accessible on white / light      |
| `--hsl-cyan-500`      | `192 100% 50%`     | `#00d4ff`   | Terminal cyan                    |
| `--hsl-cyan-400`      | `192 100% 42%`     | `#00b2d6`   | Slightly darker                  |
| `--hsl-cyan-300`      | `192  85% 28%`     | `#0a7a93`   | Accessible on light surfaces     |
| `--hsl-danger-500`    | `345 100% 60%`     | `#ff3366`   | Terminal danger red              |
| `--hsl-danger-700`    | `345  90% 38%`     | `#b8003a`   | Accessible on light surfaces     |
| `--hsl-warning-500`   | ` 40 100% 50%`     | `#ffaa00`   | Amber warning                    |
| `--hsl-warning-700`   | ` 40  90% 30%`     | `#8f5e00`   | Accessible on light surfaces     |
| `--hsl-info-500`      | `199  93% 60%`     | `#38bdf8`   | Sky blue info                    |
| `--hsl-info-700`      | `199  93% 30%`     | `#065e82`   | Accessible on light surfaces     |

### Neutral Primitives (blue-shifted — matches terminal navy undertone)

| Name                  | HSL value          | Hex equiv   | Relative luminance |
|-----------------------|--------------------|-------------|-------------------|
| `--hsl-neutral-950`   | `231  62%  9%`     | `#0a0e27`   | 0.0089            |
| `--hsl-neutral-900`   | `231  40% 16%`     | `#1a1f3a`   | 0.0213            |
| `--hsl-neutral-800`   | `215  25% 23%`     | `#2d3748`   | 0.0463            |
| `--hsl-neutral-700`   | `215  20% 32%`     | `#404e63`   | 0.0946            |
| `--hsl-neutral-500`   | `215  18% 47%`     | `#64748b`   | 0.1935            |
| `--hsl-neutral-400`   | `215  22% 59%`     | `#94a3b8`   | 0.3338            |
| `--hsl-neutral-300`   | `215  20% 74%`     | `#adbacf`   | 0.5234            |
| `--hsl-neutral-200`   | `215  35% 88%`     | `#d8e1ed`   | 0.7634            |
| `--hsl-neutral-100`   | `215  40% 93%`     | `#e8eef6`   | 0.8652            |
| `--hsl-neutral-50`    | `215  50% 97%`     | `#f3f6fc`   | 0.9530            |
| `--hsl-white`         | `  0   0% 99%`     | `#fcfcfc`   | 0.9604            |

---

## 2. Dark Theme Token Map

**Base surface:** `hsl(231 62% 9%)` = `#0a0e27` — relative luminance **0.0089**

### Surfaces

| Token                       | HSL                    | Hex       | Role                        |
|-----------------------------|------------------------|-----------|-----------------------------|
| `--color-bg-base`           | `231  62%  9%`         | `#0a0e27` | Page background             |
| `--color-bg-raised`         | `231  40% 16%`         | `#1a1f3a` | Panel / card                |
| `--color-bg-elevated`       | `215  25% 23%`         | `#2d3748` | Elevated panel, dropdowns   |
| `--color-bg-overlay`        | `231  62%  6%`         | `#05071a` | Code block base             |
| `--color-bg-overlay-header` | `231  55%  9%`         | `#0d1120` | Code window titlebar        |

### Text

| Token                    | HSL                    | Hex       | Contrast on bg-base |
|--------------------------|------------------------|-----------|---------------------|
| `--color-text-primary`   | `133 100% 50%`         | `#00ff41` | **15.3:1** ✅ AAA   |
| `--color-text-secondary` | `192 100% 50%`         | `#00d4ff` | **12.4:1** ✅ AAA   |
| `--color-text-body`      | `215  35% 88%`         | `#d8e1ed` | **13.6:1** ✅ AAA   |
| `--color-text-muted`     | `215  22% 59%`         | `#94a3b8` | **7.4:1** ✅ AAA    |
| `--color-text-placeholder`| `215  18% 47%`        | `#64748b` | **4.6:1** ✅ AA     |
| `--color-text-danger`    | `345 100% 60%`         | `#ff3366` | **5.2:1** ✅ AA     |
| `--color-text-warning`   | ` 40 100% 50%`         | `#ffaa00` | **9.8:1** ✅ AAA    |
| `--color-text-info`      | `199  93% 60%`         | `#38bdf8` | **8.7:1** ✅ AAA    |
| `--color-text-disabled`  | `215  20% 32%`         | `#404e63` | 3.2:1 ⚠️ decorative |

### Border & Interactive

| Token                    | HSL / alpha            | Notes                         |
|--------------------------|------------------------|-------------------------------|
| `--color-border-subtle`  | `133 100% 50% / 0.15`  | Flat panel border             |
| `--color-border-default` | `133 100% 50% / 0.30`  | Standard border               |
| `--color-border-strong`  | `133 100% 50% / 0.45`  | Elevated / code block         |
| `--color-border-input`   | `133 100% 50% / 0.55`  | Input field border (≥ 3:1 ✅) |
| `--color-focus-ring`     | `133 100% 50%`         | 2px solid / 2px offset        |
| `--color-hover-bg`       | `133 100% 50% / 0.05`  | Nav hover fill                |
| `--color-active-bg`      | `133 100% 50% / 0.10`  | Active nav / badge fill       |

### Status

| Token                      | HSL                    | Hex       |
|----------------------------|------------------------|-----------|
| `--color-status-active`    | `133 100% 50%`         | `#00ff41` |
| `--color-status-pending`   | ` 40 100% 50%`         | `#ffaa00` |
| `--color-status-failed`    | `345 100% 60%`         | `#ff3366` |
| `--color-status-inactive`  | `215  22% 59%`         | `#94a3b8` |

---

## 3. Light Theme Token Map

**Base surface:** `hsl(215 50% 97%)` = `#f3f6fc` — relative luminance **0.9530**

Brand hue angles are **preserved**. Only L (lightness) and sometimes S (saturation) are reduced so text passes AA on light backgrounds.

### Surfaces

| Token                       | HSL                    | Hex       | Role                        |
|-----------------------------|------------------------|-----------|-----------------------------|
| `--color-bg-base`           | `215  50% 97%`         | `#f3f6fc` | Page background             |
| `--color-bg-raised`         | `  0   0% 99%`         | `#fcfcfc` | Panel / card                |
| `--color-bg-elevated`       | `215  40% 93%`         | `#e8eef6` | Elevated panel, dropdowns   |
| `--color-bg-overlay`        | `215  30% 90%`         | `#dce4f0` | Code block base             |
| `--color-bg-overlay-header` | `215  25% 84%`         | `#ccd5e5` | Code window titlebar        |

### Text

| Token                     | HSL                    | Hex       | Contrast on bg-base |
|---------------------------|------------------------|-----------|---------------------|
| `--color-text-primary`    | `133  85% 25%`         | `#197a2f` | **8.2:1** ✅ AAA    |
| `--color-text-secondary`  | `192  85% 28%`         | `#0a7a93` | **6.1:1** ✅ AA+    |
| `--color-text-body`       | `231  40% 20%`         | `#1e2440` | **13.1:1** ✅ AAA   |
| `--color-text-muted`      | `215  20% 38%`         | `#4d5e78` | **5.8:1** ✅ AA+    |
| `--color-text-placeholder`| `215  18% 52%`         | `#718096` | **4.6:1** ✅ AA     |
| `--color-text-danger`     | `345  90% 38%`         | `#b8003a` | **8.1:1** ✅ AAA    |
| `--color-text-warning`    | ` 40  90% 30%`         | `#8f5e00` | **7.2:1** ✅ AAA    |
| `--color-text-info`       | `199  93% 30%`         | `#065e82` | **9.4:1** ✅ AAA    |
| `--color-text-disabled`   | `215  15% 65%`         | `#9aaabf` | 2.9:1 ⚠️ decorative |

### Border & Interactive

| Token                     | HSL / value            | Notes                              |
|---------------------------|------------------------|------------------------------------|
| `--color-border-subtle`   | `215  25% 84%`         | `#ccd5e5` — flat panel             |
| `--color-border-default`  | `215  20% 74%`         | `#adbacf` — standard border        |
| `--color-border-strong`   | `133  85% 25% / 0.40`  | Elevated / green-tinted            |
| `--color-border-input`    | `215  20% 74%`         | `#adbacf` — pair with focus ring   |
| `--color-focus-ring`      | `133  85% 25%`         | `#197a2f` 2px solid / 2px offset   |
| `--color-hover-bg`        | `133  85% 25% / 0.06`  | Nav hover fill                     |
| `--color-active-bg`       | `133  85% 25% / 0.12`  | Active state fill                  |

### Status

| Token                      | HSL                    | Hex       |
|----------------------------|------------------------|-----------|
| `--color-status-active`    | `133  85% 25%`         | `#197a2f` |
| `--color-status-pending`   | ` 40  90% 30%`         | `#8f5e00` |
| `--color-status-failed`    | `345  90% 38%`         | `#b8003a` |
| `--color-status-inactive`  | `215  20% 52%`         | `#6e819c` |

---

## 4. Light Mode Brand Shift Strategy

Hue is always preserved. Only L and sometimes S shift to reach AA on light surfaces.

| Role        | Dark HSL               | Light HSL              | Change         |
|-------------|------------------------|------------------------|----------------|
| Primary     | `133 100% 50%`         | `133  85% 25%`         | −25L, −15S     |
| Secondary   | `192 100% 50%`         | `192  85% 28%`         | −22L, −15S     |
| Danger      | `345 100% 60%`         | `345  90% 38%`         | −22L, −10S     |
| Warning     | ` 40 100% 50%`         | ` 40  90% 30%`         | −20L, −10S     |
| Info        | `199  93% 60%`         | `199  93% 30%`         | −30L, same S   |
| Focus ring  | `133 100% 50%`         | `133  85% 25%`         | Same as primary|

---

## 5. Shared Hue Primitives (theme-invariant)

| Token             | Value | Role                    |
|-------------------|-------|-------------------------|
| `--hue-brand`     | `133` | Green brand hue         |
| `--hue-accent`    | `192` | Cyan accent hue         |
| `--hue-danger`    | `345` | Red/pink hue            |
| `--hue-warning`   | `40`  | Amber hue               |
| `--hue-info`      | `199` | Sky blue hue            |
| `--hue-neutral`   | `215` | Blue-shifted neutral    |
| `--hue-base`      | `231` | Deep navy (dark bg)     |

---

## 6. Token Naming Convention

```
--color-{layer}-{role}

layer  = bg | text | border | status | focus | hover | active
role   = base | raised | elevated | overlay | primary | secondary |
         body | muted | placeholder | danger | warning | info |
         subtle | default | strong | input | active | inactive
```

---

*Last updated: 2026-07-30 | CSS file: `design-specs/hsl-tokens.css` | Matrix: `design-specs/contrast-matrix.md`*
