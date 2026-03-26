'use client';

import React, { useState } from 'react';
import { useTimeline } from '../context';
import type { TimelineEvent } from '../types';
import { STATUS_COLORS, STATUS_ICONS } from '../types';

interface TimelineEventItemProps {
  event: TimelineEvent;
  index: number;
}

export function TimelineEventItem({ event, index }: TimelineEventItemProps) {
  const { selectedEvent, setSelectedEvent } = useTimeline();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isSelected = selectedEvent?.id === event.id;
  
  const handleClick = () => {
    setSelectedEvent(event);
    setIsExpanded(!isExpanded);
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <div className="relative">
      {/* Timeline connector line */}
      {index > 0 && (
        <div className="absolute left-4 top-0 w-0.5 h-4 bg-zinc-700" />
      )}
      
      {/* Event card */}
      <div className="group relative flex items-start gap-3 py-2 pl-2">
        {/* Status indicator dot */}
        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${STATUS_COLORS[event.status]}`}>
          {STATUS_ICONS[event.status]}
        </div>
        
        {/* Event content */}
        <div 
          className={`flex-1 min-w-0 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-zinc-800 border-zinc-600' 
              : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
          }`}
          onClick={handleClick}
        >
          {/* Event header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-200">
                {event.event_type}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[event.status]}`}>
                {event.status}
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
          
          {/* Transaction hash */}
          {event.tx_hash && (
            <div className="mt-2">
              <span className="text-xs text-zinc-500">TX: </span>
              <span className="text-xs font-mono text-zinc-400">
                {event.tx_hash.slice(0, 12)}...{event.tx_hash.slice(-8)}
              </span>
            </div>
          )}
          
          {/* Expanded event details */}
          {isSelected && event.payload && (
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="text-xs text-zinc-400 mb-2">Event Payload:</div>
              <pre className="text-xs font-mono bg-zinc-950 p-2 rounded overflow-x-auto text-zinc-300 max-h-48">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TimelineEventListProps {
  events: TimelineEvent[];
}

export function TimelineEventList({ events }: TimelineEventListProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-500 text-sm">
        No events in this group
      </div>
    );
  }
  
  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <TimelineEventItem 
          key={`${event.id}-${index}`} 
          event={event} 
          index={index} 
        />
      ))}
    </div>
  );
}