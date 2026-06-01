/**
 * batchService.ts
 *
 * Promise-based batch execution service for event bulk operations.
 * Handles rate-limiting for bulk webhook resends and provides progress callbacks.
 */

import type { EventRecord } from "@/components/ingest/types";

export type BatchAction = "export" | "resend" | "tag" | "delete";
export type ExportFormat = "csv" | "json";

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  /** 0–100 */
  percent: number;
}

export interface BatchResult {
  succeeded: string[];
  failed: string[];
}

/** Configurable concurrency limit to avoid server saturation during bulk webhook resends. */
const WEBHOOK_CONCURRENCY = 5;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Export a list of events as CSV or JSON and trigger a browser download.
 */
export function exportEvents(events: EventRecord[], format: ExportFormat): void {
  if (!events.length) return;

  if (format === "json") {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, `events-${Date.now()}.json`);
    return;
  }

  // CSV
  const headers = [
    "Contract ID",
    "Contract Name",
    "Event Type",
    "Ledger",
    "Timestamp",
    "Transaction Hash",
    "Payload",
  ];

  const rows = events.map((e) => [
    e.contractId,
    e.contractName,
    e.eventType,
    String(e.ledger),
    e.timestamp,
    e.txHash,
    JSON.stringify(e.payload),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, `events-${Date.now()}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Webhook Resend (simulated – real API call would POST to /api/webhooks/resend)
// ---------------------------------------------------------------------------

/**
 * Resend webhooks for a batch of events with built-in rate-limiting.
 *
 * @param eventIds   IDs of events to resend
 * @param onProgress Called after each event completes/fails
 */
export async function resendWebhooks(
  eventIds: string[],
  onProgress: (progress: BatchProgress) => void,
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: [], failed: [] };
  const total = eventIds.length;
  let completed = 0;

  const sendOne = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result.succeeded.push(id);
    } catch {
      result.failed.push(id);
    } finally {
      completed++;
      onProgress({
        total,
        completed,
        failed: result.failed.length,
        percent: Math.round((completed / total) * 100),
      });
    }
  };

  // Process in chunks to respect WEBHOOK_CONCURRENCY
  for (let i = 0; i < eventIds.length; i += WEBHOOK_CONCURRENCY) {
    const chunk = eventIds.slice(i, i + WEBHOOK_CONCURRENCY);
    await Promise.all(chunk.map(sendOne));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

/**
 * Apply a tag to many events by calling the API for each.
 * Falls back gracefully: failed IDs are collected without interrupting others.
 */
export async function tagEvents(
  eventIds: string[],
  tag: string,
  onProgress: (progress: BatchProgress) => void,
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: [], failed: [] };
  const total = eventIds.length;
  let completed = 0;

  const tagOne = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result.succeeded.push(id);
    } catch {
      result.failed.push(id);
    } finally {
      completed++;
      onProgress({
        total,
        completed,
        failed: result.failed.length,
        percent: Math.round((completed / total) * 100),
      });
    }
  };

  for (let i = 0; i < eventIds.length; i += WEBHOOK_CONCURRENCY) {
    const chunk = eventIds.slice(i, i + WEBHOOK_CONCURRENCY);
    await Promise.all(chunk.map(tagOne));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a batch of events.
 * Real API: DELETE /api/events/:id
 */
export async function deleteEvents(
  eventIds: string[],
  onProgress: (progress: BatchProgress) => void,
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: [], failed: [] };
  const total = eventIds.length;
  let completed = 0;

  const deleteOne = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      result.succeeded.push(id);
    } catch {
      result.failed.push(id);
    } finally {
      completed++;
      onProgress({
        total,
        completed,
        failed: result.failed.length,
        percent: Math.round((completed / total) * 100),
      });
    }
  };

  for (let i = 0; i < eventIds.length; i += WEBHOOK_CONCURRENCY) {
    const chunk = eventIds.slice(i, i + WEBHOOK_CONCURRENCY);
    await Promise.all(chunk.map(deleteOne));
  }

  return result;
}
