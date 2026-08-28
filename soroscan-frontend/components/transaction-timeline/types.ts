export type TimelineEventStatus = "success" | "error" | "pending";

export type TimelineZoomLevel =
  | "compact"
  | "normal"
  | "comfortable";

export interface TransactionTimelineEvent {
  id: string;
  transactionId: string;
  eventType: string;
  title: string;
  timestamp: string;
  status: TimelineEventStatus;
  contractId?: string;
  txHash?: string;
  ledger?: number;
  parentEventId?: string | null;
  details?: unknown;
}

export interface TransactionTimelineGroupData {
  transactionId: string;
  startedAt: string;
  completedAt: string;
  events: TransactionTimelineEvent[];
}
