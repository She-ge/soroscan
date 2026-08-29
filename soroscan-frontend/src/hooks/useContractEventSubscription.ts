/**
 * useContractEventSubscription
 * ────────────────────────────────────────────────────────────────────
 * Typed hook wrapping Apollo's useSubscription for the
 * OnContractEvent subscription.
 *
 * Gracefully degrades to `connectionState: 'unavailable'` when
 * NEXT_PUBLIC_WS_URL is not configured (e.g. in SSR or local dev
 * without a WS backend).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSubscription, gql } from "@apollo/client";

// ── Document ──────────────────────────────────────────────────────────
const ON_CONTRACT_EVENT = gql`
  subscription OnContractEvent($contractId: String!) {
    contractEvent(contractId: $contractId) {
      id
      eventType
      ledgerSequence
      timestamp
      payload
    }
  }
`;

// ── Types ──────────────────────────────────────────────────────────────
export interface ContractEventItem {
  id: string;
  eventType: string;
  ledgerSequence: number;
  timestamp: string;
  payload: string;
}

export type ConnectionState =
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "unavailable";

export interface UseContractEventSubscriptionResult {
  /** Latest events — newest first, capped at maxEvents. */
  events: ContractEventItem[];
  loading: boolean;
  error: Error | undefined;
  connectionState: ConnectionState;
}

export interface UseContractEventSubscriptionOptions {
  contractId: string;
  /** Maximum number of events to keep in memory (default: 50). */
  maxEvents?: number;
}

const MAX_EVENTS_DEFAULT = 50;

// ── Hook ───────────────────────────────────────────────────────────────
export function useContractEventSubscription({
  contractId,
  maxEvents = MAX_EVENTS_DEFAULT,
}: UseContractEventSubscriptionOptions): UseContractEventSubscriptionResult {
  const wsAvailable =
    typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_WS_URL;

  const [events, setEvents] = useState<ContractEventItem[]>([]);
  // True once the socket has delivered at least one payload.
  const [hasReceivedData, setHasReceivedData] = useState(false);

  // Track mount state to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleData = useCallback(
    ({ data }: { data: { data?: { contractEvent?: ContractEventItem } } }) => {
      if (!mountedRef.current) return;
      const event = data.data?.contractEvent;
      if (event) {
        setEvents((prev) => [event, ...prev].slice(0, maxEvents));
      }
      setHasReceivedData(true);
    },
    [maxEvents]
  );

  const { loading, error } = useSubscription<{
    contractEvent: ContractEventItem;
  }>(ON_CONTRACT_EVENT, {
    variables: { contractId },
    skip: !wsAvailable,
    onData: handleData,
  });

  // A live socket that has not yet emitted an event is still "connected" —
  // deriving the state avoids reporting "Disconnected" on an idle contract.
  const connectionState: ConnectionState = !wsAvailable
    ? "unavailable"
    : error
      ? "reconnecting"
      : hasReceivedData || !loading
        ? "connected"
        : "disconnected";

  return {
    events,
    loading,
    error,
    connectionState,
  };
}
