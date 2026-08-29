"use client";

import { useMemo } from "react";
import { useDependencyGraphStore } from "./store";
import {
  severityNodeColor,
  getWorstSeverity,
  type ContractWithDeps,
} from "./types";

interface StackEntry {
  contract: ContractWithDeps;
  depth: number;
  direction: "dependency" | "dependent";
}

/**
 * DependencyStackPanel — shows the full dependency chain for the selected contract.
 * Two columns: upstream (what depends on this) and downstream (what this depends on).
 */
export function DependencyStackPanel() {
  const contracts = useDependencyGraphStore((s) => s.contracts);
  const selectedId = useDependencyGraphStore((s) => s.selectedContractId);
  const selectContract = useDependencyGraphStore((s) => s.selectContract);

  const selected = useMemo(
    () => contracts.find((c) => c.id === selectedId) ?? null,
    [contracts, selectedId],
  );

  /** BFS upstream: who depends on selected (transitively) */
  const upstream = useMemo((): StackEntry[] => {
    if (!selected) return [];
    const visited = new Set<string>([selected.id]);
    const result: StackEntry[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: selected.id, depth: 0 }];
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const c = contracts.find((x) => x.id === id);
      if (!c || depth > 6) continue;
      for (const dep of c.dependents) {
        const found = contracts.find((x) => x.name === dep.contractName);
        if (found && !visited.has(found.id)) {
          visited.add(found.id);
          result.push({ contract: found, depth: depth + 1, direction: "dependent" });
          queue.push({ id: found.id, depth: depth + 1 });
        }
      }
    }
    return result;
  }, [selected, contracts]);

  /** BFS downstream: what selected depends on (transitively) */
  const downstream = useMemo((): StackEntry[] => {
    if (!selected) return [];
    const visited = new Set<string>([selected.id]);
    const result: StackEntry[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: selected.id, depth: 0 }];
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const c = contracts.find((x) => x.id === id);
      if (!c || depth > 6) continue;
      for (const dep of c.dependencies) {
        const found = contracts.find((x) => x.name === dep.contractName);
        if (found && !visited.has(found.id)) {
          visited.add(found.id);
          result.push({ contract: found, depth: depth + 1, direction: "dependency" });
          queue.push({ id: found.id, depth: depth + 1 });
        }
      }
    }
    return result;
  }, [selected, contracts]);

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-terminal-gray text-sm font-mono">
          Select a contract to explore its full dependency stack.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-auto text-xs font-mono">
      <h3 className="text-xs text-terminal-gray tracking-widest uppercase">
        Dependency Stack — {selected.name}
      </h3>

      {/* Selected contract */}
      <StackContractCard
        contract={selected}
        isCenter
        onSelect={selectContract}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Upstream: who calls this */}
        <section aria-label="Upstream dependents">
          <h4 className="text-terminal-gray mb-2 flex items-center gap-1">
            <span className="text-terminal-cyan">↑</span>
            Upstream ({upstream.length})
          </h4>
          {upstream.length === 0 ? (
            <p className="text-terminal-gray">No contracts depend on this.</p>
          ) : (
            <ul className="space-y-1 list-none p-0">
              {upstream.map((entry) => (
                <StackEntry key={entry.contract.id} entry={entry} onSelect={selectContract} />
              ))}
            </ul>
          )}
        </section>

        {/* Downstream: what this calls */}
        <section aria-label="Downstream dependencies">
          <h4 className="text-terminal-gray mb-2 flex items-center gap-1">
            <span className="text-terminal-warning">↓</span>
            Downstream ({downstream.length})
          </h4>
          {downstream.length === 0 ? (
            <p className="text-terminal-gray">This contract has no dependencies.</p>
          ) : (
            <ul className="space-y-1 list-none p-0">
              {downstream.map((entry) => (
                <StackEntry key={entry.contract.id} entry={entry} onSelect={selectContract} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Stats bar */}
      <div className="rounded border border-white/10 p-3 flex flex-wrap gap-4 text-terminal-gray">
        <span>
          <span className="text-terminal-white">{upstream.length}</span> upstream
        </span>
        <span>
          <span className="text-terminal-white">{downstream.length}</span> downstream
        </span>
        <span>
          <span className="text-terminal-white">
            {selected.vulnerabilities.length}
          </span>{" "}
          vulns
        </span>
        <span>
          <span className="text-terminal-white">{selected.reachabilityPct.toFixed(0)}%</span>{" "}
          reachability
        </span>
      </div>
    </div>
  );
}

function StackContractCard({
  contract,
  isCenter = false,
  onSelect,
}: {
  contract: ContractWithDeps;
  isCenter?: boolean;
  onSelect: (id: string | null) => void;
}) {
  const worstSeverity = getWorstSeverity(contract.vulnerabilities);
  const colors = severityNodeColor(worstSeverity);
  return (
    <button
      type="button"
      onClick={() => onSelect(isCenter ? null : contract.id)}
      className="w-full text-left rounded border p-2 text-xs font-mono transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
      style={{
        borderColor: `${colors.border}${isCenter ? "80" : "40"}`,
        backgroundColor: isCenter ? colors.bg : "transparent",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.border }} />
        <span style={{ color: colors.text }} className={isCenter ? "font-bold" : ""}>
          {contract.name}
        </span>
        {isCenter && (
          <span className="ml-auto text-[9px] text-terminal-gray border border-terminal-gray/30 px-1 rounded">
            SELECTED
          </span>
        )}
      </div>
      <div className="mt-0.5 text-terminal-gray text-[10px] truncate">{contract.address}</div>
    </button>
  );
}

function StackEntry({
  entry,
  onSelect,
}: {
  entry: StackEntry;
  onSelect: (id: string | null) => void;
}) {
  const { contract, depth, direction } = entry;
  const worstSeverity = getWorstSeverity(contract.vulnerabilities);
  const colors = severityNodeColor(worstSeverity);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(contract.id)}
        className="w-full text-left flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        aria-label={`Navigate to ${contract.name}`}
      >
        <span className="text-[10px] text-terminal-gray flex-shrink-0">
          {direction === "dependency" ? "→" : "←"}
        </span>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.border }} />
        <span className="flex-1 truncate" style={{ color: colors.text }}>
          {contract.name}
        </span>
        <span className="text-[9px] text-terminal-gray flex-shrink-0">L{depth}</span>
      </button>
    </li>
  );
}

export default DependencyStackPanel;
