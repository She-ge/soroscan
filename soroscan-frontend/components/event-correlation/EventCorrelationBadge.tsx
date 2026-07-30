'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EventCorrelationBadgeProps {
  atomicGroupId: string;
  eventCount?: number;
  className?: string;
  onClick?: () => void;
}

export function EventCorrelationBadge({
  atomicGroupId,
  eventCount,
  className,
  onClick,
}: EventCorrelationBadgeProps) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={`Atomic group ${atomicGroupId}${eventCount != null ? `, ${eventCount} events` : ''}`}
      data-testid="correlation-badge"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold',
        'bg-green-900/40 text-green-400 border border-green-700',
        onClick && 'cursor-pointer hover:bg-green-900/60 transition-colors',
        className
      )}
    >
      <span aria-hidden="true">⚛</span>
      <span>Atomic group #{atomicGroupId.slice(0, 8)}</span>
      {eventCount != null && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-800/60 text-green-300 text-[10px]">
          {eventCount}
        </span>
      )}
    </Tag>
  );
}
