"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useContractEventSubscription } from "@/src/hooks/useContractEventSubscription";

interface EventStreamContextType {
  eventCounts: Record<string, number>;
  subscribe: (contractId: string, initialCount: number) => () => void;
}

const EventStreamContext = createContext<EventStreamContextType | undefined>(undefined);

export function useEventStream() {
  const context = useContext(EventStreamContext);
  if (!context) {
    throw new Error("useEventStream must be used within an EventStreamProvider");
  }
  return context;
}

interface ContractEventSubscriberProps {
  contractId: string;
  onNewEvent: () => void;
}

function ContractEventSubscriber({ contractId, onNewEvent }: ContractEventSubscriberProps) {
  const { events } = useContractEventSubscription({ contractId, maxEvents: 5 });
  const prevEventsRef = useRef<string[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const currentIds = events.map((e) => e.id);
    
    if (!isInitialized.current) {
      prevEventsRef.current = currentIds;
      isInitialized.current = true;
      return;
    }

    // Find new event IDs that weren't in the previous set
    const newEvents = events.filter((e) => !prevEventsRef.current.includes(e.id));
    if (newEvents.length > 0) {
      newEvents.forEach(() => {
        onNewEvent();
      });
    }
    
    prevEventsRef.current = currentIds;
  }, [events, onNewEvent]);

  return null;
}

interface EventStreamProviderProps {
  children: React.ReactNode;
}

export function EventStreamProvider({ children }: EventStreamProviderProps) {
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [subscribers, setSubscribers] = useState<
    Record<string, { initialCount: number; refCount: number }>
  >({});

  const subscribe = useCallback((contractId: string, initialCount: number) => {
    setSubscribers((prev) => {
      const existing = prev[contractId] || { initialCount, refCount: 0 };
      return {
        ...prev,
        [contractId]: {
          initialCount: existing.initialCount,
          refCount: existing.refCount + 1,
        },
      };
    });

    setEventCounts((prev) => {
      if (prev[contractId] !== undefined) return prev;
      return {
        ...prev,
        [contractId]: initialCount,
      };
    });

    return () => {
      setSubscribers((prev) => {
        const existing = prev[contractId];
        if (!existing) return prev;
        const nextRefCount = existing.refCount - 1;
        if (nextRefCount <= 0) {
          const copy = { ...prev };
          delete copy[contractId];
          return copy;
        }
        return {
          ...prev,
          [contractId]: {
            ...existing,
            refCount: nextRefCount,
          },
        };
      });
    };
  }, []);

  const handleNewEvent = useCallback((contractId: string) => {
    setEventCounts((prev) => ({
      ...prev,
      [contractId]: (prev[contractId] ?? 0) + 1,
    }));
  }, []);

  return (
    <EventStreamContext.Provider value={{ eventCounts, subscribe }}>
      {children}
      {Object.keys(subscribers).map((contractId) => (
        <ContractEventSubscriber
          key={contractId}
          contractId={contractId}
          onNewEvent={() => handleNewEvent(contractId)}
        />
      ))}
    </EventStreamContext.Provider>
  );
}
