import { describe, it, expect, vi, afterEach } from "vitest";
import {
  SoroScanClient,
  SoroScanError,
  SoroScanNotFoundError,
  SoroScanValidationError,
} from "../src/client.js";
import type { ContractEvent } from "../src/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
}

const BASE_URL = "https://api.soroscan.io";
const CONTRACT_ID = "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF";
const makeClient = () => new SoroScanClient({ baseUrl: BASE_URL, apiKey: "test-key" });

function makeEvent(type: string): ContractEvent {
  return {
    id: `evt-${type}`,
    ledger: 100,
    ledgerClosedAt: "2024-01-01T00:00:00Z",
    txHash: "a".repeat(64),
    contractId: CONTRACT_ID,
    type,
    topics: [],
    value: {},
    inSuccessfulContractCall: true,
    pagingToken: "1",
  };
}

const MOCK_EVENTS: ContractEvent[] = [
  makeEvent("third"),
  makeEvent("second"),
  makeEvent("first"),
];

// ─────────────────────────────────────────────────────────────────────────────
// SC-30: getContractRecentEvents
// ─────────────────────────────────────────────────────────────────────────────

describe("getContractRecentEvents() — SC-30", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fetches from /api/ingest/contracts/:id/recent-events/ with default limit", async () => {
    mockFetch(MOCK_EVENTS);
    const result = await makeClient().getContractRecentEvents(CONTRACT_ID);

    expect(result).toHaveLength(3);
    expect(result[0]?.type).toBe("third");

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      `${BASE_URL}/api/ingest/contracts/${CONTRACT_ID}/recent-events/?limit=10`
    );
    expect(init.method).toBe("GET");
  });

  it("forwards a custom limit as a query parameter", async () => {
    mockFetch(MOCK_EVENTS.slice(0, 2));
    const result = await makeClient().getContractRecentEvents(CONTRACT_ID, 2);

    expect(result).toHaveLength(2);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain(`/api/ingest/contracts/${CONTRACT_ID}/recent-events/`);
    expect(url).toContain("limit=2");
  });

  it("returns an empty array when no events exist", async () => {
    mockFetch([]);
    const result = await makeClient().getContractRecentEvents(CONTRACT_ID);
    expect(result).toEqual([]);
  });

  it("throws for a limit below 1 without making a request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const error = await makeClient()
      .getContractRecentEvents(CONTRACT_ID, 0)
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(SoroScanError);
    expect(error).toBeInstanceOf(SoroScanValidationError);
    expect((error as Error).message).toMatch(/limit must be between 1 and 20/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws for a limit above the max without making a request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const error = await makeClient()
      .getContractRecentEvents(CONTRACT_ID, 21)
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(SoroScanError);
    expect(error).toBeInstanceOf(SoroScanValidationError);
    expect((error as Error).message).toMatch(/limit must be between 1 and 20/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws SoroScanNotFoundError on 404 not found", async () => {
    mockFetch({ code: "NOT_FOUND", message: "Contract not found" }, 404);
    const error = await makeClient()
      .getContractRecentEvents(CONTRACT_ID)
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(SoroScanError);
    expect(error).toBeInstanceOf(SoroScanNotFoundError);
    expect(error).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });

  it("throws SoroScanError on 500 server error", async () => {
    mockFetch({ code: "SERVER_ERROR", message: "Internal error" }, 500);
    await expect(
      makeClient().getContractRecentEvents(CONTRACT_ID)
    ).rejects.toBeInstanceOf(SoroScanError);
  });
});
