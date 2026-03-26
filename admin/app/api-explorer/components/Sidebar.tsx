'use client';

import React from 'react';
import { useApiExplorer } from './context';
import type { Endpoint, HttpMethod } from './types';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function Sidebar() {
  const { endpointGroups, selectedEndpoint, setSelectedEndpoint } = useApiExplorer();

  return (
    <div className="w-72 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-100">API Endpoints</h2>
        <p className="text-xs text-zinc-500 mt-1">Select an endpoint to test</p>
      </div>

      {/* Endpoint Groups */}
      <div className="flex-1 overflow-y-auto">
        {endpointGroups.map((group) => (
          <div key={group.name} className="border-b border-zinc-800">
            <div className="px-4 py-3 bg-zinc-800/50">
              <h3 className="text-sm font-medium text-zinc-300">{group.name}</h3>
            </div>
            <div className="py-1">
              {group.endpoints.map((endpoint) => (
                <EndpointItem
                  key={`${endpoint.method}-${endpoint.path}`}
                  endpoint={endpoint}
                  isSelected={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
                  onSelect={() => setSelectedEndpoint(endpoint)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EndpointItemProps {
  endpoint: Endpoint;
  isSelected: boolean;
  onSelect: () => void;
}

function EndpointItem({ endpoint, isSelected, onSelect }: EndpointItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full px-4 py-2 text-left hover:bg-zinc-800/50 transition-colors ${
        isSelected ? 'bg-zinc-800' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded border ${METHOD_COLORS[endpoint.method]}`}
        >
          {endpoint.method}
        </span>
        <span className={`text-sm font-mono truncate ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>
          {endpoint.path}
        </span>
      </div>
      {endpoint.summary && (
        <p className="text-xs text-zinc-500 mt-1 truncate">{endpoint.summary}</p>
      )}
    </button>
  );
}