import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient } from "../src/client.js";

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

describe("SC-15 contract queries", () => {
  afterEach(() => vi.restoreAllMocks());

  it("isIndexer() queries /api/ingest/indexers/check/", async () => {
    mockFetch({ is_indexer: true });
    const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io" });
    const result = await client.isIndexer(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );
    expect(result.is_indexer).toBe(true);
  });

  it("getAdmin() queries /api/ingest/contract/admin/", async () => {
    mockFetch({ admin_address: "GADMIN" });
    const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io" });
    const result = await client.getAdmin();
    expect(result.admin_address).toBe("GADMIN");
  });
});
