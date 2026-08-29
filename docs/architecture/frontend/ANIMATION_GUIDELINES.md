# Terminal UI Animation Guidelines (#911)

## Timing scale

| Token | Duration | Use |
|-------|----------|-----|
| `fast` | 100ms | Hover color, focus ring settle |
| `normal` | 300ms | Page enter, modal, dropdown |
| `slow` | 500ms | Success pop, complex reveals |

CSS: `--duration-fast|normal|slow`  
JS: `lib/animations.ts` → `durations`

## Easing

| Name | Curve | Use |
|------|-------|-----|
| `standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |
| `inOut` | same | Symmetric enter/exit |
| `elastic` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Success pop only |

## Micro-interactions

| Pattern | Implementation |
|---------|----------------|
| Loading pulse | `.animate-terminal-pulse` / `PulseDot` |
| Shimmer skeleton | existing `.animate-shimmer` |
| Progress bar | `TerminalProgressBar` |
| Page / panel enter | `.animate-terminal-fade-in` |
| Modal scale | `.animate-terminal-scale-in` |
| Hover glow | `shadow-glow-*` + `transition-terminal-normal` |
| Success check | `StatusBurst tone="success"` |
| Error pulse | `StatusBurst tone="error"` / `.animate-terminal-alert-pulse` |
| Cursor blink | `TerminalCursor` / Input `showCursor` |

## Code examples

```tsx
import { TerminalCursor, StatusBurst, TerminalProgressBar } from "@/components/terminal/Motion";
import { motionStyle, durations } from "@/lib/animations";

<div className="animate-terminal-fade-in" style={motionStyle("normal")}>
  <TerminalProgressBar value={72} label="Indexing" />
  <StatusBurst tone="success" label="Synced" />
  Ready <TerminalCursor />
</div>
```

## Performance (60fps)

1. Animate only GPU-composited properties: `transform`, `opacity`, `filter`.
2. Prefer CSS classes over JS RAF loops for micro-interactions.
3. Use `.gpu-accelerate` sparingly (`will-change`) on active motion only.
4. Honor `prefers-reduced-motion` (global base rule disables non-essential animation).
5. Keep modal/page transitions ≤ 400ms (`normal` = 300ms).

## Hand-off checklist

- [x] Timing tokens in CSS + TS
- [x] Easing tokens documented
- [x] Loading / success / error / hover components
- [x] Cursor blink on terminal inputs
- [x] Reduced-motion support
- [x] Developer examples via `Motion.tsx` + this doc
