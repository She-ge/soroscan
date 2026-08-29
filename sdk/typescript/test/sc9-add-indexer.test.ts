import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { AddIndexerResponse } from "../src/types.js";

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

const MOCK_RESPONSE: AddIndexerResponse = {
  status: "submitted",
  txHash: "txaddindexer001",
  transactionStatus: "pending",
  error: null,
};

const INDEXER_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

describe("addIndexer() — SC-9", () => {
  afterEach(() => vi.restoreAllMocks());

  it("posts to /api/ingest/indexers/add/ and returns response", async () => {
    mockFetch(MOCK_RESPONSE, 202);
    const result = await makeClient().addIndexer({ indexerAddress: INDEXER_ADDRESS });

    expect(result.status).toBe("submitted");
    expect(result.txHash).toBe("txaddindexer001");
    expect(result.error).toBeNull();

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/api/ingest/indexers/add/");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as { indexer_address: string };
    expect(body.indexer_address).toBe(INDEXER_ADDRESS);
  });

  it("throws SoroScanError on 400 validation error", async () => {
    mockFetch({ code: "INVALID_INDEXER", message: "Invalid address" }, 400);
    await expect(
      makeClient().addIndexer({ indexerAddress: INDEXER_ADDRESS })
    ).rejects.toBeInstanceOf(SoroScanError);
  });
});
