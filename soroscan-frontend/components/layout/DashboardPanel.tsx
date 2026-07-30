"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DashboardPanelElevation = "flat" | "default" | "elevated";

export interface DashboardPanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual hierarchy level for borders/shadows */
  elevation?: DashboardPanelElevation;
  /** Optional panel title rendered in the header band */
  title?: string;
  /** Optional actions aligned to the title row */
  actions?: React.ReactNode;
  as?: "section" | "aside" | "div" | "article";
}

const elevationClass: Record<DashboardPanelElevation, string> = {
  flat: "border-terminal-green/15 shadow-none bg-terminal-black/40",
  default:
    "border-terminal-green/30 shadow-[0_0_20px_rgba(0,255,65,0.1)] bg-terminal-black/60",
  elevated:
    "border-terminal-green/45 shadow-[0_0_24px_rgba(0,255,65,0.16),0_0_4px_rgba(0,255,65,0.2)] bg-terminal-dark/80",
};

/**
 * Shared card/panel shell for dashboard IA (#910).
 * Spacing: 16px padding, 16px internal gap, 1px border.
 */
export function DashboardPanel({
  elevation = "default",
  title,
  actions,
  as: Comp = "section",
  className,
  children,
  ...props
}: DashboardPanelProps) {
  return (
    <Comp
      className={cn(
        "rounded-sm border p-4 flex flex-col gap-4 min-w-0",
        elevationClass[elevation],
        className,
      )}
      data-elevation={elevation}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 min-h-[28px]">
          {title ? (
            <h2 className="text-xs font-bold uppercase tracking-widest text-terminal-green m-0">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {actions ? (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          ) : null}
        </div>
      )}
      {children}
    </Comp>
  );
}
