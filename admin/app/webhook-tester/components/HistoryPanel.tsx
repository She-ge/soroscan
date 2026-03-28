'use client';

import React, { useState } from 'react';
import { useWebhookTester } from '../context';
import type { HistoryEntry } from '../types';

function statusColor(entry: HistoryEntry) {
  if (entry.error) return 'text-red-400';
  if (entry.response && entry.response.status >= 200 && entry.response.status < 300)
    return 'text-green-400';
  if (entry.response) return 'text-orange-400';
  return 'text-zinc-400';
}

function statusLabel(entry: HistoryEntry) {
  if (entry.error) return 'ERR';
  if (entry.response) return String(entry.response.status);
  return '---';
}

export function HistoryPanel() {
  const { history, clearHistory, selectHistoryEntry } = useWebhookTester();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 transition-all duration-200 ${
        isOpen ? 'h-56' : 'h-9'
      }`}
    >
      {/* Toggle bar */}
      <div
        className="flex items-center justify-between px-4 h-9 cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            History
          </span>
          {history.length > 0 && (
            <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        {isOpen && history.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); clearHistory(); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Entries */}
      {isOpen && (
        <div className="overflow-y-auto h-[calc(100%-2.25rem)]">
          {history.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-600 font-mono">
              no history yet
            </div>
          ) : (
            history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => selectHistoryEntry(entry)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/60 transition-colors border-b border-zinc-800/40 text-left"
              >
                <span className={`font-mono text-xs font-semibold w-8 flex-shrink-0 ${statusColor(entry)}`}>
                  {statusLabel(entry)}
                </span>
                <span className="text-xs font-mono text-zinc-400 truncate flex-1">
                  {entry.targetUrl}
                </span>
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
                {entry.response && (
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {entry.response.time}ms
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
