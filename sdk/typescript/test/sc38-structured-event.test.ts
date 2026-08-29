import { afterEach, describe, expect, it, vi } from "vitest";
import { SoroScanClient } from "../src/client.js";

describe("recordStructuredEvent() — SC-38", () => {
  afterEach(() => vi.restoreAllMocks());

  it("serializes the structured contract payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ status: "submitted", tx_hash: "abc", transaction_status: "PENDING" }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "key" });
    const result = await client.recordStructuredEvent({
      contractId: "CABC",
      eventType: "transfer",
      payloadHash: "a".repeat(64),
      schemaVersion: 1,
      correlationId: "b".repeat(64),
    });

    expect(result.status).toBe("submitted");
    expect(result.txHash).toBe("abc");
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.soroscan.io/api/record/structured/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      contract_id: "CABC",
      event_type: "transfer",
      payload_hash: "a".repeat(64),
      schema_version: 1,
      correlation_id: "b".repeat(64),
    });
  });
});
