import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { ContractStatus } from "../src/types.js";

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

const MOCK_ACTIVE_STATUS: ContractStatus = {
  paused: false,
  admin: "GAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
  totalEvents: 42,
};

const MOCK_PAUSED_STATUS: ContractStatus = {
  paused: true,
  admin: "GAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
  totalEvents: 42,
};

// ─────────────────────────────────────────────────────────────────────────────
// SC-28: getContractStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("getContractStatus() — SC-28", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a correctly-parsed status when not paused", async () => {
    mockFetch(MOCK_ACTIVE_STATUS, 200);
    const result = await makeClient().getContractStatus();

    expect(result.paused).toBe(false);
    expect(result.admin).toBe(MOCK_ACTIVE_STATUS.admin);
    expect(result.totalEvents).toBe(42);
  });

  it("returns a correctly-parsed status when paused", async () => {
    mockFetch(MOCK_PAUSED_STATUS, 200);
    const result = await makeClient().getContractStatus();

    expect(result.paused).toBe(true);
    expect(result.totalEvents).toBe(42);
  });

  it("calls the correct URL with GET method", async () => {
    mockFetch(MOCK_ACTIVE_STATUS, 200);
    await makeClient().getContractStatus();

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/v1/contract-status");
    expect(init.method).toBe("GET");
  });

  it("includes Authorization header", async () => {
    mockFetch(MOCK_ACTIVE_STATUS, 200);
    await makeClient().getContractStatus();

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-key"
    );
  });

  it("throws SoroScanError on 401 unauthorized", async () => {
    mockFetch({ code: "UNAUTHORIZED", message: "Invalid API key" }, 401);
    await expect(makeClient().getContractStatus()).rejects.toMatchObject({
      name: "SoroScanError",
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("throws SoroScanError on 500 server error", async () => {
    mockFetch({ code: "SERVER_ERROR", message: "Internal error" }, 500);
    await expect(makeClient().getContractStatus()).rejects.toBeInstanceOf(
      SoroScanError
    );
  });
});
