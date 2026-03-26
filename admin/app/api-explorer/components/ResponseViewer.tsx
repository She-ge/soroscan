'use client';

import React, { useState } from 'react';
import { useApiExplorer } from './context';

type TabType = 'body' | 'headers';

export function ResponseViewer() {
  const { response, error, isLoading } = useApiExplorer();
  const [activeTab, setActiveTab] = useState<TabType>('body');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400">Sending request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-red-400">Request Failed</h4>
          <p className="mt-2 text-sm text-zinc-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-zinc-400">Send a request to see the response</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-amber-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Status:</span>
          <span className={`text-sm font-medium ${getStatusColor(response.status)}`}>
            {response.status} {response.statusText}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Time:</span>
          <span className="text-sm text-zinc-300">{response.time}ms</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Size:</span>
          <span className="text-sm text-zinc-300">
            {typeof response.body === 'string'
              ? `${new Blob([response.body]).size} B`
              : `${JSON.stringify(response.body).length} B`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'body'
              ? 'border-blue-500 text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'headers'
              ? 'border-blue-500 text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Headers ({Object.keys(response.headers).length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'body' ? (
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
            {typeof response.body === 'string'
              ? response.body
              : JSON.stringify(response.body, null, 2)}
          </pre>
        ) : (
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-4">
                <span className="text-sm font-medium text-zinc-400 min-w-[200px]">{key}</span>
                <span className="text-sm text-zinc-300 font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}