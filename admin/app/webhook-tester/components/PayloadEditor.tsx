'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWebhookTester } from '../context';
import { DEFAULT_PAYLOAD } from '../types';
import { TemplateSelector } from './TemplateSelector';
import { SchemaValidator } from './SchemaValidator';
import { SchemaViewer } from './SchemaViewer';
import { PayloadBuilder } from './PayloadBuilder';
import { getSchemaByEventType, type PayloadSchema } from '../schemas';

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
    retryLastRequest,
  } = useWebhookTester();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedSchema, setSelectedSchema] = useState<PayloadSchema | undefined>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(true);

  // Auto-detect schema from payload
  useEffect(() => {
    try {
      const parsed = JSON.parse(payload);
      if (parsed.event_type) {
        const schema = getSchemaByEventType(parsed.event_type);
        setSelectedSchema(schema);
      }
    } catch {
      // Invalid JSON, ignore
    }
  }, [payload]);

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

  const handleTemplateSelect = (template: PayloadSchema) => {
    setPayload(JSON.stringify(template.example, null, 2));
    setSelectedSchema(template);
  };

  const handleValidationChange = (valid: boolean, errors: string[]) => {
    setValidationErrors(errors);
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
            Payload Editor
          </span>
          {selectedSchema && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
              {selectedSchema.eventType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TemplateSelector
            onSelectTemplate={handleTemplateSelect}
            currentEventType={selectedSchema?.eventType}
          />
          {selectedSchema && (
            <>
              <SchemaViewer schema={selectedSchema} />
              <PayloadBuilder
                schema={selectedSchema}
                onPayloadChange={setPayload}
                initialPayload={payload}
              />
            </>
          )}
          <div className="w-px h-4 bg-zinc-700" />
          <button
            onClick={handleFormat}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Format JSON"
          >
            Format
          </button>
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Reset to default"
          >
            Reset
          </button>
          <button
            onClick={() => setShowValidation(!showValidation)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showValidation
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            title="Toggle validation"
          >
            {showValidation ? '✓' : '○'} Validate
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {payloadError && (
            <span className="text-xs text-red-400 font-mono flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {payloadError}
            </span>
          )}
          {!payloadError && payload.trim() && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Valid JSON
            </span>
          )}
          {showValidation && selectedSchema && validationErrors.length === 0 && !payloadError && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Schema Valid
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500">
          {payload.length} characters • {payload.split('\n').length} lines
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

      {/* Schema validation panel */}
      {showValidation && selectedSchema && (
        <SchemaValidator
          payload={payload}
          schema={selectedSchema}
          onValidationChange={handleValidationChange}
        />
      )}

      {/* Send button */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-3">
        {selectedWebhook && (
          <div className="flex-1 min-w-0">
            <span className="text-xs text-zinc-500">Target: </span>
            <span className="text-xs font-mono text-zinc-300 truncate">{selectedWebhook.target_url}</span>
          </div>
        )}
        <button
          onClick={retryLastRequest}
          disabled={isSending}
          className="px-3 py-2 rounded bg-zinc-700 text-zinc-200 text-xs font-medium
            hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Retry last request with same payload"
        >
          ↻ Retry
        </button>
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
