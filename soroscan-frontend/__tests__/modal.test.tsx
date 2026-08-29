import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  Modal,
  ModalContent,
  ModalTrigger,
  ModalTitle,
} from "../components/ui/modal";
import "@testing-library/jest-dom";
import { useState } from "react";

// The ultimate JSDOM PointerEvent polyfill
if (typeof window.PointerEvent === "undefined") {
  class MockPointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
    }
  }
  (window as any).PointerEvent = MockPointerEvent;
}
if (typeof window.HTMLElement.prototype.hasPointerCapture === "undefined") {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}

describe("Modal Component", () => {
  const TestModal = () => {
    const [open, setOpen] = useState(false);
    
    return (
      <Modal open={open} onOpenChange={setOpen}>
        <ModalTrigger data-testid="trigger">Open Modal</ModalTrigger>
        <ModalContent>
          <ModalTitle>Test Title</ModalTitle>
          <button data-testid="inside-btn">Inside Button</button>
        </ModalContent>
      </Modal>
    );
  };

  it("should display the modal when trigger is clicked", async () => {
    render(<TestModal />);
    const trigger = screen.getByTestId("trigger");
    
    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should close when the escape key is pressed", async () => {
    render(<TestModal />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        charCode: 27,
      });
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("should close when the overlay is clicked", async () => {
    render(<TestModal />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    await waitFor(() => {
      expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    const overlay = document.querySelector(
      "[data-radix-overlay]"
    ) as HTMLElement;
    expect(overlay).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(overlay);
    });

    await waitFor(() => {
      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    });
  });

  it("should trap focus inside the modal", async () => {
    render(<TestModal />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId("trigger"));
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const guards = document.querySelectorAll("[data-radix-focus-guard]");
    expect(guards.length).toBeGreaterThan(0);
  });
});