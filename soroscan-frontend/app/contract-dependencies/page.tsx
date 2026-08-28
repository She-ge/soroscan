"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDependencyGraphStore } from "@/components/dependency-graph/store";
import { DependencyTreeView } from "@/components/dependency-graph/DependencyTreeView";
import { VulnerabilityImpactPanel } from "@/components/dependency-graph/VulnerabilityImpactPanel";
import { DependencyStackPanel } from "@/components/dependency-graph/DependencyStackPanel";
import { GraphFilter } from "@/components/dependency-graph/GraphFilter";
import { GraphExporter } from "@/components/dependency-graph/GraphExporter";

// Dynamically import ReactFlow-based graph (SSR incompatible)
const DependencyGraph = dynamic(
  () =>
    import("@/components/dependency-graph/DependencyGraph").then(
      (m) => m.DependencyGraph,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-terminal-gray text-sm font-mono">
        <span className="animate-pulse">Loading graph…</span>
      </div>
    ),
  },
);

type SideTab = "impact" | "stack";

export default function ContractDependenciesPage() {
  const loadMockData = useDependencyGraphStore((s) => s.loadMockData);
  const viewMode = useDependencyGraphStore((s) => s.viewMode);
  const contracts = useDependencyGraphStore((s) => s.contracts);
  const selectedId = useDependencyGraphStore((s) => s.selectedContractId);
  const [sideTab, setSideTab] = useState<SideTab>("impact");

  // Load mock data on mount (will be replaced by Apollo query once backend is live)
  useEffect(() => {
    loadMockData();
  }, [loadMockData]);

  const selectedContract = contracts.find((c) => c.id === selectedId);

  return (
    <main
      className="min-h-screen bg-terminal-black text-terminal-white font-mono"
      aria-label="Contract Dependency Graph"
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <header className="border-b border-terminal-green/15 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-terminal-gray tracking-[0.2em] uppercase">
            [DEPENDENCY_GRAPH]
          </p>
          <h1 className="text-lg text-terminal-green font-bold leading-tight mt-0.5">
            Contract Dependency Explorer
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-terminal-gray border border-terminal-green/15 rounded px-3 py-1">
            <span>
              <span className="text-terminal-white">{contracts.length}</span> contracts
            </span>
            <span className="text-terminal-green/30">|</span>
            <span>
              <span className="text-terminal-danger">
                {
                  contracts.filter((c) =>
                    c.vulnerabilities.some(
                      (v) => v.severity === "CRITICAL" || v.severity === "HIGH",
                    ),
                  ).length
                }
              </span>{" "}
              high-risk
            </span>
          </div>

          {/* Export */}
          <GraphExporter graphId="rf-graph-container" />
        </div>
      </header>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <GraphFilter />

      {/* ── Main content: graph + side panel ───────────────────────────── */}
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
        {/* ── Graph / Tree panel ──────────────────────────────────────── */}
        <section
          className="flex-1 min-w-0 relative"
          aria-label={viewMode === "graph" ? "Interactive dependency graph" : "Dependency tree view"}
        >
          {viewMode === "graph" ? (
            <div id="rf-graph-container" className="w-full h-full">
              <DependencyGraph graphId="rf-graph-container" />
            </div>
          ) : (
            <div className="w-full h-full overflow-auto">
              <DependencyTreeView />
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <div className="absolute bottom-4 left-4 text-[10px] text-terminal-gray font-mono opacity-60 pointer-events-none select-none">
            Click node to inspect • Scroll to zoom • Drag to pan
          </div>
        </section>

        {/* ── Right side panel ────────────────────────────────────────── */}
        <aside
          className="w-80 xl:w-96 flex-shrink-0 border-l border-terminal-green/10 flex flex-col"
          aria-label="Contract details"
        >
          {/* Side panel tab bar */}
          <div className="flex border-b border-terminal-green/10 text-xs font-mono">
            <SidePanelTab
              active={sideTab === "impact"}
              onClick={() => setSideTab("impact")}
              label="Impact"
              badge={
                selectedContract?.vulnerabilities.length
                  ? String(selectedContract.vulnerabilities.length)
                  : undefined
              }
            />
            <SidePanelTab
              active={sideTab === "stack"}
              onClick={() => setSideTab("stack")}
              label="Stack"
            />
          </div>

          {/* Side panel body */}
          <div className="flex-1 overflow-auto">
            {sideTab === "impact" ? (
              <VulnerabilityImpactPanel />
            ) : (
              <DependencyStackPanel />
            )}
          </div>

          {/* Selected contract mini footer */}
          {selectedContract && (
            <div className="border-t border-terminal-green/10 px-3 py-2 text-[10px] font-mono text-terminal-gray flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-terminal-cyan" />
              <span className="truncate">{selectedContract.address}</span>
            </div>
          )}
        </aside>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-terminal-green/10 bg-terminal-black/95 backdrop-blur-sm px-4 py-2 flex flex-wrap items-center gap-4 text-[10px] font-mono text-terminal-gray z-10">
        <span className="text-terminal-gray/60 mr-1 hidden sm:inline">Severity:</span>
        {[
          { label: "Critical/High", color: "#ff3366" },
          { label: "Medium", color: "#ffaa00" },
          { label: "Low", color: "#00d4ff" },
          { label: "Healthy", color: "#00ff41" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-terminal-gray/40 hidden md:inline">
          Edge: solid=direct · dashed=indirect · animated=circular
        </span>
      </footer>
    </main>
  );
}

function SidePanelTab({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-2 text-xs font-mono transition-colors focus:outline-none relative ${
        active
          ? "text-terminal-cyan border-b-2 border-terminal-cyan"
          : "text-terminal-gray hover:text-terminal-white border-b-2 border-transparent"
      }`}
      aria-selected={active}
      role="tab"
    >
      {label}
      {badge && (
        <span className="ml-1 text-[9px] bg-terminal-danger text-white px-1 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
