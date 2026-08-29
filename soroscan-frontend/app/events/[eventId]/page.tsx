import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CopyEventLink } from '@/components/events/CopyEventLink';
import { formatDateTime } from '@/components/ingest/formatters';
import type { EventRecord } from '@/components/ingest/types';
import { JsonHighlight } from '@/app/dashboard/components/JsonHighlight';

export const dynamic = 'force-dynamic';

interface EventPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

interface BackendEventRecord {
  id: string | number;
  contract_id: string;
  contract_name?: string | null;
  event_type: string;
  payload: unknown;
  payload_hash?: string | null;
  ledger: number;
  event_index: number;
  timestamp: string;
  tx_hash: string;
  schema_version?: string | null;
  validation_status?: string | null;
}

function mapBackendEvent(event: BackendEventRecord): EventRecord {
  return {
    id: String(event.id),
    contractId: event.contract_id,
    contractName: event.contract_name ?? '',
    eventType: event.event_type,
    ledger: event.ledger,
    eventIndex: event.event_index,
    timestamp: event.timestamp,
    txHash: event.tx_hash,
    payload: event.payload,
    payloadHash: event.payload_hash ?? undefined,
    schemaVersion: event.schema_version ?? undefined,
    validationStatus: event.validation_status ?? undefined,
  };
}

async function getEventById(eventId: string): Promise<EventRecord> {
  const backendBaseUrl = (process.env.BACKEND_BASE_URL ?? 'http://localhost:8000').replace(
    /\/+$/,
    '',
  );

  const response = await fetch(
    `${backendBaseUrl}/api/ingest/events/${encodeURIComponent(eventId)}/`,
    {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load event ${eventId}. The event service returned status ${response.status}.`,
    );
  }

  const event = (await response.json()) as BackendEventRecord;

  return mapBackendEvent(event);
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  const event = await getEventById(decodeURIComponent(eventId));

  const explorerHref = `/contracts/${encodeURIComponent(event.contractId)}/events/explorer`;

  return (
    <main className="min-h-screen bg-terminal-black px-4 py-8 font-terminal-mono text-terminal-light sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-terminal-cyan/20 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-terminal-cyan">
              [SHARED_EVENT]
            </p>

            <h1 className="break-words text-2xl font-semibold text-terminal-green sm:text-3xl">
              {event.eventType}
            </h1>

            <p className="mt-2 break-all text-xs text-terminal-gray">Event ID: {event.id}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <CopyEventLink eventId={event.id} />

            <Link
              href={explorerHref}
              className="inline-flex items-center justify-center rounded-sm border border-terminal-green/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-terminal-green transition-colors hover:bg-terminal-green/10"
            >
              Back to Explorer
            </Link>
          </div>
        </header>

        <section aria-label="Event metadata" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetadataCard label="Timestamp" value={formatDateTime(event.timestamp)} />

          <MetadataCard label="Ledger" value={event.ledger.toString()} />

          <MetadataCard label="Event Index" value={event.eventIndex.toString()} />

          <MetadataCard label="Validation" value={event.validationStatus ?? 'Not provided'} />
        </section>

        <section className="space-y-5 rounded-lg border border-terminal-cyan/25 bg-black/20 p-4 sm:p-6">
          <h2 className="text-lg text-terminal-cyan">Event Information</h2>

          <DetailRow label="Event ID" value={event.id} />

          <DetailRow label="Contract ID" value={event.contractId} />

          {event.contractName ? (
            <DetailRow label="Contract Name" value={event.contractName} />
          ) : null}

          <DetailRow label="Transaction Hash" value={event.txHash} />

          {event.payloadHash ? <DetailRow label="Payload Hash" value={event.payloadHash} /> : null}

          {event.schemaVersion ? (
            <DetailRow label="Schema Version" value={event.schemaVersion} />
          ) : null}
        </section>

        <section className="space-y-4 rounded-lg border border-terminal-green/25 bg-black/20 p-4 sm:p-6">
          <h2 className="text-lg text-terminal-green">Payload</h2>

          <JsonHighlight data={event.payload} theme="dark" maxHeight="600px" />
        </section>
      </div>
    </main>
  );
}

interface MetadataCardProps {
  label: string;
  value: string;
}

function MetadataCard({ label, value }: MetadataCardProps) {
  return (
    <article className="rounded-md border border-terminal-cyan/20 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wider text-terminal-gray">{label}</p>

      <p className="mt-2 break-words text-sm text-terminal-light">{value}</p>
    </article>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-terminal-gray">{label}</p>

      <code className="block break-all rounded-sm border border-terminal-gray/25 bg-black/40 p-3 text-sm text-terminal-light">
        {value}
      </code>
    </div>
  );
}
