"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DashboardWorkspaceProps {
  /** Compact page header (title + meta) */
  header?: React.ReactNode;
  /** Desktop filter sidebar / mobile stacked filters */
  sidebar: React.ReactNode;
  /** Main content column (table, charts, logs) */
  children: React.ReactNode;
  className?: string;
  /** Accessible name for the workspace landmark */
  "aria-label"?: string;
}

/**
 * Event Explorer / dashboard information architecture (#910).
 *
 * Desktop (≥640px): filter sidebar (280px) + main content grid.
 * Mobile (<640px): stacked — filters collapse to toggle, then content.
 */
export function DashboardWorkspace({
  header,
  sidebar,
  children,
  className,
  "aria-label": ariaLabel = "Dashboard workspace",
}: DashboardWorkspaceProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 sm:p-6 w-full max-w-[1920px] mx-auto",
        className,
      )}
      data-testid="dashboard-workspace"
      aria-label={ariaLabel}
    >
      {header ? (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-terminal-green/20 pb-4">
          {header}
        </header>
      ) : null}

      <div
        className={cn(
          "grid gap-4 items-start",
          /* Filter sidebar + main: 280px | 1fr on tablet+, stacked on mobile */
          "grid-cols-1 sm:grid-cols-[280px_minmax(0,1fr)]",
        )}
        data-testid="dashboard-workspace-grid"
      >
        <aside
          className="min-w-0 sm:sticky sm:top-[76px] sm:self-start"
          aria-label="Filters"
          data-testid="dashboard-filter-sidebar"
        >
          {sidebar}
        </aside>

        <div
          className="min-w-0 flex flex-col gap-4"
          data-testid="dashboard-main-content"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export interface AdminDashboardLayoutProps {
  header: React.ReactNode;
  metrics: React.ReactNode;
  charts: React.ReactNode;
  logs: React.ReactNode;
  className?: string;
}

/**
 * Admin Dashboard IA (#910): metrics → charts → logs, stacking on mobile.
 */
export function AdminDashboardLayout({
  header,
  metrics,
  charts,
  logs,
  className,
}: AdminDashboardLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 p-4 sm:p-6 w-full max-w-7xl mx-auto",
        className,
      )}
      data-testid="admin-dashboard-layout"
      aria-label="Admin dashboard"
    >
      <header className="border-b border-terminal-green/20 pb-6">{header}</header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Key metrics"
        data-testid="admin-metrics"
      >
        {metrics}
      </section>

      <section
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        aria-label="Charts and stats"
        data-testid="admin-charts-row"
      >
        {charts}
      </section>

      <section
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        aria-label="Logs and system health"
        data-testid="admin-logs-row"
      >
        {logs}
      </section>
    </div>
  );
}
