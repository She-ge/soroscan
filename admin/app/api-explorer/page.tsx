'use client';

import React from 'react';
import { ApiExplorerProvider } from './context';
import { Sidebar } from './components/Sidebar';
import { RequestBuilder } from './components/RequestBuilder';
import { ResponseViewer } from './components/ResponseViewer';
import { HistoryPanel } from './components/HistoryPanel';

export default function ApiExplorerPage() {
  return (
    <ApiExplorerProvider>
      <div className="flex h-screen bg-zinc-950">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Request Builder */}
          <div className="h-1/2 border-b border-zinc-800 overflow-hidden">
            <RequestBuilder />
          </div>
          
          {/* Response Viewer */}
          <div className="h-1/2 overflow-hidden">
            <ResponseViewer />
          </div>
          
          {/* History Panel */}
          <HistoryPanel />
        </div>
      </div>
    </ApiExplorerProvider>
  );
}