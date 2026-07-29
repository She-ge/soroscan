"use client";

import { useMemo, useState } from "react";

type UpgradeStatus = "deployed" | "upgraded" | "migrated";

interface UpgradeEvent {
  id: string;
  contract: string;
  type: UpgradeStatus;
  version: string;
  timestamp: string;
  deployHash?: string;
  migrationHash?: string;
  deployer: string;
  oldAddress?: string;
  newAddress?: string;
  gasUsed: number;
  txHash: string;
  deployArgs: Record<string, string | number | boolean>;
  notes: string;
}

interface VersionSnapshot {
  version: string;
  checksum: string;
  source: string[];
}

const upgradeEvents: UpgradeEvent[] = [
  {
    id: "ev-1",
    contract: "SORO_SWAP_ROUTER",
    type: "deployed",
    version: "v1.0.0",
    timestamp: "2026-07-10T08:10:00Z",
    deployHash: "deploy_17cb77ab0001",
    deployer: "GAKJ...QWE2",
    gasUsed: 182140,
    txHash: "tx_211aa9f1001",
    deployArgs: { admin: "GAKJ...QWE2", feeBps: 25, network: "mainnet" },
    notes: "Initial production deployment.",
  },
  {
    id: "ev-2",
    contract: "SORO_SWAP_ROUTER",
    type: "upgraded",
    version: "v1.1.0",
    timestamp: "2026-07-18T13:45:00Z",
    deployHash: "deploy_17cb77ab0002",
    deployer: "GBRT...TQ0L",
    gasUsed: 201778,
    txHash: "tx_211aa9f1099",
    deployArgs: { feeBps: 20, slippageGuard: true },
    notes: "Optimized fee path; added slippage guard checks.",
  },
  {
    id: "ev-3",
    contract: "SORO_SWAP_ROUTER",
    type: "migrated",
    version: "v2.0.0",
    timestamp: "2026-07-24T17:30:00Z",
    migrationHash: "migrate_1de9ffaf9301",
    deployer: "GBRT...TQ0L",
    oldAddress: "CBQ7...9MPS",
    newAddress: "CDR1...4HVN",
    gasUsed: 245600,
    txHash: "tx_211aa9f1ff1",
    deployArgs: { migrateStorage: true, preserveNonce: true },
    notes: "Storage layout migration with address rollover.",
  },
];

const versions: VersionSnapshot[] = [
  {
    version: "v1.0.0",
    checksum: "sha256:3f87...1ad2",
    source: [
      "contract Router {",
      "  fn swap(input, output, amount, minOut) {",
      "    assert(minOut > 0);",
      "    emit SwapExecuted(input, output, amount);",
      "  }",
      "}",
    ],
  },
  {
    version: "v1.1.0",
    checksum: "sha256:ec55...9b73",
    source: [
      "contract Router {",
      "  fn swap(input, output, amount, minOut) {",
      "    assert(minOut > 0);",
      "    assert(slippage_check(amount, minOut));",
      "    emit SwapExecuted(input, output, amount);",
      "  }",
      "}",
    ],
  },
  {
    version: "v2.0.0",
    checksum: "sha256:0ace...5fe2",
    source: [
      "contract RouterV2 {",
      "  fn swap(input, output, amount, minOut, routeHint) {",
      "    assert(minOut > 0);",
      "    assert(slippage_check(amount, minOut));",
      "    assert(route_hint_valid(routeHint));",
      "    emit SwapExecuted(input, output, amount, routeHint);",
      "  }",
      "}",
    ],
  },
];

function daysAgo(fromIso: string): number {
  const ms = Date.now() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function exportAsJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

export default function ContractUpgradeTimelinePage() {
  const [statusFilter, setStatusFilter] = useState<UpgradeStatus | "all">("all");
  const [timelineMode, setTimelineMode] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-07-31");
  const [selectedEventId, setSelectedEventId] = useState(upgradeEvents[0].id);
  const [leftVersion, setLeftVersion] = useState("v1.0.0");
  const [rightVersion, setRightVersion] = useState("v2.0.0");

  const filteredEvents = useMemo(() => {
    return upgradeEvents.filter((event) => {
      if (statusFilter !== "all" && event.type !== statusFilter) {
        return false;
      }
      const eventDate = new Date(event.timestamp).getTime();
      const from = new Date(fromDate).getTime();
      const to = new Date(`${toDate}T23:59:59Z`).getTime();
      return eventDate >= from && eventDate <= to;
    });
  }, [fromDate, statusFilter, toDate]);

  const selectedEvent = useMemo(() => {
    return filteredEvents.find((event) => event.id === selectedEventId) ?? filteredEvents[0];
  }, [filteredEvents, selectedEventId]);

  const leftSnapshot = versions.find((version) => version.version === leftVersion);
  const rightSnapshot = versions.find((version) => version.version === rightVersion);

  const diffRows = useMemo(() => {
    if (!leftSnapshot || !rightSnapshot) {
      return [];
    }
    const maxLen = Math.max(leftSnapshot.source.length, rightSnapshot.source.length);
    return Array.from({ length: maxLen }, (_, idx) => {
      const left = leftSnapshot.source[idx] ?? "";
      const right = rightSnapshot.source[idx] ?? "";
      return {
        line: idx + 1,
        left,
        right,
        changed: left !== right,
      };
    });
  }, [leftSnapshot, rightSnapshot]);

  const latestUpgrade = upgradeEvents
    .filter((event) => event.type === "upgraded" || event.type === "migrated")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return (
    <main className="min-h-screen bg-terminal-black p-8 font-terminal-mono text-terminal-green">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-[0.2em] text-terminal-gray">
            [CONTRACT_UPGRADE_TIMELINE]
          </p>
          <h1 className="text-3xl">Contract Deployment, Upgrade, and Migration History</h1>
          <div className="inline-flex items-center gap-2 rounded border border-terminal-cyan/40 bg-terminal-cyan/10 px-3 py-1 text-xs text-terminal-cyan">
            <span className="h-2 w-2 rounded-full bg-terminal-cyan" />
            Contract upgraded {daysAgo(latestUpgrade.timestamp)} days ago
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 rounded border border-terminal-green/20 p-4 md:grid-cols-4">
          <label className="text-xs text-terminal-gray">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as UpgradeStatus | "all")}
              className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
            >
              <option value="all">All</option>
              <option value="deployed">Deployed</option>
              <option value="upgraded">Upgraded</option>
              <option value="migrated">Migrated</option>
            </select>
          </label>
          <label className="text-xs text-terminal-gray">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
            />
          </label>
          <label className="text-xs text-terminal-gray">
            To
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1 w-full rounded border border-terminal-green/30 bg-terminal-black px-2 py-2 text-terminal-green"
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs text-terminal-gray">Export</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportAsJson(filteredEvents, "contract-upgrades.json")}
                className="rounded border border-terminal-magenta/40 px-3 py-2 text-xs text-terminal-magenta hover:bg-terminal-magenta/10"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded border border-terminal-yellow/40 px-3 py-2 text-xs text-terminal-yellow hover:bg-terminal-yellow/10"
              >
                Export PDF
              </button>
            </div>
          </div>
        </section>

        <section className="rounded border border-terminal-green/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm text-terminal-gray">Upgrade Timeline</h2>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTimelineMode("vertical")}
                className={`rounded border px-2 py-1 ${
                  timelineMode === "vertical"
                    ? "border-terminal-green text-terminal-green"
                    : "border-terminal-gray/40 text-terminal-gray"
                }`}
              >
                Vertical
              </button>
              <button
                type="button"
                onClick={() => setTimelineMode("horizontal")}
                className={`rounded border px-2 py-1 ${
                  timelineMode === "horizontal"
                    ? "border-terminal-green text-terminal-green"
                    : "border-terminal-gray/40 text-terminal-gray"
                }`}
              >
                Horizontal
              </button>
            </div>
          </div>
          <div
            className={
              timelineMode === "vertical"
                ? "space-y-3"
                : "grid grid-cols-1 gap-3 md:grid-cols-3"
            }
          >
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="rounded border border-terminal-green/20 bg-black/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-terminal-cyan">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  <span className="rounded border border-terminal-green/30 px-2 py-0.5 text-[10px] uppercase">
                    {event.type}
                  </span>
                </div>
                <p className="mt-2 text-sm">{event.contract}</p>
                <p className="text-xs text-terminal-gray">Version: {event.version}</p>
                {event.deployHash && (
                  <p className="mt-1 text-xs text-terminal-gray">Deploy hash: {event.deployHash}</p>
                )}
                {event.oldAddress && event.newAddress && (
                  <p className="mt-1 text-xs text-terminal-yellow">
                    {event.oldAddress} -&gt; {event.newAddress}
                  </p>
                )}
                {event.migrationHash && (
                  <p className="mt-1 text-xs text-terminal-gray">
                    Migration hash: {event.migrationHash}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className="mt-3 rounded border border-terminal-cyan/40 px-2 py-1 text-xs text-terminal-cyan hover:bg-terminal-cyan/10"
                >
                  View metadata
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded border border-terminal-cyan/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-cyan">Upgrade Metadata Viewer</h2>
            {selectedEvent ? (
              <div className="space-y-2 text-xs">
                <p>Transaction hash: {selectedEvent.txHash}</p>
                <p>Gas used: {selectedEvent.gasUsed.toLocaleString()}</p>
                <p>Deployer: {selectedEvent.deployer}</p>
                <p>Deploy args:</p>
                <pre className="overflow-x-auto rounded border border-terminal-cyan/20 bg-black/40 p-2 text-[11px] text-terminal-gray">
                  {JSON.stringify(selectedEvent.deployArgs, null, 2)}
                </pre>
                <p className="text-terminal-gray">{selectedEvent.notes}</p>
              </div>
            ) : (
              <p className="text-xs text-terminal-gray">No event selected for metadata view.</p>
            )}
          </article>

          <article className="rounded border border-terminal-magenta/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-magenta">Contract Version Compare</h2>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={leftVersion}
                onChange={(event) => setLeftVersion(event.target.value)}
                className="rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-2 text-xs"
              >
                {versions.map((version) => (
                  <option key={version.version} value={version.version}>
                    {version.version}
                  </option>
                ))}
              </select>
              <select
                value={rightVersion}
                onChange={(event) => setRightVersion(event.target.value)}
                className="rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-2 text-xs"
              >
                {versions.map((version) => (
                  <option key={version.version} value={version.version}>
                    {version.version}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-terminal-gray">
              {leftSnapshot?.checksum} vs {rightSnapshot?.checksum}
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto rounded border border-terminal-magenta/20">
              <table className="w-full text-[11px]">
                <thead className="bg-terminal-magenta/10 text-terminal-magenta">
                  <tr>
                    <th className="px-2 py-1 text-left">Line</th>
                    <th className="px-2 py-1 text-left">{leftVersion}</th>
                    <th className="px-2 py-1 text-left">{rightVersion}</th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row) => (
                    <tr key={row.line} className={row.changed ? "bg-terminal-yellow/10" : ""}>
                      <td className="px-2 py-1 text-terminal-gray">{row.line}</td>
                      <td className="px-2 py-1">{row.left}</td>
                      <td className="px-2 py-1">{row.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
