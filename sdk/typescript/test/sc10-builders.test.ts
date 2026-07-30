import { describe, it, expect, vi, afterEach } from "vitest";
import { SoroScanClient } from "../src/client.js";
import { EventQueryBuilder, ContractQueryBuilder } from "../src/builder.js";
import type { GetEventsResponse, GetContractsResponse } from "../src/types.js";

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

const makeClient = () =>
  new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "test-key" });

const EMPTY_EVENTS: GetEventsResponse = {
  items: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
  totalCount: 0,
};

const EMPTY_CONTRACTS: GetContractsResponse = {
  items: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
  totalCount: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// EventQueryBuilder — SC-10
// ─────────────────────────────────────────────────────────────────────────────

describe("EventQueryBuilder — SC-10", () => {
  afterEach(() => vi.restoreAllMocks());

  it("client.events() returns an EventQueryBuilder", () => {
    const builder = makeClient().events();
    expect(builder).toBeInstanceOf(EventQueryBuilder);
  });

  it("build() returns defaults with no filters set", () => {
    const params = new EventQueryBuilder(makeClient()).build();
    expect(params.first).toBe(50);
    expect(params.contractId).toBeUndefined();
    expect(params.eventType).toBeUndefined();
  });

  it("filterByContract sets contractId", () => {
    const params = new EventQueryBuilder(makeClient())
      .filterByContract("CCAAA123")
      .build();
    expect(params.contractId).toBe("CCAAA123");
  });

  it("filterByEventType sets eventType", () => {
    const params = new EventQueryBuilder(makeClient())
      .filterByEventType("transfer")
      .build();
    expect(params.eventType).toBe("transfer");
  });

  it("filterByLedgerRange sets startLedger and endLedger", () => {
    const params = new EventQueryBuilder(makeClient())
      .filterByLedgerRange(1000, 2000)
      .build();
    expect(params.startLedger).toBe(1000);
    expect(params.endLedger).toBe(2000);
  });

  it("filterByStartLedger and filterByEndLedger work independently", () => {
    const params = new EventQueryBuilder(makeClient())
      .filterByStartLedger(500)
      .filterByEndLedger(900)
      .build();
    expect(params.startLedger).toBe(500);
    expect(params.endLedger).toBe(900);
  });

  it("paginate() sets first", () => {
    const params = new EventQueryBuilder(makeClient()).paginate(25).build();
    expect(params.first).toBe(25);
  });

  it("first() sets first and clears last", () => {
    const params = new EventQueryBuilder(makeClient()).first(10).build();
    expect(params.first).toBe(10);
    expect(params.last).toBeUndefined();
  });

  it("last() sets last and omits first", () => {
    const params = new EventQueryBuilder(makeClient()).last(5).build();
    expect(params.last).toBe(5);
    expect(params.first).toBeUndefined();
  });

  it("after() sets cursor and clears before", () => {
    const params = new EventQueryBuilder(makeClient())
      .before("prev-cursor")
      .after("next-cursor")
      .build();
    expect(params.after).toBe("next-cursor");
    expect(params.before).toBeUndefined();
  });

  it("before() sets cursor and clears after", () => {
    const params = new EventQueryBuilder(makeClient())
      .after("next-cursor")
      .before("prev-cursor")
      .build();
    expect(params.before).toBe("prev-cursor");
    expect(params.after).toBeUndefined();
  });

  it("method chaining returns the same builder instance", () => {
    const builder = makeClient().events();
    const chained = builder
      .filterByContract("CCAAA123")
      .filterByEventType("swap")
      .filterByLedgerRange(100, 200)
      .paginate(20);
    expect(chained).toBe(builder);
  });

  it("execute() calls getEvents with built params", async () => {
    mockFetch(EMPTY_EVENTS);
    const client = makeClient();
    const spy = vi.spyOn(client, "getEvents").mockResolvedValue(EMPTY_EVENTS);

    await client
      .events()
      .filterByContract("CCAAA123")
      .filterByEventType("transfer")
      .filterByLedgerRange(1000, 2000)
      .paginate(10)
      .execute();

    expect(spy).toHaveBeenCalledOnce();
    const [params] = spy.mock.calls[0]!;
    expect(params?.contractId).toBe("CCAAA123");
    expect(params?.eventType).toBe("transfer");
    expect(params?.startLedger).toBe(1000);
    expect(params?.endLedger).toBe(2000);
    expect(params?.first).toBe(10);
  });

  it("execute() makes a real HTTP GET to /v1/events", async () => {
    mockFetch(EMPTY_EVENTS);
    await makeClient()
      .events()
      .filterByContract("CCAAA123")
      .execute();

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("/v1/events");
    expect(url).toContain("contractId=CCAAA123");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContractQueryBuilder — SC-10
// ─────────────────────────────────────────────────────────────────────────────

describe("ContractQueryBuilder — SC-10", () => {
  afterEach(() => vi.restoreAllMocks());

  it("client.contracts() returns a ContractQueryBuilder", () => {
    const builder = makeClient().contracts();
    expect(builder).toBeInstanceOf(ContractQueryBuilder);
  });

  it("build() returns defaults with no filters set", () => {
    const params = new ContractQueryBuilder(makeClient()).build();
    expect(params.first).toBe(50);
    expect(params.type).toBeUndefined();
    expect(params.search).toBeUndefined();
  });

  it("filterByType sets type", () => {
    const params = new ContractQueryBuilder(makeClient())
      .filterByType("token")
      .build();
    expect(params.type).toBe("token");
  });

  it("filterByCreator sets creator", () => {
    const params = new ContractQueryBuilder(makeClient())
      .filterByCreator("GABC123")
      .build();
    expect(params.creator).toBe("GABC123");
  });

  it("filterByVerified sets verified flag", () => {
    const params = new ContractQueryBuilder(makeClient())
      .filterByVerified()
      .build();
    expect(params.verified).toBe(true);
  });

  it("filterByVerified(false) sets verified to false", () => {
    const params = new ContractQueryBuilder(makeClient())
      .filterByVerified(false)
      .build();
    expect(params.verified).toBe(false);
  });

  it("search() sets the search term", () => {
    const params = new ContractQueryBuilder(makeClient())
      .search("my-token")
      .build();
    expect(params.search).toBe("my-token");
  });

  it("paginate() sets first", () => {
    const params = new ContractQueryBuilder(makeClient()).paginate(20).build();
    expect(params.first).toBe(20);
  });

  it("method chaining returns the same builder instance", () => {
    const builder = makeClient().contracts();
    const chained = builder
      .filterByType("dex")
      .filterByVerified()
      .search("swap")
      .paginate(10);
    expect(chained).toBe(builder);
  });

  it("execute() calls getContracts with built params", async () => {
    const client = makeClient();
    const spy = vi.spyOn(client, "getContracts").mockResolvedValue(EMPTY_CONTRACTS);

    await client
      .contracts()
      .filterByType("token")
      .filterByVerified()
      .paginate(15)
      .execute();

    expect(spy).toHaveBeenCalledOnce();
    const [params] = spy.mock.calls[0]!;
    expect(params?.type).toBe("token");
    expect(params?.verified).toBe(true);
    expect(params?.first).toBe(15);
  });

  it("execute() makes a real HTTP GET to /v1/contracts", async () => {
    mockFetch(EMPTY_CONTRACTS);
    await makeClient()
      .contracts()
      .search("token")
      .execute();

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("/v1/contracts");
    expect(url).toContain("search=token");
  });
});
