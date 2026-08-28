"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/layout/AppShell";

// LiveEventStream opens a WebSocket on mount — render client-only so the
// connection is never attempted during server rendering.
const LiveEventStream = dynamic(
  () =>
    import("@/components/terminal/LiveEventStream").then(
      (mod) => mod.LiveEventStream,
    ),
  { ssr: false },
);

const DEFAULT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_CONTRACT_ID ?? "CCAA";

export default function MonitorPage() {
  const [contractId, setContractId] = React.useState(DEFAULT_CONTRACT_ID);
  const [draft, setDraft] = React.useState(DEFAULT_CONTRACT_ID);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed) setContractId(trimmed);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-bold tracking-wider text-terminal-green">
            LIVE EVENT MONITOR
          </h1>
          <p className="text-xs text-terminal-gray">
            Streams contract events over WebSocket as they are indexed.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2"
        >
          <label
            htmlFor="monitor-contract-id"
            className="text-xs uppercase tracking-wider text-terminal-gray"
          >
            Contract ID
          </label>
          <input
            id="monitor-contract-id"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="CCAA..."
            className="flex-1 min-w-[220px] bg-terminal-black border border-terminal-green/40 px-3 py-2 text-sm text-terminal-green placeholder:text-terminal-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 border border-terminal-green/40 text-xs uppercase tracking-wider text-terminal-green hover:bg-terminal-green/10 transition-colors"
          >
            Watch
          </button>
        </form>

        <LiveEventStream contractId={contractId} />
      </div>
    </AppShell>
  );
}
