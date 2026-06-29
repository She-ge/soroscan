import { render, screen, fireEvent } from "@testing-library/react";
import { KeyboardShortcutsOverlay } from "../components/terminal/KeyboardShortcutsOverlay";
import "@testing-library/jest-dom";

describe("KeyboardShortcutsOverlay", () => {
  it("opens when ? is pressed", () => {
    render(<KeyboardShortcutsOverlay />);

    fireEvent.keyDown(document, {
      key: "?",
      code: "Slash",
      shiftKey: true,
    });

    expect(screen.getByText(/KEYBOARD SHORTCUTS/)).toBeInTheDocument();
    expect(screen.getAllByText("?").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Escape")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", () => {
    render(<KeyboardShortcutsOverlay />);

    fireEvent.keyDown(document, {
      key: "?",
      code: "Slash",
      shiftKey: true,
    });

    expect(screen.getByText(/KEYBOARD SHORTCUTS/)).toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByText("KEYBOARD SHORTCUTS")).not.toBeInTheDocument();
  });

  it("does not open when focus is in an input field", () => {
    render(
      <>
        <input data-testid="shortcut-input" />
        <KeyboardShortcutsOverlay />
      </>
    );

    const input = screen.getByTestId("shortcut-input");
    fireEvent.focus(input);

    fireEvent.keyDown(input, {
      key: "?",
      code: "Slash",
      shiftKey: true,
    });

    expect(screen.queryByText("KEYBOARD SHORTCUTS")).not.toBeInTheDocument();
  });
});
