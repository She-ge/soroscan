import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { RecordEventsBatchResponse } from "../src/types.js";

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

const MOCK_BATCH_RESPONSE: RecordEventsBatchResponse = {
  status: "submitted",
  totalEvents: 3,
  txHash: "txbatch001",
  transactionStatus: "pending",
  error: null,
};

const SAMPLE_EVENTS = [
  {
    contractId: "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
    eventType: "transfer" as const,
    payloadHash: "a".repeat(64),
  },
  {
    contractId: "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
    eventType: "swap" as const,
    payloadHash: "b".repeat(64),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SC-29: recordEventsBatch
// ─────────────────────────────────────────────────────────────────────────────

describe("recordEventsBatch() — SC-29", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts to /v1/record-events-batch and returns response", async () => {
    mockFetch(MOCK_BATCH_RESPONSE, 202);
    const result = await makeClient().recordEventsBatch({ events: SAMPLE_EVENTS });

    expect(result.status).toBe("submitted");
    expect(result.totalEvents).toBe(3);
    expect(result.txHash).toBe("txbatch001");
    expect(result.error).toBeNull();

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/v1/record-events-batch");
    expect(init.method).toBe("POST");
  });

  it("sends correct payload in request body", async () => {
    mockFetch(MOCK_BATCH_RESPONSE, 202);
    await makeClient().recordEventsBatch({ events: SAMPLE_EVENTS });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as { events: typeof SAMPLE_EVENTS };
    expect(body.events).toHaveLength(2);
    expect(body.events[0]?.eventType).toBe("transfer");
    expect(body.events[1]?.eventType).toBe("swap");
  });

  it("includes Authorization header", async () => {
    mockFetch(MOCK_BATCH_RESPONSE, 202);
    await makeClient().recordEventsBatch({ events: SAMPLE_EVENTS });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-key"
    );
  });

  it("handles single-event batch", async () => {
    mockFetch({ ...MOCK_BATCH_RESPONSE, totalEvents: 1 }, 202);
    const result = await makeClient().recordEventsBatch({
      events: [SAMPLE_EVENTS[0]!],
    });
    expect(result.totalEvents).toBe(1);
  });

  it("throws SoroScanError on 400 validation error", async () => {
    mockFetch({ code: "INVALID_BATCH", message: "Batch too large" }, 400);
    await expect(
      makeClient().recordEventsBatch({ events: SAMPLE_EVENTS })
    ).rejects.toMatchObject({
      name: "SoroScanError",
      statusCode: 400,
      code: "INVALID_BATCH",
    });
  });

  it("throws SoroScanError on 401 unauthorized", async () => {
    mockFetch({ code: "UNAUTHORIZED", message: "Invalid API key" }, 401);
    await expect(
      makeClient().recordEventsBatch({ events: SAMPLE_EVENTS })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws SoroScanError on 500 server error", async () => {
    mockFetch({ code: "SERVER_ERROR", message: "Internal error" }, 500);
    await expect(
      makeClient().recordEventsBatch({ events: SAMPLE_EVENTS })
    ).rejects.toBeInstanceOf(SoroScanError);
  });
});
