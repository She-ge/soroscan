import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { PactV4, MatchersV3 } from "@pact-foundation/pact";
import { SoroScanClient } from "../../src/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACTS_DIR = path.resolve(__dirname, "../../../../pacts");

const { like, eachLike, string, integer, boolean } = MatchersV3;

const pact = new PactV4({
  consumer: "soroscan-typescript-sdk",
  provider: "soroscan-api",
  dir: PACTS_DIR,
});

describe("SoroScan TypeScript SDK API contract (consumer)", () => {
  it("ingest health check returns healthy status", async () => {
    await pact
      .addInteraction()
      .given("the API is healthy")
      .uponReceiving("a request for ingest service health")
      .withRequest("GET", "/api/ingest/health/")
      .willRespondWith(200, (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody({
          status: "healthy",
          service: like("soroscan"),
        });
      })
      .executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/ingest/health/`);
        const body = (await response.json()) as { status: string; service: string };
        expect(response.status).toBe(200);
        expect(body.status).toBe("healthy");
        expect(body.service).toBeTruthy();
      });
  });

  it("lists events using SDK pagination format", async () => {
    await pact
      .addInteraction()
      .given("contract events exist")
      .uponReceiving("a request to list events for the TypeScript SDK")
      .withRequest("GET", "/v1/events", (builder) => {
        builder.query({ first: "5" });
      })
      .willRespondWith(200, (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody({
          items: eachLike({
            id: string("evt_001"),
            ledger: integer(123456),
            ledgerClosedAt: string("2024-01-01T00:00:00Z"),
            txHash: string("abc123"),
            contractId: string("CCAAA"),
            type: string("transfer"),
            topics: eachLike({
              type: string("symbol"),
              value: string("transfer"),
            }),
            value: like({ amount: "100" }),
            inSuccessfulContractCall: boolean(true),
            pagingToken: string("123456-1"),
          }),
          pageInfo: {
            hasNextPage: boolean(false),
            hasPreviousPage: boolean(false),
            startCursor: like("123456-1"),
            endCursor: like("123456-1"),
          },
          totalCount: integer(1),
        });
      })
      .executeTest(async (mockServer) => {
        const client = new SoroScanClient({ baseUrl: mockServer.url });
        const result = await client.getEvents({ first: 5 });
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.pageInfo).toBeDefined();
        expect(typeof result.totalCount).toBe("number");
      });
  });

  it("returns a single contract by id", async () => {
    const contractId = "C" + "A".repeat(55);

    await pact
      .addInteraction()
      .given("a tracked contract exists")
      .uponReceiving("a request for a single contract by id")
      .withRequest("GET", `/v1/contracts/${contractId}`)
      .willRespondWith(200, (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody({
          id: string(contractId),
          network: string("mainnet"),
          type: string("custom"),
          wasmHash: string(""),
          creator: string(""),
          createdAt: string("2024-01-01T00:00:00Z"),
          createdLedger: integer(0),
          lastActivityAt: like(null),
          totalEvents: integer(1),
          spec: like(null),
          verified: boolean(false),
          verifiedAt: like(null),
          sourceCode: like(null),
          label: string("Pact Test Contract"),
        });
      })
      .executeTest(async (mockServer) => {
        const client = new SoroScanClient({ baseUrl: mockServer.url });
        const contract = await client.getContract({ contractId });
        expect(contract.id).toBe(contractId);
        expect(contract.network).toBe("mainnet");
      });
  });
});
