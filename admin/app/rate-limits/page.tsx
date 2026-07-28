'use client';

/**
 * Rate Limit Monitoring Dashboard
 *
 * Displays per-API-key quota usage, 7-day trend charts, overage warnings,
 * and a 24-hour forecast. Data comes from GET /api/analytics/rate-limits/.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardGrid } from '../components/DashboardGrid';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { apiFetch, type ApiError } from '../utils/apiClient';

// ---------------------------------------------------------------------------
// Types mirroring the backend response shape
// ---------------------------------------------------------------------------

interface ApiKeyMetrics {
  api_key_id: number;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  quota_per_hour: number;
  /** 168 values, oldest → newest */
  hourly_hits: number[];
  avg_hits_per_hour: number;
  /** percentage 0–100 */
  quota_used_percent: number;
  overage_events: number;
  projected_next_24h_hits: number;
  projected_overage: boolean;
}

interface RateLimitAnalyticsResponse {
  window_hours: number;
  generated_at: string;
  api_keys: ApiKeyMetrics[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<string, string> = {
  free: '#a1a1aa',       // zinc-400
  pro: '#00ffff',        // cyan
  enterprise: '#ff00ff', // magenta
};

const TIER_BADGE_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  free: 'info',
  pro: 'success',
  enterprise: 'warning',
};

function quotaVariant(pct: number): 'primary' | 'success' | 'warning' | 'danger' {
  if (pct >= 90) return 'danger';
  if (pct >= 70) return 'warning';
  if (pct >= 40) return 'success';
  return 'primary';
}

/**
 * Build an array of ISO hour labels for the last N hours.
 * e.g. ["Jul-19 14:00", "Jul-19 15:00", ...]
 */
function buildHourLabels(count: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  // round to top of current hour
  now.setMinutes(0, 0, 0);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3_600_000);
    const month = d.toLocaleString('en', { month: 'short' });
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    labels.push(`${month}-${day} ${hour}:00`);
  }
  return labels;
}

/** Reduce 168-hour array down to daily totals (7 values). */
function toDailyTotals(hourly: number[]): number[] {
  const days: number[] = [];
  for (let d = 0; d < 7; d++) {
    const slice = hourly.slice(d * 24, d * 24 + 24);
    days.push(slice.reduce((s, v) => s + v, 0));
  }
  return days;
}

/** Build day labels like ["Jul-19", "Jul-20", ...] for the last 7 days. */
function buildDayLabels(): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    labels.push(
      `${d.toLocaleString('en', { month: 'short' })}-${d.getDate()}`,
    );
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}

function StatCard({ label, value, sub, alert = false }: StatCardProps) {
  return (
    <div
      className={`bg-zinc-900 border rounded-lg p-4 flex flex-col gap-1 ${
        alert ? 'border-red-600/60' : 'border-zinc-800'
      }`}
    >
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-2xl font-mono font-semibold ${
          alert ? 'text-red-400' : 'text-zinc-100'
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs font-mono text-zinc-500">{sub}</span>
      )}
    </div>
  );
}

interface KeyRowProps {
  metrics: ApiKeyMetrics;
  isSelected: boolean;
  onSelect: () => void;
}

function KeyRow({ metrics, isSelected, onSelect }: KeyRowProps) {
  const pct = Math.min(metrics.quota_used_percent, 100);
  const hasOverage = metrics.overage_events > 0;
  const hasForecast = metrics.projected_overage;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-zinc-900 border rounded-lg p-4 transition-colors ${
        isSelected
          ? 'border-green-500/60 bg-zinc-800'
          : 'border-zinc-800 hover:border-zinc-600'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono text-zinc-100 font-semibold">
            {metrics.name}
          </span>
          <Badge
            label={metrics.tier.toUpperCase()}
            variant={TIER_BADGE_VARIANT[metrics.tier] ?? 'info'}
            size="compact"
            shape="square"
          />
          {hasOverage && (
            <Badge
              label={`${metrics.overage_events} OVERAGE${metrics.overage_events > 1 ? 'S' : ''}`}
              variant="error"
              size="compact"
              shape="square"
            />
          )}
          {hasForecast && !hasOverage && (
            <Badge
              label="PROJECTED OVERAGE"
              variant="warning"
              size="compact"
              shape="square"
            />
          )}
        </div>
        <span className="text-xs font-mono text-zinc-500 shrink-0">
          #{metrics.api_key_id}
        </span>
      </div>

      <ProgressBar
        value={pct}
        variant={quotaVariant(metrics.quota_used_percent)}
        label={`${metrics.avg_hits_per_hour.toFixed(1)} avg req/hr`}
        showPercentage
        className="mb-2"
      />

      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
        <span>Quota: {metrics.quota_per_hour.toLocaleString()} req/hr</span>
        <span>
          Forecast 24h:{' '}
          <span
            className={
              hasForecast ? 'text-yellow-400' : 'text-zinc-400'
            }
          >
            {metrics.projected_next_24h_hits.toLocaleString()}
          </span>
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RateLimitsPage() {
  const [data, setData] = useState<RateLimitAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [view, setView] = useState<'7d-daily' | '24h-hourly'>('7d-daily');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<RateLimitAnalyticsResponse>(
        '/api/analytics/rate-limits/',
      );
      setData(result);
      // Auto-select first key
      if (!isRefresh && result.api_keys.length > 0) {
        setSelectedKeyId(result.api_keys[0].api_key_id);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401 || apiErr.status === 403) {
        setError(
          'Authentication required. Set NEXT_PUBLIC_API_KEY or log in first.',
        );
      } else {
        setError(
          `Failed to load analytics (HTTP ${apiErr.status ?? 'unknown'}): ${apiErr.message}`,
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

  // Derived data ----------------------------------------------------------------

  const selectedKey = useMemo(
    () => data?.api_keys.find((k) => k.api_key_id === selectedKeyId) ?? null,
    [data, selectedKeyId],
  );

  const hourLabels = useMemo(() => buildHourLabels(168), []);
  const dayLabels = useMemo(() => buildDayLabels(), []);

  /** Line chart data for the selected key */
  const trendData = useMemo(() => {
    if (!selectedKey) return [];
    if (view === '24h-hourly') {
      const last24 = selectedKey.hourly_hits.slice(-24);
      const labels = hourLabels.slice(-24);
      return last24.map((hits, i) => ({
        name: labels[i],
        hits,
        quota: selectedKey.quota_per_hour,
      }));
    }
    // 7-day daily
    const dailyHits = toDailyTotals(selectedKey.hourly_hits);
    const dailyQuota = selectedKey.quota_per_hour * 24;
    return dailyHits.map((hits, i) => ({
      name: dayLabels[i],
      hits,
      quota: dailyQuota,
    }));
  }, [selectedKey, view, hourLabels, dayLabels]);

  /** Bar chart: avg % quota used per key */
  const quotaBarData = useMemo(
    () =>
      (data?.api_keys ?? []).map((k) => ({
        name: k.name.length > 14 ? k.name.slice(0, 13) + '…' : k.name,
        'Quota Used %': Math.min(k.quota_used_percent, 100),
        fullName: k.name,
      })),
    [data],
  );

  /** Summary stats */
  const stats = useMemo(() => {
    if (!data) return null;
    const keys = data.api_keys;
    const totalKeys = keys.length;
    const overageKeys = keys.filter((k) => k.overage_events > 0).length;
    const forecastKeys = keys.filter((k) => k.projected_overage).length;
    const totalHits = keys.reduce(
      (s, k) => s + k.hourly_hits.reduce((a, b) => a + b, 0),
      0,
    );
    return { totalKeys, overageKeys, forecastKeys, totalHits };
  }, [data]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-mono text-zinc-400">
            Loading rate limit analytics…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-lg mx-auto mt-20 bg-zinc-900 border border-red-600/50 rounded-lg p-6">
          <h2 className="text-sm font-mono text-red-400 uppercase tracking-wider mb-2">
            Error Loading Data
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

  if (!data || data.api_keys.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <PageHeader onRefresh={() => load(true)} refreshing={refreshing} generatedAt={data?.generated_at} />
        <div className="mt-12 text-center">
          <p className="text-sm font-mono text-zinc-500">
            No API keys found. Create a key to start tracking quota usage.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <PageHeader
        onRefresh={() => load(true)}
        refreshing={refreshing}
        generatedAt={data.generated_at}
      />

      {/* ── Summary stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="API Keys"
          value={stats!.totalKeys}
          sub="active and tracked"
        />
        <StatCard
          label="7-Day Requests"
          value={stats!.totalHits.toLocaleString()}
          sub="across all keys"
        />
        <StatCard
          label="Overage Events"
          value={stats!.overageKeys}
          sub="keys with quota exceeded"
          alert={stats!.overageKeys > 0}
        />
        <StatCard
          label="Forecast Warnings"
          value={stats!.forecastKeys}
          sub="keys projected to exceed"
          alert={stats!.forecastKeys > 0}
        />
      </div>

      {/* ── Overage alerts banner ──────────────────────────────────────── */}
      {(stats!.overageKeys > 0 || stats!.forecastKeys > 0) && (
        <OverageBanner keys={data.api_keys} />
      )}

      {/* ── Two-column layout: key list + trend chart ──────────────────── */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6">
        {/* Key list */}
        <div className="xl:w-80 shrink-0 flex flex-col gap-3">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            API Keys ({data.api_keys.length})
          </h2>
          {data.api_keys.map((k) => (
            <KeyRow
              key={k.api_key_id}
              metrics={k}
              isSelected={selectedKeyId === k.api_key_id}
              onSelect={() => setSelectedKeyId(k.api_key_id)}
            />
          ))}
        </div>

        {/* Trend chart for selected key */}
        <div className="flex-1 min-w-0">
          {selectedKey && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-full flex flex-col">
              {/* Chart header */}
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-mono text-zinc-100 uppercase tracking-wider">
                    {selectedKey.name} — Usage Trend
                  </h3>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    Requests vs quota ceiling
                  </p>
                </div>
                {/* View toggle */}
                <div className="flex border border-zinc-700 rounded overflow-hidden">
                  {(['7d-daily', '24h-hourly'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-3 py-1 text-xs font-mono transition-colors ${
                        view === v
                          ? 'bg-zinc-700 text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {v === '7d-daily' ? '7D Daily' : '24H Hourly'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <LineChart
                  data={trendData}
                  lines={[
                    { dataKey: 'hits', name: 'Requests', stroke: '#00ff00' },
                    {
                      dataKey: 'quota',
                      name: 'Quota Limit',
                      stroke: '#ff4444',
                    },
                  ]}
                />
              </div>

              {/* Key metrics strip */}
              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KeyMetric
                  label="Avg req/hr"
                  value={selectedKey.avg_hits_per_hour.toFixed(1)}
                />
                <KeyMetric
                  label="Quota/hr"
                  value={selectedKey.quota_per_hour.toLocaleString()}
                />
                <KeyMetric
                  label="Overage hrs"
                  value={selectedKey.overage_events}
                  highlight={selectedKey.overage_events > 0}
                />
                <KeyMetric
                  label="Forecast 24h"
                  value={selectedKey.projected_next_24h_hits.toLocaleString()}
                  highlight={selectedKey.projected_overage}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quota usage comparison bar chart ──────────────────────────── */}
      <DashboardGrid columns={1} className="mb-6">
        <BarChart
          data={quotaBarData}
          bars={[
            {
              dataKey: 'Quota Used %',
              fill: '#00ffff',
              name: 'Avg Quota Used (%)',
            },
          ]}
          title="Quota Usage Comparison"
          description="Average % of hourly quota used per API key over the 7-day window"
          xAxisKey="name"
        />
      </DashboardGrid>

      {/* ── Per-key detailed rows (all keys, condensed) ────────────────── */}
      <AllKeysTable keys={data.api_keys} />

      {/* Footer */}
      <p className="mt-8 text-xs font-mono text-zinc-600 text-center">
        Data from a 7-day rolling window · Redis counters reset hourly ·
        Refresh to get latest
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Smaller helper components
// ---------------------------------------------------------------------------

function PageHeader({
  onRefresh,
  refreshing,
  generatedAt,
}: {
  onRefresh: () => void;
  refreshing: boolean;
  generatedAt?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-mono text-zinc-100 uppercase tracking-wider mb-1">
          Rate Limit Dashboard
        </h1>
        <p className="text-sm font-mono text-zinc-500">
          Quota usage, trends, and overage forecasting · 7-day rolling window
        </p>
        {generatedAt && (
          <p className="text-xs font-mono text-zinc-600 mt-0.5">
            Generated at {new Date(generatedAt).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back
        </a>
        <button
          onClick={onRefresh}
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
  );
}

function KeyMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-base font-mono font-semibold ${
          highlight ? 'text-yellow-400' : 'text-zinc-200'
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-mono text-zinc-600 mt-0.5">{label}</div>
    </div>
  );
}

function OverageBanner({ keys }: { keys: ApiKeyMetrics[] }) {
  const overageKeys = keys.filter((k) => k.overage_events > 0);
  const forecastKeys = keys.filter(
    (k) => k.projected_overage && k.overage_events === 0,
  );

  return (
    <div className="mb-6 space-y-2">
      {overageKeys.map((k) => (
        <div
          key={k.api_key_id}
          role="alert"
          className="flex items-center gap-3 bg-red-950/40 border border-red-600/50 rounded-lg px-4 py-3"
        >
          <span className="text-red-400 text-base" aria-hidden="true">
            ⚠
          </span>
          <p className="text-sm font-mono text-red-300">
            <strong>{k.name}</strong> exceeded its quota in{' '}
            <strong>{k.overage_events}</strong> hour
            {k.overage_events > 1 ? 's' : ''} over the last 7 days.
            Quota: {k.quota_per_hour.toLocaleString()} req/hr.
          </p>
        </div>
      ))}
      {forecastKeys.map((k) => (
        <div
          key={k.api_key_id}
          role="alert"
          className="flex items-center gap-3 bg-yellow-950/40 border border-yellow-600/50 rounded-lg px-4 py-3"
        >
          <span className="text-yellow-400 text-base" aria-hidden="true">
            ◈
          </span>
          <p className="text-sm font-mono text-yellow-300">
            <strong>{k.name}</strong> is projected to use{' '}
            <strong>{k.projected_next_24h_hits.toLocaleString()}</strong> requests
            in the next 24h — exceeding the {k.quota_per_hour.toLocaleString()}{' '}
            req/hr quota.
          </p>
        </div>
      ))}
    </div>
  );
}

function AllKeysTable({ keys }: { keys: ApiKeyMetrics[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          All Keys — 7-Day Summary
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono" role="table">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Key Name', 'Tier', 'Quota/hr', 'Avg req/hr', 'Used %', 'Overages', 'Forecast 24h', 'Status'].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-zinc-500 uppercase tracking-wider font-normal"
                    scope="col"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {keys.map((k, i) => {
              const pct = k.quota_used_percent;
              const status =
                k.overage_events > 0
                  ? 'OVER LIMIT'
                  : k.projected_overage
                  ? 'AT RISK'
                  : pct >= 70
                  ? 'HIGH USAGE'
                  : 'NORMAL';
              const statusColor =
                k.overage_events > 0
                  ? 'text-red-400'
                  : k.projected_overage
                  ? 'text-yellow-400'
                  : pct >= 70
                  ? 'text-orange-400'
                  : 'text-green-400';

              return (
                <tr
                  key={k.api_key_id}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    i % 2 === 0 ? '' : 'bg-zinc-900/50'
                  }`}
                >
                  <td className="px-4 py-3 text-zinc-200 font-semibold">
                    {k.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        color: TIER_COLORS[k.tier],
                        borderColor: `${TIER_COLORS[k.tier]}40`,
                      }}
                    >
                      {k.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {k.quota_per_hour.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {k.avg_hits_per_hour.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        pct >= 90
                          ? 'text-red-400'
                          : pct >= 70
                          ? 'text-yellow-400'
                          : 'text-zinc-300'
                      }
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {k.overage_events > 0 ? (
                      <span className="text-red-400">{k.overage_events}</span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      k.projected_overage ? 'text-yellow-400' : 'text-zinc-400'
                    }`}
                  >
                    {k.projected_next_24h_hits.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${statusColor}`}>
                    {status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
