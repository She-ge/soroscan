import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { IndexerStats } from "../src/types.js";

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
const makeClient = () => new SoroScanClient({ baseUrl: BASE_URL, apiKey: "test-key" });

const INDEXER_ADDRESS = "GABC111222333444555666777888999AAABBBCCCDDDEEEFFF00";

const MOCK_STATS_RESPONSE: IndexerStats = {
  indexer: INDEXER_ADDRESS,
  eventsRecorded: 42,
};

const MOCK_ZERO_STATS_RESPONSE: IndexerStats = {
  indexer: INDEXER_ADDRESS,
  eventsRecorded: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// SC-13: getIndexerStats
// ─────────────────────────────────────────────────────────────────────────────

describe("getIndexerStats() — SC-13", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a correctly-parsed stats object", async () => {
    mockFetch(MOCK_STATS_RESPONSE, 200);
    const result = await makeClient().getIndexerStats(INDEXER_ADDRESS);

    expect(result.indexer).toBe(INDEXER_ADDRESS);
    expect(result.eventsRecorded).toBe(42);
  });

  it("calls GET on /v1/indexer-stats/<address>", async () => {
    mockFetch(MOCK_STATS_RESPONSE, 200);
    await makeClient().getIndexerStats(INDEXER_ADDRESS);

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain(`/v1/indexer-stats/${INDEXER_ADDRESS}`);
    expect(init.method).toBe("GET");
  });

  it("includes Authorization header", async () => {
    mockFetch(MOCK_STATS_RESPONSE, 200);
    await makeClient().getIndexerStats(INDEXER_ADDRESS);

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-key"
    );
  });

  it("handles a zero-events response correctly", async () => {
    mockFetch(MOCK_ZERO_STATS_RESPONSE, 200);
    const result = await makeClient().getIndexerStats(INDEXER_ADDRESS);

    expect(result.eventsRecorded).toBe(0);
  });

  it("throws SoroScanError on 401 unauthorized", async () => {
    mockFetch({ code: "UNAUTHORIZED", message: "Invalid API key" }, 401);
    await expect(
      makeClient().getIndexerStats(INDEXER_ADDRESS)
    ).rejects.toMatchObject({ name: "SoroScanError", statusCode: 401 });
  });

  it("throws SoroScanError on 404 not found", async () => {
    mockFetch({ code: "NOT_FOUND", message: "Indexer not found" }, 404);
    await expect(
      makeClient().getIndexerStats(INDEXER_ADDRESS)
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("throws SoroScanError on 500 server error", async () => {
    mockFetch({ code: "SERVER_ERROR", message: "Internal error" }, 500);
    await expect(
      makeClient().getIndexerStats(INDEXER_ADDRESS)
    ).rejects.toBeInstanceOf(SoroScanError);
  });
});
