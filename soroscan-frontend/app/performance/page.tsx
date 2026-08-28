"use client";

import { useMemo, useState } from "react";
import { Activity, Cpu, HardDrive, Database, Server, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle } from "lucide-react";

interface LatencyPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
}

interface CachePoint {
  time: string;
  hits: number;
  misses: number;
}

interface SlowQuery {
  id: string;
  queryName: string;
  endpoint: string;
  avgLatencyMs: number;
  p99LatencyMs: number;
  callCount: number;
  cacheable: boolean;
}

const mockLatencyData: LatencyPoint[] = [
  { time: "00:00", p50: 38, p95: 98, p99: 180 },
  { time: "04:00", p50: 35, p95: 92, p99: 165 },
  { time: "08:00", p50: 45, p95: 125, p99: 240 },
  { time: "12:00", p50: 52, p95: 140, p99: 275 },
  { time: "16:00", p50: 42, p95: 115, p99: 230 },
  { time: "20:00", p50: 39, p95: 105, p99: 195 },
  { time: "24:00", p50: 40, p95: 110, p99: 210 },
];

const mockCacheData: CachePoint[] = [
  { time: "00:00", hits: 14200, misses: 850 },
  { time: "04:00", hits: 11800, misses: 620 },
  { time: "08:00", hits: 28400, misses: 1750 },
  { time: "12:00", hits: 39100, misses: 2400 },
  { time: "16:00", hits: 34500, misses: 2100 },
  { time: "20:00", hits: 22800, misses: 1300 },
  { time: "24:00", hits: 18600, misses: 980 },
];

const mockSlowQueries: SlowQuery[] = [
  {
    id: "q-1",
    queryName: "GetContractEventHistory",
    endpoint: "GraphQL /graphql",
    avgLatencyMs: 342,
    p99LatencyMs: 820,
    callCount: 14250,
    cacheable: true,
  },
  {
    id: "q-2",
    queryName: "AggregateTokenVolume24h",
    endpoint: "REST /api/v1/analytics/volume",
    avgLatencyMs: 288,
    p99LatencyMs: 650,
    callCount: 8900,
    cacheable: true,
  },
  {
    id: "q-3",
    queryName: "SearchEventsByTopics",
    endpoint: "GraphQL /graphql",
    avgLatencyMs: 215,
    p99LatencyMs: 510,
    callCount: 32100,
    cacheable: false,
  },
  {
    id: "q-4",
    queryName: "VerifyContractWasmSignature",
    endpoint: "REST /api/v1/contracts/verify",
    avgLatencyMs: 195,
    p99LatencyMs: 440,
    callCount: 4120,
    cacheable: true,
  },
  {
    id: "q-5",
    queryName: "ListWebhookDeliveries",
    endpoint: "REST /api/v1/webhooks/deliveries",
    avgLatencyMs: 160,
    p99LatencyMs: 380,
    callCount: 19800,
    cacheable: false,
  },
];

export default function PerformanceDashboardPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const metrics = useMemo(() => {
    const is7d = timeRange === "7d";
    const is30d = timeRange === "30d";
    return {
      p50Latency: is30d ? 48 : is7d ? 45 : 42,
      p50Diff: -4.5,
      p95Latency: is30d ? 128 : is7d ? 120 : 115,
      p95Diff: -2.1,
      p99Latency: is30d ? 255 : is7d ? 240 : 230,
      p99Diff: +1.8,
      cacheHitRate: is30d ? 92.8 : is7d ? 93.5 : 94.2,
      cacheHitDiff: +1.4,
      errorRate: 0.08,
      errorRateDiff: -0.02,
      uptime: 99.99,
      uptimeDiff: 0.0,
      cpuUsage: is30d ? 38.4 : is7d ? 36.1 : 34.2,
      memoryUsage: 58.6,
      diskUsage: 42.1,
    };
  }, [timeRange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-terminal-black p-4 sm:p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-terminal-green/20 pb-6">
          <div>
            <p className="text-xs text-terminal-gray tracking-[0.2em] uppercase">
              [OBSERVABILITY_SYSTEM_HEALTH]
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-terminal-green flex items-center gap-3">
              <Activity className="h-7 w-7 text-terminal-cyan" />
              Performance & System Metrics
            </h1>
            <p className="text-sm text-terminal-gray mt-1">
              Real-time API response times, cache efficiency, query latency, and resource utilization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded border border-terminal-green/30 bg-terminal-dark p-1 text-xs">
              {(["24h", "7d", "30d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    timeRange === range
                      ? "bg-terminal-green text-terminal-black font-bold"
                      : "text-terminal-gray hover:text-terminal-green"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 border border-terminal-green/30 bg-terminal-dark px-3 py-2 text-xs text-terminal-green hover:bg-terminal-green/10 rounded transition-colors"
              title="Refresh metrics"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Top Key Metrics Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Latency Percentiles Card */}
          <div className="rounded border border-terminal-green/30 bg-terminal-dark/60 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-terminal-gray">
              <span>API LATENCY (P50 / P95 / P99)</span>
              <Clock className="h-4 w-4 text-terminal-cyan" />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-terminal-gray">P50:</span>
                <span className="text-xl font-bold text-terminal-green">{metrics.p50Latency} ms</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-terminal-gray">P95:</span>
                <span className="text-sm font-semibold text-terminal-cyan">{metrics.p95Latency} ms</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-terminal-gray">P99:</span>
                <span className="text-sm font-semibold text-terminal-warning">{metrics.p99Latency} ms</span>
              </div>
            </div>
            <div className="pt-2 border-t border-terminal-green/10 flex items-center justify-between text-[11px]">
              <span className="text-terminal-gray">vs 7-day avg</span>
              <span className="text-terminal-green flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3" /> 4.5ms faster
              </span>
            </div>
          </div>

          {/* Cache Hit Rate Card */}
          <div className="rounded border border-terminal-cyan/30 bg-terminal-dark/60 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-terminal-gray">
              <span>CACHE HIT RATE</span>
              <Database className="h-4 w-4 text-terminal-cyan" />
            </div>
            <div className="text-3xl font-bold text-terminal-cyan">
              {metrics.cacheHitRate}%
            </div>
            <div className="w-full bg-terminal-black h-2 rounded overflow-hidden border border-terminal-cyan/20">
              <div
                className="bg-terminal-cyan h-full transition-all duration-500"
                style={{ width: `${metrics.cacheHitRate}%` }}
              />
            </div>
            <div className="pt-2 border-t border-terminal-cyan/10 flex items-center justify-between text-[11px]">
              <span className="text-terminal-gray">vs 7-day avg</span>
              <span className="text-terminal-green flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> +{metrics.cacheHitDiff}%
              </span>
            </div>
          </div>

          {/* Error Rate Card */}
          <div className="rounded border border-terminal-green/30 bg-terminal-dark/60 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-terminal-gray">
              <span>ERROR RATE</span>
              <AlertTriangle className="h-4 w-4 text-terminal-warning" />
            </div>
            <div className="text-3xl font-bold text-terminal-green">
              {metrics.errorRate}%
            </div>
            <p className="text-xs text-terminal-gray">
              99.92% request success rate across REST & GraphQL
            </p>
            <div className="pt-2 border-t border-terminal-green/10 flex items-center justify-between text-[11px]">
              <span className="text-terminal-gray">vs 7-day avg</span>
              <span className="text-terminal-green flex items-center gap-0.5">
                <ArrowDownRight className="h-3 w-3" /> -0.02%
              </span>
            </div>
          </div>

          {/* System Health / Uptime Card */}
          <div className="rounded border border-terminal-green/30 bg-terminal-dark/60 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-terminal-gray">
              <span>SYSTEM HEALTH & UPTIME</span>
              <CheckCircle2 className="h-4 w-4 text-terminal-green" />
            </div>
            <div className="text-3xl font-bold text-terminal-green">
              {metrics.uptime}%
            </div>
            <div className="flex items-center gap-2 text-xs text-terminal-green">
              <span className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
              <span>All Ingest & API Nodes Operational</span>
            </div>
            <div className="pt-2 border-t border-terminal-green/10 flex items-center justify-between text-[11px]">
              <span className="text-terminal-gray">7-day Uptime</span>
              <span className="text-terminal-green">100.0%</span>
            </div>
          </div>
        </section>

        {/* Visual Charts Section */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Latency Over Time Line Chart */}
          <div className="rounded border border-terminal-green/20 bg-terminal-dark/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-terminal-cyan flex items-center gap-2">
                <Clock className="h-4 w-4" /> Latency Over Time (ms)
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-terminal-green">
                  <span className="h-2 w-2 rounded-full bg-terminal-green" /> P50
                </span>
                <span className="flex items-center gap-1 text-terminal-cyan">
                  <span className="h-2 w-2 rounded-full bg-terminal-cyan" /> P95
                </span>
                <span className="flex items-center gap-1 text-terminal-warning">
                  <span className="h-2 w-2 rounded-full bg-terminal-warning" /> P99
                </span>
              </div>
            </div>

            {/* SVG Trend Visualization */}
            <div className="h-56 w-full pt-4">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 200">
                {/* Gridlines */}
                {[0, 50, 100, 150, 200].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y}
                    x2="490"
                    y2={y}
                    stroke="rgba(0, 255, 65, 0.1)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Y-Axis Labels */}
                <text x="30" y="15" fill="#94a3b8" fontSize="10" textAnchor="end">300ms</text>
                <text x="30" y="65" fill="#94a3b8" fontSize="10" textAnchor="end">200ms</text>
                <text x="30" y="115" fill="#94a3b8" fontSize="10" textAnchor="end">100ms</text>
                <text x="30" y="165" fill="#94a3b8" fontSize="10" textAnchor="end">0ms</text>

                {/* P99 Line */}
                <polyline
                  fill="none"
                  stroke="#ffaa00"
                  strokeWidth="2"
                  points={mockLatencyData
                    .map((d, i) => `${50 + i * 70},${170 - (d.p99 / 300) * 150}`)
                    .join(" ")}
                />
                {/* P95 Line */}
                <polyline
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="2"
                  points={mockLatencyData
                    .map((d, i) => `${50 + i * 70},${170 - (d.p95 / 300) * 150}`)
                    .join(" ")}
                />
                {/* P50 Line */}
                <polyline
                  fill="none"
                  stroke="#00ff41"
                  strokeWidth="2"
                  points={mockLatencyData
                    .map((d, i) => `${50 + i * 70},${170 - (d.p50 / 300) * 150}`)
                    .join(" ")}
                />

                {/* Data points & X-Axis Labels */}
                {mockLatencyData.map((d, i) => {
                  const cx = 50 + i * 70;
                  return (
                    <g key={d.time}>
                      <circle cx={cx} cy={170 - (d.p50 / 300) * 150} r="3" fill="#00ff41" />
                      <circle cx={cx} cy={170 - (d.p95 / 300) * 150} r="3" fill="#00d4ff" />
                      <circle cx={cx} cy={170 - (d.p99 / 300) * 150} r="3" fill="#ffaa00" />
                      <text x={cx} y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {d.time}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Cache Hits vs Misses Stacked Chart */}
          <div className="rounded border border-terminal-green/20 bg-terminal-dark/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-terminal-cyan flex items-center gap-2">
                <Database className="h-4 w-4" /> Cache Hits vs. Misses
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-terminal-green">
                  <span className="h-2.5 w-2.5 rounded-sm bg-terminal-green" /> Hits
                </span>
                <span className="flex items-center gap-1 text-terminal-danger">
                  <span className="h-2.5 w-2.5 rounded-sm bg-terminal-danger" /> Misses
                </span>
              </div>
            </div>

            <div className="h-56 w-full pt-4">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 200">
                {[0, 50, 100, 150, 200].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y}
                    x2="490"
                    y2={y}
                    stroke="rgba(0, 255, 65, 0.1)"
                    strokeDasharray="4 4"
                  />
                ))}

                <text x="30" y="15" fill="#94a3b8" fontSize="10" textAnchor="end">40k</text>
                <text x="30" y="65" fill="#94a3b8" fontSize="10" textAnchor="end">30k</text>
                <text x="30" y="115" fill="#94a3b8" fontSize="10" textAnchor="end">20k</text>
                <text x="30" y="165" fill="#94a3b8" fontSize="10" textAnchor="end">0k</text>

                {mockCacheData.map((d, i) => {
                  const x = 40 + i * 65;
                  const hitHeight = (d.hits / 45000) * 150;
                  const missHeight = (d.misses / 45000) * 150;
                  return (
                    <g key={d.time}>
                      <rect
                        x={x}
                        y={170 - hitHeight}
                        width="24"
                        height={hitHeight}
                        fill="#00ff41"
                        rx="1"
                        opacity="0.85"
                      />
                      <rect
                        x={x}
                        y={170 - hitHeight - missHeight}
                        width="24"
                        height={missHeight}
                        fill="#ff3366"
                        rx="1"
                        opacity="0.9"
                      />
                      <text x={x + 12} y="190" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {d.time}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>

        {/* Bottom Section: Top Slow Queries & Hardware Resources */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Top Slow Queries Table (2 cols) */}
          <div className="lg:col-span-2 rounded border border-terminal-green/20 bg-terminal-dark/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-terminal-cyan flex items-center gap-2">
                <Server className="h-4 w-4" /> Top Slow Queries & Endpoints
              </h2>
              <span className="text-xs text-terminal-gray">Sorted by P99 Latency</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-terminal-green/20 text-terminal-gray">
                  <tr>
                    <th className="pb-3 font-semibold">QUERY / ENDPOINT</th>
                    <th className="pb-3 font-semibold text-right">AVG LATENCY</th>
                    <th className="pb-3 font-semibold text-right">P99 LATENCY</th>
                    <th className="pb-3 font-semibold text-right">CALL COUNT</th>
                    <th className="pb-3 font-semibold text-center">CACHEABLE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-green/10">
                  {mockSlowQueries.map((query) => (
                    <tr key={query.id} className="hover:bg-terminal-green/5 transition-colors">
                      <td className="py-3 font-mono">
                        <div className="font-semibold text-terminal-green">{query.queryName}</div>
                        <div className="text-[11px] text-terminal-gray">{query.endpoint}</div>
                      </td>
                      <td className="py-3 text-right text-terminal-cyan font-semibold">
                        {query.avgLatencyMs} ms
                      </td>
                      <td className="py-3 text-right text-terminal-warning font-bold">
                        {query.p99LatencyMs} ms
                      </td>
                      <td className="py-3 text-right text-terminal-gray">
                        {query.callCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        {query.cacheable ? (
                          <span className="inline-block rounded px-2 py-0.5 text-[10px] bg-terminal-green/20 text-terminal-green border border-terminal-green/40">
                            YES
                          </span>
                        ) : (
                          <span className="inline-block rounded px-2 py-0.5 text-[10px] bg-terminal-gray/20 text-terminal-gray">
                            NO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resource Usage Meters (1 col) */}
          <div className="rounded border border-terminal-green/20 bg-terminal-dark/40 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-terminal-cyan flex items-center gap-2">
              <Cpu className="h-4 w-4" /> System Resource Usage
            </h2>

            {/* CPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-terminal-gray">
                  <Cpu className="h-3.5 w-3.5 text-terminal-cyan" /> CPU Utilization
                </span>
                <span className="font-bold text-terminal-green">{metrics.cpuUsage}%</span>
              </div>
              <div className="h-2 w-full bg-terminal-black rounded overflow-hidden border border-terminal-green/20">
                <div className="h-full bg-terminal-green" style={{ width: `${metrics.cpuUsage}%` }} />
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-terminal-gray">
                  <Database className="h-3.5 w-3.5 text-terminal-cyan" /> Memory (RAM)
                </span>
                <span className="font-bold text-terminal-cyan">{metrics.memoryUsage}%</span>
              </div>
              <div className="h-2 w-full bg-terminal-black rounded overflow-hidden border border-terminal-cyan/20">
                <div className="h-full bg-terminal-cyan" style={{ width: `${metrics.memoryUsage}%` }} />
              </div>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-terminal-gray">
                  <HardDrive className="h-3.5 w-3.5 text-terminal-cyan" /> Disk I/O & Storage
                </span>
                <span className="font-bold text-terminal-green">{metrics.diskUsage}%</span>
              </div>
              <div className="h-2 w-full bg-terminal-black rounded overflow-hidden border border-terminal-green/20">
                <div className="h-full bg-terminal-green" style={{ width: `${metrics.diskUsage}%` }} />
              </div>
            </div>

            {/* Active Pool Info */}
            <div className="pt-4 border-t border-terminal-green/10 space-y-2 text-xs text-terminal-gray">
              <div className="flex justify-between">
                <span>PostgreSQL DB Connections:</span>
                <span className="text-terminal-green font-bold">42 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Redis Queue Delay:</span>
                <span className="text-terminal-green font-bold">1.2 ms</span>
              </div>
              <div className="flex justify-between">
                <span>Celery Workers Active:</span>
                <span className="text-terminal-green font-bold">8 worker nodes</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
