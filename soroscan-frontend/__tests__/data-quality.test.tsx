/**
 * Tests for Data Quality Dashboard (#918).
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('recharts', () => {
  const React = require('react');
  return {
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null, XAxis: () => null, YAxis: () => null,
    CartesianGrid: () => null, Tooltip: () => null, Legend: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

import { DataQualityScorecard } from '@/components/data-quality/DataQualityScorecard';
import { LedgerSequenceGapViewer } from '@/components/data-quality/LedgerSequenceGapViewer';
import { EventCountComparison } from '@/components/data-quality/EventCountComparison';
import { ReconciliationHistory } from '@/components/data-quality/ReconciliationHistory';
import { ManualReconciliationForm } from '@/components/data-quality/ManualReconciliationForm';
import { GapFillPreview } from '@/components/data-quality/GapFillPreview';
import { DataQualityAnomalyAlert } from '@/components/data-quality/DataQualityAnomalyAlert';
import type {
  DataQualityMetrics, ReconciliationJob, EventCountPoint,
  GapFillPreviewItem, AnomalyAlert,
} from '@/components/data-quality/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONTRACT_A = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const CONTRACT_B = 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

const METRICS: DataQualityMetrics[] = [
  { contractId: CONTRACT_A, completenessPercent: 99.8, expectedEventCount: 5000,
    actualEventCount: 4990, gaps: [{ startSequence: 100, endSequence: 109, count: 10 }],
    lastReconciliation: { timestamp: new Date().toISOString(), status: 'success', eventsRecovered: 10 } },
  { contractId: CONTRACT_B, completenessPercent: 85.0, expectedEventCount: 2000,
    actualEventCount: 1700, gaps: [
      { startSequence: 200, endSequence: 249, count: 50 },
      { startSequence: 500, endSequence: 749, count: 250 },
    ],
    lastReconciliation: null },
];

const JOBS: ReconciliationJob[] = [
  { jobId: 'job-abc123', contractId: CONTRACT_A, status: 'success', startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(), eventsRecovered: 10, reason: 'Manual fill',
    progressPercent: 100, estimatedDurationSecs: 30, dateRangeStart: '2024-01-01', dateRangeEnd: '2024-01-31' },
  { jobId: 'job-def456', contractId: CONTRACT_B, status: 'running', startedAt: new Date().toISOString(),
    completedAt: null, eventsRecovered: 50, reason: 'Scheduled', progressPercent: 65,
    estimatedDurationSecs: 120, dateRangeStart: '2024-02-01', dateRangeEnd: '2024-02-28' },
];

const EVENT_COUNTS: EventCountPoint[] = [
  { date: '2024-01-01', expected: 100, actual: 98 },
  { date: '2024-01-02', expected: 120, actual: 80 },
  { date: '2024-01-03', expected: 110, actual: 110 },
];

const GAP_FILL_ITEMS: GapFillPreviewItem[] = Array.from({ length: 15 }, (_, i) => ({
  sequence: 100 + i, estimatedTimestamp: new Date().toISOString(), contractId: CONTRACT_A,
}));

const ANOMALIES: AnomalyAlert[] = [
  { id: 'anom-1', contractId: CONTRACT_A, detectedAt: new Date().toISOString(),
    dropPercent: 35.5, expectedCount: 1000, actualCount: 645 },
  { id: 'anom-2', contractId: CONTRACT_B, detectedAt: new Date().toISOString(),
    dropPercent: 22.0, expectedCount: 500, actualCount: 390 },
];

// ── DataQualityScorecard ──────────────────────────────────────────────────────

describe('DataQualityScorecard', () => {
  it('renders a row per contract', () => {
    render(<DataQualityScorecard metrics={METRICS} />);
    expect(screen.getByTestId(`scorecard-row-${CONTRACT_A}`)).toBeInTheDocument();
    expect(screen.getByTestId(`scorecard-row-${CONTRACT_B}`)).toBeInTheDocument();
  });

  it('shows completeness % for each contract', () => {
    render(<DataQualityScorecard metrics={METRICS} />);
    expect(screen.getByTestId(`completeness-pct-${CONTRACT_A}`)).toHaveTextContent('99.8%');
    expect(screen.getByTestId(`completeness-pct-${CONTRACT_B}`)).toHaveTextContent('85.0%');
  });

  it('high completeness shows green text', () => {
    render(<DataQualityScorecard metrics={METRICS} />);
    expect(screen.getByTestId(`completeness-pct-${CONTRACT_A}`)).toHaveClass('text-green-400');
  });

  it('low completeness shows red text', () => {
    render(<DataQualityScorecard metrics={METRICS} />);
    expect(screen.getByTestId(`completeness-pct-${CONTRACT_B}`)).toHaveClass('text-red-400');
  });

  it('calls onSelectContract when row clicked', () => {
    const onSelect = jest.fn();
    render(<DataQualityScorecard metrics={METRICS} onSelectContract={onSelect} />);
    fireEvent.click(screen.getByTestId(`scorecard-row-${CONTRACT_A}`));
    expect(onSelect).toHaveBeenCalledWith(CONTRACT_A);
  });

  it('renders loading state', () => {
    render(<DataQualityScorecard metrics={[]} isLoading />);
    expect(screen.getByTestId('scorecard-loading')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<DataQualityScorecard metrics={[]} />);
    expect(screen.getByTestId('scorecard-empty')).toBeInTheDocument();
  });

  it('shows gap count per contract', () => {
    render(<DataQualityScorecard metrics={METRICS} />);
    const rowB = screen.getByTestId(`scorecard-row-${CONTRACT_B}`);
    expect(rowB).toHaveTextContent('2 gaps');
  });

  it('progress bar has role=progressbar with correct value', () => {
    render(<DataQualityScorecard metrics={[METRICS[0]]} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '99.8');
  });
});

// ── LedgerSequenceGapViewer ───────────────────────────────────────────────────

describe('LedgerSequenceGapViewer', () => {
  it('shows no-gaps message when gaps array is empty', () => {
    render(<LedgerSequenceGapViewer gaps={[]} totalEvents={5000} />);
    expect(screen.getByTestId('gap-viewer-no-gaps')).toBeInTheDocument();
  });

  it('renders a row per gap', () => {
    render(<LedgerSequenceGapViewer gaps={METRICS[1].gaps} totalEvents={1700} />);
    expect(screen.getByTestId('gap-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('gap-row-1')).toBeInTheDocument();
  });

  it('shows gap summary counts', () => {
    render(<LedgerSequenceGapViewer gaps={METRICS[1].gaps} totalEvents={1700} />);
    expect(screen.getByTestId('ledger-gap-viewer')).toHaveTextContent('300');
  });

  it('renders page controls when gaps exceed page size', () => {
    const manyGaps = Array.from({ length: 60 }, (_, i) => ({
      startSequence: i * 10, endSequence: i * 10 + 5, count: 6,
    }));
    render(<LedgerSequenceGapViewer gaps={manyGaps} totalEvents={10000} />);
    expect(screen.getByTestId('gap-next-page')).toBeInTheDocument();
  });

  it('next page button advances visible rows', () => {
    const manyGaps = Array.from({ length: 60 }, (_, i) => ({
      startSequence: i * 10, endSequence: i * 10 + 5, count: 6,
    }));
    render(<LedgerSequenceGapViewer gaps={manyGaps} totalEvents={10000} />);
    fireEvent.click(screen.getByTestId('gap-next-page'));
    expect(screen.getByTestId('gap-row-50')).toBeInTheDocument();
  });

  it('prev page button is disabled on first page', () => {
    const manyGaps = Array.from({ length: 60 }, (_, i) => ({
      startSequence: i * 10, endSequence: i * 10 + 5, count: 6,
    }));
    render(<LedgerSequenceGapViewer gaps={manyGaps} totalEvents={10000} />);
    expect(screen.getByTestId('gap-prev-page')).toBeDisabled();
  });
});

// ── EventCountComparison ──────────────────────────────────────────────────────

describe('EventCountComparison', () => {
  it('renders chart container', () => {
    render(<EventCountComparison data={EVENT_COUNTS} />);
    expect(screen.getByTestId('event-count-comparison')).toBeInTheDocument();
  });

  it('renders bar chart', () => {
    render(<EventCountComparison data={EVENT_COUNTS} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<EventCountComparison data={[]} />);
    expect(screen.getByTestId('event-count-chart-empty')).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    render(<EventCountComparison data={EVENT_COUNTS} />);
    expect(screen.getByTestId('event-count-comparison')).toHaveAttribute(
      'aria-label', 'Expected vs actual event counts'
    );
  });
});

// ── ReconciliationHistory ─────────────────────────────────────────────────────

describe('ReconciliationHistory', () => {
  it('renders a row per job', () => {
    render(<ReconciliationHistory jobs={JOBS} />);
    expect(screen.getByTestId('reconciliation-job-job-abc123')).toBeInTheDocument();
    expect(screen.getByTestId('reconciliation-job-job-def456')).toBeInTheDocument();
  });

  it('shows status badge for each job', () => {
    render(<ReconciliationHistory jobs={JOBS} />);
    expect(screen.getByTestId('job-status-job-abc123')).toHaveTextContent('success');
    expect(screen.getByTestId('job-status-job-def456')).toHaveTextContent('running');
  });

  it('shows events recovered count', () => {
    render(<ReconciliationHistory jobs={JOBS} />);
    expect(screen.getByTestId('job-recovered-job-abc123')).toHaveTextContent('10');
  });

  it('shows progress percentage', () => {
    render(<ReconciliationHistory jobs={JOBS} />);
    expect(screen.getByTestId('job-progress-job-def456')).toHaveTextContent('65%');
  });

  it('progress bar has role=progressbar', () => {
    render(<ReconciliationHistory jobs={[JOBS[1]]} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65');
  });

  it('renders empty state', () => {
    render(<ReconciliationHistory jobs={[]} />);
    expect(screen.getByTestId('reconciliation-history-empty')).toBeInTheDocument();
  });
});

// ── ManualReconciliationForm ──────────────────────────────────────────────────

describe('ManualReconciliationForm', () => {
  const CONTRACT = CONTRACT_A;

  it('renders the form', () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn()} />);
    expect(screen.getByTestId('manual-reconciliation-form')).toBeInTheDocument();
  });

  it('shows error when start date missing', async () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn()} />);
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-error')).toHaveTextContent('Start date is required');
  });

  it('shows error when end date missing', async () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-error')).toHaveTextContent('End date is required');
  });

  it('shows error when start is after end', async () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-03-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-reason'), { target: { value: 'test' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-error')).toHaveTextContent('Start date must be before end date');
  });

  it('shows error when reason missing', async () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-31' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-error')).toHaveTextContent('Reason is required');
  });

  it('calls onSubmit with correct args when form is valid', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ jobId: 'j1', status: 'pending', estimatedDurationSecs: 60 });
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-31' } });
    fireEvent.change(screen.getByTestId('recon-reason'), { target: { value: 'Test run' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(onSubmit).toHaveBeenCalledWith(CONTRACT, { start: '2024-01-01', end: '2024-01-31' }, 'Test run');
  });

  it('shows job result after successful submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ jobId: 'j1', status: 'pending', estimatedDurationSecs: 60 });
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-31' } });
    fireEvent.change(screen.getByTestId('recon-reason'), { target: { value: 'Test run' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('reconciliation-job-started')).toBeInTheDocument();
    expect(screen.getByTestId('started-job-id')).toHaveTextContent('j1');
    expect(screen.getByTestId('started-job-duration')).toHaveTextContent('60s');
  });

  it('shows error on submit failure', async () => {
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={jest.fn().mockRejectedValue(new Error('API error'))} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-31' } });
    fireEvent.change(screen.getByTestId('recon-reason'), { target: { value: 'Test' } });
    await act(async () => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-error')).toHaveTextContent('API error');
  });

  it('submit button is disabled while submitting', async () => {
    let resolve!: (v: unknown) => void;
    const onSubmit = jest.fn(() => new Promise((r) => { resolve = r; }));
    render(<ManualReconciliationForm contractId={CONTRACT} onSubmit={onSubmit as never} />);
    fireEvent.change(screen.getByTestId('recon-start-date'), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByTestId('recon-end-date'), { target: { value: '2024-01-31' } });
    fireEvent.change(screen.getByTestId('recon-reason'), { target: { value: 'Test' } });
    act(() => { fireEvent.click(screen.getByTestId('recon-submit-button')); });
    expect(screen.getByTestId('recon-submit-button')).toBeDisabled();
    await act(async () => { resolve({ jobId: 'j', status: 'pending', estimatedDurationSecs: null }); });
  });
});

// ── GapFillPreview ────────────────────────────────────────────────────────────

describe('GapFillPreview', () => {
  it('renders a row per item', () => {
    render(<GapFillPreview items={GAP_FILL_ITEMS} />);
    expect(screen.getByTestId('gap-fill-preview')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^gap-fill-row-/)).toHaveLength(15);
  });

  it('shows item count', () => {
    render(<GapFillPreview items={GAP_FILL_ITEMS} />);
    expect(screen.getByTestId('gap-fill-preview')).toHaveTextContent('15');
  });

  it('shows export button when onExport provided', () => {
    render(<GapFillPreview items={GAP_FILL_ITEMS} onExport={jest.fn()} />);
    expect(screen.getByTestId('gap-fill-export-button')).toBeInTheDocument();
  });

  it('calls onExport when export clicked', () => {
    const onExport = jest.fn();
    render(<GapFillPreview items={GAP_FILL_ITEMS} onExport={onExport} />);
    fireEvent.click(screen.getByTestId('gap-fill-export-button'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no items', () => {
    render(<GapFillPreview items={[]} />);
    expect(screen.getByTestId('gap-fill-preview-empty')).toBeInTheDocument();
  });
});

// ── DataQualityAnomalyAlert ───────────────────────────────────────────────────

describe('DataQualityAnomalyAlert', () => {
  it('renders an alert for each anomaly', () => {
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    expect(screen.getByTestId('anomaly-alert-anom-1')).toBeInTheDocument();
    expect(screen.getByTestId('anomaly-alert-anom-2')).toBeInTheDocument();
  });

  it('alerts have role=alert', () => {
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('shows drop % in alert text', () => {
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    expect(screen.getByTestId('anomaly-alert-anom-1')).toHaveTextContent('35.5%');
  });

  it('shows expected and actual counts', () => {
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    const alert = screen.getByTestId('anomaly-alert-anom-1');
    expect(alert).toHaveTextContent('1,000');
    expect(alert).toHaveTextContent('645');
  });

  it('dismisses alert when dismiss button clicked', () => {
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    fireEvent.click(screen.getByTestId('dismiss-alert-anom-1'));
    expect(screen.queryByTestId('anomaly-alert-anom-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('anomaly-alert-anom-2')).toBeInTheDocument();
  });

  it('calls onDismiss callback when alert dismissed', () => {
    const onDismiss = jest.fn();
    render(<DataQualityAnomalyAlert alerts={ANOMALIES} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('dismiss-alert-anom-2'));
    expect(onDismiss).toHaveBeenCalledWith('anom-2');
  });

  it('renders nothing when all alerts are dismissed', () => {
    const { container } = render(<DataQualityAnomalyAlert alerts={ANOMALIES} />);
    fireEvent.click(screen.getByTestId('dismiss-alert-anom-1'));
    fireEvent.click(screen.getByTestId('dismiss-alert-anom-2'));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when alerts array is empty', () => {
    const { container } = render(<DataQualityAnomalyAlert alerts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
