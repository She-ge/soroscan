'use client';

import React from 'react';
import { useWebhookTester } from '../context';

export function WebhookSelector() {
  const { webhooks, isLoadingWebhooks, selectedWebhook, setSelectedWebhook, fetchWebhooks } =
    useWebhookTester();

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Webhooks
        </span>
        <button
          onClick={fetchWebhooks}
          disabled={isLoadingWebhooks}
          className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Refresh"
        >
          <svg
            className={`w-4 h-4 ${isLoadingWebhooks ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingWebhooks ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            No webhooks found
          </div>
        ) : (
          webhooks.map((wh) => {
            const isSelected = selectedWebhook?.id === wh.id;
            return (
              <button
                key={wh.id}
                onClick={() => setSelectedWebhook(wh)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 transition-colors ${
                  isSelected
                    ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                    : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      wh.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}
                  />
                  <span className="text-xs font-mono text-zinc-300 truncate">
                    #{wh.id}
                  </span>
                  {wh.event_type && (
                    <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                      {wh.event_type}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 truncate font-mono">
                  {wh.target_url}
                </div>
                <div className="text-xs text-zinc-600 truncate mt-0.5">
                  {wh.contract_id}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
