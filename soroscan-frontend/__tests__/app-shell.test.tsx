import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "@/components/layout/AppShell";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

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

describe("AppShell mobile navigation", () => {
  it("renders the app header with logo", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByText("◆ SoroScan")).toBeInTheDocument();
  });

  it("shows hamburger toggle on mobile layout", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    expect(toggle).toHaveAttribute("aria-controls", "app-sidebar");
    expect(toggle).toHaveClass("min-h-[44px]");
  });

  it("opens navigation drawer when hamburger is clicked", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: /toggle menu/i }));

    const drawer = screen.getByRole("dialog", { name: /navigation/i });
    expect(drawer).toBeInTheDocument();
    expect(drawer.querySelector('a[href="/dashboard"]')).toBeInTheDocument();
    expect(drawer.querySelector('a[href="/contracts"]')).toBeInTheDocument();
  });

  it("renders child content in main area", () => {
    render(
      <AppShell>
        <div data-testid="page-content">Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("renders sidebar nav links with icon + label pattern", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    const sidebar = document.getElementById("app-sidebar");
    expect(sidebar).toBeTruthy();
    expect(sidebar!.querySelector('a[href="/dashboard"]')).toHaveTextContent(
      "Events",
    );
    expect(sidebar!.querySelector('a[href="/admin"]')).toHaveTextContent("Admin");
  });
});
