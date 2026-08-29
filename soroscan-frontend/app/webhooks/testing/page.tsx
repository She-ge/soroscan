"use client";

import * as React from "react";
import { Navbar } from "@/components/terminal/landing/Navbar";
import { Footer } from "@/components/terminal/landing/Footer";

type SavedWebhook = {
  id: string;
  url: string;
};

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
  target: string;
  status: number;
  ok: boolean;
};

const DEFAULT_PAYLOAD = {
  event: "test.delivery",
  timestamp: new Date().toISOString(),
  data: {
    contract_id: "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    event_type: "TRANSFER",
    amount: "1000",
  },
};

const FALLBACK_WEBHOOKS: SavedWebhook[] = [
  { id: "local_1", url: "https://webhook.site/your-endpoint" },
  { id: "local_2", url: "http://localhost:9000/webhook" },
];

export default function WebhookTestingConsolePage() {
  const [webhooks, setWebhooks] = React.useState<SavedWebhook[]>(FALLBACK_WEBHOOKS);
  const [selectedUrl, setSelectedUrl] = React.useState(FALLBACK_WEBHOOKS[0].url);
  const [payloadText, setPayloadText] = React.useState(() => JSON.stringify(DEFAULT_PAYLOAD, null, 2));
  const [result, setResult] = React.useState<RequestResult | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("webhooks");
      if (!raw) return;

      const parsed = JSON.parse(raw) as Array<{ id: string; url: string }>;
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      const normalized = parsed
        .filter((item) => item && typeof item.id === "string" && typeof item.url === "string")
        .map((item) => ({ id: item.id, url: item.url }));

      if (normalized.length > 0) {
        setWebhooks(normalized);
        setSelectedUrl(normalized[0].url);
      }
    } catch {
      // Keep fallback list when local storage is not available or malformed.
    }
  }, []);

  const sendTest = async () => {
    setError(null);
    setResult(null);

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError("Payload must be valid JSON.");
      return;
    }

    if (!selectedUrl.trim()) {
      setError("Select or enter a webhook URL.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/dev/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          url: selectedUrl.trim(),
          headers: { "Content-Type": "application/json", "X-SoroScan-Test": "true" },
          body: JSON.stringify(parsedPayload),
        }),
      });

      const data = (await response.json()) as RequestResult;
      setResult(data);

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          target: selectedUrl.trim(),
          status: data.status,
          ok: data.ok,
        },
        ...prev,
      ].slice(0, 10));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send webhook test.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <Navbar />
      <main className="container mx-auto px-6 md:px-8 py-10 md:py-14 space-y-6 max-w-6xl">
        <header>
          <div className="text-[10px] text-terminal-cyan tracking-widest mb-2">[WEBHOOK_TEST_CONSOLE]</div>
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">Test Webhook Deliveries</h1>
          <p className="text-terminal-gray text-sm mt-2">Select a subscription URL, craft a payload, send, and inspect the response.</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 border border-terminal-green/20 p-4">
            <label className="block text-xs text-terminal-gray tracking-widest">WEBHOOK_URL</label>
            <select
              aria-label="Webhook selector"
              className="w-full border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm"
              value={selectedUrl}
              onChange={(event) => setSelectedUrl(event.target.value)}
            >
              {webhooks.map((webhook) => (
                <option key={webhook.id} value={webhook.url}>{webhook.url}</option>
              ))}
            </select>

            <label className="block text-xs text-terminal-gray tracking-widest">PAYLOAD_EDITOR</label>
            <textarea
              aria-label="Webhook payload JSON"
              spellCheck={false}
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              className="w-full min-h-72 border border-terminal-green/30 bg-terminal-black px-3 py-2 text-xs text-terminal-green"
            />

            {error ? <p className="text-terminal-danger text-sm">{error}</p> : null}

            <button
              type="button"
              onClick={sendTest}
              disabled={sending}
              className="border border-terminal-cyan text-terminal-cyan px-4 py-2 text-sm hover:bg-terminal-cyan/10 disabled:opacity-60"
            >
              {sending ? "SENDING..." : "SEND_TEST_PAYLOAD"}
            </button>
          </div>

          <div className="space-y-4 border border-terminal-green/20 p-4">
            <h2 className="text-terminal-green text-sm tracking-widest">RESPONSE</h2>
            {result ? (
              <>
                <p className={`text-sm ${result.ok ? "text-terminal-green" : "text-terminal-danger"}`}>
                  STATUS: {result.status} {result.statusText}
                </p>

                <div>
                  <p className="text-xs text-terminal-gray mb-1">HEADERS</p>
                  <pre className="overflow-x-auto border border-terminal-green/20 p-2 text-xs text-terminal-cyan">
                    {JSON.stringify(result.headers, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-xs text-terminal-gray mb-1">BODY</p>
                  <pre className="overflow-x-auto border border-terminal-green/20 p-2 text-xs text-terminal-green whitespace-pre-wrap break-all">
                    {result.body || "(empty body)"}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-terminal-gray text-sm">No response yet.</p>
            )}
          </div>
        </section>

        <section className="border border-terminal-green/20 p-4">
          <h2 className="text-terminal-green text-sm tracking-widest mb-3">RECENT_TEST_SENDS</h2>
          {history.length === 0 ? (
            <p className="text-terminal-gray text-sm">No test history yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {history.map((item) => (
                <li key={item.id} className="border border-terminal-green/15 p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-terminal-gray">{new Date(item.at).toLocaleString()}</span>
                  <span className="text-terminal-cyan break-all">{item.target}</span>
                  <span className={item.ok ? "text-terminal-green" : "text-terminal-danger"}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <div className="container mx-auto px-6 md:px-8 max-w-6xl pb-12">
        <Footer />
      </div>
    </div>
  );
}
