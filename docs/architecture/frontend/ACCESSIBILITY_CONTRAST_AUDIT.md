# Accessibility & Color Contrast Audit (#912)

## Method

Contrast ratios computed with relative luminance (WCAG 2.1) against terminal black `#0a0e27` using `lib/contrast.ts`.

## Audit results (text on terminal black)

| Pair | Foreground | Ratio | AA (4.5:1) | AAA (7:1) |
|------|------------|------:|:----------:|:---------:|
| Primary green | `#00ff41` | 13.92 | PASS | PASS |
| Cyan accent | `#00d4ff` | 10.73 | PASS | PASS |
| Danger | `#ff3366` | 5.36 | PASS | FAIL |
| Warning | `#ffaa00` | 9.96 | PASS | PASS |
| Info | `#38bdf8` | 8.87 | PASS | PASS |
| Muted text (**fixed**) | `#94a3b8` | 7.41 | PASS | PASS |
| Legacy muted (**retired for text**) | `#64748b` | 3.99 | FAIL | FAIL |
| Light text | `#e2e8f0` | 15.42 | PASS | PASS |

## Fixes applied

1. **`--color-terminal-gray`**: `#64748b` → `#94a3b8` for body/helper text.
2. Legacy `#64748b` retained as `--color-terminal-gray-muted` for decorative non-text only.
3. Light-mode `--muted-foreground` darkened to ~oklch(0.45) for AA.
4. Focus ring remains `#00ff41` (≥3:1 vs `#1a1f3a` adjacent surfaces).
5. Placeholder text uses full `text-terminal-gray` (no `/50` opacity that dropped under AA).

## Focus indicators

- Global `:focus-visible` → 2px solid terminal green, 2px offset.
- Interactive controls also use `focus-visible:ring-*` / border glow where applicable.
- Focus vs adjacent dark surface: ~11.8:1 (exceeds 3:1 non-text contrast).

## Color blindness guidance

Do not rely on color alone:

- Success/error use glyph + text (`StatusBurst`: ✓ / ✕).
- Role permissions matrix uses ✓ / — with `aria-label`.
- Status badges should pair icon + label (existing pattern).

Deuteranopia / Protanopia: green/cyan remain distinguishable by luminance; danger pink stays high-luminance vs background. Prefer cyan for secondary actions when green meaning must stay unique.

## Designer guidelines for new colors

1. Run `contrastRatio(fg, bg)` from `lib/contrast.ts` (or any WCAG calculator).
2. Normal text must be ≥ 4.5:1; large text (≥18px/14px bold) ≥ 3:1.
3. Focus / UI component boundaries ≥ 3:1 against adjacent colors.
4. Never ship opacity-reduced text below AA — adjust the solid hex instead.
5. Document new pairs in this file and `lib/design-tokens.ts` `contrastRatios`.

## Before / after

| Surface | Before | After |
|---------|--------|-------|
| Muted labels / nav idle | Unreadable gray (FAIL) | Slate-400 AA+AAA |
| Input placeholders | gray/50 | Solid accessible gray |
| Focus rings | Present | Documented ≥3:1 |
| Semantic info | Missing dedicated token | `#38bdf8` |
