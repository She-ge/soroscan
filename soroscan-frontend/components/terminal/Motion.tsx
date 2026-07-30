"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TerminalCursorProps {
  className?: string;
  /** Blink period; prefers-reduced-motion disables animation via CSS. */
  active?: boolean;
}

/** Classic terminal block cursor for inputs and prompts. */
export function TerminalCursor({
  className,
  active = true,
}: TerminalCursorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[1.1em] w-[0.55em] translate-y-[0.1em] bg-terminal-green align-baseline",
        active && "animate-terminal-cursor",
        className,
      )}
    />
  );
}

interface StatusBurstProps {
  tone: "success" | "error";
  label: string;
  className?: string;
}

/** Success check / error X with terminal micro-animation. */
export function StatusBurst({ tone, label, className }: StatusBurstProps) {
  const isSuccess = tone === "success";
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 font-terminal-mono text-sm",
        isSuccess
          ? "text-terminal-green animate-terminal-success-pop"
          : "text-terminal-danger animate-terminal-alert-pulse",
        className,
      )}
    >
      <span aria-hidden="true" className="text-base font-bold">
        {isSuccess ? "✓" : "✕"}
      </span>
      {label}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function TerminalProgressBar({
  value,
  label = "Loading",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full space-y-2 font-terminal-mono", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="flex justify-between text-caption text-terminal-gray">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 overflow-hidden border border-terminal-green/40 bg-terminal-dark">
        <div
          className="h-full bg-terminal-green shadow-glow-green transition-terminal-normal gpu-accelerate"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface PulseDotProps {
  className?: string;
  label?: string;
}

export function PulseDot({ className, label = "Live" }: PulseDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="h-2 w-2 rounded-full bg-terminal-green shadow-glow-green animate-terminal-pulse"
        aria-hidden="true"
      />
      <span className="text-caption text-terminal-gray">{label}</span>
    </span>
  );
}
