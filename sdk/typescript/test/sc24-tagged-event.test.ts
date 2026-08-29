import { afterEach, describe, expect, it, vi } from "vitest";
import { SoroScanClient } from "../src/client.js";

describe("recordTaggedEvent() — SC-24", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serializes the tagged contract payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "submitted",
            tx_hash: "abc",
            transaction_status: "PENDING",
            tags: ["defi", "token"],
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "key" });
    const result = await client.recordTaggedEvent({
      contractId: "CABC",
      eventType: "transfer",
      payloadHash: "a".repeat(64),
      tags: ["defi", "token"],
    });

    expect(result.status).toBe("submitted");
    expect(result.txHash).toBe("abc");
    expect(result.tags).toEqual(["defi", "token"]);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.soroscan.io/api/record/tagged/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      contract_id: "CABC",
      event_type: "transfer",
      payload_hash: "a".repeat(64),
      tags: ["defi", "token"],
    });
  });

  it("uses an empty array if tags are not provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "submitted",
            tx_hash: "def",
            transaction_status: "PENDING",
            tags: [],
          }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "key" });
    const result = await client.recordTaggedEvent({
      contractId: "CABC",
      eventType: "transfer",
      payloadHash: "a".repeat(64),
    });

    expect(result.status).toBe("submitted");
    expect(result.txHash).toBe("def");
    expect(result.tags).toEqual([]);
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      contract_id: "CABC",
      event_type: "transfer",
      payload_hash: "a".repeat(64),
      tags: [],
    });
  });
});
