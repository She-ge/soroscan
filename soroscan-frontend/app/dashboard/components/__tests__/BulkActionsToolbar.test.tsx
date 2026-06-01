/**
 * BulkActionsToolbar.test.tsx
 *
 * Tests for:
 * - Toolbar visibility based on selection
 * - Export actions (CSV / JSON)
 * - Resend / Tag / Delete confirmation modals
 * - Progress indicator accuracy
 * - Confirmation / cancellation workflow
 */

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BulkActionsToolbar } from "../BulkActionsToolbar";
import type { EventRecord } from "@/components/ingest/types";
import * as batchService from "@/lib/batchService";

// ── Mock batchService ──────────────────────────────────────────────────────
jest.mock("@/lib/batchService", () => ({
  exportEvents: jest.fn(),
  resendWebhooks: jest.fn(),
  tagEvents: jest.fn(),
  deleteEvents: jest.fn(),
}));

const mockExportEvents = batchService.exportEvents as jest.MockedFunction<
  typeof batchService.exportEvents
>;
const mockResendWebhooks = batchService.resendWebhooks as jest.MockedFunction<
  typeof batchService.resendWebhooks
>;
const mockTagEvents = batchService.tagEvents as jest.MockedFunction<
  typeof batchService.tagEvents
>;
const mockDeleteEvents = batchService.deleteEvents as jest.MockedFunction<
  typeof batchService.deleteEvents
>;

// ── Test data ──────────────────────────────────────────────────────────────
const mockEvents: EventRecord[] = [
  {
    id: "1",
    contractId: "CCAAA123",
    contractName: "Test Contract",
    eventType: "transfer",
    ledger: 1000,
    eventIndex: 0,
    timestamp: "2024-01-01T00:00:00Z",
    txHash: "abc123",
    payload: { amount: 100 },
  },
  {
    id: "2",
    contractId: "CCBBB456",
    contractName: "Another Contract",
    eventType: "swap",
    ledger: 1001,
    eventIndex: 1,
    timestamp: "2024-01-01T01:00:00Z",
    txHash: "def456",
    payload: { from: "A", to: "B" },
  },
];

const defaultProps = {
  selectedIds: new Set<string>(),
  allEvents: mockEvents,
  onClearSelection: jest.fn(),
  onSelectAll: jest.fn(),
  onDeleteSuccess: jest.fn(),
  onBulkTagSuccess: jest.fn(),
  tagSuggestions: ["urgent", "review"],
};

describe("BulkActionsToolbar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    // Default implementation: instant success
    mockResendWebhooks.mockImplementation(async (_ids, onProgress) => {
      onProgress({ total: 1, completed: 1, failed: 0, percent: 100 });
      return { succeeded: ["1"], failed: [] };
    });
    mockTagEvents.mockImplementation(async (_ids, _tag, onProgress) => {
      onProgress({ total: 1, completed: 1, failed: 0, percent: 100 });
      return { succeeded: ["1"], failed: [] };
    });
    mockDeleteEvents.mockImplementation(async (_ids, onProgress) => {
      onProgress({ total: 1, completed: 1, failed: 0, percent: 100 });
      return { succeeded: ["1"], failed: [] };
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // ── Visibility ─────────────────────────────────────────────────────────────

  describe("Toolbar visibility", () => {
    it("is hidden (aria-hidden) when no events are selected", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set()} />);
      const toolbar = screen.getByRole("toolbar", { hidden: true });
      expect(toolbar).toHaveAttribute("aria-hidden", "true");
    });

    it("is visible when at least one event is selected", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      const toolbar = screen.getByRole("toolbar");
      expect(toolbar).toHaveAttribute("aria-hidden", "false");
    });

    it("shows the correct count of selected events", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1", "2"])} />);
      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it("shows singular label for 1 selected event", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });
  });

  // ── Selection controls ─────────────────────────────────────────────────────

  describe("Selection controls", () => {
    it("calls onSelectAll when 'Select all' is clicked", () => {
      const onSelectAll = jest.fn();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedIds={new Set(["1"])}
          onSelectAll={onSelectAll}
        />,
      );
      fireEvent.click(screen.getByText("Select all"));
      expect(onSelectAll).toHaveBeenCalledTimes(1);
    });

    it("calls onClearSelection when 'Deselect all' is clicked", () => {
      const onClearSelection = jest.fn();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedIds={new Set(["1"])}
          onClearSelection={onClearSelection}
        />,
      );
      fireEvent.click(screen.getByText("Deselect all"));
      expect(onClearSelection).toHaveBeenCalledTimes(1);
    });
  });

  // ── Export ─────────────────────────────────────────────────────────────────

  describe("Export actions", () => {
    it("calls exportEvents with csv format when CSV button is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Export selected events as CSV"));
      expect(mockExportEvents).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "1" })]),
        "csv",
      );
    });

    it("calls exportEvents with json format when JSON button is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Export selected events as JSON"));
      expect(mockExportEvents).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "1" })]),
        "json",
      );
    });

    it("passes only selected events to exportEvents", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Export selected events as JSON"));
      const [calledWith] = (mockExportEvents as jest.Mock).mock.calls[0];
      expect(calledWith).toHaveLength(1);
      expect(calledWith[0].id).toBe("1");
    });
  });

  // ── Resend ─────────────────────────────────────────────────────────────────

  describe("Resend Webhooks", () => {
    it("opens resend confirmation modal when Resend is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Resend webhooks for selected events"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Resend Webhooks")).toBeInTheDocument();
    });

    it("closes the modal when Cancel is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Resend webhooks for selected events"));
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls resendWebhooks and shows progress on confirm", async () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Resend webhooks for selected events"));
      fireEvent.click(screen.getById("confirm-modal-confirm"));

      await waitFor(() => {
        expect(mockResendWebhooks).toHaveBeenCalledWith(
          ["1"],
          expect.any(Function),
        );
      });

      // Progress should reach 100%
      await waitFor(() => {
        expect(screen.getByText("100%")).toBeInTheDocument();
      });
    });

    it("shows partial success result when some fail", async () => {
      mockResendWebhooks.mockImplementation(async (_ids, onProgress) => {
        onProgress({ total: 2, completed: 2, failed: 1, percent: 100 });
        return { succeeded: ["1"], failed: ["2"] };
      });

      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1", "2"])} />);
      fireEvent.click(screen.getByTitle("Resend webhooks for selected events"));
      fireEvent.click(screen.getById("confirm-modal-confirm"));

      await waitFor(() => {
        expect(screen.getByText(/1 succeeded/i)).toBeInTheDocument();
        expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
      });
    });
  });

  // ── Tag ────────────────────────────────────────────────────────────────────

  describe("Tag Events", () => {
    it("opens tag modal when Tag button is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Add a tag to selected events"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add Tag to Events")).toBeInTheDocument();
    });

    it("disables confirm button when tag input is empty", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Add a tag to selected events"));
      const confirmBtn = screen.getById("confirm-modal-confirm");
      expect(confirmBtn).toBeDisabled();
    });

    it("enables confirm button when tag input has text", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Add a tag to selected events"));
      fireEvent.change(screen.getByPlaceholderText(/e.g. urgent/i), {
        target: { value: "test-tag" },
      });
      expect(screen.getById("confirm-modal-confirm")).not.toBeDisabled();
    });

    it("calls tagEvents and onBulkTagSuccess on confirm", async () => {
      const onBulkTagSuccess = jest.fn();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedIds={new Set(["1"])}
          onBulkTagSuccess={onBulkTagSuccess}
        />,
      );

      fireEvent.click(screen.getByTitle("Add a tag to selected events"));
      fireEvent.change(screen.getByPlaceholderText(/e.g. urgent/i), {
        target: { value: "my-tag" },
      });
      fireEvent.click(screen.getById("confirm-modal-confirm"));

      await waitFor(() => {
        expect(mockTagEvents).toHaveBeenCalledWith(
          ["1"],
          "my-tag",
          expect.any(Function),
        );
        expect(onBulkTagSuccess).toHaveBeenCalledWith(["1"], "my-tag");
      });
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  describe("Delete Events", () => {
    it("opens delete confirmation modal when Delete is clicked", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Delete selected events"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Delete Events")).toBeInTheDocument();
    });

    it("shows the destructive warning message", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1", "2"])} />);
      fireEvent.click(screen.getByTitle("Delete selected events"));
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it("calls deleteEvents and onDeleteSuccess on confirm", async () => {
      const onDeleteSuccess = jest.fn();
      render(
        <BulkActionsToolbar
          {...defaultProps}
          selectedIds={new Set(["1"])}
          onDeleteSuccess={onDeleteSuccess}
        />,
      );

      fireEvent.click(screen.getByTitle("Delete selected events"));
      fireEvent.click(screen.getById("confirm-modal-confirm"));

      await waitFor(() => {
        expect(mockDeleteEvents).toHaveBeenCalledWith(
          ["1"],
          expect.any(Function),
        );
        expect(onDeleteSuccess).toHaveBeenCalledWith(["1"]);
      });
    });

    it("does not call deleteEvents when user cancels", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Delete selected events"));
      fireEvent.click(screen.getByText("Cancel"));
      expect(mockDeleteEvents).not.toHaveBeenCalled();
    });

    it("closes on Escape key press", () => {
      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1"])} />);
      fireEvent.click(screen.getByTitle("Delete selected events"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ── Progress indicator ─────────────────────────────────────────────────────

  describe("Progress indicator", () => {
    it("shows progress bar while operation is running", async () => {
      let resolveOperation!: (result: batchService.BatchResult) => void;
      mockDeleteEvents.mockImplementation(async (_ids, onProgress) => {
        onProgress({ total: 3, completed: 1, failed: 0, percent: 33 });
        return new Promise((resolve) => { resolveOperation = resolve; });
      });

      render(<BulkActionsToolbar {...defaultProps} selectedIds={new Set(["1", "2"])} />);
      fireEvent.click(screen.getByTitle("Delete selected events"));
      fireEvent.click(screen.getById("confirm-modal-confirm"));

      await waitFor(() => {
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.getByText("33%")).toBeInTheDocument();
      });

      // Resolve to clean up
      await act(async () => {
        resolveOperation({ succeeded: ["1", "2"], failed: [] });
      });
    });
  });
});

// Helper to find elements by ID (not built into RTL by default)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// Extend screen to support getByText with an aria-hidden element
// (RTL already supports this, we just add a helper for id-based lookup)
Object.defineProperty(screen, "getById", {
  get() {
    return (id: string) => document.getElementById(id) as HTMLElement;
  },
});
