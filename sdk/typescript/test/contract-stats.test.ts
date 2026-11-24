import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SoroScanClient,
  SoroScanNotFoundError,
  SoroScanValidationError,
} from "../src/client.js";
import type { ContractStats } from "../src/types.js";

const BASE_URL = "https://api.soroscan.io";
const CONTRACT_PK = "42";
const CONTRACT_ADDRESS = "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF";

const makeClient = () =>
  new SoroScanClient({ baseUrl: BASE_URL, apiKey: "test-key" });

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

const VALID_STATS = {
  contract_id: CONTRACT_ADDRESS,
  name: "yield-vault",
  total_events: 128,
  unique_event_types: 5,
  latest_ledger: 1_234_567,
  last_activity: "2024-05-01T12:34:56Z",
};

describe("getContractStats() — SC-42", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a typed ContractStats object from the stats endpoint", async () => {
    mockFetch(VALID_STATS);

    const stats: ContractStats = await makeClient().getContractStats(CONTRACT_PK);

    expect(stats).toEqual({
      contractId: CONTRACT_ADDRESS,
      name: "yield-vault",
      totalEvents: 128,
      uniqueEventTypes: 5,
      latestLedger: 1_234_567,
      lastActivity: "2024-05-01T12:34:56Z",
    });

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe(
      `${BASE_URL}/api/ingest/contracts/${CONTRACT_PK}/stats/`
    );
    expect(init.method).toBe("GET");
  });

  it("normalizes nullable fields when a contract has no events", async () => {
    mockFetch({
      ...VALID_STATS,
      total_events: 0,
      unique_event_types: 0,
      latest_ledger: null,
      last_activity: null,
    });

    const stats = await makeClient().getContractStats(CONTRACT_PK);
    expect(stats.latestLedger).toBeNull();
    expect(stats.lastActivity).toBeNull();
  });

  it("throws SoroScanNotFoundError on a 404 for an unknown contract", async () => {
    mockFetch({ code: "not_found", message: "Contract not found" }, 404);

    await expect(
      makeClient().getContractStats("999999")
    ).rejects.toBeInstanceOf(SoroScanNotFoundError);
  });

  it("throws SoroScanValidationError for an invalid response body", async () => {
    mockFetch({ contract_id: CONTRACT_ADDRESS, total_events: "many" });

    await expect(
      makeClient().getContractStats(CONTRACT_PK)
    ).rejects.toBeInstanceOf(SoroScanValidationError);
  });

  it("throws SoroScanValidationError when the response is empty", async () => {
    mockFetch({});

    await expect(
      makeClient().getContractStats(CONTRACT_PK)
    ).rejects.toMatchObject({
      name: "SoroScanValidationError",
      code: "invalid_response",
    });
  });
});
