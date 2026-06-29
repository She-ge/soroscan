'use client';

import React from 'react';
import { validatePayload, type PayloadSchema } from '../schemas';

interface SchemaValidatorProps {
  payload: string;
  schema?: PayloadSchema;
  onValidationChange?: (valid: boolean, errors: string[]) => void;
}

export function SchemaValidator({ payload, schema, onValidationChange }: SchemaValidatorProps) {
  const validation = React.useMemo(() => {
    return validatePayload(payload, schema);
  }, [payload, schema]);

  React.useEffect(() => {
    onValidationChange?.(validation.valid, validation.errors);
  }, [validation, onValidationChange]);

  if (!schema) {
    return null;
  }

  return (
    <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
      <div className="flex items-start gap-2">
        {validation.valid ? (
          <>
            <svg
              className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-400">
                Valid {schema.name} payload
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                All required fields present and types match
              </p>
            </div>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-400">
                {validation.errors.length} validation error{validation.errors.length !== 1 ? 's' : ''}
              </p>
              <ul className="mt-1 space-y-0.5">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-zinc-400">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
