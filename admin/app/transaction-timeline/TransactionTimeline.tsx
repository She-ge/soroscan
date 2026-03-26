'use client';

import React from 'react';
import { useTimeline } from './context';
import { ZOOM_LEVELS, STATUS_COLORS } from './types';
import type { EventStatus } from './types';
import { TimelineGroupList } from './components/TimelineGroup';

export function TransactionTimeline() {
  const {
    timeline,
    isLoading,
    error,
    contractId,
    setContractId,
    zoomLevel,
    setZoomLevel,
    filters,
    setEventTypes,
    setStatuses,
    setSearchQuery,
    expandAll,
    collapseAll,
    availableEventTypes,
    refreshTimeline,
  } = useTimeline();
  
  // Handle event type toggle
  const handleEventTypeToggle = (type: string) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter(t => t !== type)
      : [...filters.eventTypes, type];
    setEventTypes(newTypes);
  };
  
  // Handle status toggle
  const handleStatusToggle = (status: EventStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setStatuses(newStatuses);
  };
  
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">Transaction Timeline</h2>
          
          {/* Contract ID input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={contractId || ''}
              onChange={(e) => setContractId(e.target.value || null)}
              placeholder="Enter contract ID"
              className="w-80 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500"
            />
            <button
              onClick={() => refreshTimeline()}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Zoom:</span>
          <div className="flex gap-1">
            {ZOOM_LEVELS.map((level) => (
              <button
                key={level.label}
                onClick={() => setZoomLevel(level)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  zoomLevel.label === level.label
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Filters bar */}
      <div className="flex items-center gap-6 p-3 border-b border-zinc-800 bg-zinc-900/30">
        {/* Search */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-48 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100 placeholder-zinc-500"
          />
        </div>
        
        {/* Status filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Status:</span>
          {(['success', 'pending', 'error'] as EventStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                filters.statuses.includes(status)
                  ? STATUS_COLORS[status]
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        {/* Event type filters */}
        {availableEventTypes.length > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-zinc-500">Events:</span>
            <div className="flex flex-wrap gap-1">
              {availableEventTypes.slice(0, 8).map((type) => (
                <button
                  key={type}
                  onClick={() => handleEventTypeToggle(type)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.eventTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Expand/Collapse all */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={expandAll}
            className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>
      
      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-zinc-400">Loading timeline...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-red-400">Error</h4>
            <p className="mt-2 text-sm text-zinc-300">{error}</p>
          </div>
        )}
        
        {!isLoading && !error && timeline && (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-6 mb-4 p-3 bg-zinc-900/50 rounded-lg">
              <div>
                <span className="text-xs text-zinc-500">Total Events</span>
                <p className="text-lg font-semibold text-zinc-200">{timeline.total_events}</p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Time Range</span>
                <p className="text-sm text-zinc-300">
                  {new Date(timeline.since).toLocaleDateString()} - {new Date(timeline.until).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-zinc-500">Groups</span>
                <p className="text-sm text-zinc-300">{timeline.groups.length}</p>
              </div>
            </div>
            
            {/* Groups */}
            <TimelineGroupList groups={timeline.groups} />
          </>
        )}
        
        {!isLoading && !error && !timeline && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-zinc-400">Enter a contract ID to view its timeline</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}