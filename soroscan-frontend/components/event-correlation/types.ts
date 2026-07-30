/** Domain types for event correlation & atomic transaction visualization (#916). */

export interface CorrelatedEvent {
  id: string;
  contractId: string;
  contractName: string;
  eventType: string;
  timestamp: string;
  blockNumber: number;
  payload?: Record<string, unknown>;
}

export interface AtomicGroupTimeline {
  eventId: string;
  contractId: string;
  contractName: string;
  eventType: string;
  timestamp: string;
  blockNumber: number;
}

export interface AtomicGroup {
  id: string;
  totalEvents: number;
  contracts: string[];
  timeline: AtomicGroupTimeline[];
}

export interface EventCorrelationData {
  id: string;
  correlationId: string | null;
  atomicGroupId: string | null;
  relatedEvents: CorrelatedEvent[];
  atomicGroup: AtomicGroup | null;
}

/** Node data stored in the React Flow graph */
export interface CorrelationNodeData extends Record<string, unknown> {
  eventId: string;
  eventType: string;
  contractId: string;
  contractName: string;
  timestamp: string;
  blockNumber: number;
  isRoot?: boolean;
}
