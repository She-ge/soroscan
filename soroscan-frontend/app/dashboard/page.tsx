"use client";

import { useMemo, useState } from "react";

type RegionState = "green" | "yellow" | "red";

interface RegionHealth {
  region: string;
  status: RegionState;
  latencyMs: number;
  uptimePct: number;
  rpoPct: number;
  rtoPct: number;
  replicationLagSec: number;
  lastBackup: string;
  backupSizeGb: number;
  backupVerified: boolean;
}

const regions: RegionHealth[] = [
  {
    region: "eu-west",
    status: "green",
    latencyMs: 72,
    uptimePct: 99.99,
    rpoPct: 99.4,
    rtoPct: 98.8,
    replicationLagSec: 1.8,
    lastBackup: "2026-07-27T18:00:00Z",
    backupSizeGb: 58.4,
    backupVerified: true,
  },
  {
    region: "us-east",
    status: "yellow",
    latencyMs: 118,
    uptimePct: 99.93,
    rpoPct: 97.9,
    rtoPct: 97.2,
    replicationLagSec: 11.2,
    lastBackup: "2026-07-27T18:05:00Z",
    backupSizeGb: 57.9,
    backupVerified: true,
  },
  {
    region: "ap-south",
    status: "red",
    latencyMs: 252,
    uptimePct: 99.71,
    rpoPct: 95.2,
    rtoPct: 94.9,
    replicationLagSec: 38.4,
    lastBackup: "2026-07-27T17:50:00Z",
    backupSizeGb: 56.8,
    backupVerified: false,
  },
];

const failovers = [
  { id: "fo-1", from: "ap-south", to: "eu-west", timestamp: "2026-07-25T02:11:00Z" },
  { id: "fo-2", from: "us-east", to: "eu-west", timestamp: "2026-07-19T21:40:00Z" },
];

const incidents = [
  {
    id: "in-1",
    title: "Replication lag spike",
    region: "ap-south",
    startedAt: "2026-07-25T01:50:00Z",
    resolvedAt: "2026-07-25T03:04:00Z",
  },
  {
    id: "in-2",
    title: "Transient packet loss",
    region: "us-east",
    startedAt: "2026-07-19T21:20:00Z",
    resolvedAt: "2026-07-19T21:48:00Z",
  },
];

const drTests = [
  { id: "dr-1", test: "Chaos failover drill", timestamp: "2026-07-14T15:00:00Z", result: "pass" },
  { id: "dr-2", test: "Backup restore validation", timestamp: "2026-07-07T14:00:00Z", result: "pass" },
  { id: "dr-3", test: "Cross-region quorum loss simulation", timestamp: "2026-06-30T14:00:00Z", result: "warning" },
];

export default function DashboardPage() {
  const [publicPageStatus, setPublicPageStatus] = useState(true);
  const [regionFailureAlertEnabled, setRegionFailureAlertEnabled] = useState(true);

  const aggregate = useMemo(() => {
    const avgLatency =
      regions.reduce((sum, region) => sum + region.latencyMs, 0) / regions.length;
    const avgUptime =
      regions.reduce((sum, region) => sum + region.uptimePct, 0) / regions.length;
    const avgRpo = regions.reduce((sum, region) => sum + region.rpoPct, 0) / regions.length;
    const avgRto = regions.reduce((sum, region) => sum + region.rtoPct, 0) / regions.length;
    return {
      avgLatency: Math.round(avgLatency),
      avgUptime: Number(avgUptime.toFixed(2)),
      avgRpo: Number(avgRpo.toFixed(2)),
      avgRto: Number(avgRto.toFixed(2)),
    };
  }, []);

  return (
    <main className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs tracking-[0.2em] text-terminal-gray">[MULTI_REGION_HA_DASHBOARD]</p>
          <h1 className="text-3xl">Region Health, Failover, and SLA Compliance</h1>
          <p className="text-sm text-terminal-gray">
            Monitor global region reliability, disaster recovery posture, and SLA adherence in one view.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Average Latency" value={`${aggregate.avgLatency} ms`} hint="cross-region p95" />
          <MetricCard label="SLA Uptime" value={`${aggregate.avgUptime}%`} hint="target >= 99.9%" />
          <MetricCard label="SLA RPO" value={`${aggregate.avgRpo}%`} hint="target >= 98%" />
          <MetricCard label="SLA RTO" value={`${aggregate.avgRto}%`} hint="target >= 98%" />
        </section>

        <section className="rounded border border-terminal-green/20 overflow-hidden">
          <div className="border-b border-terminal-green/10 px-4 py-3">
            <h2 className="text-sm text-terminal-gray">Region Health Dashboard</h2>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-terminal-green/5">
              <tr>
                <th className="px-2 py-2 text-left">Region</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-right">Latency</th>
                <th className="px-2 py-2 text-right">Replication Lag</th>
                <th className="px-2 py-2 text-right">Backup</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr key={region.region} className="border-t border-terminal-green/10">
                  <td className="px-2 py-2">{region.region}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded border px-2 py-1 ${statusBadge(region.status)}`}>
                      {region.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">{region.latencyMs} ms</td>
                  <td className="px-2 py-2 text-right">{region.replicationLagSec}s</td>
                  <td className="px-2 py-2 text-right">
                    {new Date(region.lastBackup).toLocaleTimeString()} /{" "}
                    {region.backupVerified ? "verified" : "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded border border-terminal-cyan/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-cyan">Failover Event Timeline</h2>
            <div className="space-y-2 text-xs">
              {failovers.map((event) => (
                <div
                  key={event.id}
                  className="rounded border border-terminal-cyan/20 bg-black/30 p-2"
                >
                  {event.from} -&gt; {event.to}
                  <p className="text-terminal-gray">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded border border-terminal-magenta/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-magenta">Disaster Recovery Test Results</h2>
            <div className="space-y-2 text-xs">
              {drTests.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-terminal-magenta/20 bg-black/30 p-2"
                >
                  <p>{item.test}</p>
                  <p className="text-terminal-gray">
                    {new Date(item.timestamp).toLocaleDateString()} - {item.result}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded border border-terminal-yellow/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-yellow">Incident Timeline</h2>
            <div className="space-y-2 text-xs">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="rounded border border-terminal-yellow/20 bg-black/30 p-2"
                >
                  <p>
                    {incident.title} ({incident.region})
                  </p>
                  <p className="text-terminal-gray">
                    {new Date(incident.startedAt).toLocaleString()} -{" "}
                    {new Date(incident.resolvedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded border border-terminal-green/20 p-4">
            <h2 className="mb-3 text-sm text-terminal-gray">Health Check Status Page</h2>
            <p className="text-xs text-terminal-gray">
              Public status page currently {publicPageStatus ? "online" : "maintenance"}.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPublicPageStatus((value) => !value)}
                className="rounded border border-terminal-green/40 px-2 py-1 text-xs text-terminal-green"
              >
                Toggle public status page
              </button>
            </div>
            <div className="mt-4 rounded border border-terminal-green/20 p-2 text-xs">
              <p>Alert configuration for region failures</p>
              <button
                type="button"
                onClick={() => setRegionFailureAlertEnabled((value) => !value)}
                className={`mt-2 rounded border px-2 py-1 ${
                  regionFailureAlertEnabled
                    ? "border-terminal-green/40 text-terminal-green"
                    : "border-terminal-gray/40 text-terminal-gray"
                }`}
              >
                {regionFailureAlertEnabled ? "alerts enabled" : "alerts disabled"}
              </button>
            </div>
          </article>
        </section>

        <section className="rounded border border-terminal-green/20 p-4">
          <h2 className="text-sm text-terminal-gray">SLA Compliance Scorecard</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 text-xs text-terminal-gray">
            <p>Uptime score: {aggregate.avgUptime}% / target 99.9%</p>
            <p>RPO score: {aggregate.avgRpo}% / target 98%</p>
            <p>RTO score: {aggregate.avgRto}% / target 98%</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded border border-terminal-green/20 bg-black/30 p-4">
      <p className="text-xs text-terminal-gray">{label}</p>
      <p className="mt-2 text-2xl">{value}</p>
      <p className="mt-1 text-xs text-terminal-cyan">{hint}</p>
    </article>
  );
}

function statusBadge(status: RegionState): string {
  if (status === "green") {
    return "border-terminal-green/40 text-terminal-green bg-terminal-green/10";
  }
  if (status === "yellow") {
    return "border-terminal-yellow/40 text-terminal-yellow bg-terminal-yellow/10";
  }
  return "border-terminal-danger/40 text-terminal-danger bg-terminal-danger/10";
}
