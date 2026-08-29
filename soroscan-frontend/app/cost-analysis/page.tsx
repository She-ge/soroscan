"use client";

import { useMemo, useState } from "react";

interface SpendPoint {
  date: string;
  totalUsd: number;
}

interface CostBucket {
  key: string;
  label: string;
  spendUsd: number;
}

const spendTrend90d: SpendPoint[] = [
  { date: "2026-05-01", totalUsd: 212 },
  { date: "2026-05-15", totalUsd: 228 },
  { date: "2026-06-01", totalUsd: 245 },
  { date: "2026-06-15", totalUsd: 252 },
  { date: "2026-07-01", totalUsd: 268 },
  { date: "2026-07-15", totalUsd: 276 },
  { date: "2026-07-27", totalUsd: 284 },
];

const byContract: CostBucket[] = [
  { key: "router", label: "SORO_SWAP_ROUTER", spendUsd: 3820 },
  { key: "vault", label: "LIQUIDITY_VAULT", spendUsd: 2410 },
  { key: "oracle", label: "PRICE_ORACLE", spendUsd: 1130 },
];

const byOperation: CostBucket[] = [
  { key: "ingest", label: "Event Ingestion", spendUsd: 3580 },
  { key: "queries", label: "GraphQL Queries", spendUsd: 2020 },
  { key: "webhooks", label: "Webhook Delivery", spendUsd: 1760 },
];

const historical12m = [
  { month: "2025-08", spend: 1940 },
  { month: "2025-09", spend: 2020 },
  { month: "2025-10", spend: 2195 },
  { month: "2025-11", spend: 2360 },
  { month: "2025-12", spend: 2488 },
  { month: "2026-01", spend: 2590 },
  { month: "2026-02", spend: 2725 },
  { month: "2026-03", spend: 2890 },
  { month: "2026-04", spend: 3015 },
  { month: "2026-05", spend: 3175 },
  { month: "2026-06", spend: 3340 },
  { month: "2026-07", spend: 3498 },
];

export default function CostAnalysisPage() {
  const [monthlyBudget, setMonthlyBudget] = useState(4200);
  const [threshold80, setThreshold80] = useState(true);
  const [threshold90, setThreshold90] = useState(true);
  const [threshold100, setThreshold100] = useState(true);
  const [resetDay, setResetDay] = useState(1);
  const [historicalFilter, setHistoricalFilter] = useState<"all" | "high">("all");

  const currentMonthSpend = 3498;
  const projectedEomSpend = 4022;
  const budgetUsagePct = (currentMonthSpend / monthlyBudget) * 100;

  const costPerOperation = useMemo(() => {
    const operations = 5_200_000;
    return Number((currentMonthSpend / operations).toFixed(6));
  }, [currentMonthSpend]);

  const filteredHistory = useMemo(() => {
    if (historicalFilter === "all") {
      return historical12m;
    }
    return historical12m.filter((entry) => entry.spend >= 2800);
  }, [historicalFilter]);

  const maxBarValue = Math.max(...byContract.map((item) => item.spendUsd));

  return (
    <main className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs text-terminal-gray tracking-[0.2em]">[COST_ANALYSIS_DASHBOARD]</p>
          <h1 className="text-3xl">Cost Overview and Budget Controls</h1>
          <p className="text-sm text-terminal-gray">
            Track spend, compare cost drivers, and configure budget alerts before limits are reached.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Tile label="Current Month Spend" value={`$${currentMonthSpend.toLocaleString()}`} />
          <Tile label="Projected End of Month" value={`$${projectedEomSpend.toLocaleString()}`} />
          <Tile label="Monthly Budget" value={`$${monthlyBudget.toLocaleString()}`} />
          <Tile label="Budget Usage" value={`${budgetUsagePct.toFixed(1)}%`} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded border border-terminal-cyan/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-cyan">Cost Breakdown by Contract</h2>
            <div className="space-y-3 text-xs">
              {byContract.map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between">
                    <span>{item.label}</span>
                    <span>${item.spendUsd.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-terminal-cyan/10">
                    <div
                      className="h-2 rounded bg-terminal-cyan"
                      style={{ width: `${(item.spendUsd / maxBarValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded border border-terminal-magenta/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-magenta">Cost Breakdown by Operation Type</h2>
            <div className="space-y-2 text-xs">
              {byOperation.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded border border-terminal-magenta/20 px-2 py-2"
                >
                  <span>{item.label}</span>
                  <span>${item.spendUsd.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded border border-terminal-yellow/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-yellow">Budget Configuration</h2>
            <div className="space-y-3 text-xs">
              <label className="block text-terminal-gray">
                Monthly budget limit (USD)
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(event) => setMonthlyBudget(Number(event.target.value) || 0)}
                  className="mt-1 w-full rounded border border-terminal-yellow/30 bg-terminal-black px-3 py-2 text-terminal-green"
                />
              </label>
              <p className="text-terminal-gray">
                Budget reset schedule: auto-reset on day{" "}
                <input
                  type="number"
                  value={resetDay}
                  min={1}
                  max={28}
                  onChange={(event) => setResetDay(Number(event.target.value) || 1)}
                  className="mx-2 w-14 rounded border border-terminal-yellow/30 bg-terminal-black px-2 py-1 text-terminal-green"
                />
                of each month.
              </p>
            </div>
          </article>

          <article className="rounded border border-terminal-green/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-gray">Budget Alert Thresholds</h2>
            <div className="space-y-2 text-xs">
              <ToggleRow
                label="80% threshold alert"
                enabled={threshold80}
                onToggle={() => setThreshold80((state) => !state)}
              />
              <ToggleRow
                label="90% threshold alert"
                enabled={threshold90}
                onToggle={() => setThreshold90((state) => !state)}
              />
              <ToggleRow
                label="100% threshold alert"
                enabled={threshold100}
                onToggle={() => setThreshold100((state) => !state)}
              />
            </div>
          </article>
        </section>

        <section className="rounded border border-terminal-cyan/20 p-4">
          <h2 className="mb-3 text-sm text-terminal-cyan">Spend Trend (Past 90 Days)</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7 text-xs">
            {spendTrend90d.map((point) => (
              <div key={point.date} className="rounded border border-terminal-cyan/20 p-2">
                <p className="text-terminal-gray">{point.date}</p>
                <p className="text-terminal-cyan">${point.totalUsd}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-terminal-magenta/20 p-4">
          <h2 className="mb-2 text-sm text-terminal-magenta">Cost per Operation Calculator</h2>
          <p className="text-xs text-terminal-gray">
            Estimated cost per operation (ingestion/query/webhook): ${costPerOperation}
          </p>
        </section>

        <section className="rounded border border-terminal-green/20 overflow-hidden">
          <div className="flex items-center justify-between border-b border-terminal-green/10 px-3 py-2">
            <h2 className="text-sm text-terminal-gray">Historical Cost Report (12 Months)</h2>
            <select
              value={historicalFilter}
              onChange={(event) => setHistoricalFilter(event.target.value as "all" | "high")}
              className="rounded border border-terminal-green/30 bg-terminal-black px-2 py-1 text-xs text-terminal-green"
            >
              <option value="all">All months</option>
              <option value="high">Months above $2,800</option>
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-terminal-green/5">
              <tr>
                <th className="px-3 py-2 text-left">Month</th>
                <th className="px-3 py-2 text-right">Spend (USD)</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry) => (
                <tr key={entry.month} className="border-t border-terminal-green/10">
                  <td className="px-3 py-2">{entry.month}</td>
                  <td className="px-3 py-2 text-right">${entry.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded border border-terminal-green/20 bg-black/30 p-4">
      <p className="text-xs text-terminal-gray">{label}</p>
      <p className="mt-2 text-xl">{value}</p>
    </article>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded border border-terminal-green/20 px-2 py-2">
      <span>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`rounded border px-2 py-1 ${
          enabled
            ? "border-terminal-green/40 text-terminal-green"
            : "border-terminal-gray/40 text-terminal-gray"
        }`}
      >
        {enabled ? "enabled" : "disabled"}
      </button>
    </div>
  );
}
