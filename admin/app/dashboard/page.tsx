'use client';

import React, { useState } from 'react';
import { DashboardGrid } from '../components/DashboardGrid';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/PieChart';
import { Heatmap } from '../components/Heatmap';
import Card from '../components/Card';

// Placeholder metric content for IA mock (#910)
const metrics = [
  { title: 'Events Today', value: '1,284' },
  { title: 'Total Events', value: '98,432' },
  { title: 'Webhook Health', value: '97%' },
  { title: 'Active Contracts', value: '42' },
];

const timeSeriesData = [
  { name: 'Jan', transactions: 400, events: 240, contracts: 100 },
  { name: 'Feb', transactions: 300, events: 139, contracts: 120 },
  { name: 'Mar', transactions: 200, events: 980, contracts: 150 },
  { name: 'Apr', transactions: 278, events: 390, contracts: 180 },
  { name: 'May', transactions: 189, events: 480, contracts: 200 },
  { name: 'Jun', transactions: 239, events: 380, contracts: 220 },
];

const comparisonData = [
  { name: 'Contract A', calls: 4000, errors: 240 },
  { name: 'Contract B', calls: 3000, errors: 139 },
  { name: 'Contract C', calls: 2000, errors: 980 },
  { name: 'Contract D', calls: 2780, errors: 390 },
  { name: 'Contract E', calls: 1890, errors: 480 },
];

const breakdownData = [
  { name: 'Success', value: 400 },
  { name: 'Failed', value: 300 },
  { name: 'Pending', value: 100 },
  { name: 'Timeout', value: 50 },
];

const heatmapData = [
  { x: 'Mon', y: '00:00', value: 10 },
  { x: 'Mon', y: '06:00', value: 25 },
  { x: 'Mon', y: '12:00', value: 80 },
  { x: 'Mon', y: '18:00', value: 65 },
  { x: 'Tue', y: '00:00', value: 8 },
  { x: 'Tue', y: '06:00', value: 30 },
  { x: 'Tue', y: '12:00', value: 90 },
  { x: 'Tue', y: '18:00', value: 70 },
  { x: 'Wed', y: '00:00', value: 12 },
  { x: 'Wed', y: '06:00', value: 28 },
  { x: 'Wed', y: '12:00', value: 85 },
  { x: 'Wed', y: '18:00', value: 68 },
  { x: 'Thu', y: '00:00', value: 15 },
  { x: 'Thu', y: '06:00', value: 32 },
  { x: 'Thu', y: '12:00', value: 95 },
  { x: 'Thu', y: '18:00', value: 75 },
  { x: 'Fri', y: '00:00', value: 20 },
  { x: 'Fri', y: '06:00', value: 35 },
  { x: 'Fri', y: '12:00', value: 100 },
  { x: 'Fri', y: '18:00', value: 80 },
];

const placeholderLogs = [
  { time: '21:45', message: 'webhook timeout · retry scheduled' },
  { time: '21:40', message: 'rate limit soft · org_acme' },
  { time: '21:32', message: 'ingest lag recovered · region us-east' },
];

export default function DashboardPage() {
  const [selectedData, setSelectedData] = useState<string>('');

  const handleDrillDown = (data: unknown, chartType: string) => {
    setSelectedData(`${chartType}: ${JSON.stringify(data, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6" data-testid="admin-analytics-ia">
      {/* Header */}
      <header className="mb-6 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-mono text-zinc-100 uppercase tracking-wider mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-sm font-mono text-zinc-500">
          Metrics → charts → logs information architecture (#910)
        </p>
      </header>

      {/* Metrics band */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
        aria-label="Key metrics"
      >
        {metrics.map((metric) => (
          <Card key={metric.title} background="gray" variant="elevated">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
              [{metric.title}]
            </p>
            <p className="text-2xl font-mono text-zinc-900">{metric.value}</p>
          </Card>
        ))}
      </section>

      {selectedData && (
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xs font-mono text-zinc-400 uppercase">Selected Data</h3>
            <button
              onClick={() => setSelectedData('')}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
            >
              ✕ CLEAR
            </button>
          </div>
          <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">
            {selectedData}
          </pre>
        </div>
      )}

      {/* Charts band */}
      <section aria-label="Charts and visualizations" className="mb-6">
        <DashboardGrid columns={2}>
          <LineChart
            data={timeSeriesData}
            lines={[
              { dataKey: 'transactions', name: 'Transactions' },
              { dataKey: 'events', name: 'Events' },
              { dataKey: 'contracts', name: 'Contracts' },
            ]}
            title="Time Series Analysis"
            description="Monthly trends for transactions, events, and contracts"
            onPointClick={(data) => handleDrillDown(data, 'Line Chart')}
          />

          <BarChart
            data={comparisonData}
            bars={[
              { dataKey: 'calls', name: 'API Calls' },
              { dataKey: 'errors', name: 'Errors' },
            ]}
            title="Contract Comparison"
            description="API calls and errors by contract"
            onBarClick={(data) => handleDrillDown(data, 'Bar Chart')}
          />

          <PieChart
            data={breakdownData}
            title="Transaction Status"
            description="Distribution of transaction outcomes"
            onSliceClick={(data) => handleDrillDown(data, 'Pie Chart')}
          />

          <Heatmap
            data={heatmapData}
            title="Activity Heatmap"
            description="Contract activity by day and time"
            onCellClick={(data) => handleDrillDown(data, 'Heatmap')}
          />
        </DashboardGrid>
      </section>

      {/* Logs band */}
      <section aria-label="Activity logs" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" background="gray" variant="elevated" title="Recent Logs">
          <ul className="space-y-3">
            {placeholderLogs.map((log) => (
              <li key={log.time} className="text-xs font-mono text-zinc-700">
                <span className="text-zinc-500">[{log.time}]</span> {log.message}
              </li>
            ))}
          </ul>
        </Card>
        <Card background="gray" variant="elevated" title="System Status">
          <p className="text-xs font-mono text-zinc-700 mb-2">Database [ONLINE]</p>
          <p className="text-xs font-mono text-zinc-700">Redis [ONLINE]</p>
        </Card>
      </section>
    </div>
  );
}
