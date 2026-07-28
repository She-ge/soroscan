'use client';

/**
 * Analytics Dashboard
 *
 * Visualises event volume, trends, contract activity, and anomalies.
 * Data sources:
 *   GET /api/ingest/analytics/                     — summary widgets
 *   GET /api/ingest/analytics/event_volume/        — time-series
 *   GET /api/ingest/analytics/top_contracts/       — most active contracts
 *   GET /api/ingest/analytics/event_type_breakdown/ — event type distribution
 *   GET /api/ingest/analytics/anomalies/           — anomaly list
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardGrid } from '../components/DashboardGrid';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/PieChart';
import Badge from '../components/Badge';
import { apiFetch, type ApiError } from '../utils/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Summary {
  total_events: number;
  active_contracts: number;
  events_last_24h: number;
  events_last_7d: number;
  unique_event_types: number;
  anomalies_last_7d: number;
  top_event_type: string | null;
}

interface VolumeRow {
  timestamp: string;
  contract_id: string;
  count: number;
  has_anomaly: boolean;
}

interface TopContract {
  contract_id: string;
  name: string;
  network: string;
  event_count: number;
}

interface TypeBreakdown {
  event_type: string;
  count: number;
  pct: number;
}

interface Anomaly {
  timestamp: string;
  contract_id: string;
  contract_name: string;
  event_count: number;
}

type Granularity = 'hourly' | 'daily' | 'weekly' | 'monthly';
type RangeAlias = '1d' | '7d' | '30d' | '90d' | '1y';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  sub,
  color,
  alert = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-4 ${
        alert ? 'border-red-600/60' : 'border-zinc-800'
      }`}
    >
      <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className="text-2xl font-mono font-bold"
        style={{ color: color ?? (alert ? '#f87171' : '#e4e4e7') }}
      >
        {typeof value === 'number' ? formatNum(value) : value}
      </div>
      {sub && <div className="text-xs font-mono text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AnalyticsDashboardPage() {
  // Filters
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [range, setRange] = useState<RangeAlias>('30d');

  // Data state
  const [summary, setSummary] = useState<Summary | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeRow[]>([]);
  const [topContracts, setTopContracts] = useState<TopContract[]>([]);
  const [breakdown, setBreakdown] = useState<TypeBreakdown[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [sum, vol, top, bdown, anom] = await Promise.all([
        apiFetch<Summary>('/api/ingest/analytics/'),
        apiFetch<{ data: VolumeRow[] }>(
          `/api/ingest/analytics/event_volume/?granularity=${granularity}&range=${range}`
        ),
        apiFetch<{ contracts: TopContract[] }>(
          `/api/ingest/analytics/top_contracts/?range=${range}&limit=10`
        ),
        apiFetch<{ breakdown: TypeBreakdown[] }>(
          `/api/ingest/analytics/event_type_breakdown/?range=${range}`
        ),
        apiFetch<{ anomalies: Anomaly[] }>(
          `/api/ingest/analytics/anomalies/?range=${range}`
        ),
      ]);

      setSummary(sum);
      setVolumeData(vol.data ?? []);
      setTopContracts(top.contracts ?? []);
      setBreakdown(bdown.breakdown ?? []);
      setAnomalies(anom.anomalies ?? []);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 401 || e.status === 403) {
        setError('Authentication required. Set NEXT_PUBLIC_API_KEY or log in.');
      } else {
        setError(`Failed to load analytics (HTTP ${e.status ?? '?'}): ${e.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [granularity, range]);

  useEffect(() => { load(); }, [load]);

  // Chart data transformations
  const lineData = useMemo(
    () =>
      volumeData.map((r) => ({
        name: formatDate(r.timestamp),
        Events: r.count,
      })),
    [volumeData],
  );

  const barData = useMemo(
    () =>
      topContracts.map((c) => ({
        name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
        Events: c.event_count,
      })),
    [topContracts],
  );

  const pieData = useMemo(
    () => breakdown.slice(0, 8).map((b) => ({ name: b.event_type, value: b.count })),
    [breakdown],
  );

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-mono text-zinc-400">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-lg mx-auto mt-20 bg-zinc-900 border border-red-600/50 rounded-lg p-6">
          <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider mb-2">Error</h2>
          <p className="text-sm font-mono text-zinc-300 mb-4">{error}</p>
          <button
            onClick={() => load()}
            className="text-xs font-mono px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded hover:border-zinc-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono text-zinc-100 uppercase tracking-wider mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-sm font-mono text-zinc-500">
            Event volume, trends, and contract activity · pre-computed hourly
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Back
          </a>
          {/* Granularity toggle */}
          <div className="flex border border-zinc-700 rounded overflow-hidden">
            {(['hourly', 'daily', 'weekly', 'monthly'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors capitalize ${
                  granularity === g ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {g.slice(0, 2).toUpperCase()}
              </button>
            ))}
          </div>
          {/* Range toggle */}
          <div className="flex border border-zinc-700 rounded overflow-hidden">
            {(['1d', '7d', '30d', '90d', '1y'] as RangeAlias[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors ${
                  range === r ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-xs font-mono px-4 py-2 border border-zinc-700 text-zinc-400 rounded hover:border-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {refreshing && (
              <span className="inline-block w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
            )}
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
          <StatTile label="Total Events" value={summary.total_events} />
          <StatTile label="Events (24h)" value={summary.events_last_24h} color="#00ffff" />
          <StatTile label="Events (7d)" value={summary.events_last_7d} color="#00ff00" />
          <StatTile label="Active Contracts" value={summary.active_contracts} color="#00ffff" />
          <StatTile label="Event Types" value={summary.unique_event_types} />
          <StatTile
            label="Anomalies (7d)"
            value={summary.anomalies_last_7d}
            alert={summary.anomalies_last_7d > 0}
          />
          <StatTile
            label="Top Event Type"
            value={summary.top_event_type ?? '—'}
            color="#ff00ff"
          />
        </div>
      )}

      {/* Anomaly alert banner */}
      {anomalies.length > 0 && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 bg-red-950/40 border border-red-600/50 rounded-lg px-4 py-3"
        >
          <span className="text-red-400 text-base mt-0.5" aria-hidden>⚠</span>
          <div className="text-sm font-mono text-red-300">
            <strong>{anomalies.length}</strong> anomaly event{anomalies.length > 1 ? 's' : ''} detected
            in the last {range} — event volume dropped &gt;50% below the rolling average.
            <span className="ml-2 text-zinc-400">Possible RPC failure or contract issue.</span>
          </div>
        </div>
      )}

      {/* Main charts */}
      <DashboardGrid columns={2} className="mb-6">
        <LineChart
          data={lineData}
          lines={[{ dataKey: 'Events', stroke: '#00ff00', name: 'Events' }]}
          title={`Event Volume — ${granularity} / ${range}`}
          description="Total events across all contracts (pre-computed aggregations)"
          className="lg:col-span-2"
        />
        <BarChart
          data={barData}
          bars={[{ dataKey: 'Events', fill: '#00ffff', name: 'Events' }]}
          title={`Top 10 Contracts (${range})`}
          description="Most active contracts by event count"
          xAxisKey="name"
        />
        <PieChart
          data={pieData}
          title={`Event Type Distribution (${range})`}
          description="Breakdown of event types by total count"
        />
      </DashboardGrid>

      {/* Anomalies table */}
      {anomalies.length > 0 && (
        <div className="bg-zinc-900 border border-red-800/40 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <span className="text-red-400" aria-hidden>⚠</span>
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Volume Anomalies — {range}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono" role="table">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Timestamp', 'Contract', 'Contract ID', 'Event Count'].map((col) => (
                    <th key={col} scope="col" className="px-4 py-2 text-left text-zinc-500 uppercase tracking-wider font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-400">{formatDate(a.timestamp)}</td>
                    <td className="px-4 py-3 text-zinc-200 font-semibold">{a.contract_name}</td>
                    <td className="px-4 py-3 text-zinc-600">{a.contract_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-red-400 font-semibold">{a.event_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event type breakdown table */}
      {breakdown.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Event Type Breakdown — {range}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono" role="table">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Event Type', 'Count', '%', 'Bar'].map((col) => (
                    <th key={col} scope="col" className="px-4 py-2 text-left text-zinc-500 uppercase tracking-wider font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.slice(0, 20).map((b, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-200 font-semibold">{b.event_type}</td>
                    <td className="px-4 py-3 text-zinc-300">{b.count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-zinc-400">{b.pct.toFixed(1)}%</td>
                    <td className="px-4 py-3 w-40">
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all"
                          style={{ width: `${b.pct}%` }}
                          role="progressbar"
                          aria-valuenow={b.pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${b.event_type}: ${b.pct.toFixed(1)}%`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export links */}
      <div className="flex items-center gap-4 mt-4">
        <span className="text-xs font-mono text-zinc-600">Export:</span>
        <a
          href={`/api/ingest/analytics/export/?range=${range}&format=csv`}
          download
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 transition-colors"
        >
          ↓ CSV
        </a>
        <a
          href={`/api/ingest/analytics/export/?range=${range}&format=json`}
          download
          className="text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 transition-colors"
        >
          ↓ JSON
        </a>
      </div>

      <p className="mt-8 text-xs font-mono text-zinc-600 text-center">
        Data pre-computed hourly by the aggregate_event_statistics Celery task ·
        anomaly threshold: &gt;50% volume drop vs 7-day rolling avg
      </p>
    </div>
  );
}
