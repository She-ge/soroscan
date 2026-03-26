'use client';

import React from 'react';
import { useApiExplorer } from './context';
import type { HistoryEntry, HttpMethod } from './types';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-orange-400',
  DELETE: 'text-red-400',
};

export function HistoryPanel() {
  const { history, clearHistory, setMethod, setUrl, setHeaders, setQueryParams, setRequestBody } = useApiExplorer();

  const handleSelectHistory = (entry: HistoryEntry) => {
    setMethod(entry.request.method);
    setUrl(entry.request.url);
    setHeaders(entry.request.headers);
    setQueryParams(entry.request.queryParams);
    if (entry.request.body) {
      setRequestBody(entry.request.body);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-red-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-amber-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  if (history.length === 0) {
    return (
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-300">History</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-xs text-zinc-500">No requests yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-300">History ({history.length})</h3>
        <button
          onClick={clearHistory}
          className="text-xs px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => handleSelectHistory(entry)}
            className="w-full p-2 text-left hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${METHOD_COLORS[entry.request.method]}`}>
                {entry.request.method}
              </span>
              <span className="text-xs text-zinc-400 truncate flex-1">
                {entry.request.url}
              </span>
              {entry.response ? (
                <span className={`text-xs ${getStatusColor(entry.response.status)}`}>
                  {entry.response.status}
                </span>
              ) : (
                <span className="text-xs text-red-400">Error</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500">{formatDate(entry.timestamp)}</span>
              {entry.response && (
                <span className="text-xs text-zinc-500">{entry.response.time}ms</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}