'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ConstructorArg } from './types';

export interface ConstructorArgsDecoderProps {
  args: ConstructorArg[];
  className?: string;
}

export function ConstructorArgsDecoder({ args, className }: ConstructorArgsDecoderProps) {
  if (args.length === 0) {
    return (
      <p
        className="text-sm text-gray-500 font-mono py-2"
        data-testid="constructor-args-empty"
      >
        No constructor arguments.
      </p>
    );
  }

  return (
    <div
      className={cn('rounded-md border border-gray-800 overflow-hidden', className)}
      data-testid="constructor-args-decoder"
    >
      <table className="w-full text-xs font-mono">
        <thead className="bg-gray-900">
          <tr className="text-gray-500">
            <th className="text-left px-4 py-2 font-normal">#</th>
            <th className="text-left px-4 py-2 font-normal">Name</th>
            <th className="text-left px-4 py-2 font-normal">Type</th>
            <th className="text-left px-4 py-2 font-normal">Value</th>
          </tr>
        </thead>
        <tbody>
          {args.map((arg, idx) => (
            <tr
              key={`${arg.name}-${idx}`}
              className="border-t border-gray-800 hover:bg-gray-900/50"
              data-testid={`constructor-arg-row-${idx}`}
            >
              <td className="px-4 py-2 text-gray-600">{idx}</td>
              <td className="px-4 py-2 text-green-400">{arg.name}</td>
              <td className="px-4 py-2 text-blue-400">{arg.type}</td>
              <td
                className="px-4 py-2 text-gray-300 break-all"
                data-testid={`constructor-arg-value-${idx}`}
              >
                {arg.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
