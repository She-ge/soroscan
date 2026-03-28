'use client';

import React from 'react';
import { WebhookTesterProvider } from './context';
import { WebhookSelector } from './components/WebhookSelector';
import { PayloadEditor } from './components/PayloadEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { HistoryPanel } from './components/HistoryPanel';

export default function WebhookTesterPage() {
  return (
    <WebhookTesterProvider>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        {/* Sidebar: webhook selector */}
        <div className="w-64 flex-shrink-0">
          <WebhookSelector />
        </div>

        {/* Main: editor + response stacked, history drawer at bottom */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Top half: payload editor */}
          <div className="h-1/2 border-b border-zinc-800 overflow-hidden">
            <PayloadEditor />
          </div>

          {/* Bottom half: response viewer */}
          <div className="h-1/2 overflow-hidden">
            <ResponseViewer />
          </div>

          {/* History drawer (absolute, overlays bottom) */}
          <HistoryPanel />
        </div>
      </div>
    </WebhookTesterProvider>
  );
}
