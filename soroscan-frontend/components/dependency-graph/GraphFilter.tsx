"use client";

import { useCallback } from "react";
import { useDependencyGraphStore } from "./store";
import type { VulnerabilitySeverity } from "./types";
import { severityNodeColor } from "./types";

const SEVERITY_OPTIONS: Array<{ value: VulnerabilitySeverity | "ALL"; label: string }> = [
  { value: "ALL", label: "All Severities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
  { value: "NONE", label: "None (Healthy)" },
];

/**
 * GraphFilter — search input + severity dropdown for filtering the graph.
 * Shows active contract count and a reset button.
 */
export function GraphFilter() {
  const filterName = useDependencyGraphStore((s) => s.filterName);
  const filterSeverity = useDependencyGraphStore((s) => s.filterSeverity);
  const setFilterName = useDependencyGraphStore((s) => s.setFilterName);
  const setFilterSeverity = useDependencyGraphStore((s) => s.setFilterSeverity);
  const contracts = useDependencyGraphStore((s) => s.contracts);
  const nodes = useDependencyGraphStore((s) => s.nodes);
  const viewMode = useDependencyGraphStore((s) => s.viewMode);
  const setViewMode = useDependencyGraphStore((s) => s.setViewMode);

  const handleReset = useCallback(() => {
    setFilterName("");
    setFilterSeverity("ALL");
  }, [setFilterName, setFilterSeverity]);

  const isFiltered = filterName !== "" || filterSeverity !== "ALL";
  const visibleCount = nodes.length;
  const totalCount = contracts.length;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-terminal-green/10"
      role="search"
      aria-label="Filter contracts"
    >
      {/* Contract name search */}
      <div className="relative flex-1 min-w-48">
        <label htmlFor="graph-filter-name" className="sr-only">
          Filter by contract name
        </label>
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-gray text-xs pointer-events-none"
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          id="graph-filter-name"
          type="search"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="Filter by contract name…"
          className="w-full bg-terminal-dark border border-terminal-green/20 rounded px-2 py-1 pl-7 text-xs font-mono text-terminal-white placeholder-terminal-gray focus:outline-none focus:border-terminal-cyan transition-colors"
          aria-label="Filter by contract name"
        />
      </div>

      {/* Severity filter */}
      <div className="relative">
        <label htmlFor="graph-filter-severity" className="sr-only">
          Filter by severity
        </label>
        <select
          id="graph-filter-severity"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as VulnerabilitySeverity | "ALL")}
          className="bg-terminal-dark border border-terminal-green/20 rounded px-2 py-1 text-xs font-mono text-terminal-white focus:outline-none focus:border-terminal-cyan appearance-none pr-6 cursor-pointer transition-colors"
          aria-label="Filter by severity"
          style={{
            color:
              filterSeverity !== "ALL"
                ? severityNodeColor(filterSeverity as VulnerabilitySeverity).text
                : undefined,
          }}
        >
          {SEVERITY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 text-terminal-gray text-[10px] pointer-events-none"
          aria-hidden="true"
        >
          ▼
        </span>
      </div>

      {/* View mode toggle */}
      <div className="flex rounded border border-terminal-green/20 overflow-hidden text-xs font-mono">
        <button
          type="button"
          onClick={() => setViewMode("graph")}
          className={`px-2.5 py-1 transition-colors focus:outline-none ${
            viewMode === "graph"
              ? "bg-terminal-green/20 text-terminal-green"
              : "text-terminal-gray hover:text-terminal-white"
          }`}
          aria-pressed={viewMode === "graph"}
          aria-label="Graph view"
        >
          Graph
        </button>
        <button
          type="button"
          onClick={() => setViewMode("tree")}
          className={`px-2.5 py-1 border-l border-terminal-green/20 transition-colors focus:outline-none ${
            viewMode === "tree"
              ? "bg-terminal-green/20 text-terminal-green"
              : "text-terminal-gray hover:text-terminal-white"
          }`}
          aria-pressed={viewMode === "tree"}
          aria-label="Tree view"
        >
          Tree
        </button>
      </div>

      {/* Contract count */}
      <span className="text-[11px] font-mono text-terminal-gray whitespace-nowrap">
        {visibleCount}/{totalCount}
      </span>

      {/* Reset button */}
      {isFiltered && (
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-mono text-terminal-danger border border-terminal-danger/30 px-2 py-0.5 rounded hover:bg-terminal-danger/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-danger"
          aria-label="Reset all filters"
        >
          ✕ Reset
        </button>
      )}
    </div>
  );
}

export default GraphFilter;
