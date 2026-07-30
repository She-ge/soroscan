"use client";

import { memo, useState, useCallback } from "react";
import { useDependencyGraphStore } from "./store";
import { severityNodeColor, getWorstSeverity, type ContractWithDeps } from "./types";

interface TreeNodeProps {
  contract: ContractWithDeps;
  depth: number;
  allContracts: ContractWithDeps[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  visited?: Set<string>;
}

const MAX_DEPTH = 6;

const TreeNode = memo(function TreeNode({
  contract,
  depth,
  allContracts,
  selectedId,
  onSelect,
  visited = new Set(),
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const worstSeverity = getWorstSeverity(contract.vulnerabilities);
  const colors = severityNodeColor(worstSeverity);
  const isSelected = contract.id === selectedId;
  const hasCycle = visited.has(contract.id);

  // Resolve children from dependency names
  const children = contract.dependencies
    .map((dep) => allContracts.find((c) => c.name === dep.contractName))
    .filter((c): c is ContractWithDeps => c !== undefined);

  const hasChildren = children.length > 0 && !hasCycle && depth < MAX_DEPTH;
  const nextVisited = new Set(visited).add(contract.id);

  const toggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded((v) => !v);
    },
    [],
  );

  const handleSelect = useCallback(() => {
    onSelect(isSelected ? null : contract.id);
  }, [contract.id, isSelected, onSelect]);

  return (
    <li role="treeitem" aria-expanded={hasChildren ? expanded : undefined} aria-selected={isSelected}>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded cursor-pointer group hover:bg-white/5 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={toggleExpand}
          className="w-4 h-4 flex items-center justify-center text-xs font-mono flex-shrink-0 opacity-60 hover:opacity-100 focus:outline-none"
          style={{ color: colors.text }}
          aria-label={expanded ? "Collapse" : "Expand"}
          disabled={!hasChildren}
        >
          {hasChildren ? (expanded ? "▼" : "▶") : "·"}
        </button>

        {/* Severity dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.border }}
          aria-hidden="true"
        />

        {/* Contract name */}
        <span
          className="text-sm font-mono flex-1 min-w-0 truncate"
          style={{
            color: isSelected ? "#fff" : colors.text,
            fontWeight: isSelected ? 700 : 400,
          }}
        >
          {contract.name}
        </span>

        {/* Cycle indicator */}
        {hasCycle && (
          <span className="text-[10px] text-terminal-warning px-1 border border-terminal-warning/30 rounded">
            CYCLE
          </span>
        )}

        {/* Risk score */}
        <span
          className="text-[10px] font-mono opacity-60 flex-shrink-0"
          style={{ color: colors.text }}
        >
          {contract.riskScore.toFixed(1)}
        </span>

        {/* Vuln count badge */}
        {contract.vulnerabilities.length > 0 && (
          <span
            className="text-[9px] font-bold px-1 rounded leading-none flex-shrink-0"
            style={{ backgroundColor: colors.border, color: "#0a0e27" }}
            aria-label={`${contract.vulnerabilities.length} vulnerabilities`}
          >
            {contract.vulnerabilities.length}
          </span>
        )}

        {/* Dependency type badge */}
        {depth > 0 && contract.dependencies.length === 0 && (
          <span className="text-[9px] text-terminal-gray opacity-60 flex-shrink-0">leaf</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <ul role="group" className="list-none p-0 m-0">
          {children.map((child) => (
            <TreeNode
              key={`${contract.id}-${child.id}-${depth}`}
              contract={child}
              depth={depth + 1}
              allContracts={allContracts}
              selectedId={selectedId}
              onSelect={onSelect}
              visited={nextVisited}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

/**
 * DependencyTreeView — hierarchical tree alternative to the graph view.
 * Renders root contracts (no dependents) as top-level nodes, with their
 * dependency trees below. Handles circular dependencies with cycle detection.
 */
export function DependencyTreeView() {
  const contracts = useDependencyGraphStore((s) => s.contracts);
  const selectedContractId = useDependencyGraphStore((s) => s.selectedContractId);
  const selectContract = useDependencyGraphStore((s) => s.selectContract);
  const filterName = useDependencyGraphStore((s) => s.filterName);
  const filterSeverity = useDependencyGraphStore((s) => s.filterSeverity);

  // Identify roots: contracts not depended on by anyone visible, or first matching filter
  const filtered = contracts.filter((c) => {
    const nameMatch = !filterName || c.name.toLowerCase().includes(filterName.toLowerCase());
    const sevMatch =
      filterSeverity === "ALL" || c.vulnerabilities.some((v) => v.severity === filterSeverity);
    return nameMatch && (filterSeverity === "ALL" ? true : sevMatch);
  });

  // Root = contracts that no other filtered contract depends on
  const dependedOnNames = new Set(
    filtered.flatMap((c) => c.dependencies.map((d) => d.contractName)),
  );
  const roots = filtered.filter((c) => !dependedOnNames.has(c.name));

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-terminal-gray text-sm font-mono">
        No contracts match the current filter.
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto p-3" role="tree" aria-label="Contract dependency tree">
      <ul className="list-none p-0 m-0 space-y-1">
        {(roots.length > 0 ? roots : filtered).map((root) => (
          <TreeNode
            key={root.id}
            contract={root}
            depth={0}
            allContracts={filtered}
            selectedId={selectedContractId}
            onSelect={selectContract}
          />
        ))}
      </ul>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-3 text-[10px] font-mono text-terminal-gray">
        {[
          { label: "CRITICAL/HIGH", color: "#ff3366" },
          { label: "MEDIUM", color: "#ffaa00" },
          { label: "LOW", color: "#00d4ff" },
          { label: "NONE", color: "#00ff41" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default DependencyTreeView;
