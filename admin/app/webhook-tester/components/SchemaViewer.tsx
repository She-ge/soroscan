'use client';

import React, { useState } from 'react';
import { type PayloadSchema, type SchemaProperty } from '../schemas';

interface SchemaViewerProps {
  schema: PayloadSchema;
}

function PropertyRow({ name, property, level = 0 }: { name: string; property: SchemaProperty; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = property.type === 'object' && property.properties;

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <div
        className={`flex items-start gap-3 p-2 hover:bg-zinc-800/50 transition-colors ${
          hasChildren ? 'cursor-pointer' : ''
        }`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      >
        {hasChildren && (
          <svg
            className={`w-3 h-3 text-zinc-500 flex-shrink-0 mt-1 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {!hasChildren && <div className="w-3 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-blue-400">{name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              {property.type}
            </span>
            {property.required && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                required
              </span>
            )}
            {property.format && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                {property.format}
              </span>
            )}
          </div>
          {property.description && (
            <p className="text-xs text-zinc-400 mt-1">{property.description}</p>
          )}
          {property.example !== undefined && (
            <div className="mt-1">
              <span className="text-xs text-zinc-500">Example: </span>
              <code className="text-xs text-green-400 font-mono">
                {JSON.stringify(property.example)}
              </code>
            </div>
          )}
          {property.enum && (
            <div className="mt-1">
              <span className="text-xs text-zinc-500">Values: </span>
              <code className="text-xs text-amber-400 font-mono">
                {property.enum.join(' | ')}
              </code>
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && property.properties && (
        <div className="bg-zinc-900/30">
          {Object.entries(property.properties).map(([childName, childProp]) => (
            <PropertyRow
              key={childName}
              name={childName}
              property={childProp}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaViewer({ schema }: SchemaViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Schema
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 w-[32rem] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-[32rem] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    {schema.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {schema.description}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Properties */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(schema.schema.properties).map(([name, property]) => (
                <PropertyRow
                  key={name}
                  name={name}
                  property={{
                    ...property,
                    required: schema.schema.required.includes(name),
                  }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {Object.keys(schema.schema.properties).length} properties
                </span>
                <span className="text-zinc-500">
                  {schema.schema.required.length} required
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
