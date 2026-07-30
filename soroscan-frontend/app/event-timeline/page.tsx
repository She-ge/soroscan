"use client";

import { TransactionTimeline } from "@/components/transaction-timeline/TransactionTimeline";
import type { TransactionTimelineEvent } from "@/components/transaction-timeline/types";

const events: TransactionTimelineEvent[] = [
  {
    id: "evt-001",
    transactionId: "tx-7f21",
    eventType: "Init",
    title: "Initialize swap request",
    timestamp: "2026-03-22T21:05:00.000Z",
    status: "success",
    contractId: "CA-SWAP-ROUTER",
    txHash: "7f21a8c9",
    ledger: 520001,
    details: {
      caller: "GABC...P4Q",
      route: "XLM/USDC",
    },
  },
  {
    id: "evt-002",
    transactionId: "tx-7f21",
    eventType: "Transfer",
    title: "Transfer input asset",
    timestamp: "2026-03-22T21:05:02.000Z",
    status: "success",
    parentEventId: "evt-001",
    contractId: "CA-TOKEN-XLM",
    txHash: "7f21a8c9",
    ledger: 520001,
    details: {
      amount: "250.0000000",
      asset: "XLM",
    },
  },
  {
    id: "evt-003",
    transactionId: "tx-7f21",
    eventType: "ContractCall",
    title: "Call liquidity contract",
    timestamp: "2026-03-22T21:05:04.000Z",
    status: "pending",
    parentEventId: "evt-002",
    contractId: "CA-LIQUIDITY-B",
    txHash: "7f21a8c9",
    ledger: 520001,
    details: {
      method: "swap_exact_in",
      minimumOutput: "44.20",
    },
  },
  {
    id: "evt-004",
    transactionId: "tx-7f21",
    eventType: "Approve",
    title: "Approve settlement",
    timestamp: "2026-03-22T21:05:06.000Z",
    status: "error",
    parentEventId: "evt-003",
    contractId: "CA-SETTLEMENT",
    txHash: "7f21a8c9",
    ledger: 520001,
    details: {
      error:
        "Minimum output threshold not met",
      code: "SLIPPAGE_LIMIT",
    },
  },
  {
    id: "evt-005",
    transactionId: "tx-83ab",
    eventType: "Mint",
    title: "Mint position token",
    timestamp: "2026-03-22T21:07:10.000Z",
    status: "success",
    contractId: "CA-POSITION-TOKEN",
    txHash: "83ab4490",
    ledger: 520004,
    details: {
      tokenId: "position-904",
      owner: "GBBB...N72",
    },
  },
  {
    id: "evt-006",
    transactionId: "tx-83ab",
    eventType: "Transfer",
    title: "Transfer position token",
    timestamp: "2026-03-22T21:07:12.000Z",
    status: "success",
    parentEventId: "evt-005",
    contractId: "CA-POSITION-TOKEN",
    txHash: "83ab4490",
    ledger: 520004,
    details: {
      destination: "GBBB...N72",
    },
  },
];

export default function EventTimelinePage() {
  return (
    <main className="min-h-screen bg-terminal-black px-4 py-8 font-terminal-mono text-terminal-light sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-terminal-green/20 pb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-terminal-cyan">
            [TRANSACTION_TIMELINE]
          </p>

          <h1 className="mt-2 text-3xl text-terminal-green">
            Interactive Event Causality
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-terminal-gray">
            Follow events chronologically,
            inspect causality, filter event types,
            group activity by logical transaction,
            and adjust the time scale.
          </p>
        </header>

        <TransactionTimeline events={events} />
      </div>
    </main>
  );
}
