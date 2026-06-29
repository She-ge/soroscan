'use client';

import React, { useState, useEffect } from 'react';
import { type PayloadSchema, type SchemaProperty } from '../schemas';

interface PayloadBuilderProps {
  schema: PayloadSchema;
  onPayloadChange: (payload: string) => void;
  initialPayload?: string;
}

interface FieldValue {
  [key: string]: any;
}

function FieldInput({
  name,
  property,
  value,
  onChange,
}: {
  name: string;
  property: SchemaProperty;
  value: any;
  onChange: (value: any) => void;
}) {
  const isRequired = property.required;

  const renderInput = () => {
    switch (property.type) {
      case 'string':
        if (property.format === 'date-time') {
          return (
            <input
              type="datetime-local"
              value={value ? new Date(value).toISOString().slice(0, 16) : ''}
              onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          );
        }
        if (property.enum) {
          return (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select...</option>
              {property.enum.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.example ? String(property.example) : ''}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={property.example ? String(property.example) : ''}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-zinc-400">
              {value ? 'true' : 'false'}
            </span>
          </label>
        );

      case 'object':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder={property.example ? JSON.stringify(property.example, null, 2) : '{}'}
            rows={4}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-mono text-zinc-300">
          {name}
        </label>
        {isRequired && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
            required
          </span>
        )}
        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">
          {property.type}
        </span>
      </div>
      {property.description && (
        <p className="text-xs text-zinc-500">{property.description}</p>
      )}
      {renderInput()}
    </div>
  );
}

export function PayloadBuilder({ schema, onPayloadChange, initialPayload }: PayloadBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldValues, setFieldValues] = useState<FieldValue>({});

  // Initialize with example or parse initial payload
  useEffect(() => {
    if (initialPayload) {
      try {
        const parsed = JSON.parse(initialPayload);
        setFieldValues(parsed);
      } catch {
        setFieldValues(schema.example);
      }
    } else {
      setFieldValues(schema.example);
    }
  }, [schema, initialPayload]);

  // Update payload when field values change
  useEffect(() => {
    const payload = JSON.stringify(fieldValues, null, 2);
    onPayloadChange(payload);
  }, [fieldValues, onPayloadChange]);

  const handleFieldChange = (name: string, value: any) => {
    setFieldValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedFieldChange = (parentName: string, childName: string, value: any) => {
    setFieldValues((prev) => ({
      ...prev,
      [parentName]: {
        ...(typeof prev[parentName] === 'object' ? prev[parentName] : {}),
        [childName]: value,
      },
    }));
  };

  const handleReset = () => {
    setFieldValues(schema.example);
  };

  const handleUseCurrentTime = () => {
    if ('timestamp' in schema.schema.properties) {
      handleFieldChange('timestamp', new Date().toISOString());
    }
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Builder
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 w-[36rem] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-[40rem] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Visual Payload Builder
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Build your payload using form fields
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

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(schema.schema.properties).map(([name, property]) => {
                // Handle nested objects specially
                if (property.type === 'object' && property.properties) {
                  return (
                    <div key={name} className="space-y-3 p-3 border border-zinc-800 rounded-lg bg-zinc-950/50">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                        <span className="text-sm font-mono text-blue-400">{name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">
                          object
                        </span>
                      </div>
                      {Object.entries(property.properties).map(([childName, childProperty]) => (
                        <FieldInput
                          key={childName}
                          name={childName}
                          property={childProperty}
                          value={fieldValues[name]?.[childName]}
                          onChange={(value) => handleNestedFieldChange(name, childName, value)}
                        />
                      ))}
                    </div>
                  );
                }

                return (
                  <FieldInput
                    key={name}
                    name={name}
                    property={{
                      ...property,
                      required: schema.schema.required.includes(name),
                    }}
                    value={fieldValues[name]}
                    onChange={(value) => handleFieldChange(name, value)}
                  />
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-xs font-medium"
              >
                Reset to Example
              </button>
              <div className="flex items-center gap-2">
                {schema.schema.properties.timestamp && (
                  <button
                    onClick={handleUseCurrentTime}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors text-xs font-medium"
                  >
                    Use Current Time
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-500 transition-colors text-xs font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
