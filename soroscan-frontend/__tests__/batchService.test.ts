/**
 * batchService.test.ts
 *
 * Unit tests for the batch service handlers.
 * Uses mocked fetch for API calls.
 */

import { exportEvents, resendWebhooks, tagEvents, deleteEvents } from "@/lib/batchService";
import type { EventRecord } from "@/components/ingest/types";

// ── Mock global fetch ───────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Mock URL/Blob ────────────────────────────────────────────────────────────
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement for anchor click
const mockClick = jest.fn();
const mockAnchor = { href: "", download: "", click: mockClick };
jest.spyOn(document, "createElement").mockImplementation((tag) => {
  if (tag === "a") return mockAnchor as unknown as HTMLElement;
  return document.createElement(tag);
});

// ── Test data ──────────────────────────────────────────────────────────────
const sampleEvent: EventRecord = {
  id: "1",
  contractId: "CCAAA123",
  contractName: "Test Contract",
  eventType: "transfer",
  ledger: 1000,
  eventIndex: 0,
  timestamp: "2024-01-01T00:00:00Z",
  txHash: "abc123",
  payload: { amount: 100 },
};

describe("batchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  // ── exportEvents ────────────────────────────────────────────────────────────

  describe("exportEvents", () => {
    it("triggers a JSON download for json format", () => {
      exportEvents([sampleEvent], "json");
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockAnchor.download).toMatch(/\.json$/);
    });

    it("triggers a CSV download for csv format", () => {
      exportEvents([sampleEvent], "csv");
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(mockAnchor.download).toMatch(/\.csv$/);
    });

    it("does nothing when events array is empty", () => {
      exportEvents([], "json");
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it("revokes the object URL after download", () => {
      exportEvents([sampleEvent], "json");
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  // ── resendWebhooks ─────────────────────────────────────────────────────────

  describe("resendWebhooks", () => {
    it("POSTs to /api/events/:id/resend for each event", async () => {
      const onProgress = jest.fn();
      await resendWebhooks(["1", "2"], onProgress);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith("/api/events/1/resend", expect.objectContaining({ method: "POST" }));
      expect(mockFetch).toHaveBeenCalledWith("/api/events/2/resend", expect.objectContaining({ method: "POST" }));
    });

    it("reports progress after each event", async () => {
      const onProgress = jest.fn();
      await resendWebhooks(["1", "2"], onProgress);

      expect(onProgress).toHaveBeenCalledTimes(2);
      // Final call should have 100%
      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({ percent: 100, completed: 2 }),
      );
    });

    it("returns succeeded and failed IDs", async () => {
      // First call succeeds, second fails
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) });

      const onProgress = jest.fn();
      const result = await resendWebhooks(["1", "2"], onProgress);

      expect(result.succeeded).toContain("1");
      expect(result.failed).toContain("2");
    });

    it("handles fetch network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const onProgress = jest.fn();
      const result = await resendWebhooks(["1"], onProgress);

      expect(result.failed).toContain("1");
      expect(result.succeeded).toHaveLength(0);
    });
  });

  // ── tagEvents ──────────────────────────────────────────────────────────────

  describe("tagEvents", () => {
    it("POSTs to /api/events/:id/tags with the tag in the body", async () => {
      const onProgress = jest.fn();
      await tagEvents(["1"], "urgent", onProgress);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/events/1/tags",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ tag: "urgent" }),
        }),
      );
    });

    it("collects failed IDs on HTTP error", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403, json: () => Promise.resolve({}) });
      const onProgress = jest.fn();
      const result = await tagEvents(["1", "2"], "urgent", onProgress);

      expect(result.failed).toHaveLength(2);
      expect(result.succeeded).toHaveLength(0);
    });
  });

  // ── deleteEvents ────────────────────────────────────────────────────────────

  describe("deleteEvents", () => {
    it("sends DELETE requests for each event ID", async () => {
      const onProgress = jest.fn();
      await deleteEvents(["1", "2"], onProgress);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith("/api/events/1", expect.objectContaining({ method: "DELETE" }));
      expect(mockFetch).toHaveBeenCalledWith("/api/events/2", expect.objectContaining({ method: "DELETE" }));
    });

    it("returns a result with all succeeded IDs on success", async () => {
      const onProgress = jest.fn();
      const result = await deleteEvents(["1", "2"], onProgress);

      expect(result.succeeded).toEqual(expect.arrayContaining(["1", "2"]));
      expect(result.failed).toHaveLength(0);
    });

    it("reports 100% progress when all done", async () => {
      const onProgress = jest.fn();
      await deleteEvents(["1"], onProgress);

      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({ percent: 100 }),
      );
    });
  });
});
