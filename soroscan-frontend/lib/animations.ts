/**
 * Terminal UI animation timing, easing, and performance guidelines (#911).
 */

import type { CSSProperties } from "react";

export const durations = {
  fast: 100,
  normal: 300,
  slow: 500,
} as const;

export const easings = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  elastic: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export type MotionDuration = keyof typeof durations;
export type MotionEasing = keyof typeof easings;

export function motionStyle(
  duration: MotionDuration = "normal",
  easing: MotionEasing = "standard",
  property = "all",
): CSSProperties {
  return {
    transitionProperty: property,
    transitionDuration: `${durations[duration]}ms`,
    transitionTimingFunction: easings[easing],
  };
}

/** Prefer GPU-composited properties for 60fps terminal motion. */
export const GPU_SAFE_PROPERTIES = [
  "transform",
  "opacity",
  "filter",
] as const;

export const animationClassNames = {
  fadeIn: "animate-terminal-fade-in",
  scaleIn: "animate-terminal-scale-in",
  cursor: "animate-terminal-cursor",
  pulse: "animate-terminal-pulse",
  alertPulse: "animate-terminal-alert-pulse",
  successPop: "animate-terminal-success-pop",
  shimmer: "animate-shimmer",
} as const;
