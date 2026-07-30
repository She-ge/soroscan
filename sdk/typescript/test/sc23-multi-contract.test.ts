import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { GetEventsByContractsResponse } from "../src/types.js";

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

const CONTRACT_IDS = [
  "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
  "CCBBB111222333444555666777888999AAABBBCCCDDDEEEFFF",
];

const MOCK_RESPONSE: GetEventsByContractsResponse = {
  count: 1,
  results: [
    {
      id: "1",
      ledger: 100000,
      ledgerClosedAt: "2026-01-01T12:00:00Z",
      txHash: "txabc123",
      contractId: CONTRACT_IDS[0]!,
      type: "transfer",
      topics: [],
      value: { amount: "100" },
      inSuccessfulContractCall: true,
      pagingToken: "token1",
    },
  ],
  contractIds: CONTRACT_IDS,
};

// ─────────────────────────────────────────────────────────────────────────────
// SC-23: getEventsByContracts
// ─────────────────────────────────────────────────────────────────────────────

describe("getEventsByContracts() — SC-23", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts to /v1/events/by-contracts and returns response", async () => {
    mockFetch(MOCK_RESPONSE, 200);
    const result = await makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS });

    expect(result.count).toBe(1);
    expect(result.contractIds).toEqual(CONTRACT_IDS);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.type).toBe("transfer");

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/v1/events/by-contracts");
    expect(init.method).toBe("POST");
  });

  it("sends contractIds in request body", async () => {
    mockFetch(MOCK_RESPONSE, 200);
    await makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as { contractIds: string[] };
    expect(body.contractIds).toEqual(CONTRACT_IDS);
  });

  it("sends optional filters in request body", async () => {
    mockFetch({ ...MOCK_RESPONSE, count: 0, results: [] }, 200);
    await makeClient().getEventsByContracts({
      contractIds: CONTRACT_IDS,
      eventType: "transfer",
      startLedger: 100000,
      endLedger: 200000,
    });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as {
      eventType: string;
      startLedger: number;
      endLedger: number;
    };
    expect(body.eventType).toBe("transfer");
    expect(body.startLedger).toBe(100000);
    expect(body.endLedger).toBe(200000);
  });

  it("includes Authorization header", async () => {
    mockFetch(MOCK_RESPONSE, 200);
    await makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS });

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-key"
    );
  });

  it("handles single contract ID", async () => {
    mockFetch({ ...MOCK_RESPONSE, contractIds: [CONTRACT_IDS[0]] }, 200);
    const result = await makeClient().getEventsByContracts({
      contractIds: [CONTRACT_IDS[0]!],
    });
    expect(result.contractIds).toHaveLength(1);
  });

  it("throws SoroScanError on 400 validation error", async () => {
    mockFetch({ code: "INVALID_REQUEST", message: "Too many contract IDs" }, 400);
    await expect(
      makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS })
    ).rejects.toMatchObject({
      name: "SoroScanError",
      statusCode: 400,
      code: "INVALID_REQUEST",
    });
  });

  it("throws SoroScanError on 401 unauthorized", async () => {
    mockFetch({ code: "UNAUTHORIZED", message: "Invalid API key" }, 401);
    await expect(
      makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws SoroScanError on 500 server error", async () => {
    mockFetch({ code: "SERVER_ERROR", message: "Internal error" }, 500);
    await expect(
      makeClient().getEventsByContracts({ contractIds: CONTRACT_IDS })
    ).rejects.toBeInstanceOf(SoroScanError);
  });
});
