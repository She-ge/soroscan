import type { FreshnessLevel } from './types';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Classify a lastSyncAt timestamp into a freshness level.
 * - fresh  : < 1 hour ago
 * - stale  : 1 hour – 1 day ago
 * - error  : > 1 day ago or null
 */
export function getFreshnessLevel(lastSyncAt: string | null): FreshnessLevel {
  if (!lastSyncAt) return 'error';
  const ageMs = Date.now() - new Date(lastSyncAt).getTime();
  if (ageMs < ONE_HOUR_MS) return 'fresh';
  if (ageMs < ONE_DAY_MS) return 'stale';
  return 'error';
}

export const FRESHNESS_COLORS: Record<FreshnessLevel, string> = {
  fresh: 'bg-green-900/60 border-green-700 text-green-400',
  stale: 'bg-yellow-900/60 border-yellow-700 text-yellow-400',
  error: 'bg-red-900/60 border-red-700 text-red-400',
};

export const FRESHNESS_LABELS: Record<FreshnessLevel, string> = {
  fresh: '< 1h',
  stale: '< 1d',
  error: '> 1d',
};
