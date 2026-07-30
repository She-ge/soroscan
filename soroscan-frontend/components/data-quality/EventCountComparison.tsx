'use client';

import * as React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { EventCountPoint } from './types';

export interface EventCountComparisonProps {
  data: EventCountPoint[];
  className?: string;
}

export function EventCountComparison({ data, className }: EventCountComparisonProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm font-mono text-gray-500 border border-green-900 rounded-lg bg-gray-950"
        data-testid="event-count-chart-empty">
        No event count data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    Expected: d.expected,
    Actual: d.actual,
  }));

  return (
    <div className={cn('space-y-2', className)} data-testid="event-count-comparison"
      aria-label="Expected vs actual event counts">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#14532d" opacity={0.4} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
            tickLine={false} axisLine={{ stroke: '#14532d' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
            tickLine={false} axisLine={{ stroke: '#14532d' }} />
          <Tooltip contentStyle={{ background: '#030712', border: '1px solid #166534',
            borderRadius: 4, fontFamily: 'monospace', fontSize: 11, color: '#4ade80' }} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', color: '#6b7280' }} />
          <Bar dataKey="Expected" fill="#166534" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Actual" fill="#4ade80" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
