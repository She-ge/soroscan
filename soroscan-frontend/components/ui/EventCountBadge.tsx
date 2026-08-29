"use client";

import React, { useEffect } from "react";
import { useEventStream } from "@/context/EventStreamContext";

interface EventCountBadgeProps {
  contractId: string;
  initialCount: number;
  className?: string;
}

export function EventCountBadge({ contractId, initialCount, className = "" }: EventCountBadgeProps) {
  const { eventCounts, subscribe } = useEventStream();

  useEffect(() => {
    const unsubscribe = subscribe(contractId, initialCount);
    return () => {
      unsubscribe();
    };
  }, [contractId, initialCount, subscribe]);

  const currentCount = eventCounts[contractId] ?? initialCount;

  // Formatting: e.g. > 9999 -> "10k+"
  const formatCount = (count: number): string => {
    if (count > 9999) {
      return `${Math.floor(count / 1000)}k+`;
    }
    return count.toLocaleString();
  };

  return (
    <span
      data-testid={`event-count-badge-${contractId}`}
      className={[
        "inline-flex items-center justify-center px-2 py-0.5 rounded-full",
        "font-terminal-mono text-xs font-bold border transition-all duration-300",
        currentCount > 0
          ? "bg-terminal-green/10 text-terminal-green border-terminal-green/30"
          : "bg-terminal-gray/10 text-terminal-gray border-terminal-gray/30",
        className,
      ].join(" ")}
      title={`${currentCount.toLocaleString()} events`}
    >
      {formatCount(currentCount)}
    </span>
  );
}
