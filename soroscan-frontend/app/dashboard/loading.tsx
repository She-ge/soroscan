import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonText,
} from '@/components/ui/skeleton';

export default function EventExplorerLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Event Explorer"
      className="min-h-screen bg-terminal-black p-4 font-terminal-mono sm:p-8"
    >
      <span className="sr-only">Loading Event Explorer</span>

      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-lg border border-terminal-green/20 p-4">
          <SkeletonText lines={2} lineHeight={14} lineWidths={['45%', '75%']} />

          <SkeletonCard
            showMedia={false}
            lines={4}
            height={220}
            animation="pulse"
            animationSpeed="normal"
          />

          <SkeletonText lines={3} lineHeight={38} gap={12} lineWidths={['100%', '100%', '100%']} />
        </aside>

        <main className="min-w-0 space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonText
              lines={3}
              width={360}
              lineHeight={16}
              gap={10}
              lineWidths={['25%', '70%', '100%']}
            />

            <Skeleton width={42} height={42} animation="pulse" className="shrink-0" />
          </header>

          <SkeletonChart height={220} bars={10} animation="pulse" animationSpeed="normal" />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SkeletonText lines={1} width={180} lineHeight={20} />

              <div className="flex gap-2">
                <Skeleton width={100} height={34} animation="pulse" />

                <Skeleton width={80} height={34} animation="pulse" />
              </div>
            </div>

            <SkeletonTable
              rows={8}
              columns={7}
              rowHeight={16}
              animation="pulse"
              animationSpeed="normal"
            />
          </section>
        </main>
      </div>
    </div>
  );
}
