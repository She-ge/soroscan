import { EventExplorerView } from "@/components/ingest/EventExplorerView";

export default async function ContractExplorerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventExplorerView contractId={id} />;
}
