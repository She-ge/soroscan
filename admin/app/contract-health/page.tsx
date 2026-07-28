'use client';

/**
 * Contract Health Dashboard
 *
 * Shows indexing health for all active contracts.
 * Data source: GET /api/analytics/contracts/health/  (staff only)
 *
 * Status legend:
 *   HEALTHY  — events flowing, no ABI decode spike
 *   DEGRADED — no events for >30 min OR ABI decode errors > threshold
 *   FAILED   — no events for >2 hours
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardGrid } from '../components/DashboardGrid';
import { BarChart } from '../components/BarChart';
import Badge from '../components/Badge';
import { apiFetch, type ApiError } from '../utils/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContractHealth {
  contract_id: string;
  name: string;
  network: string;
  status: 'healthy' | 'degraded' | 'failed';
  last_event_time: string | null;
  minutes_since_last_event: number;
  abi_decode_errors_1h: number;
  consecutive_failures: number;
  error_message: string;
  checked_at: string | null;
}

interface HealthOverview {
  total: number;
  healthy: number;
  degraded: number;
  failed: number;
  contracts: ContractHealth[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  healthy: '#00ff00',
  degraded: '#ffff00',
  failed: '#ff4444',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  healthy: 'success',
  degraded: 'warning',
  failed: 'error',
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string;
  value: number;
  color?: string;
  alert?: boolean;
}

function StatTile({ label, value, color, alert = false }: StatTileProps) {
  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-4 text-center ${
        alert && value > 0 ? 'border-red-600/60' : 'border-zinc-800'
      }`}
    >
      <div
        className="text-3xl font-mono font-bold mb-1"
        style={{ color: color ?? (alert && value > 0 ? '#f87171' : '#e4e4e7') }}
      >
        {value}
      </div>
      <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

interface ContractRowProps {
  health: ContractHealth;
}

function ContractRow({ health }: ContractRowProps) {
  const isProblematic = health.status !== 'healthy';

  return (
    <tr
      className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${
        health.status === 'failed'
          ? 'bg-red-950/20'
          : health.status === 'degraded'
          ? 'bg-yellow-950/10'
          : ''
      }`}
    >
      {/* Contract */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-mono font-semibold text-zinc-100">
            {health.name}
          </span>
          <span className="text-xs font-mono text-zinc-600">
            {health.contract_id.slice(0, 8)}…{health.contract_id.slice(-4)}
          </span>
        </div>
      </td>

      {/* Network */}
      <td className="px-4 py-3 text-xs font-mono text-zinc-400 uppercase">
        {health.network}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge
          label={health.status.toUpperCase()}
          variant={STATUS_BADGE[health.status] ?? 'info'}
          size="compact"
          shape="square"
        />
      </td>

      {/* Last event */}
      <td className="px-4 py-3 text-xs font-mono text-zinc-400">
        {formatRelativeTime(health.last_event_time)}
      </td>

      {/* Minutes stale */}
      <td className="px-4 py-3 text-xs font-mono">
        <span
          className={
            health.minutes_since_last_event >= 120
              ? 'text-red-400'
              : health.minutes_since_last_event >= 30
              ? 'text-yellow-400'
              : 'text-zinc-400'
          }
        >
          {health.minutes_since_last_event}m
        </span>
      </td>

      {/* ABI decode errors */}
      <td className="px-4 py-3 text-xs font-mono">
        <span className={health.abi_decode_errors_1h > 0 ? 'text-yellow-400' : 'text-zinc-600'}>
          {health.abi_decode_errors_1h}
        </span>
      </td>

      {/* Consecutive failures */}
      <td className="px-4 py-3 text-xs font-mono">
        <span className={health.consecutive_failures > 0 ? 'text-orange-400' : 'text-zinc-600'}>
          {health.consecutive_failures}
        </span>
      </td>

      {/* Error */}
      <td className="px-4 py-3 text-xs font-mono text-zinc-500 max-w-xs truncate">
        {health.error_message || (
          <span className="text-zinc-700">—</span>
        )}
      </td>

      {/* Checked at */}
      <td className="px-4 py-3 text-xs font-mono text-zinc-600">
        {formatRelativeTime(health.checked_at)}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ContractHealthPage() {
  const [data, setData] = useState<HealthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'degraded' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<HealthOverview>('/api/analytics/contracts/health/');
      setData(result);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401 || apiErr.status === 403) {
        setError('Staff authentication required. Log in as a staff user.');
      } else {
        setError(
          `Failed to load health data (HTTP ${apiErr.status ?? 'unknown'}): ${apiErr.message}`,
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 60 s
  useEffect(() => {
    const id = setInterval(() => load(true), 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Filtered + searched contract list
  const displayedContracts = useMemo(() => {
    if (!data) return [];
    return data.contracts.filter((c) => {
      const statusMatch = filter === 'all' || c.status === filter;
      const searchMatch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contract_id.toLowerCase().includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [data, filter, search]);

  // Bar chart data — stale minutes per contract
  const staleBarData = useMemo(
    () =>
      (data?.contracts ?? [])
        .filter((c) => c.status !== 'healthy')
        .sort((a, b) => b.minutes_since_last_event - a.minutes_since_last_event)
        .slice(0, 10)
        .map((c) => ({
          name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
          'Minutes stale': c.minutes_since_last_event,
          'ABI errors (1h)': c.abi_decode_errors_1h,
        })),
    [data],
  );

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-mono text-zinc-400">Loading contract health…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-lg mx-auto mt-20 bg-zinc-900 border border-red-600/50 rounded-lg p-6">
          <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider mb-2">
            Error Loading Health Data
          </h2>
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

  if (!data) return null;

  const problemCount = data.degraded + data.failed;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-mono text-zinc-100 uppercase tracking-wider mb-1">
            Contract Health
          </h1>
          <p className="text-sm font-mono text-zinc-500">
            Indexing status for all active contracts · updated every 5 minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Back
          </a>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-xs font-mono px-4 py-2 border border-zinc-700 text-zinc-400 rounded hover:border-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {refreshing && (
              <span className="inline-block w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
            )}
            {refreshing ? 'Refreshing…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total contracts" value={data.total} />
        <StatTile label="Healthy" value={data.healthy} color="#00ff00" />
        <StatTile label="Degraded" value={data.degraded} color="#ffff00" alert />
        <StatTile label="Failed" value={data.failed} color="#ff4444" alert />
      </div>

      {/* Problem banners */}
      {data.failed > 0 && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 bg-red-950/40 border border-red-600/50 rounded-lg px-4 py-3"
        >
          <span className="text-red-400 text-base mt-0.5" aria-hidden>✗</span>
          <p className="text-sm font-mono text-red-300">
            <strong>{data.failed}</strong> contract{data.failed > 1 ? 's have' : ' has'} FAILED —
            no events indexed for over 2 hours. Immediate investigation required.
          </p>
        </div>
      )}
      {data.degraded > 0 && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 bg-yellow-950/40 border border-yellow-600/50 rounded-lg px-4 py-3"
        >
          <span className="text-yellow-400 text-base mt-0.5" aria-hidden>⚠</span>
          <p className="text-sm font-mono text-yellow-300">
            <strong>{data.degraded}</strong> contract{data.degraded > 1 ? 's are' : ' is'} DEGRADED —
            no events for over 30 minutes or ABI decode error spike detected.
          </p>
        </div>
      )}

      {/* Stale contracts chart */}
      {staleBarData.length > 0 && (
        <DashboardGrid columns={1} className="mb-6">
          <BarChart
            data={staleBarData}
            bars={[
              { dataKey: 'Minutes stale', fill: '#ff4444', name: 'Minutes without events' },
              { dataKey: 'ABI errors (1h)', fill: '#ffff00', name: 'ABI decode errors (1h)' },
            ]}
            title="Problematic Contracts"
            description="Top 10 contracts with indexing issues — minutes stale and ABI decode error count"
            xAxisKey="name"
          />
        </DashboardGrid>
      )}

      {/* Filter + search bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex border border-zinc-700 rounded overflow-hidden">
          {(['all', 'healthy', 'degraded', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono transition-colors capitalize ${
                filter === f
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f === 'all' ? `All (${data.total})` : `${f} (${data[f]})`}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search by name or contract ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          aria-label="Search contracts"
        />
        <span className="text-xs font-mono text-zinc-600">
          {displayedContracts.length} result{displayedContracts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contracts table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono" role="table">
            <thead>
              <tr className="border-b border-zinc-800">
                {[
                  'Contract',
                  'Network',
                  'Status',
                  'Last Event',
                  'Stale (min)',
                  'ABI Errors/hr',
                  'Consec. Failures',
                  'Error',
                  'Checked',
                ].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-2 text-left text-zinc-500 uppercase tracking-wider font-normal whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-zinc-600 font-mono"
                  >
                    {data.total === 0
                      ? 'No contracts tracked yet.'
                      : 'No contracts match the current filter.'}
                  </td>
                </tr>
              ) : (
                displayedContracts.map((h) => (
                  <ContractRow key={h.contract_id} health={h} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-8 text-xs font-mono text-zinc-600 text-center">
        Health checks run every 5 minutes · thresholds: degraded &gt;30 min, failed &gt;120 min
        · auto-refreshes every 60 s
      </p>
    </div>
  );
}
