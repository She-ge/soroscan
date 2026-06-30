"use client";

import * as React from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "details > summary",
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  ).filter((el) => !el.closest("[hidden]"));
}

export interface UseFocusTrapOptions {
  /** Whether the trap is currently active */
  active: boolean;
  /** Ref to the container element that focus should be trapped within */
  containerRef: React.RefObject<HTMLElement | null>;
}

export function useFocusTrap({ active, containerRef }: UseFocusTrapOptions): void {
  // Store the element that had focus before the trap activated
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Capture the previously focused element when the trap activates
  React.useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [active]);

  // Set initial focus on the first focusable element when the trap activates
  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      // Fallback: focus the container itself so keyboard events are received
      containerRef.current.focus();
    }
  }, [active, containerRef]);

  // Trap Tab / Shift+Tab within the container
  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !containerRef.current) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab — if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab — if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);

  // Restore focus to the previously focused element when the trap deactivates
  React.useEffect(() => {
    if (active) return;

    const target = previousFocusRef.current;
    if (target && typeof target.focus === "function") {
      // Defer slightly so the DOM settles before restoring focus
      const id = window.setTimeout(() => target.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [active]);
}
