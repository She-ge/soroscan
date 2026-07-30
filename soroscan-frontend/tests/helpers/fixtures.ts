import { test as base, expect, type Page, type Route } from "@playwright/test";

export const CONTRACT_ID =
  "CCAABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOP";

export interface MockContract {
  id: string;
  contractId: string;
  name: string;
  description: string;
  tags: string[];
  status: "active" | "inactive";
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

function buildEvents(count: number, eventType?: string | null) {
  return Array.from({ length: count }, (_, index) => {
    const type = eventType || (index % 2 === 0 ? "SWAP_COMPLETE" : "TRANSFER");
    return {
      id: `evt_${index + 1}`,
      eventType: type,
      ledger: 1_000_000 + index,
      eventIndex: index,
      timestamp: new Date(Date.UTC(2026, 0, 1, 12, 0, index)).toISOString(),
      txHash: `txhash${String(index).padStart(8, "0")}${"a".repeat(48)}`,
      payload: { amount: String(100 + index), asset: "XLM" },
      contractId: CONTRACT_ID,
      contractName: "Demo AMM",
      payloadHash: `hash_${index}`,
      validationStatus: "VALID",
      schemaVersion: "1.0",
    };
  });
}

function createInitialContracts(): MockContract[] {
  return [
    {
      id: "ctr_1",
      contractId: CONTRACT_ID,
      name: "Demo AMM",
      description: "Primary demo contract",
      tags: ["defi", "amm"],
      status: "active",
      eventCount: 128,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "ctr_2",
      contractId: "CCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      name: "Oracle Feed",
      description: "Price oracle",
      tags: ["oracle"],
      status: "active",
      eventCount: 42,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
  ];
}

function operationName(query: string): string {
  const match = query.match(/\b(query|mutation|subscription)\s+([A-Za-z0-9_]+)/);
  return match?.[2] || "";
}

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ data }),
  });
}

/**
 * Installs GraphQL route mocks used by the Next.js BFF (`/api/graphql`)
 * and the Apollo client (`localhost:8000/graphql/`).
 */
export async function installGraphqlMocks(page: Page) {
  const contracts = createInitialContracts();

  const handler = async (route: Route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204 });
      return;
    }

    let body: { query?: string; variables?: Record<string, unknown> } = {};
    try {
      body = route.request().postDataJSON();
    } catch {
      body = {};
    }

    const query = body.query || "";
    const variables = body.variables || {};
    const op = operationName(query);

    if (op === "Login" || query.includes("mutation Login")) {
      await fulfillJson(route, {
        login: {
          access: "e2e-access-token",
          refresh: "e2e-refresh-token",
          user: { id: "user_1", email: "operator@soroscan.io" },
        },
      });
      return;
    }

    if (op === "ListContracts" || (query.includes("contracts") && query.includes("eventCount"))) {
      await fulfillJson(route, { contracts });
      return;
    }

    if (op === "AllContracts" || (query.includes("query AllContracts"))) {
      await fulfillJson(route, {
        contracts: contracts.map((c) => ({
          contractId: c.contractId,
          name: c.name,
        })),
      });
      return;
    }

    if (op === "GetContract" || (query.includes("query GetContract"))) {
      const id = String(variables.id || "");
      const contract = contracts.find((c) => c.id === id || c.contractId === id) || null;
      await fulfillJson(route, { contract });
      return;
    }

    if (op === "Contract" || query.includes("query Contract(")) {
      const contractId = String(variables.contractId || "");
      const contract = contracts.find((c) => c.contractId === contractId);
      await fulfillJson(route, {
        contract: contract
          ? { contractId: contract.contractId, name: contract.name }
          : null,
      });
      return;
    }

    if (op === "RegisterContract" || query.includes("registerContract")) {
      const input = (variables.input || {}) as Partial<MockContract>;
      const created: MockContract = {
        id: `ctr_${Date.now()}`,
        contractId: String(input.contractId || ""),
        name: String(input.name || "Untitled"),
        description: String(input.description || ""),
        tags: Array.isArray(input.tags) ? input.tags : [],
        status: (input.status as MockContract["status"]) || "active",
        eventCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contracts.unshift(created);
      await fulfillJson(route, { registerContract: created });
      return;
    }

    if (op === "UpdateContract" || query.includes("updateContract")) {
      const id = String(variables.id || "");
      const input = (variables.input || {}) as Partial<MockContract>;
      const index = contracts.findIndex((c) => c.id === id || c.contractId === id);
      if (index >= 0) {
        contracts[index] = {
          ...contracts[index],
          ...input,
          id: contracts[index].id,
          contractId: contracts[index].contractId,
          updatedAt: new Date().toISOString(),
        };
        await fulfillJson(route, { updateContract: contracts[index] });
        return;
      }
      await fulfillJson(route, { updateContract: null });
      return;
    }

    if (op === "DeleteContract" || query.includes("deleteContract")) {
      const id = String(variables.id || "");
      const index = contracts.findIndex((c) => c.id === id || c.contractId === id);
      if (index >= 0) {
        contracts.splice(index, 1);
      }
      await fulfillJson(route, { deleteContract: { success: true } });
      return;
    }

    if (op === "EventTypes" || query.includes("eventTypes")) {
      await fulfillJson(route, {
        eventTypes: ["SWAP_COMPLETE", "TRANSFER", "LIQUIDITY_ADD"],
      });
      return;
    }

    if (
      op === "ExplorerEvents" ||
      op === "EventsExport" ||
      op === "AllEvents" ||
      query.includes("query ExplorerEvents") ||
      query.includes("query EventsExport") ||
      query.includes("query AllEvents") ||
      (query.includes("events(") && query.includes("contractId"))
    ) {
      const eventType = (variables.eventType as string | null | undefined) || null;
      const limit = Number(variables.limit ?? 50);
      const offset = Number(variables.offset ?? 0);
      // Always build a mixed set, then filter — otherwise filtered counts never shrink.
      const all = buildEvents(20);
      const filtered = eventType
        ? all.filter((event) => event.eventType === eventType)
        : all;
      const slice = filtered.slice(offset, offset + limit);
      if (query.includes("allEvents")) {
        await fulfillJson(route, { allEvents: slice });
      } else {
        await fulfillJson(route, { events: slice });
      }
      return;
    }

    if (op === "GetSystemMetrics" || query.includes("systemMetrics")) {
      await fulfillJson(route, {
        systemMetrics: {
          eventsIndexedToday: 1284,
          eventsIndexedTotal: 982_341,
          webhookSuccessRate: 97.5,
          avgWebhookDeliveryTime: 142,
          activeContracts: contracts.filter((c) => c.status === "active").length,
          lastSynced: "2026-07-27T12:00:00.000Z",
          dbStatus: "ONLINE",
          redisStatus: "ONLINE",
        },
        recentErrors: [
          {
            id: "err_1",
            timestamp: "2026-07-27T11:55:00.000Z",
            level: "WARNING",
            message: "Transient RPC timeout",
            context: "ingest",
          },
        ],
      });
      return;
    }

    // Default: empty successful payload so unrelated queries do not crash the UI.
    await fulfillJson(route, {});
  };

  await page.route("**/api/graphql", handler);
  await page.route("**/api/graphql/", handler);
  await page.route("**/graphql", handler);
  await page.route("**/graphql/", handler);
  await page.route("**/graphql/**", handler);
}

export async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("access_token", "e2e-access-token");
    window.localStorage.setItem("refresh_token", "e2e-refresh-token");
  });
}

export async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("refresh_token");
  });
}

/**
 * Visual regression helper.
 * - Chromium only (Firefox still runs functional coverage).
 * - Locally compares against committed baselines.
 * - In CI, attaches a full-page screenshot without failing on missing
 *   linux baselines (win32 baselines are committed for local runs).
 */
export async function expectVisualSnapshot(
  page: Page,
  name: string,
  testInfo: import("@playwright/test").TestInfo,
) {
  testInfo.skip(testInfo.project.name !== "chromium", "Visual baselines are Chromium-only");

  if (process.env.CI) {
    const shot = await page.screenshot({ fullPage: true, animations: "disabled" });
    await testInfo.attach(name, { body: shot, contentType: "image/png" });
    return;
  }

  await expect(page).toHaveScreenshot(name, { fullPage: true });
}

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, provide) => {
    await seedAuth(page);
    await installGraphqlMocks(page);
    await provide(page);
  },
});

export { expect };
