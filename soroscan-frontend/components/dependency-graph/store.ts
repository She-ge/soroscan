"use client";

import { create } from "zustand";
import { MarkerType, type Node, type Edge } from "reactflow";
import type { ContractWithDeps, VulnerabilitySeverity } from "./types";
import { getWorstSeverity, severityNodeColor, generateMockContracts, MOCK_CONTRACTS } from "./types";

export type ViewMode = "graph" | "tree";

export interface GraphNodeData {
  contract: ContractWithDeps;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  worstSeverity: VulnerabilitySeverity;
}

export interface GraphEdgeData {
  dependencyType: string;
  isHighlighted: boolean;
  isDimmed: boolean;
}

export interface DependencyGraphState {
  // Raw data
  contracts: ContractWithDeps[];
  // Graph elements (reactflow)
  nodes: Node<GraphNodeData>[];
  edges: Edge<GraphEdgeData>[];
  // Selection / hover state
  selectedContractId: string | null;
  hoveredContractId: string | null;
  // Active highlighted path (for hover propagation)
  highlightedPath: Set<string>;
  // Filter state
  filterName: string;
  filterSeverity: VulnerabilitySeverity | "ALL";
  // View mode
  viewMode: ViewMode;
  // Loading
  isLoading: boolean;
  // Actions
  setContracts: (contracts: ContractWithDeps[]) => void;
  selectContract: (id: string | null) => void;
  hoverContract: (id: string | null) => void;
  setFilterName: (name: string) => void;
  setFilterSeverity: (sev: VulnerabilitySeverity | "ALL") => void;
  setViewMode: (mode: ViewMode) => void;
  setLoading: (loading: boolean) => void;
  loadMockData: (count?: number) => void;
}

// Compute which contract IDs are reachable from `startId` following dependency edges
function computeReachablePath(
  contracts: ContractWithDeps[],
  startId: string,
): Set<string> {
  const visited = new Set<string>();
  const queue = [startId];
  const contractMap = new Map(contracts.map((c) => [c.id, c]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const contract = contractMap.get(current);
    if (!contract) continue;

    // Add upstream dependents (who depends on this)
    for (const dep of contract.dependents) {
      const depContract = contracts.find((c) => c.name === dep.contractName);
      if (depContract && !visited.has(depContract.id)) {
        queue.push(depContract.id);
      }
    }

    // Add downstream dependencies (what this depends on)
    for (const dep of contract.dependencies) {
      const depContract = contracts.find((c) => c.name === dep.contractName);
      if (depContract && !visited.has(depContract.id)) {
        queue.push(depContract.id);
      }
    }
  }

  return visited;
}

function buildNodes(
  contracts: ContractWithDeps[],
  selectedId: string | null,
  hoveredId: string | null,
  highlightedPath: Set<string>,
  filterName: string,
  filterSeverity: VulnerabilitySeverity | "ALL",
): Node<GraphNodeData>[] {
  const filtered = contracts.filter((c) => {
    const nameMatch = !filterName || c.name.toLowerCase().includes(filterName.toLowerCase());
    const sevMatch =
      filterSeverity === "ALL" ||
      c.vulnerabilities.some((v) => v.severity === filterSeverity);
    return nameMatch && (filterSeverity === "ALL" ? true : sevMatch);
  });

  return filtered.map((contract) => {
    const worstSeverity = getWorstSeverity(contract.vulnerabilities);
    const colors = severityNodeColor(worstSeverity);
    const isSelected = contract.id === selectedId;
    const isHighlighted = highlightedPath.size > 0 && highlightedPath.has(contract.id);
    const isDimmed =
      highlightedPath.size > 0 && !isHighlighted && !isSelected;

    // Size based on reachability (critical = larger)
    const size = 40 + contract.reachabilityPct * 0.4;

    return {
      id: contract.id,
      type: "contractNode",
      position: { x: 0, y: 0 }, // dagre will recalculate
      data: {
        contract,
        isSelected,
        isHighlighted,
        isDimmed,
        worstSeverity,
      },
      style: {
        width: size,
        height: size,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        opacity: isDimmed ? 0.3 : 1,
      },
    };
  });
}

function buildEdges(
  contracts: ContractWithDeps[],
  highlightedPath: Set<string>,
  filterName: string,
  filterSeverity: VulnerabilitySeverity | "ALL",
): Edge<GraphEdgeData>[] {
  const filtered = contracts.filter((c) => {
    const nameMatch = !filterName || c.name.toLowerCase().includes(filterName.toLowerCase());
    const sevMatch =
      filterSeverity === "ALL" ||
      c.vulnerabilities.some((v) => v.severity === filterSeverity);
    return nameMatch && (filterSeverity === "ALL" ? true : sevMatch);
  });

  const visibleIds = new Set(filtered.map((c) => c.id));
  const edges: Edge<GraphEdgeData>[] = [];

  for (const contract of filtered) {
    for (const dep of contract.dependencies) {
      const target = contracts.find((c) => c.name === dep.contractName);
      if (!target || !visibleIds.has(target.id)) continue;

      const isHighlighted =
        highlightedPath.size > 0 &&
        highlightedPath.has(contract.id) &&
        highlightedPath.has(target.id);
      const isDimmed = highlightedPath.size > 0 && !isHighlighted;

      const edgeColor =
        dep.dependencyType === "CIRCULAR"
          ? "#ff3366"
          : dep.dependencyType === "INDIRECT"
          ? "#ffaa00"
          : "#00d4ff";

      edges.push({
        id: `${contract.id}→${target.id}`,
        source: contract.id,
        target: target.id,
        type: "smoothstep",
        animated: dep.dependencyType === "CIRCULAR",
        label: dep.dependencyType !== "DIRECT" ? dep.dependencyType : undefined,
        style: {
          stroke: edgeColor,
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          opacity: isDimmed ? 0.15 : 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
        data: {
          dependencyType: dep.dependencyType,
          isHighlighted,
          isDimmed,
        },
      });
    }
  }

  return edges;
}

export const useDependencyGraphStore = create<DependencyGraphState>((set, get) => ({
  contracts: [],
  nodes: [],
  edges: [],
  selectedContractId: null,
  hoveredContractId: null,
  highlightedPath: new Set(),
  filterName: "",
  filterSeverity: "ALL",
  viewMode: "graph",
  isLoading: false,

  setContracts: (contracts) => {
    const { selectedContractId, hoveredContractId, highlightedPath, filterName, filterSeverity } = get();
    set({
      contracts,
      nodes: buildNodes(contracts, selectedContractId, hoveredContractId, highlightedPath, filterName, filterSeverity),
      edges: buildEdges(contracts, highlightedPath, filterName, filterSeverity),
    });
  },

  selectContract: (id) => {
    const { contracts, hoveredContractId, filterName, filterSeverity } = get();
    const path = id ? computeReachablePath(contracts, id) : new Set<string>();
    set({
      selectedContractId: id,
      highlightedPath: path,
      nodes: buildNodes(contracts, id, hoveredContractId, path, filterName, filterSeverity),
      edges: buildEdges(contracts, path, filterName, filterSeverity),
    });
  },

  hoverContract: (id) => {
    const { contracts, selectedContractId, filterName, filterSeverity } = get();
    // Only override highlighted path when nothing is selected
    const path = selectedContractId
      ? computeReachablePath(contracts, selectedContractId)
      : id
      ? computeReachablePath(contracts, id)
      : new Set<string>();

    set({
      hoveredContractId: id,
      highlightedPath: path,
      nodes: buildNodes(contracts, selectedContractId, id, path, filterName, filterSeverity),
      edges: buildEdges(contracts, path, filterName, filterSeverity),
    });
  },

  setFilterName: (filterName) => {
    const { contracts, selectedContractId, hoveredContractId, highlightedPath, filterSeverity } = get();
    set({
      filterName,
      nodes: buildNodes(contracts, selectedContractId, hoveredContractId, highlightedPath, filterName, filterSeverity),
      edges: buildEdges(contracts, highlightedPath, filterName, filterSeverity),
    });
  },

  setFilterSeverity: (filterSeverity) => {
    const { contracts, selectedContractId, hoveredContractId, highlightedPath, filterName } = get();
    set({
      filterSeverity,
      nodes: buildNodes(contracts, selectedContractId, hoveredContractId, highlightedPath, filterName, filterSeverity),
      edges: buildEdges(contracts, highlightedPath, filterName, filterSeverity),
    });
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setLoading: (isLoading) => set({ isLoading }),

  loadMockData: (count) => {
    const contracts = count ? generateMockContracts(count) : MOCK_CONTRACTS;
    get().setContracts(contracts);
  },
}));
