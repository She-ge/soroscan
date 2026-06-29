import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";

describe("EmptyState Component", () => {
  it("renders all elements correctly", () => {
    render(
      <EmptyState
        icon={<Search data-testid="test-icon" />}
        title="No results found"
        description="Try adjusting your search or filters to find what you're looking for."
        action={{ label: "Clear Filters", onClick: jest.fn() }}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters to find what you're looking for.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
  });

  it("handles button clicks correctly", () => {
    const mockOnClick = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: "Refresh", onClick: mockOnClick }}
      />
    );

    fireEvent.click(screen.getByText("Refresh"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("renders without optional elements", () => {
    render(<EmptyState />);
    // Should render without errors
  });

  it("renders custom icon and action href", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">✨</span>}
        title="Welcome!"
        action={{ label: "Get Started", href: "/getting-started" }}
      />
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute("href", "/getting-started");
  });
});
