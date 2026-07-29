"use client";

import * as React from "react";
import { Navbar } from "@/components/terminal/landing/Navbar";
import { Footer } from "@/components/terminal/landing/Footer";
import { getAccessToken } from "@/lib/auth";

type EndpointDef = {
  id: string;
  resource: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  schema: string;
};

type HeaderRow = { key: string; value: string };
type QueryRow = { key: string; value: string };

type RequestResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

type HistoryItem = {
  id: string;
  at: string;
  method: string;
  url: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ENDPOINTS: EndpointDef[] = [
  {
    id: "contracts-list",
    resource: "Contracts",
    method: "GET",
    path: "/api/contracts/",
    description: "List indexed contracts.",
    schema: "Query params: limit, offset",
  },
  {
    id: "contracts-create",
    resource: "Contracts",
    method: "POST",
    path: "/api/contracts/",
    description: "Register a contract for indexing.",
    schema: '{"contract_id":"C...","label":"my-contract"}',
  },
  {
    id: "events-list",
    resource: "Events",
    method: "GET",
    path: "/api/events/",
    description: "List indexed events.",
    schema: "Query params: contract_id, event_type, limit",
  },
  {
    id: "webhooks-list",
    resource: "Webhooks",
    method: "GET",
    path: "/api/webhooks/",
    description: "List webhook subscriptions.",
    schema: "No body",
  },
  {
    id: "webhooks-create",
    resource: "Webhooks",
    method: "POST",
    path: "/api/webhooks/",
    description: "Create a webhook subscription.",
    schema: '{"url":"https://example.com/webhook","event_type":"TRANSFER"}',
  },
];

function buildUrl(base: string, path: string, queryRows: QueryRow[]): string {
  const url = new URL(path, base);
  queryRows.forEach((row) => {
    if (row.key.trim()) {
      url.searchParams.set(row.key.trim(), row.value);
    }
  });
  return url.toString();
}

function rowsToHeaders(rows: HeaderRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    if (key) acc[key] = row.value;
    return acc;
  }, {});
}

export default function ApiExplorerPage() {
  const [selectedEndpointId, setSelectedEndpointId] = React.useState(ENDPOINTS[0].id);
  const selectedEndpoint = ENDPOINTS.find((entry) => entry.id === selectedEndpointId) || ENDPOINTS[0];

  const [method, setMethod] = React.useState<EndpointDef["method"]>(selectedEndpoint.method);
  const [path, setPath] = React.useState(selectedEndpoint.path);
  const [headers, setHeaders] = React.useState<HeaderRow[]>([{ key: "Content-Type", value: "application/json" }]);
  const [queryRows, setQueryRows] = React.useState<QueryRow[]>([{ key: "", value: "" }]);
  const [body, setBody] = React.useState(selectedEndpoint.method === "GET" ? "" : selectedEndpoint.schema);
  const [result, setResult] = React.useState<RequestResult | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const endpoint = ENDPOINTS.find((entry) => entry.id === selectedEndpointId);
    if (!endpoint) return;

    setMethod(endpoint.method);
    setPath(endpoint.path);
    setBody(endpoint.method === "GET" ? "" : endpoint.schema);
    setResult(null);
  }, [selectedEndpointId]);

  const updateHeader = (index: number, field: keyof HeaderRow, value: string) => {
    setHeaders((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const updateQuery = (index: number, field: keyof QueryRow, value: string) => {
    setQueryRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const sendRequest = async () => {
    setError(null);
    setResult(null);

    let bodyPayload = "";
    if (!["GET", "HEAD"].includes(method) && body.trim()) {
      try {
        bodyPayload = JSON.stringify(JSON.parse(body));
      } catch {
        setError("Request body must be valid JSON.");
        return;
      }
    }

    const finalUrl = buildUrl(API_BASE, path, queryRows);
    const token = getAccessToken();
    const finalHeaders = rowsToHeaders(headers);
    if (token && !finalHeaders.Authorization) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }

    setSending(true);

    try {
      const response = await fetch("/api/dev/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          method,
          headers: finalHeaders,
          body: bodyPayload || undefined,
        }),
      });

      const data = (await response.json()) as RequestResult;
      setResult(data);
      setHistory((prev) => [
        { id: crypto.randomUUID(), at: new Date().toISOString(), method, url: finalUrl, status: data.status },
        ...prev,
      ].slice(0, 20));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to execute request.");
    } finally {
      setSending(false);
    }
  };

  const grouped = ENDPOINTS.reduce<Record<string, EndpointDef[]>>((acc, entry) => {
    acc[entry.resource] = acc[entry.resource] || [];
    acc[entry.resource].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <Navbar />
      <main className="container mx-auto px-6 md:px-8 py-10 md:py-14 space-y-6 max-w-7xl">
        <header>
          <div className="text-[10px] text-terminal-cyan tracking-widest mb-2">[API_EXPLORER]</div>
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">Interactive API Explorer</h1>
          <p className="text-terminal-gray text-sm mt-2">Browse endpoints, build requests, run them, and inspect responses in-browser.</p>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
          <aside className="border border-terminal-green/20 p-4">
            <h2 className="text-terminal-green text-sm tracking-widest mb-3">ENDPOINTS</h2>
            <div className="space-y-4">
              {Object.entries(grouped).map(([resource, entries]) => (
                <div key={resource}>
                  <p className="text-xs text-terminal-gray mb-2">{resource.toUpperCase()}</p>
                  <ul className="space-y-2">
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedEndpointId(entry.id)}
                          className={`w-full text-left border px-2 py-2 text-xs ${selectedEndpointId === entry.id ? "border-terminal-green text-terminal-green" : "border-terminal-green/20 text-terminal-gray hover:text-terminal-cyan"}`}
                        >
                          {entry.method} {entry.path}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="border border-terminal-green/20 p-4 space-y-4">
              <h2 className="text-terminal-green text-sm tracking-widest">REQUEST_BUILDER</h2>
              <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-3">
                <select
                  aria-label="HTTP method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value as EndpointDef["method"])}
                  className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm"
                >
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  aria-label="Request path"
                  value={path}
                  onChange={(event) => setPath(event.target.value)}
                  className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm"
                />
              </div>

              <div>
                <p className="text-xs text-terminal-gray mb-2">QUERY_PARAMS</p>
                <div className="space-y-2">
                  {queryRows.map((row, index) => (
                    <div key={`query-${index}`} className="grid grid-cols-2 gap-2">
                      <input
                        aria-label="Query key"
                        placeholder="key"
                        value={row.key}
                        onChange={(event) => updateQuery(index, "key", event.target.value)}
                        className="border border-terminal-green/30 bg-terminal-black px-2 py-1 text-xs"
                      />
                      <input
                        aria-label="Query value"
                        placeholder="value"
                        value={row.value}
                        onChange={(event) => updateQuery(index, "value", event.target.value)}
                        className="border border-terminal-green/30 bg-terminal-black px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setQueryRows((prev) => [...prev, { key: "", value: "" }])} className="text-xs text-terminal-cyan">
                    + Add query param
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-terminal-gray mb-2">HEADERS</p>
                <div className="space-y-2">
                  {headers.map((row, index) => (
                    <div key={`header-${index}`} className="grid grid-cols-2 gap-2">
                      <input
                        aria-label="Header name"
                        placeholder="Header"
                        value={row.key}
                        onChange={(event) => updateHeader(index, "key", event.target.value)}
                        className="border border-terminal-green/30 bg-terminal-black px-2 py-1 text-xs"
                      />
                      <input
                        aria-label="Header value"
                        placeholder="Value"
                        value={row.value}
                        onChange={(event) => updateHeader(index, "value", event.target.value)}
                        className="border border-terminal-green/30 bg-terminal-black px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setHeaders((prev) => [...prev, { key: "", value: "" }])} className="text-xs text-terminal-cyan">
                    + Add header
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-terminal-gray mb-2">REQUEST_BODY (JSON)</p>
                <textarea
                  aria-label="Request JSON body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  className="w-full min-h-36 border border-terminal-green/30 bg-terminal-black px-3 py-2 text-xs"
                  spellCheck={false}
                />
              </div>

              {error ? <p className="text-terminal-danger text-sm">{error}</p> : null}

              <button type="button" onClick={sendRequest} disabled={sending} className="border border-terminal-cyan px-4 py-2 text-terminal-cyan text-sm hover:bg-terminal-cyan/10 disabled:opacity-60">
                {sending ? "SENDING..." : "SEND_REQUEST"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="border border-terminal-green/20 p-4 space-y-3">
                <h2 className="text-terminal-green text-sm tracking-widest">DOCUMENTATION</h2>
                <p className="text-sm text-terminal-gray">{selectedEndpoint.description}</p>
                <div>
                  <p className="text-xs text-terminal-gray mb-1">SCHEMA</p>
                  <pre className="border border-terminal-green/20 p-2 text-xs text-terminal-cyan whitespace-pre-wrap break-all">{selectedEndpoint.schema}</pre>
                </div>
              </section>

              <section className="border border-terminal-green/20 p-4 space-y-3">
                <h2 className="text-terminal-green text-sm tracking-widest">RESPONSE</h2>
                {result ? (
                  <>
                    <p className={`text-sm ${result.ok ? "text-terminal-green" : "text-terminal-danger"}`}>
                      STATUS: {result.status} {result.statusText}
                    </p>
                    <pre className="border border-terminal-green/20 p-2 text-xs text-terminal-cyan overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                    <pre className="border border-terminal-green/20 p-2 text-xs text-terminal-green overflow-x-auto whitespace-pre-wrap break-all">
                      {result.body || "(empty body)"}
                    </pre>
                  </>
                ) : (
                  <p className="text-terminal-gray text-sm">No response yet.</p>
                )}
              </section>
            </div>

            <section className="border border-terminal-green/20 p-4">
              <h2 className="text-terminal-green text-sm tracking-widest mb-3">REQUEST_HISTORY</h2>
              {history.length === 0 ? (
                <p className="text-terminal-gray text-sm">No requests yet.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {history.map((entry) => (
                    <li key={entry.id} className="border border-terminal-green/15 p-2 grid grid-cols-1 md:grid-cols-[120px_120px_1fr_90px] gap-2">
                      <span className="text-terminal-gray">{new Date(entry.at).toLocaleTimeString()}</span>
                      <span className="text-terminal-cyan">{entry.method}</span>
                      <span className="text-terminal-gray break-all">{entry.url}</span>
                      <span className="text-terminal-green">{entry.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>
      </main>

      <div className="container mx-auto px-6 md:px-8 max-w-7xl pb-12">
        <Footer />
      </div>
    </div>
  );
}
