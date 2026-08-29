import { TimelineView } from "@/components/ingest/TimelineView";

export default async function ContractTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TimelineView contractId={id} />;
}
