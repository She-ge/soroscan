/**
 * StatWidgetSkeleton – shimmer placeholder for metric/stat cards.
 *
 * Design spec (issue #989):
 * ──────────────────────────────────────────────────────────────────
 * Layout:
 *   • Card: rounded border border-terminal-green/20 bg-black/30 p-4
 *   • Label:  text-xs text-terminal-gray  → skeleton 60×12
 *   • Value:  text-2xl default color      → skeleton 100×28
 *   • Hint:   text-xs text-terminal-cyan  → skeleton 80×12
 *
 * Grid context:
 *   • Top metrics:     grid-cols-1 md:grid-cols-2 lg:grid-cols-4
 *   • System metrics:  grid-cols-1 md:grid-cols-3
 *   • Gap: 4 (1rem)
 *
 * Responsive rules:
 *   • Skeletons use percentage widths so cards resize naturally.
 *   • No layout shift when real data loads – skeleton is same aspect ratio.
 * ──────────────────────────────────────────────────────────────────
 */

import { Skeleton } from "@/components/ui/skeleton";

interface StatWidgetSkeletonProps {
  /** Number of skeleton cards to render. */
  count?: number;
  /** Grid layout preset: 'top' (4-col) or 'system' (3-col). */
  layout?: "top" | "system";
}

const gridClass = {
  top: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4",
  system: "grid grid-cols-1 gap-4 md:grid-cols-3",
} as const;

export function StatWidgetSkeleton({
  count = 4,
  layout = "top",
}: StatWidgetSkeletonProps) {
  return (
    <section className={gridClass[layout]} aria-busy="true" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={`sk-stat-${i}`}
          className="rounded border border-terminal-green/20 bg-black/30 p-4 pointer-events-none"
        >
          <Skeleton variant="text" width="40%" height={12} />
          <div className="mt-2">
            <Skeleton variant="rectangle" width="55%" height={28} />
          </div>
          <div className="mt-1">
            <Skeleton variant="text" width="50%" height={12} />
          </div>
        </article>
      ))}

      {/* Accessible loading announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        Loading statistics…
      </div>
    </section>
  );
}
