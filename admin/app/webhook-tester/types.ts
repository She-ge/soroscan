// Webhook Tester Types

export interface WebhookSubscription {
  id: number;
  contract_id: string;
  event_type: string;
  target_url: string;
  is_active: boolean;
  status: 'active' | 'suspended';
  created_at: string;
  last_triggered: string | null;
  failure_count: number;
}

export interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  time: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  webhookId: number;
  targetUrl: string;
  payload: string;
  response?: TestResponse;
  error?: string;
}

export const DEFAULT_PAYLOAD = JSON.stringify(
  {
    event_type: 'test',
    payload: { message: 'This is a test webhook' },
    contract_id: '',
    timestamp: new Date().toISOString(),
  },
  null,
  2
);
