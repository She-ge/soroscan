import { render, screen, fireEvent, within } from "@testing-library/react";
import { FilterBar } from "@/app/dashboard/components/FilterBar";

jest.mock("@/components/ingest/graphql", () => ({
  fetchEventTypes: jest.fn().mockResolvedValue(["transfer", "mint"]),
}));

const defaultFilters = {
  contractId: "",
  eventType: "",
  since: "",
  until: "",
  searchQuery: "",
  tags: [],
};

describe("FilterBar mobile drawer", () => {
  it("renders a touch-friendly filter toggle button", () => {
    render(
      <FilterBar
        contracts={[{ contractId: "CC123", name: "Test" }]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        onExport={jest.fn()}
        tagSuggestions={[]}
      />,
    );

    const toggle = screen.getByTestId("filter-panel-toggle");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-controls", "mobile-filter-panel");
    expect(toggle).toHaveTextContent("Filters");
  });

  it("opens filter drawer when toggle is clicked", () => {
    render(
      <FilterBar
        contracts={[{ contractId: "CC123", name: "Test" }]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
        onExport={jest.fn()}
        tagSuggestions={[]}
      />,
    );

    fireEvent.click(screen.getByTestId("filter-panel-toggle"));

    const drawer = screen.getByRole("dialog", { name: /event filters/i });
    expect(drawer).toBeInTheDocument();
    expect(drawer.querySelector("#contract-select")).toBeInTheDocument();
  });

  it("shows active filter count badge when filters are set", () => {
    render(
      <FilterBar
        contracts={[{ contractId: "CC123", name: "Test" }]}
        filters={{
          ...defaultFilters,
          contractId: "CC123",
          eventType: "transfer",
        }}
        onFilterChange={jest.fn()}
        onExport={jest.fn()}
        tagSuggestions={[]}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onFilterChange when Apply Filters is clicked in drawer", () => {
    const onFilterChange = jest.fn();

    render(
      <FilterBar
        contracts={[{ contractId: "CC123", name: "Test" }]}
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        onExport={jest.fn()}
        tagSuggestions={[]}
      />,
    );

    fireEvent.click(screen.getByTestId("filter-panel-toggle"));

    const drawer = screen.getByRole("dialog", { name: /event filters/i });
    const applyButton = drawer.querySelector("button");
    const buttons = drawer.querySelectorAll("button");
    const apply = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Apply Filters"),
    );
    expect(apply).toBeTruthy();
    fireEvent.click(apply!);

    expect(onFilterChange).toHaveBeenCalled();
  });
});
