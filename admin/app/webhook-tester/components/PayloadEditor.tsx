'use client';

import React, { useRef } from 'react';
import { useWebhookTester } from '../context';
import { DEFAULT_PAYLOAD } from '../types';

// Minimal syntax highlighting for JSON in a textarea overlay approach
function highlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="text-blue-400">${match}</span>`;
          return `<span class="text-green-400">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="text-yellow-400">${match}</span>`;
        if (/null/.test(match)) return `<span class="text-zinc-500">${match}</span>`;
        return `<span class="text-orange-400">${match}</span>`;
      }
    );
}

export function PayloadEditor() {
  const {
    selectedWebhook,
    payload,
    setPayload,
    payloadError,
    isSending,
    sendTest,
  } = useWebhookTester();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = () => {
    try {
      setPayload(JSON.stringify(JSON.parse(payload), null, 2));
    } catch {
      // invalid JSON, leave as-is
    }
  };

  const handleReset = () => {
    setPayload(DEFAULT_PAYLOAD);
  };

  // Sync scroll between textarea and highlight overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const pre = e.currentTarget.previousElementSibling as HTMLElement | null;
    if (pre) {
      pre.scrollTop = e.currentTarget.scrollTop;
      pre.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Payload
          </span>
          {payloadError && (
            <span className="text-xs text-red-400 font-mono truncate max-w-xs">
              ✗ {payloadError}
            </span>
          )}
          {!payloadError && payload.trim() && (
            <span className="text-xs text-green-400">✓ valid JSON</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Format
          </button>
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Terminal-style editor */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950 font-mono text-sm">
        {/* Syntax-highlighted backdrop */}
        <pre
          aria-hidden="true"
          className="absolute inset-0 p-4 overflow-auto pointer-events-none whitespace-pre text-zinc-300 leading-6"
          dangerouslySetInnerHTML={{ __html: highlight(payload) }}
        />
        {/* Actual editable textarea (transparent text, caret visible) */}
        <textarea
          ref={textareaRef}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-zinc-200 resize-none outline-none leading-6 font-mono text-sm"
        />
      </div>

      {/* Send button */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-3">
        {selectedWebhook && (
          <div className="flex-1 min-w-0">
            <span className="text-xs text-zinc-500">Target: </span>
            <span className="text-xs font-mono text-zinc-300 truncate">{selectedWebhook.target_url}</span>
          </div>
        )}
        <button
          onClick={sendTest}
          disabled={!selectedWebhook || isSending || !!payloadError}
          className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium
            hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {isSending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Send Test
            </>
          )}
        </button>
      </div>
    </div>
  );
}
