import { render, screen } from "@testing-library/react";
import {
  PulseDot,
  StatusBurst,
  TerminalCursor,
  TerminalProgressBar,
} from "@/components/terminal/Motion";

describe("terminal motion micro-interactions (#911)", () => {
  it("renders a blinking terminal cursor", () => {
    const { container } = render(<TerminalCursor />);
    expect(container.firstChild).toHaveClass("animate-terminal-cursor");
  });

  it("announces success and error bursts", () => {
    const { rerender } = render(
      <StatusBurst tone="success" label="Saved" />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    rerender(<StatusBurst tone="error" label="Failed" />);
    expect(screen.getByRole("status")).toHaveTextContent("Failed");
  });

  it("exposes progressbar semantics", () => {
    render(<TerminalProgressBar value={40} label="Sync" />);
    expect(screen.getByRole("progressbar", { name: /sync/i })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("renders a live pulse indicator", () => {
    render(<PulseDot label="Streaming" />);
    expect(screen.getByText("Streaming")).toBeInTheDocument();
  });
});
