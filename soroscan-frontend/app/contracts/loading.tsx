import { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from '@/components/ui/skeleton';

export default function ContractsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading contracts"
      className="min-h-screen bg-terminal-black p-4 font-terminal-mono sm:p-8"
    >
      <span className="sr-only">Loading contracts</span>

      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonText
            lines={2}
            width={420}
            lineHeight={18}
            gap={12}
            lineWidths={['70%', '100%']}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton width={145} height={40} animation="pulse" />

            <Skeleton width={130} height={40} animation="pulse" />

            <Skeleton width={155} height={40} animation="pulse" />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard
              key={index}
              showMedia={false}
              lines={1}
              height={128}
              animation="pulse"
              animationSpeed="normal"
            />
          ))}
        </section>

        <section className="space-y-4 rounded-lg border border-terminal-green/20 p-4">
          <SkeletonText lines={1} width={220} lineHeight={20} />

          <SkeletonTable
            rows={7}
            columns={5}
            rowHeight={18}
            animation="pulse"
            animationSpeed="normal"
          />
        </section>
      </div>
    </div>
  );
}
