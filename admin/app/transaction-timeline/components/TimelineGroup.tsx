'use client';

import React from 'react';
import { useTimeline } from '../context';
import type { TimelineGroup as TimelineGroupType } from '../types';
import { TimelineEventList } from './TimelineEvent';

interface TimelineGroupProps {
  group: TimelineGroupType;
  index: number;
}

export function TimelineGroup({ group, index }: TimelineGroupProps) {
  const { expandedGroups, toggleGroup, zoomLevel } = useTimeline();
  
  const isExpanded = expandedGroups.has(index);
  
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Calculate the time range for this group
  const startTime = new Date(group.start);
  const endTime = new Date(group.end);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMin = Math.round(durationMs / 60000);
  
  // Get status summary
  const statusSummary = group.event_type_counts.reduce((acc, etc) => {
    acc[etc.event_type] = etc.count;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
      {/* Group header - clickable to expand/collapse */}
      <button
        onClick={() => toggleGroup(index)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse icon */}
          <div className={`w-6 h-6 flex items-center justify-center text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Date/Time and event count */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-200">
                {formatDateTime(group.start)}
              </span>
              <span className="text-xs text-zinc-500">
                ({durationMin} min)
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">
                {group.event_count} event{group.event_count !== 1 ? 's' : ''}
              </span>
              {Object.entries(statusSummary).map(([type, count]) => (
                <span 
                  key={type}
                  className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chevron indicator */}
        <div className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Expandable content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
          {/* Event list */}
          <TimelineEventList events={group.events} />
        </div>
      </div>
    </div>
  );
}

interface TimelineGroupListProps {
  groups: TimelineGroupType[];
}

export function TimelineGroupList({ groups }: TimelineGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-zinc-400">No events found</p>
        <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or time range</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {groups.map((group, index) => (
        <TimelineGroup 
          key={`${group.start}-${index}`} 
          group={group} 
          index={index} 
        />
      ))}
    </div>
  );
}