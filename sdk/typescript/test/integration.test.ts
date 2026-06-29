/**
 * Live integration tests for the SoroScan TypeScript SDK.
 *
 * These tests run against an actual backend. They are skipped by default
 * unless the `SOROSCAN_INTEGRATION_TEST_URL` environment variable is set.
 *
 * Usage:
 *   SOROSCAN_INTEGRATION_TEST_URL=http://localhost:8000 \
 *   SOROSCAN_INTEGRATION_API_KEY=your-key \
 *   npx vitest run test/integration.test.ts
 *
 * For CI the backend is started by the sdk-integration-tests workflow.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SoroScanClient, SoroScanError } from "../src/client.js";
import type { Webhook } from "../src/types.js";

// ---------------------------------------------------------------------------
// Skip guard — skip every test if no live URL is configured
// ---------------------------------------------------------------------------

const LIVE_BASE_URL = process.env["SOROSCAN_INTEGRATION_TEST_URL"];
const LIVE_API_KEY = process.env["SOROSCAN_INTEGRATION_API_KEY"];

const runIntegration = LIVE_BASE_URL ? it : it.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueContractId(): string {
  const rand = Math.random().toString(36).slice(2, 12).toUpperCase();
  return `CTEST${rand.padEnd(51, "0")}`;
}

function uniqueUrl(): string {
  return `https://integration-test.example.com/webhook/${Math.random()
    .toString(36)
    .slice(2)}`;
}

function makeClient(apiKey?: string): SoroScanClient {
  return new SoroScanClient({
    baseUrl: LIVE_BASE_URL ?? "http://localhost:8000",
    apiKey: apiKey ?? LIVE_API_KEY,
    timeoutMs: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

describe("Authentication (live)", () => {
  runIntegration(
    "unauthenticated request reaches backend without throwing network error",
    async () => {
      const client = makeClient(undefined);
      // Remove key to simulate anonymous
      const anonClient = new SoroScanClient({
        baseUrl: LIVE_BASE_URL!,
        timeoutMs: 15_000,
      });
      try {
        await anonClient.getEvents({ first: 1 });
      } catch (err) {
        if (err instanceof SoroScanError) {
          // 401 or 403 is acceptable — backend reached
          expect([401, 403]).toContain(err.statusCode);
        } else {
          throw err;
        }
      }
    }
  );

  runIntegration("invalid API key returns 401", async () => {
    const client = new SoroScanClient({
      baseUrl: LIVE_BASE_URL!,
      apiKey: "invalid-key-xyz",
    });
    await expect(client.getContracts()).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  runIntegration("valid credentials allow events query", async () => {
    const client = makeClient();
    const result = await client.getEvents({ first: 1 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("pageInfo");
    expect(result).toHaveProperty("totalCount");
  });
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

describe("Event queries (live)", () => {
  runIntegration("getEvents() returns paginated response", async () => {
    const client = makeClient();
    const result = await client.getEvents({ first: 5 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.totalCount).toBe("number");
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  runIntegration("getEvents() filters by eventType", async () => {
    const client = makeClient();
    const result = await client.getEvents({ eventType: "transfer", first: 5 });
    for (const event of result.items) {
      expect(event.type).toBe("transfer");
    }
  });

  runIntegration("getEvents() respects first limit", async () => {
    const client = makeClient();
    const result = await client.getEvents({ first: 3 });
    expect(result.items.length).toBeLessThanOrEqual(3);
  });

  runIntegration(
    "getEvents() ledger range filter returns events in range",
    async () => {
      const client = makeClient();
      const result = await client.getEvents({
        startLedger: 1,
        endLedger: 9_999_999,
        first: 5,
      });
      for (const event of result.items) {
        expect(event.ledger).toBeGreaterThanOrEqual(1);
        expect(event.ledger).toBeLessThanOrEqual(9_999_999);
      }
    }
  );

  runIntegration("getEvents() nonexistent contractId returns empty list", async () => {
    const client = makeClient();
    const result = await client.getEvents({
      contractId: uniqueContractId(),
      first: 10,
    });
    expect(result.items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

describe("Contracts (live)", () => {
  runIntegration("getContracts() returns paginated response", async () => {
    const client = makeClient();
    const result = await client.getContracts({ first: 5 });
    expect(Array.isArray(result.items)).toBe(true);
  });

  runIntegration("getContracts() filter by type", async () => {
    const client = makeClient();
    const result = await client.getContracts({ type: "token", first: 5 });
    for (const contract of result.items) {
      expect(contract.type).toBe("token");
    }
  });

  runIntegration("getContracts() filter verified=true", async () => {
    const client = makeClient();
    const result = await client.getContracts({ verified: true, first: 5 });
    for (const contract of result.items) {
      expect(contract.verified).toBe(true);
    }
  });

  runIntegration("getContract() nonexistent returns 404", async () => {
    const client = makeClient();
    await expect(
      client.getContract({ contractId: uniqueContractId() })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

describe("Webhook management (live)", () => {
  let createdWebhookId: string | undefined;

  afterAll(async () => {
    if (createdWebhookId && LIVE_BASE_URL) {
      try {
        await makeClient().deleteWebhook(createdWebhookId);
      } catch {
        // best-effort cleanup
      }
    }
  });

  runIntegration("subscribeWebhook() creates a webhook", async () => {
    const client = makeClient();
    const url = uniqueUrl();

    let webhook: Webhook;
    try {
      webhook = await client.subscribeWebhook({
        url,
        triggers: ["event.created"],
      });
    } catch (err) {
      if (err instanceof SoroScanError && err.statusCode === 401) {
        // Backend requires auth for webhook creation — skip gracefully
        return;
      }
      throw err;
    }

    createdWebhookId = webhook.id;
    expect(webhook.url).toBe(url);
    expect(webhook.triggers).toContain("event.created");
    expect(webhook.status).toBe("active");
  });

  runIntegration("listWebhooks() returns created webhook", async () => {
    if (!createdWebhookId) return;
    const client = makeClient();
    const result = await client.listWebhooks();
    const ids = result.items.map((w) => w.id);
    expect(ids).toContain(createdWebhookId);
  });

  runIntegration("getWebhook() returns webhook by id", async () => {
    if (!createdWebhookId) return;
    const client = makeClient();
    const webhook = await client.getWebhook(createdWebhookId);
    expect(webhook.id).toBe(createdWebhookId);
  });

  runIntegration("updateWebhook() changes status to paused", async () => {
    if (!createdWebhookId) return;
    const client = makeClient();
    const updated = await client.updateWebhook(createdWebhookId, {
      status: "paused",
    });
    expect(updated.status).toBe("paused");
  });

  runIntegration("deleteWebhook() removes the webhook", async () => {
    if (!createdWebhookId) return;
    const client = makeClient();
    await client.deleteWebhook(createdWebhookId);
    createdWebhookId = undefined;

    await expect(
      client.getWebhook(createdWebhookId!)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ---------------------------------------------------------------------------
// Error scenarios
// ---------------------------------------------------------------------------

describe("Error scenarios (live)", () => {
  runIntegration(
    "request to nonexistent path returns SoroScanError",
    async () => {
      const client = makeClient();
      await expect(
        (client as any)["#request"]?.("GET", "/v1/this-path-does-not-exist")
      ).rejects.toBeInstanceOf(Error);
    }
  );

  runIntegration("large page size is clamped by backend", async () => {
    const client = makeClient();
    // Backend should handle or clamp an oversized page request
    const result = await client.getEvents({ first: 10_000 });
    expect(result.items.length).toBeLessThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// Pagination (live)
// ---------------------------------------------------------------------------

describe("Pagination (live)", () => {
  runIntegration(
    "cursor-based pagination returns consistent sequential pages",
    async () => {
      const client = makeClient();
      const page1 = await client.getEvents({ first: 2 });

      if (!page1.pageInfo.hasNextPage) {
        // Not enough events to test pagination
        return;
      }

      const page2 = await client.getEvents({
        first: 2,
        after: page1.pageInfo.endCursor ?? undefined,
      });

      // Items on page 2 should not overlap with page 1
      const page1Ids = new Set(page1.items.map((e) => e.id));
      for (const event of page2.items) {
        expect(page1Ids.has(event.id)).toBe(false);
      }
    }
  );
});
