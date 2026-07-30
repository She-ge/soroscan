import { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from '@/components/ui/skeleton';

export default function WebhooksLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading webhooks"
      className="min-h-screen bg-terminal-black font-terminal-mono"
    >
      <span className="sr-only">Loading webhooks</span>

      <main className="container mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-8 md:py-14">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonText
            lines={3}
            width={360}
            lineHeight={16}
            gap={10}
            lineWidths={['35%', '80%', '60%']}
          />

          <Skeleton width={150} height={42} animation="pulse" />
        </header>

        <section className="grid grid-cols-2 gap-4 border border-terminal-green/20 p-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard
              key={index}
              showMedia={false}
              lines={1}
              height={112}
              animation="pulse"
              animationSpeed="normal"
            />
          ))}
        </section>

        <SkeletonText lines={1} width={260} lineHeight={12} />

        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <SkeletonText lines={1} width={180} lineHeight={20} />

            <Skeleton width="100%" height={2} animation="pulse" />
          </div>

          <SkeletonTable
            rows={6}
            columns={6}
            rowHeight={18}
            animation="pulse"
            animationSpeed="normal"
          />
        </section>
      </main>
    </div>
  );
}
