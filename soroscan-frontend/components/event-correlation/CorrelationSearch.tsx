'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CorrelationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export function CorrelationSearch({
  value,
  onChange,
  onSearch,
  placeholder = 'Search by correlation ID or atomic group…',
  isLoading = false,
  className,
}: CorrelationSearchProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    onChange('');
    onSearch('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-center gap-2', className)}
      role="search"
      aria-label="Search correlated events"
      data-testid="correlation-search-form"
    >
      <div className="relative flex-1">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm"
          aria-hidden="true"
        >
          ⌕
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Correlation ID or atomic group ID"
          data-testid="correlation-search-input"
          className="w-full h-9 pl-8 pr-8 text-sm font-mono bg-gray-900 border border-green-900 rounded text-green-300 placeholder-gray-600 focus:outline-none focus:border-green-500"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            data-testid="correlation-search-clear"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        data-testid="correlation-search-submit"
        className="h-9 px-4 text-sm font-mono rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? '…' : 'Find'}
      </button>
    </form>
  );
}
