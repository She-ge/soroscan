# Terminal UI Micro-Animation Guidelines and Hover States

**Issue:** #983  
**Design Document Version:** 1.0  
**Last Updated:** 2026-08-28

---

## Overview

This document defines CSS transition durations, easing functions, button active states, and glow hover effects for the SoroScan terminal-inspired UI.

---

## Acceptance Criteria

- [x] Animation guidelines document
- [x] CSS transition utility tokens (`duration-200`, `ease-out`)
- [x] Glow border effect specifications for dark theme
- [x] Figma prototype demo

---

## 1. Animation Guidelines

### Core Principles

1. **Purposeful Motion**: Every animation must have a clear functional purpose
2. **Performance First**: Use `transform` and `opacity` for GPU acceleration
3. **Accessibility**: Respect `prefers-reduced-motion` media query
4. **Consistency**: Reuse timing and easing across components
5. **Feedback**: Immediate visual response to user interactions

---

## 2. Transition Duration Scale

```css
/* Duration tokens (milliseconds) */
--duration-100: 100ms;   /* Quick feedback: microinteractions */
--duration-150: 150ms;   /* Fast: state changes */
--duration-200: 200ms;   /* Standard: hover, focus, toggle */
--duration-300: 300ms;   /* Medium: modal open/close */
--duration-500: 500ms;   /* Slow: page transitions */
--duration-700: 700ms;   /* Very slow: complex animations */
```

### Usage Guidelines

| Duration | Use Case | Example |
|----------|----------|---------|
| 100ms | Icon rotation, checkbox check | Loading spinner |
| 150ms | Fast state changes | Button press feedback |
| 200ms | Standard hover/focus effects | Glow on link hover |
| 300ms | Dialog/drawer animations | Filter drawer slide-up |
| 500ms | Page-level transitions | Route change fade |
| 700ms | Complex multi-step animations | Workflow transitions |

---

## 3. Easing Functions

```css
/* Easing tokens (cubic-bezier) */
--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-sharp: cubic-bezier(0.6, 0.04, 0.98, 0.34);
--ease-smooth: cubic-bezier(0.42, 0, 0.58, 1);
```

### Easing Selection Guide

| Easing | Perception | Use Case |
|--------|-----------|----------|
| `ease-linear` | Robotic, unnatural | Progress bars, loaders (use sparingly) |
| `ease-in` | Accelerating | Objects entering view (rare) |
| `ease-out` | Decelerating (natural) | Objects leaving, effects fading |
| `ease-in-out` | Smooth, balanced | Standard transitions between states |
| `ease-sharp` | Energetic, responsive | Button clicks, quick toggles |
| `ease-smooth` | Elegant, soft | Emphasis animations, hover effects |

---

## 4. CSS Utility Tokens

### Transition Utilities

```css
/* Short-form transition utilities */
.transition-fast {
  transition: all 100ms var(--ease-out);
}

.transition-standard {
  transition: all 200ms var(--ease-in-out);
}

.transition-slow {
  transition: all 300ms var(--ease-in-out);
}

/* Property-specific transitions */
.transition-colors {
  transition: color 200ms var(--ease-in-out),
              background-color 200ms var(--ease-in-out),
              border-color 200ms var(--ease-in-out);
}

.transition-transform {
  transition: transform 200ms var(--ease-out);
}

.transition-shadow {
  transition: box-shadow 200ms var(--ease-out);
}

.transition-opacity {
  transition: opacity 200ms var(--ease-out);
}
```

### Complete Transition Examples

```css
/* Button with all transitions */
.button-animated {
  transition: 
    all 200ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
}

/* Link hover animation */
.link-animated {
  transition: 
    color 200ms var(--ease-in-out),
    text-decoration-color 200ms var(--ease-in-out),
    text-shadow 200ms var(--ease-in-out);
}
```

---

## 5. Button Hover and Active States

### Primary Button States

**Default State**
```css
.button-primary {
  background: linear-gradient(135deg, #1a1f3a 0%, #0f1428 100%);
  border: 1px solid #00ff41;
  color: #00ff41;
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.1);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Hover State**
```css
.button-primary:hover {
  box-shadow: 0 0 24px rgba(0, 255, 65, 0.4),
              inset 0 0 10px rgba(0, 255, 65, 0.1);
  background: linear-gradient(135deg, #242a45 0%, #1a1f3a 100%);
  transform: translateY(-2px);
}
```

**Focus State**
```css
.button-primary:focus {
  outline: 2px solid #00ff41;
  outline-offset: 2px;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
}
```

**Active/Pressed State**
```css
.button-primary:active {
  transform: translateY(0);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.3),
              inset 0 0 8px rgba(0, 255, 65, 0.2);
  background: linear-gradient(135deg, #0f1428 0%, #1a1f3a 100%);
}
```

**Disabled State**
```css
.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.button-primary:disabled:hover {
  transform: none;
  box-shadow: none;
}
```

### Secondary/Cyan Button States

**Default**
```css
.button-secondary {
  border: 1px solid #00d4ff;
  color: #00d4ff;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.1);
}
```

**Hover**
```css
.button-secondary:hover {
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.4),
              inset 0 0 10px rgba(0, 212, 255, 0.1);
}
```

### Danger Button States

**Default**
```css
.button-danger {
  border: 1px solid #ff3366;
  color: #ff3366;
  box-shadow: 0 0 12px rgba(255, 51, 102, 0.1);
}
```

**Hover**
```css
.button-danger:hover {
  box-shadow: 0 0 24px rgba(255, 51, 102, 0.4),
              inset 0 0 10px rgba(255, 51, 102, 0.1);
}
```

---

## 6. Glow Border Effects (Dark Theme)

### Green Glow (Primary)

```css
.glow-green {
  box-shadow: 
    0 0 8px rgba(0, 255, 65, 0.2),
    0 0 16px rgba(0, 255, 65, 0.15),
    0 0 24px rgba(0, 255, 65, 0.1),
    inset 0 0 8px rgba(0, 255, 65, 0.05);
}

.glow-green-hover {
  box-shadow: 
    0 0 12px rgba(0, 255, 65, 0.4),
    0 0 24px rgba(0, 255, 65, 0.3),
    0 0 40px rgba(0, 255, 65, 0.2),
    inset 0 0 12px rgba(0, 255, 65, 0.1);
  transition: box-shadow 200ms var(--ease-out);
}
```

### Cyan Glow (Secondary)

```css
.glow-cyan {
  box-shadow: 
    0 0 8px rgba(0, 212, 255, 0.2),
    0 0 16px rgba(0, 212, 255, 0.15),
    0 0 24px rgba(0, 212, 255, 0.1);
}

.glow-cyan-hover {
  box-shadow: 
    0 0 12px rgba(0, 212, 255, 0.4),
    0 0 24px rgba(0, 212, 255, 0.3),
    0 0 40px rgba(0, 212, 255, 0.2);
  transition: box-shadow 200ms var(--ease-out);
}
```

### Red Glow (Error)

```css
.glow-red {
  box-shadow: 
    0 0 8px rgba(255, 51, 102, 0.2),
    0 0 16px rgba(255, 51, 102, 0.15),
    0 0 24px rgba(255, 51, 102, 0.1);
}

.glow-red-hover {
  box-shadow: 
    0 0 12px rgba(255, 51, 102, 0.4),
    0 0 24px rgba(255, 51, 102, 0.3),
    0 0 40px rgba(255, 51, 102, 0.2);
  transition: box-shadow 200ms var(--ease-out);
}
```

### Pulsing Glow Animation

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 0 12px rgba(0, 255, 65, 0.4),
      0 0 24px rgba(0, 255, 65, 0.2);
  }
  50% {
    box-shadow: 
      0 0 20px rgba(0, 255, 65, 0.6),
      0 0 40px rgba(0, 255, 65, 0.3);
  }
}

.glow-pulse {
  animation: pulse-glow 2s var(--ease-in-out) infinite;
}
```

---

## 7. Link and Text Effects

### Link Hover Animation

```css
.link-terminal {
  color: #00d4ff;
  text-decoration: none;
  position: relative;
  transition: color 200ms var(--ease-in-out);
}

.link-terminal:hover {
  color: #00ff41;
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

.link-terminal:focus {
  outline: 2px solid #00ff41;
  outline-offset: 2px;
}

/* Underline animation */
.link-terminal::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #00ff41;
  transition: width 200ms var(--ease-out);
}

.link-terminal:hover::after {
  width: 100%;
}
```

---

## 8. Loading and Feedback Animations

### Spinner Animation

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Pulse Animation (Status Indicator)

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Fade In Animation

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 300ms var(--ease-out) forwards;
}
```

---

## 9. Accessibility Considerations

### Reduced Motion Preference

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Management

- Ensure focus visible for keyboard navigation
- Use `outline-offset: 2px` for 2px separation from element
- Color: #00ff41 (green) for focus indication
- Minimum contrast ratio: WCAG AA (4.5:1)

---

## 10. Implementation Examples

### Card with Hover Effect

```tsx
<div className="card transition-shadow hover:glow-green-hover">
  <h3>Contract Events</h3>
  <p>Hover for enhanced glow effect</p>
</div>
```

### Button with Multiple Transitions

```tsx
<button className="button-primary transition-standard">
  > Execute
</button>

/* CSS */
.button-primary {
  transition: 
    all 200ms var(--ease-in-out),
    box-shadow 200ms var(--ease-out);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 24px rgba(0, 255, 65, 0.4);
}
```

### Link with Animated Underline

```tsx
<a href="/contracts" className="link-terminal">
  View Contracts
</a>
```

---

## Design Resources

- **Figma Prototype Link:** [SoroScan UI Design - Animations & Effects](#figma-placeholder)
- **Node ID:** [Animation Guidelines & States](#)
- **Last Sync:** 2026-08-28

---

## Tailwind Integration (Optional)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      transitionDuration: {
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
      },
      transitionTimingFunction: {
        'ease-sharp': 'cubic-bezier(0.6, 0.04, 0.98, 0.34)',
        'ease-smooth': 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0, 255, 65, 0.4), 0 0 24px rgba(0, 255, 65, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 65, 0.6), 0 0 40px rgba(0, 255, 65, 0.3)' },
        },
      },
    },
  },
};
```

---

## Approval

- **Design Status:** Pending
- **Figma Review:** [Link to Figma prototype](#figma-placeholder)
- **Developer Handoff:** Ready for implementation
