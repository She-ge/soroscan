export interface SC20Event {
  contractId: string;
  topic: string;
  data: unknown;
  timestamp: number;
}

export function parseSC20Event(rawEvent: Record<string, unknown>): SC20Event {
  return {
    contractId: String(rawEvent.contractId || ""),
    topic: String(rawEvent.topic || "unknown"),
    data: rawEvent.data ?? null,
    timestamp: Number(rawEvent.timestamp || Date.now()),
  };
}
