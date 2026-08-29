/**
 * SoroScan k6 scenario suite for primary API workflows discovered in
 * django-backend/soroscan/urls.py and ingest/urls.py.
 *
 * Configurable via environment variables. Refuses production targets unless
 * ALLOW_PRODUCTION_LOAD=true.
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import { assertSafeTarget } from "./lib/safety.js";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8000";
const TOKEN_USER = __ENV.K6_USERNAME || "";
const TOKEN_PASSWORD = __ENV.K6_PASSWORD || "";
const API_TOKEN = __ENV.K6_API_TOKEN || "";

export const options = {
  scenarios: {
    smoke_health: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: __ENV.K6_RAMP_UP || "10s", target: Number(__ENV.K6_VUS || 5) },
        { duration: __ENV.K6_DURATION || "45s", target: Number(__ENV.K6_VUS || 5) },
      ],
      exec: "healthFlow",
    },
    browse_contracts: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_CONTRACT_VUS || 3),
      duration: __ENV.K6_DURATION || "45s",
      exec: "browseContracts",
      startTime: "5s",
    },
    query_events: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_EVENT_VUS || 3),
      duration: __ENV.K6_DURATION || "45s",
      exec: "queryEvents",
      startTime: "5s",
    },
    webhook_ops: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_WEBHOOK_VUS || 2),
      duration: __ENV.K6_DURATION || "45s",
      exec: "webhookOps",
      startTime: "5s",
    },
    data_export: {
      executor: "constant-vus",
      vus: Number(__ENV.K6_EXPORT_VUS || 1),
      duration: __ENV.K6_DURATION || "45s",
      exec: "dataExport",
      startTime: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.1"],
    "http_req_duration{scenario:smoke_health}": ["p(95)<2000"],
    "http_req_duration{scenario:browse_contracts}": ["p(95)<3000"],
    "http_req_duration{scenario:query_events}": ["p(95)<3000"],
    "http_req_duration{scenario:webhook_ops}": ["p(95)<3000"],
    "http_req_duration{scenario:data_export}": ["p(95)<4000"],
  },
};

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

export function setup() {
  assertSafeTarget(BASE_URL);
  let token = API_TOKEN;
  if (!token && TOKEN_USER && TOKEN_PASSWORD) {
    const res = http.post(
      `${BASE_URL}/api/token/`,
      JSON.stringify({ username: TOKEN_USER, password: TOKEN_PASSWORD }),
      { headers: { "Content-Type": "application/json" } }
    );
    if (res.status === 200) {
      try {
        token = res.json("access") || "";
      } catch (err) {
        token = "";
      }
    }
  }
  return { token };
}

export function healthFlow() {
  group("health and readiness", () => {
    const health = http.get(`${BASE_URL}/health/`, { tags: { name: "liveness" } });
    check(health, { "liveness 200": (r) => r.status === 200 });

    const ingestHealth = http.get(`${BASE_URL}/api/ingest/health/`, {
      tags: { name: "ingest-health" },
    });
    check(ingestHealth, { "ingest health 200": (r) => r.status === 200 });

    const ready = http.get(`${BASE_URL}/ready/`, {
      tags: { name: "ready" },
      responseCallback: http.expectedStatuses(200, 503),
    });
    check(ready, { "readiness reachable": (r) => [200, 503].includes(r.status) });
  });
  sleep(1);
}

export function browseContracts() {
  group("list contracts", () => {
    const res = http.get(`${BASE_URL}/api/ingest/contracts/`, {
      headers: authHeaders(),
      tags: { name: "contracts-list" },
      responseCallback: http.expectedStatuses(200, 401, 403),
    });
    check(res, {
      "contracts list responds": (r) => [200, 401, 403].includes(r.status),
    });
  });
  sleep(1);
}

export function queryEvents() {
  group("event retrieval", () => {
    const rest = http.get(`${BASE_URL}/api/ingest/events/`, {
      headers: authHeaders(),
      tags: { name: "events-list" },
      responseCallback: http.expectedStatuses(200, 401, 403),
    });
    check(rest, {
      "events list responds": (r) => [200, 401, 403].includes(r.status),
    });

    const v1 = http.get(`${BASE_URL}/v1/events`, {
      headers: authHeaders(),
      tags: { name: "v1-events" },
      responseCallback: http.expectedStatuses(200, 401, 403),
    });
    check(v1, {
      "v1 events responds": (r) => [200, 401, 403].includes(r.status),
    });

    const gql = http.post(
      `${BASE_URL}/graphql/`,
      JSON.stringify({
        query: "{ events(first: 10) { id eventType ledger } }",
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "graphql-events" },
        responseCallback: http.expectedStatuses(200, 404),
      }
    );
    check(gql, {
      "graphql events responds": (r) => [200, 404].includes(r.status),
    });
  });
  sleep(1);
}

export function webhookOps() {
  group("webhook operations", () => {
    const list = http.get(`${BASE_URL}/api/ingest/webhooks/`, {
      headers: authHeaders(),
      tags: { name: "webhooks-list" },
      responseCallback: http.expectedStatuses(200, 401, 403),
    });
    check(list, {
      "webhook list responds": (r) => [200, 401, 403].includes(r.status),
    });

    const signing = http.get(`${BASE_URL}/api/ingest/webhooks/signing-public-key/`, {
      headers: authHeaders(),
      tags: { name: "webhook-signing-key" },
      responseCallback: http.expectedStatuses(200, 401, 403),
    });
    check(signing, {
      "signing key responds": (r) => [200, 401, 403].includes(r.status),
    });
  });
  sleep(1);
}

export function dataExport() {
  group("compliance export", () => {
    const res = http.get(`${BASE_URL}/api/ingest/compliance-export/`, {
      headers: authHeaders(),
      tags: { name: "compliance-export" },
      responseCallback: http.expectedStatuses(200, 400, 401, 403, 405),
    });
    check(res, {
      "export endpoint responds": (r) =>
        [200, 400, 401, 403, 405].includes(r.status),
    });
  });
  sleep(1);
}

export function handleSummary(data) {
  const reportPath =
    __ENV.K6_REPORT_PATH || "load-tests/results/scenarios-summary.json";
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    [reportPath]: JSON.stringify(data, null, 2),
  };
}
