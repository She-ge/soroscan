import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { Inbox, Search } from "lucide-react";

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("EmptyState Component", () => {
  it("renders all elements correctly", () => {
    render(
      <EmptyState
        icon={<Search data-testid="test-icon" />}
        title="No results found"
        description="Try adjusting your search or filters to find what you're looking for."
        action={{ label: "Clear Filters", onClick: jest.fn() }}
      />,
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Try adjusting your search or filters to find what you're looking for.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear Filters" }),
    ).toBeInTheDocument();
  });

  it("handles button clicks correctly", () => {
    const mockOnClick = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: "Refresh", onClick: mockOnClick }}
      />,
    );

    fireEvent.click(screen.getByText("Refresh"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("renders without optional elements", () => {
    render(<EmptyState data-testid="empty-state-root" />);
    expect(screen.getByTestId("empty-state-root")).toBeInTheDocument();
  });

  it("renders custom icon and action href", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">✨</span>}
        title="Welcome!"
        action={{ label: "Get Started", href: "/getting-started" }}
      />,
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Started" })).toHaveAttribute(
      "href",
      "/getting-started",
    );
  });

  it("renders terminal variant with centered layout", () => {
    render(
      <EmptyState
        variant="terminal"
        title="No events"
        description="Select a contract to begin."
        data-testid="terminal-empty"
      />,
    );

    const root = screen.getByTestId("terminal-empty");
    expect(root).toHaveAttribute("data-variant", "terminal");
    expect(root).toHaveClass("font-terminal-mono");
    expect(screen.getByRole("heading", { name: "No events" })).toHaveClass(
      "text-terminal-green",
    );
  });

  it("renders primary and secondary actions", () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();

    render(
      <EmptyState
        variant="terminal"
        title="No webhooks"
        action={{ label: "Create Webhook", onClick: onPrimary }}
        secondaryAction={{
          label: "View Docs",
          onClick: onSecondary,
          terminalVariant: "secondary",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Webhook" }));
    fireEvent.click(screen.getByRole("button", { name: "View Docs" }));

    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("renders footer hint text", () => {
    render(
      <EmptyState
        variant="terminal"
        title="Empty"
        footer="$ soroscan help"
      />,
    );

    expect(screen.getByText("$ soroscan help")).toBeInTheDocument();
  });

  it("exposes role=status for screen readers", () => {
    render(<EmptyState title="Nothing here" ariaLabel="No items available" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "No items available",
    );
  });
});

describe("EmptyStateIcon", () => {
  it("wraps custom icons with terminal ring styling", () => {
    render(
      <EmptyStateIcon animated={false}>
        <Inbox data-testid="inbox-icon" className="h-8 w-8" />
      </EmptyStateIcon>,
    );

    expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument();
    expect(screen.getByTestId("inbox-icon")).toBeInTheDocument();
  });
});
