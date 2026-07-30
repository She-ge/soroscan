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
import { useState } from "react";
import { useRouter } from "next/navigation";
import ContractDependencyGraph, { GraphNode, GraphEdge } from "@/components/graph/ContractDependencyGraph";

const mockNodes: GraphNode[] = [
  { id: "Router", label: "Router", status: "healthy" },
  { id: "Vault", label: "Vault", status: "healthy" },
  { id: "Oracle", label: "Oracle", status: "degraded" },
  { id: "Token", label: "Token", status: "healthy" },
  { id: "FeeCollector", label: "FeeCollector", status: "healthy" },
  { id: "Treasury", label: "Treasury", status: "healthy" },
  { id: "PriceFeed", label: "PriceFeed", status: "failed" },
];

const mockEdges: GraphEdge[] = [
  { from: "Router", to: "Vault", calls: 1820 },
  { from: "Router", to: "Oracle", calls: 910 },
  { from: "Vault", to: "Token", calls: 2210 },
  { from: "Vault", to: "FeeCollector", calls: 640 },
  { from: "FeeCollector", to: "Treasury", calls: 620 },
  { from: "Oracle", to: "PriceFeed", calls: 905 },
];

export default function ContractDependenciesPage() {
  const router = useRouter();
  const [layout, setLayout] = useState<"cose" | "breadthfirst" | "circle">("cose");

  const handleNodeClick = (nodeId: string) => {
    // Navigate to contract details page
    router.push(`/contracts/${nodeId}`);
  };

  return (
    <main className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs text-terminal-gray tracking-[0.2em]">[INTERACTIVE_DEPENDENCY_GRAPH]</p>
          <h1 className="text-3xl mt-2">Contract Call Dependency Explorer</h1>
          <p className="text-sm text-terminal-gray mt-2">
            Pan and zoom the graph. Hover over a node to highlight its dependencies. Click a node to view its details.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <aside className="rounded border border-terminal-green/20 p-4 lg:col-span-1 flex flex-col space-y-6">
            <div>
              <h2 className="text-sm text-terminal-gray mb-3 uppercase tracking-widest">Layout</h2>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as any)}
                className="w-full rounded border border-terminal-green/30 bg-black/60 px-3 py-2 text-sm text-terminal-green outline-none focus:border-terminal-green"
              >
                <option value="cose">Force Directed</option>
                <option value="breadthfirst">Hierarchical</option>
                <option value="circle">Circular</option>
              </select>
            </div>

            <div>
              <h2 className="text-sm text-terminal-gray mb-3 uppercase tracking-widest">Legend</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <span>Healthy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <span>Degraded</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <span>Failed</span>
                </li>
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <ContractDependencyGraph
              nodes={mockNodes}
              edges={mockEdges}
              layout={layout}
              onNodeClick={handleNodeClick}
            />
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
