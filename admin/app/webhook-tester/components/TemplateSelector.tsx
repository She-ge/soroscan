'use client';

import React, { useState } from 'react';
import { WEBHOOK_SCHEMAS, type PayloadSchema } from '../schemas';

interface TemplateSelectorProps {
  onSelectTemplate: (template: PayloadSchema) => void;
  currentEventType?: string;
}

export function TemplateSelector({ onSelectTemplate, currentEventType }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchemas = WEBHOOK_SCHEMAS.filter(
    (schema) =>
      schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (schema: PayloadSchema) => {
    onSelectTemplate(schema);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs font-medium"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        Templates
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-zinc-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Template list */}
            <div className="max-h-96 overflow-y-auto">
              {filteredSchemas.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No templates found
                </div>
              ) : (
                filteredSchemas.map((schema) => (
                  <button
                    key={schema.eventType}
                    onClick={() => handleSelect(schema)}
                    className={`w-full text-left p-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                      currentEventType === schema.eventType ? 'bg-zinc-800/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200">
                            {schema.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                            {schema.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {schema.description}
                        </p>
                      </div>
                      {currentEventType === schema.eventType && (
                        <svg
                          className="w-4 h-4 text-green-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-xs text-zinc-500 text-center">
                {filteredSchemas.length} template{filteredSchemas.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
