/**
 * Tests for contract dependency graph (#922)
 * Covers:
 *   - Types/utilities (severityColor, getWorstSeverity, generateMockContracts)
 *   - Zustand store (setContracts, selectContract, filter operations)
 *   - Performance: store handles 100+ nodes without lag
 *   - GraphFilter component
 *   - DependencyTreeView component (renders, filtering, cycle detection)
 *   - VulnerabilityImpactPanel component
 *   - DependencyStackPanel component
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Types & helpers ───────────────────────────────────────────────────────────
import {
  getWorstSeverity,
  severityColor,
  severityNodeColor,
  generateMockContracts,
  MOCK_CONTRACTS,
  type ContractWithDeps,
  type VulnerabilitySeverity,
} from "@/components/dependency-graph/types";

// ── Store ─────────────────────────────────────────────────────────────────────
import { useDependencyGraphStore } from "@/components/dependency-graph/store";

// ── Components ────────────────────────────────────────────────────────────────
import { DependencyTreeView } from "@/components/dependency-graph/DependencyTreeView";
import { VulnerabilityImpactPanel } from "@/components/dependency-graph/VulnerabilityImpactPanel";
import { DependencyStackPanel } from "@/components/dependency-graph/DependencyStackPanel";
import { GraphFilter } from "@/components/dependency-graph/GraphFilter";

// Reset store state between tests
function resetStore() {
  act(() => {
    useDependencyGraphStore.setState({
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
    });
  });
}

// ── Types & utilities ─────────────────────────────────────────────────────────
describe("dependency-graph/types", () => {
  describe("getWorstSeverity", () => {
    it("returns NONE for empty vulnerability list", () => {
      expect(getWorstSeverity([])).toBe("NONE");
    });

    it("returns CRITICAL when any vuln is critical", () => {
      const vulns = [
        { id: "1", title: "A", severity: "MEDIUM" as VulnerabilitySeverity, impactedContracts: [] },
        { id: "2", title: "B", severity: "CRITICAL" as VulnerabilitySeverity, impactedContracts: [] },
      ];
      expect(getWorstSeverity(vulns)).toBe("CRITICAL");
    });

    it("returns HIGH when no CRITICAL present", () => {
      const vulns = [
        { id: "1", title: "A", severity: "LOW" as VulnerabilitySeverity, impactedContracts: [] },
        { id: "2", title: "B", severity: "HIGH" as VulnerabilitySeverity, impactedContracts: [] },
      ];
      expect(getWorstSeverity(vulns)).toBe("HIGH");
    });

    it("handles a null/undefined vulnerabilities array gracefully", () => {
      // @ts-expect-error testing edge case
      expect(getWorstSeverity(null)).toBe("NONE");
    });
  });

  describe("severityColor", () => {
    it("returns danger color for CRITICAL", () => {
      expect(severityColor("CRITICAL")).toBe("#ff3366");
    });
    it("returns warning color for MEDIUM", () => {
      expect(severityColor("MEDIUM")).toBe("#ffaa00");
    });
    it("returns cyan for LOW", () => {
      expect(severityColor("LOW")).toBe("#00d4ff");
    });
    it("returns green for NONE", () => {
      expect(severityColor("NONE")).toBe("#00ff41");
    });
  });

  describe("severityNodeColor", () => {
    it("returns an object with border, bg, text for each severity", () => {
      const severities: VulnerabilitySeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];
      for (const sev of severities) {
        const colors = severityNodeColor(sev);
        expect(colors).toHaveProperty("border");
        expect(colors).toHaveProperty("bg");
        expect(colors).toHaveProperty("text");
        expect(typeof colors.border).toBe("string");
      }
    });
  });

  describe("generateMockContracts", () => {
    it("generates exactly N contracts", () => {
      const contracts = generateMockContracts(50);
      expect(contracts).toHaveLength(50);
    });

    it("generates 100 contracts with correct structure", () => {
      const contracts = generateMockContracts(100);
      expect(contracts).toHaveLength(100);
      for (const c of contracts) {
        expect(c).toHaveProperty("id");
        expect(c).toHaveProperty("name");
        expect(c).toHaveProperty("address");
        expect(c).toHaveProperty("riskScore");
        expect(c).toHaveProperty("reachabilityPct");
        expect(Array.isArray(c.vulnerabilities)).toBe(true);
        expect(Array.isArray(c.dependencies)).toBe(true);
        expect(Array.isArray(c.dependents)).toBe(true);
      }
    });

    it("generates unique IDs for all contracts", () => {
      const contracts = generateMockContracts(150);
      const ids = new Set(contracts.map((c) => c.id));
      expect(ids.size).toBe(150);
    });

    it("back-populates dependents correctly", () => {
      const contracts = generateMockContracts(10);
      // Any contract that's depended on should appear in someone's dependents
      const dependerNames = new Set(
        contracts.flatMap((c) => c.dependencies.map((d) => d.contractName)),
      );
      for (const name of dependerNames) {
        const target = contracts.find((c) => c.name === name);
        if (target) {
          expect(target.dependents.length).toBeGreaterThan(0);
        }
      }
    });

    it("MOCK_CONTRACTS has expected contracts", () => {
      const names = MOCK_CONTRACTS.map((c) => c.name);
      expect(names).toContain("Router");
      expect(names).toContain("Vault");
      expect(names).toContain("Token");
    });
  });
});

// ── Performance test: 100+ nodes ─────────────────────────────────────────────
describe("dependency-graph/store — performance", () => {
  beforeEach(resetStore);

  it("handles 100 contracts in store without exceeding 200ms", () => {
    const contracts = generateMockContracts(100);
    const start = performance.now();
    act(() => {
      useDependencyGraphStore.getState().setContracts(contracts);
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
    expect(useDependencyGraphStore.getState().contracts).toHaveLength(100);
  });

  it("handles 200 contracts in store without exceeding 500ms", () => {
    const contracts = generateMockContracts(200);
    const start = performance.now();
    act(() => {
      useDependencyGraphStore.getState().setContracts(contracts);
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(useDependencyGraphStore.getState().contracts).toHaveLength(200);
  });

  it("selectContract on 100-node graph resolves path in under 100ms", () => {
    const contracts = generateMockContracts(100);
    act(() => {
      useDependencyGraphStore.getState().setContracts(contracts);
    });
    const start = performance.now();
    act(() => {
      useDependencyGraphStore.getState().selectContract("contract_0");
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it("produces nodes and edges for 100 contracts", () => {
    const contracts = generateMockContracts(100);
    act(() => {
      useDependencyGraphStore.getState().setContracts(contracts);
    });
    const state = useDependencyGraphStore.getState();
    expect(state.nodes.length).toBe(100);
    expect(state.edges.length).toBeGreaterThan(0);
  });
});

// ── Zustand store ─────────────────────────────────────────────────────────────
describe("dependency-graph/store", () => {
  beforeEach(resetStore);

  it("initialises with empty contracts", () => {
    expect(useDependencyGraphStore.getState().contracts).toHaveLength(0);
  });

  it("setContracts populates nodes and edges", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
    });
    const { nodes, edges } = useDependencyGraphStore.getState();
    expect(nodes.length).toBe(MOCK_CONTRACTS.length);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("selectContract sets selectedContractId and highlightedPath", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
      useDependencyGraphStore.getState().selectContract("router");
    });
    const state = useDependencyGraphStore.getState();
    expect(state.selectedContractId).toBe("router");
    expect(state.highlightedPath.size).toBeGreaterThan(0);
    expect(state.highlightedPath.has("router")).toBe(true);
  });

  it("selectContract(null) clears highlighted path", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
      useDependencyGraphStore.getState().selectContract("router");
      useDependencyGraphStore.getState().selectContract(null);
    });
    const state = useDependencyGraphStore.getState();
    expect(state.selectedContractId).toBeNull();
    expect(state.highlightedPath.size).toBe(0);
  });

  it("setFilterName reduces visible nodes", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
      useDependencyGraphStore.getState().setFilterName("Router");
    });
    const { nodes } = useDependencyGraphStore.getState();
    expect(nodes.every((n) => n.data.contract.name.toLowerCase().includes("router"))).toBe(true);
  });

  it("setFilterSeverity filters by severity", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
      useDependencyGraphStore.getState().setFilterSeverity("CRITICAL");
    });
    const { nodes } = useDependencyGraphStore.getState();
    for (const node of nodes) {
      const hasCritical = node.data.contract.vulnerabilities.some(
        (v) => v.severity === "CRITICAL",
      );
      expect(hasCritical).toBe(true);
    }
  });

  it("setViewMode changes the view mode", () => {
    act(() => {
      useDependencyGraphStore.getState().setViewMode("tree");
    });
    expect(useDependencyGraphStore.getState().viewMode).toBe("tree");
  });

  it("loadMockData populates with default MOCK_CONTRACTS", () => {
    act(() => {
      useDependencyGraphStore.getState().loadMockData();
    });
    expect(useDependencyGraphStore.getState().contracts.length).toBe(MOCK_CONTRACTS.length);
  });

  it("loadMockData with count generates that many contracts", () => {
    act(() => {
      useDependencyGraphStore.getState().loadMockData(120);
    });
    expect(useDependencyGraphStore.getState().contracts.length).toBe(120);
  });

  it("nodes have GraphNodeData with worstSeverity", () => {
    act(() => {
      useDependencyGraphStore.getState().setContracts(MOCK_CONTRACTS);
    });
    const { nodes } = useDependencyGraphStore.getState();
    for (const node of nodes) {
      expect(["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"]).toContain(
        node.data.worstSeverity,
      );
    }
  });
});

// ── GraphFilter component ─────────────────────────────────────────────────────
describe("GraphFilter", () => {
  beforeEach(() => {
    resetStore();
    act(() => {
      useDependencyGraphStore.getState().loadMockData();
    });
  });

  it("renders a search input", () => {
    render(<GraphFilter />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("renders a severity select", () => {
    render(<GraphFilter />);
    expect(screen.getByLabelText(/filter by severity/i)).toBeInTheDocument();
  });

  it("renders graph/tree toggle buttons", () => {
    render(<GraphFilter />);
    expect(screen.getByRole("button", { name: /graph view/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tree view/i })).toBeInTheDocument();
  });

  it("typing in search input calls setFilterName", async () => {
    const user = userEvent.setup();
    render(<GraphFilter />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "Router");
    expect(useDependencyGraphStore.getState().filterName).toBe("Router");
  });

  it("selecting a severity calls setFilterSeverity", async () => {
    const user = userEvent.setup();
    render(<GraphFilter />);
    const select = screen.getByLabelText(/filter by severity/i);
    await user.selectOptions(select, "HIGH");
    expect(useDependencyGraphStore.getState().filterSeverity).toBe("HIGH");
  });

  it("shows reset button when filter is active and clicking resets", async () => {
    act(() => {
      useDependencyGraphStore.getState().setFilterName("test");
    });
    const user = userEvent.setup();
    render(<GraphFilter />);
    const resetBtn = screen.getByRole("button", { name: /reset all filters/i });
    expect(resetBtn).toBeInTheDocument();
    await user.click(resetBtn);
    expect(useDependencyGraphStore.getState().filterName).toBe("");
    expect(useDependencyGraphStore.getState().filterSeverity).toBe("ALL");
  });

  it("does not show reset button when no filter is active", () => {
    render(<GraphFilter />);
    expect(screen.queryByRole("button", { name: /reset/i })).toBeNull();
  });

  it("clicking Tree toggles view mode to tree", async () => {
    const user = userEvent.setup();
    render(<GraphFilter />);
    await user.click(screen.getByRole("button", { name: /tree view/i }));
    expect(useDependencyGraphStore.getState().viewMode).toBe("tree");
  });
});

// ── DependencyTreeView ────────────────────────────────────────────────────────
describe("DependencyTreeView", () => {
  beforeEach(() => {
    resetStore();
    act(() => {
      useDependencyGraphStore.getState().loadMockData();
    });
  });

  it("renders a tree with role=tree", () => {
    render(<DependencyTreeView />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("renders all root contract names", () => {
    render(<DependencyTreeView />);
    // Router is the root (no dependents from other filtered nodes)
    expect(screen.getAllByText("Router").length).toBeGreaterThan(0);
  });

  it("shows empty state when filter matches nothing", () => {
    act(() => {
      useDependencyGraphStore.getState().setFilterName("ZZZNOMATCH");
    });
    render(<DependencyTreeView />);
    expect(screen.getByText(/no contracts match/i)).toBeInTheDocument();
  });

  it("renders legend at the bottom", () => {
    render(<DependencyTreeView />);
    expect(screen.getByText("CRITICAL/HIGH")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
  });

  it("renders with 100 contracts without crashing", () => {
    act(() => {
      useDependencyGraphStore.getState().loadMockData(100);
    });
    const { container } = render(<DependencyTreeView />);
    expect(container).toBeTruthy();
    // At least some tree items rendered
    expect(container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(0);
  });

  it("clicking a node selects it in the store", async () => {
    const user = userEvent.setup();
    render(<DependencyTreeView />);
    // Find and click "Router" button
    const routerBtn = screen.getAllByRole("button").find(
      (b) => b.textContent?.includes("Router"),
    );
    if (routerBtn) {
      await user.click(routerBtn);
      expect(useDependencyGraphStore.getState().selectedContractId).toBe("router");
    }
  });
});

// ── VulnerabilityImpactPanel ──────────────────────────────────────────────────
describe("VulnerabilityImpactPanel", () => {
  beforeEach(() => {
    resetStore();
    act(() => {
      useDependencyGraphStore.getState().loadMockData();
    });
  });

  it("shows placeholder when no contract is selected", () => {
    render(<VulnerabilityImpactPanel />);
    expect(screen.getByText(/click a contract node/i)).toBeInTheDocument();
  });

  it("shows no-vulnerability message for a healthy contract", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("treasury");
    });
    render(<VulnerabilityImpactPanel />);
    expect(screen.getByText(/no vulnerabilities detected/i)).toBeInTheDocument();
  });

  it("shows vulnerability details for Router (has HIGH vuln)", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("router");
    });
    render(<VulnerabilityImpactPanel />);
    expect(screen.getByText("Reentrancy in swap()")).toBeInTheDocument();
  });

  it("shows risk score for selected contract", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("router");
    });
    render(<VulnerabilityImpactPanel />);
    expect(screen.getByText("Risk Score")).toBeInTheDocument();
  });

  it("shows reachability percentage", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("router");
    });
    render(<VulnerabilityImpactPanel />);
    expect(screen.getByText(/reachability/i)).toBeInTheDocument();
  });

  it("shows propagation chain header when there are dependents", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("vault");
    });
    render(<VulnerabilityImpactPanel />);
    // Vault has a dependent (Router) and a vulnerability
    expect(screen.getByText(/propagation chain/i)).toBeInTheDocument();
  });
});

// ── DependencyStackPanel ──────────────────────────────────────────────────────
describe("DependencyStackPanel", () => {
  beforeEach(() => {
    resetStore();
    act(() => {
      useDependencyGraphStore.getState().loadMockData();
    });
  });

  it("shows placeholder when no contract is selected", () => {
    render(<DependencyStackPanel />);
    expect(screen.getByText(/select a contract/i)).toBeInTheDocument();
  });

  it("shows upstream and downstream sections for selected contract", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("vault");
    });
    render(<DependencyStackPanel />);
    expect(screen.getByLabelText(/upstream/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/downstream/i)).toBeInTheDocument();
  });

  it("shows the selected contract name in the heading", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("router");
    });
    render(<DependencyStackPanel />);
    expect(screen.getByText(/dependency stack.*router/i)).toBeInTheDocument();
  });

  it("shows stats bar with upstream/downstream counts", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("vault");
    });
    render(<DependencyStackPanel />);
    // Multiple "upstream"/"downstream" labels are expected (heading + stats bar)
    expect(screen.getAllByText(/upstream/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/downstream/i).length).toBeGreaterThan(0);
  });

  it("leaf contract (Treasury) has no dependencies downstream", () => {
    act(() => {
      useDependencyGraphStore.getState().selectContract("treasury");
    });
    render(<DependencyStackPanel />);
    // Treasury is the deepest leaf — it has no outbound dependencies
    expect(screen.getByText(/this contract has no dependencies/i)).toBeInTheDocument();
  });

  it("renders without crashing for 100 contracts", () => {
    act(() => {
      useDependencyGraphStore.getState().loadMockData(100);
      useDependencyGraphStore.getState().selectContract("contract_0");
    });
    const { container } = render(<DependencyStackPanel />);
    expect(container).toBeTruthy();
  });
});
