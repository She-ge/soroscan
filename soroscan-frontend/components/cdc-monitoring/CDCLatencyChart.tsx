'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { LatencyDataPoint } from './types';

export interface CDCLatencyChartProps {
  data: LatencyDataPoint[];
  targetLatencyMs?: number;
  className?: string;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

export function CDCLatencyChart({
  data,
  targetLatencyMs = 5000,
  className,
}: CDCLatencyChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-40 text-sm font-mono text-gray-500 border border-green-900 rounded-lg bg-gray-950"
        data-testid="latency-chart-empty"
      >
        No latency data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    latencyMs: d.latencyMs,
  }));

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="cdc-latency-chart"
      aria-label="CDC sync latency over time"
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
        <span>Latency (ms)</span>
        <span className="text-yellow-500">— target: {targetLatencyMs.toLocaleString()} ms</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#14532d" opacity={0.4} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#14532d' }}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#14532d' }}
          />
          <Tooltip
            contentStyle={{
              background: '#030712',
              border: '1px solid #166534',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#4ade80',
            }}
            formatter={(v: number) => [`${v.toLocaleString()} ms`, 'Latency']}
          />
          <ReferenceLine
            y={targetLatencyMs}
            stroke="#ca8a04"
            strokeDasharray="4 2"
            label={{ value: 'target', fill: '#ca8a04', fontSize: 10, fontFamily: 'monospace' }}
          />
          <Line
            type="monotone"
            dataKey="latencyMs"
            stroke="#4ade80"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#4ade80' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
