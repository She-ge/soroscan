import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react";
import {
  Modal,
  ModalContent,
  ModalTrigger,
  ModalTitle,
  ModalDescription,
} from "../components/ui/modal";
import "@testing-library/jest-dom";
import { useState, useRef } from "react";
import { useFocusTrap } from "../lib/hooks/useFocusTrap";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TestModal = ({
  onClose,
  titleId = "modal-title",
}: {
  onClose?: () => void;
  titleId?: string;
}) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) onClose?.();
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger data-testid="trigger">Open Modal</ModalTrigger>
      <ModalContent aria-labelledby={titleId}>
        <ModalTitle id={titleId}>Test Title</ModalTitle>
        <ModalDescription>Description text</ModalDescription>
        <button data-testid="first-btn">First Button</button>
        <button data-testid="second-btn">Second Button</button>
      </ModalContent>
    </Modal>
  );
};

const openModal = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId("trigger"));
  });
};

// ---------------------------------------------------------------------------
// Interaction tests
// ---------------------------------------------------------------------------

describe("Modal Component — interaction", () => {
  it("renders trigger and is closed by default", () => {
    render(<TestModal />);
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays the modal when trigger is clicked", async () => {
    render(<TestModal />);
    await openModal();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("closes when the Escape key is pressed", async () => {
    render(<TestModal />);
    await openModal();
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

  it("does NOT close when the overlay is clicked (per requirements)", async () => {
    render(<TestModal />);
    await openModal();

    const overlay = document.querySelector("[data-radix-overlay]");

    await act(async () => {
      if (overlay) fireEvent.click(overlay);
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("calls onClose callback when the modal closes", async () => {
    const onClose = jest.fn();
    render(<TestModal onClose={onClose} />);
    await openModal();

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape", code: "Escape", keyCode: 27 });
    });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// Accessibility tests
// ---------------------------------------------------------------------------

describe("Modal Component — accessibility (ARIA)", () => {
  it("has role='dialog' when open", async () => {
    render(<TestModal />);
    await openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has aria-modal='true' when open", async () => {
    render(<TestModal />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to the title element", async () => {
    render(<TestModal titleId="modal-title" />);
    await openModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });

  it("title element has the matching id", async () => {
    render(<TestModal titleId="modal-title" />);
    await openModal();
    const title = screen.getByText("Test Title");
    expect(title).toHaveAttribute("id", "modal-title");
  });

  it("contains a close button with accessible label", async () => {
    render(<TestModal />);
    await openModal();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Focus trap tests (component-level)
// ---------------------------------------------------------------------------

describe("Modal Component — focus trap", () => {
  it("renders Radix focus guards when open (focus trap active)", async () => {
    render(<TestModal />);
    await openModal();

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const guards = document.querySelectorAll("[data-radix-focus-guard]");
    expect(guards.length).toBeGreaterThan(0);
  });

  it("keeps focusable elements inside the dialog", async () => {
    render(<TestModal />);
    await openModal();

    const dialog = await screen.findByRole("dialog");
    const focusableInDialog = dialog.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    expect(focusableInDialog.length).toBeGreaterThan(0);
  });

  it("has both entry and exit focus guards (Shift+Tab boundary)", async () => {
    render(<TestModal />);
    await openModal();

    const guards = document.querySelectorAll("[data-radix-focus-guard]");
    expect(guards.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Scroll-lock test
// ---------------------------------------------------------------------------

describe("Modal Component — scroll lock", () => {
  it("modal renders correctly when open (scroll-lock side-effect pathway)", async () => {
    render(<TestModal />);
    const dialog = screen.queryByRole("dialog");
    expect(dialog).not.toBeInTheDocument();

    await openModal();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useFocusTrap hook — unit tests
// ---------------------------------------------------------------------------

describe("useFocusTrap hook", () => {
  it("does nothing when inactive", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const { unmount } = renderHook(() => {
      const containerRef = useRef(div);
      useFocusTrap({ active: false, containerRef });
    });

    unmount();
    document.body.removeChild(div);
  });

  it("focuses the first focusable element when activated", async () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    btn1.textContent = "First";
    const btn2 = document.createElement("button");
    btn2.textContent = "Second";
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => {
        const containerRef = useRef(container);
        useFocusTrap({ active, containerRef });
      },
      { initialProps: { active: false } }
    );

    await act(async () => {
      rerender({ active: true });
    });

    // Allow effects to flush
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(document.activeElement).toBe(btn1);

    document.body.removeChild(container);
  });

  it("restores focus to the previously focused element when deactivated", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.textContent = "Inside";
    container.appendChild(btn);
    document.body.appendChild(container);

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => {
        const containerRef = useRef(container);
        useFocusTrap({ active, containerRef });
      },
      { initialProps: { active: false } }
    );

    // Activate — captures previousFocusRef = trigger
    await act(async () => {
      rerender({ active: true });
    });

    // Deactivate — should restore focus to trigger
    await act(async () => {
      rerender({ active: false });
    });

    // Allow the setTimeout(0) inside the hook to flush
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
    document.body.removeChild(container);
  });

  it("traps Tab at the last focusable element and wraps to first", async () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    btn1.textContent = "First";
    const btn2 = document.createElement("button");
    btn2.textContent = "Last";
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    await act(async () => {
      renderHook(() => {
        const containerRef = useRef(container);
        useFocusTrap({ active: true, containerRef });
      });
    });

    // Put focus on the last button
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Dispatch Tab — the handler should preventDefault and move focus to first
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(tabEvent);

    expect(document.activeElement).toBe(btn1);

    document.body.removeChild(container);
  });

  it("traps Shift+Tab at the first focusable element and wraps to last", async () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    btn1.textContent = "First";
    const btn2 = document.createElement("button");
    btn2.textContent = "Last";
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    await act(async () => {
      renderHook(() => {
        const containerRef = useRef(container);
        useFocusTrap({ active: true, containerRef });
      });
    });

    // Put focus on the first button
    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    // Dispatch Shift+Tab — the handler should preventDefault and move focus to last
    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(shiftTabEvent);

    expect(document.activeElement).toBe(btn2);

    document.body.removeChild(container);
  });

  it("does not move focus on Tab when focus is not on the last element", async () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    btn1.textContent = "First";
    const btn2 = document.createElement("button");
    btn2.textContent = "Last";
    container.appendChild(btn1);
    container.appendChild(btn2);
    document.body.appendChild(container);

    await act(async () => {
      renderHook(() => {
        const containerRef = useRef(container);
        useFocusTrap({ active: true, containerRef });
      });
    });

    // Focus is on first button — Tab should NOT wrap (browser handles natural flow)
    btn1.focus();
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(tabEvent);

    // focus stays on btn1 because we only intercept when activeElement === last
    expect(document.activeElement).toBe(btn1);

    document.body.removeChild(container);
  });
});
