import { render, screen } from "@testing-library/react";
import {
  DashboardWorkspace,
  AdminDashboardLayout,
} from "@/components/layout/DashboardWorkspace";
import { DashboardPanel } from "@/components/layout/DashboardPanel";
import { layout } from "@/lib/design-tokens";

describe("dashboard layout tokens (#910)", () => {
  it("defines chrome and filter sidebar measurements", () => {
    expect(layout.headerHeight).toBe(60);
    expect(layout.navSidebarWidth).toBe(240);
    expect(layout.filterSidebarWidth).toBe(280);
    expect(layout.breakpoints.mobileMax).toBe(639);
  });

  it("defines panel spacing and elevation shadows", () => {
    expect(layout.panel.padding).toBe(16);
    expect(layout.panel.gap).toBe(16);
    expect(layout.panel.borderWidth).toBe(1);
    expect(layout.panel.shadow).toContain("rgba(0, 255, 65");
  });

  it("defines data table density and column widths", () => {
    expect(layout.table.headerHeight).toBe(40);
    expect(layout.table.rowHeight).toBe(48);
    expect(layout.table.minWidth).toBe(680);
    expect(layout.table.columns.select).toBe(44);
    expect(layout.table.columns.contract).toBe(160);
  });

  it("defines admin dashboard grid bands", () => {
    expect(layout.admin.metricsColumns).toBe(4);
    expect(layout.admin.chartMainSpan).toBe(2);
    expect(layout.admin.sectionGap).toBe(24);
  });
});

describe("DashboardWorkspace (#910)", () => {
  it("renders filter sidebar and main content landmarks", () => {
    render(
      <DashboardWorkspace
        header={<h1>Event Explorer</h1>}
        sidebar={<div>Filter controls</div>}
      >
        <div>Main table</div>
      </DashboardWorkspace>,
    );

    expect(screen.getByTestId("dashboard-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-filter-sidebar")).toHaveTextContent(
      "Filter controls",
    );
    expect(screen.getByTestId("dashboard-main-content")).toHaveTextContent(
      "Main table",
    );
    expect(screen.getByTestId("dashboard-workspace-grid").className).toContain(
      "sm:grid-cols-[280px_minmax(0,1fr)]",
    );
  });
});

describe("AdminDashboardLayout (#910)", () => {
  it("renders metrics, charts, and logs bands", () => {
    render(
      <AdminDashboardLayout
        header={<h1>System Dashboard</h1>}
        metrics={<div>metric-a</div>}
        charts={<div>chart-a</div>}
        logs={<div>log-a</div>}
      />,
    );

    expect(screen.getByTestId("admin-dashboard-layout")).toBeInTheDocument();
    expect(screen.getByTestId("admin-metrics")).toHaveTextContent("metric-a");
    expect(screen.getByTestId("admin-charts-row")).toHaveTextContent("chart-a");
    expect(screen.getByTestId("admin-logs-row")).toHaveTextContent("log-a");
  });
});

describe("DashboardPanel (#910)", () => {
  it("exposes elevation hierarchy", () => {
    const { rerender } = render(
      <DashboardPanel title="Panel" elevation="flat">
        Body
      </DashboardPanel>,
    );
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Body").closest("[data-elevation]")).toHaveAttribute(
      "data-elevation",
      "flat",
    );

    rerender(
      <DashboardPanel title="Panel" elevation="elevated">
        Body
      </DashboardPanel>,
    );
    expect(screen.getByText("Body").closest("[data-elevation]")).toHaveAttribute(
      "data-elevation",
      "elevated",
    );
  });
});
