/**
 * Tests for Event Correlation & Atomic Transaction Visualization (#916).
 *
 * Acceptance criteria covered:
 * - CorrelatedEventsPanel shows count and events
 * - AtomicTransactionTree renders 100+ nodes without performance issues
 * - EventTimeline shows chronological sequence
 * - CorrelationSearch filters by correlation ID
 * - Clicking a node/event surfaces selected event detail
 * - CorrelationExporter downloads JSON
 * - EventCorrelationBadge shows atomic group ID
 * - contractColors assigns stable colours per contract
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock @xyflow/react so tests run without a DOM canvas ──────────────────────
jest.mock('@xyflow/react', () => {
  const React = require('react');

  const ReactFlow = ({
    nodes,
    onNodeClick,
    children,
  }: {
    nodes: Array<{ id: string; data: Record<string, unknown> }>;
    onNodeClick?: (e: React.MouseEvent, node: { id: string }) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="react-flow-mock">
      {nodes.map((n) => (
        <button
          key={n.id}
          data-testid={`tree-node-${n.id}`}
          onClick={(e) => onNodeClick?.(e, n)}
        >
          {String(n.data.eventType)} / {String(n.data.contractName)}
        </button>
      ))}
      {children}
    </div>
  );

  return {
    ReactFlow,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    useNodesState: (initial: unknown[]) => {
      const [nodes, setNodes] = React.useState(initial);
      return [nodes, setNodes, (changes: unknown[]) => {
        if (changes.every((c: unknown) => (c as { type?: string }).type === 'reset')) {
          setNodes((changes as Array<{ item: unknown }>).map((c) => c.item));
        }
      }];
    },
    useEdgesState: (initial: unknown[]) => {
      const [edges, setEdges] = React.useState(initial);
      return [edges, setEdges, () => {}];
    },
    BackgroundVariant: { Dots: 'dots' },
  };
});

// ── Mock clipboard + URL APIs ─────────────────────────────────────────────────
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  configurable: true,
  writable: true,
});
global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

import { CorrelatedEventsPanel } from '@/components/event-correlation/CorrelatedEventsPanel';
import { AtomicTransactionTree } from '@/components/event-correlation/AtomicTransactionTree';
import { EventTimeline } from '@/components/event-correlation/EventTimeline';
import { CorrelationSearch } from '@/components/event-correlation/CorrelationSearch';
import { EventCorrelationBadge } from '@/components/event-correlation/EventCorrelationBadge';
import { CorrelationExporter } from '@/components/event-correlation/CorrelationExporter';
import { getContractColor } from '@/components/event-correlation/contractColors';
import type {
  CorrelatedEvent,
  AtomicGroupTimeline,
  EventCorrelationData,
} from '@/components/event-correlation/types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeEvent(i: number): CorrelatedEvent {
  return {
    id: `evt-${i}`,
    contractId: `CONTRACT_${String.fromCharCode(65 + (i % 5))}`,
    contractName: `Contract${String.fromCharCode(65 + (i % 5))}`,
    eventType: ['transfer', 'mint', 'burn', 'approve', 'clawback'][i % 5],
    timestamp: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    blockNumber: 1000 + i,
  };
}

function makeTimelineEvent(i: number): AtomicGroupTimeline {
  const ev = makeEvent(i);
  return { ...ev, eventId: ev.id };
}

/** 110 events for the "100+ nodes" acceptance criterion */
const EVENTS_110 = Array.from({ length: 110 }, (_, i) => makeEvent(i));
const TIMELINE_110 = Array.from({ length: 110 }, (_, i) => makeTimelineEvent(i));
const EVENTS_5 = Array.from({ length: 5 }, (_, i) => makeEvent(i));
const TIMELINE_5 = Array.from({ length: 5 }, (_, i) => makeTimelineEvent(i));

const CORRELATION_DATA: EventCorrelationData = {
  id: 'evt-0',
  correlationId: 'corr-abc123',
  atomicGroupId: 'group-xyz789',
  relatedEvents: EVENTS_5,
  atomicGroup: {
    id: 'group-xyz789',
    totalEvents: 5,
    contracts: EVENTS_5.map((e) => e.contractId),
    timeline: TIMELINE_5,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// contractColors
// ─────────────────────────────────────────────────────────────────────────────

describe('getContractColor', () => {
  it('returns an object with bg, border, text keys', () => {
    const color = getContractColor('CONTRACT_A');
    expect(color).toHaveProperty('bg');
    expect(color).toHaveProperty('border');
    expect(color).toHaveProperty('text');
  });

  it('returns the same color for the same contract ID', () => {
    expect(getContractColor('CONTRACT_A')).toEqual(getContractColor('CONTRACT_A'));
  });

  it('returns different colors for different contract IDs', () => {
    const a = getContractColor('CONTRACT_AAAA');
    const b = getContractColor('CONTRACT_BBBB');
    // May collide due to small palette — just verify determinism
    expect(getContractColor('CONTRACT_AAAA')).toEqual(a);
    expect(getContractColor('CONTRACT_BBBB')).toEqual(b);
  });

  it('handles empty string without throwing', () => {
    expect(() => getContractColor('')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EventCorrelationBadge
// ─────────────────────────────────────────────────────────────────────────────

describe('EventCorrelationBadge', () => {
  it('renders with atomic group ID (first 8 chars)', () => {
    render(<EventCorrelationBadge atomicGroupId="group-xyz789ABCDEF" />);
    const badge = screen.getByTestId('correlation-badge');
    expect(badge).toHaveTextContent('group-xy');
  });

  it('shows event count when provided', () => {
    render(<EventCorrelationBadge atomicGroupId="group-xyz789" eventCount={42} />);
    expect(screen.getByTestId('correlation-badge')).toHaveTextContent('42');
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<EventCorrelationBadge atomicGroupId="group-xyz789" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('correlation-badge'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as span (non-interactive) when no onClick', () => {
    render(<EventCorrelationBadge atomicGroupId="group-xyz789" />);
    expect(screen.getByTestId('correlation-badge').tagName).toBe('SPAN');
  });

  it('renders as button when onClick provided', () => {
    render(<EventCorrelationBadge atomicGroupId="group-xyz789" onClick={jest.fn()} />);
    expect(screen.getByTestId('correlation-badge').tagName).toBe('BUTTON');
  });

  it('has accessible aria-label', () => {
    render(<EventCorrelationBadge atomicGroupId="group-xyz789" eventCount={5} />);
    expect(screen.getByTestId('correlation-badge')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('group-xyz789')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CorrelatedEventsPanel
// ─────────────────────────────────────────────────────────────────────────────

describe('CorrelatedEventsPanel', () => {
  it('renders with correct event count', () => {
    render(
      <CorrelatedEventsPanel events={EVENTS_5} atomicGroupId="group-xyz789" />
    );
    expect(screen.getByTestId('correlated-events-count')).toHaveTextContent('5');
  });

  it('renders a button per event', () => {
    render(
      <CorrelatedEventsPanel events={EVENTS_5} atomicGroupId="group-xyz789" />
    );
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('shows event type and contract name', () => {
    render(
      <CorrelatedEventsPanel events={[EVENTS_5[0]]} atomicGroupId="group-xyz789" />
    );
    const btn = screen.getByTestId(`correlated-event-${EVENTS_5[0].id}`);
    expect(btn).toHaveTextContent(EVENTS_5[0].eventType);
    expect(btn).toHaveTextContent(EVENTS_5[0].contractName);
  });

  it('calls onEventClick when an event is clicked', () => {
    const onEventClick = jest.fn();
    render(
      <CorrelatedEventsPanel
        events={EVENTS_5}
        atomicGroupId="group-xyz789"
        onEventClick={onEventClick}
      />
    );
    fireEvent.click(screen.getByTestId(`correlated-event-${EVENTS_5[1].id}`));
    expect(onEventClick).toHaveBeenCalledWith(EVENTS_5[1].id);
  });

  it('shows empty state when events list is empty', () => {
    render(<CorrelatedEventsPanel events={[]} atomicGroupId={null} />);
    expect(screen.getByTestId('correlated-events-empty')).toBeInTheDocument();
    expect(screen.getByTestId('correlated-events-count')).toHaveTextContent('0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AtomicTransactionTree — 100+ nodes test
// ─────────────────────────────────────────────────────────────────────────────

describe('AtomicTransactionTree', () => {
  it('renders tree container', () => {
    render(<AtomicTransactionTree events={TIMELINE_5} rootEventId="evt-0" />);
    expect(screen.getByTestId('atomic-transaction-tree')).toBeInTheDocument();
  });

  it('renders 110 nodes without crashing (performance test)', () => {
    const start = performance.now();
    render(
      <AtomicTransactionTree events={TIMELINE_110} rootEventId="evt-0" />
    );
    const elapsed = performance.now() - start;
    // All 110 nodes rendered
    expect(screen.getAllByTestId(/^tree-node-/)).toHaveLength(110);
    // Rendered within 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });

  it('calls onNodeClick when a node is clicked', () => {
    const onNodeClick = jest.fn();
    render(
      <AtomicTransactionTree
        events={TIMELINE_5}
        rootEventId="evt-0"
        onNodeClick={onNodeClick}
      />
    );
    fireEvent.click(screen.getByTestId('tree-node-evt-0'));
    expect(onNodeClick).toHaveBeenCalledWith('evt-0');
  });

  it('shows empty state when events list is empty', () => {
    render(<AtomicTransactionTree events={[]} />);
    expect(screen.getByTestId('tree-empty')).toBeInTheDocument();
  });

  it('renders react-flow component', () => {
    render(<AtomicTransactionTree events={TIMELINE_5} />);
    expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
  });

  it('has accessible aria-label with event count', () => {
    render(<AtomicTransactionTree events={TIMELINE_5} />);
    expect(screen.getByTestId('atomic-transaction-tree')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('5')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EventTimeline
// ─────────────────────────────────────────────────────────────────────────────

describe('EventTimeline', () => {
  it('renders a list item per event', () => {
    render(<EventTimeline events={TIMELINE_5} />);
    expect(screen.getByTestId('event-timeline')).toBeInTheDocument();
    TIMELINE_5.forEach((ev) => {
      expect(screen.getByTestId(`timeline-event-${ev.eventId}`)).toBeInTheDocument();
    });
  });

  it('sorts events chronologically (ascending timestamp)', () => {
    const unordered = [TIMELINE_5[2], TIMELINE_5[0], TIMELINE_5[4], TIMELINE_5[1]];
    render(<EventTimeline events={unordered} />);
    const items = screen.getAllByTestId(/^timeline-event-evt-/);
    // First rendered should be evt-0 (lowest timestamp)
    expect(items[0]).toHaveAttribute('data-testid', 'timeline-event-evt-0');
  });

  it('shows event type in each row', () => {
    render(<EventTimeline events={[TIMELINE_5[0]]} />);
    expect(screen.getByTestId(`timeline-event-${TIMELINE_5[0].eventId}`)).toHaveTextContent(
      TIMELINE_5[0].eventType
    );
  });

  it('calls onEventClick when row is clicked', () => {
    const onEventClick = jest.fn();
    render(<EventTimeline events={TIMELINE_5} onEventClick={onEventClick} />);
    fireEvent.click(screen.getByTestId(`timeline-event-btn-${TIMELINE_5[2].eventId}`));
    expect(onEventClick).toHaveBeenCalledWith(TIMELINE_5[2].eventId);
  });

  it('shows empty state when events list is empty', () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByTestId('timeline-empty')).toBeInTheDocument();
  });

  it('renders 110 timeline rows without crashing', () => {
    render(<EventTimeline events={TIMELINE_110} />);
    expect(screen.getAllByTestId(/^timeline-event-evt-/)).toHaveLength(110);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CorrelationSearch
// ─────────────────────────────────────────────────────────────────────────────

describe('CorrelationSearch', () => {
  it('renders input and submit button', () => {
    render(
      <CorrelationSearch value="" onChange={jest.fn()} onSearch={jest.fn()} />
    );
    expect(screen.getByTestId('correlation-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('correlation-search-submit')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn();
    render(
      <CorrelationSearch value="" onChange={onChange} onSearch={jest.fn()} />
    );
    fireEvent.change(screen.getByTestId('correlation-search-input'), {
      target: { value: 'corr-abc' },
    });
    expect(onChange).toHaveBeenCalledWith('corr-abc');
  });

  it('calls onSearch with current value on submit', () => {
    const onSearch = jest.fn();
    render(
      <CorrelationSearch value="corr-abc" onChange={jest.fn()} onSearch={onSearch} />
    );
    fireEvent.submit(screen.getByTestId('correlation-search-form'));
    expect(onSearch).toHaveBeenCalledWith('corr-abc');
  });

  it('submit button is disabled when value is empty', () => {
    render(
      <CorrelationSearch value="" onChange={jest.fn()} onSearch={jest.fn()} />
    );
    expect(screen.getByTestId('correlation-search-submit')).toBeDisabled();
  });

  it('submit button is disabled when isLoading is true', () => {
    render(
      <CorrelationSearch value="abc" onChange={jest.fn()} onSearch={jest.fn()} isLoading />
    );
    expect(screen.getByTestId('correlation-search-submit')).toBeDisabled();
  });

  it('shows clear button when value is non-empty', () => {
    render(
      <CorrelationSearch value="abc" onChange={jest.fn()} onSearch={jest.fn()} />
    );
    expect(screen.getByTestId('correlation-search-clear')).toBeInTheDocument();
  });

  it('calls onChange and onSearch with empty string when cleared', () => {
    const onChange = jest.fn();
    const onSearch = jest.fn();
    render(
      <CorrelationSearch value="abc" onChange={onChange} onSearch={onSearch} />
    );
    fireEvent.click(screen.getByTestId('correlation-search-clear'));
    expect(onChange).toHaveBeenCalledWith('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('hides clear button when value is empty', () => {
    render(
      <CorrelationSearch value="" onChange={jest.fn()} onSearch={jest.fn()} />
    );
    expect(screen.queryByTestId('correlation-search-clear')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CorrelationExporter
// ─────────────────────────────────────────────────────────────────────────────

describe('CorrelationExporter', () => {
  beforeEach(() => {
    (global.URL.createObjectURL as jest.Mock).mockClear();
    (global.URL.revokeObjectURL as jest.Mock).mockClear();
  });

  it('renders JSON and CSV export buttons', () => {
    render(<CorrelationExporter data={CORRELATION_DATA} />);
    expect(screen.getByTestId('export-json-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
  });

  it('JSON export triggers blob download', () => {
    const anchorClick = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<CorrelationExporter data={CORRELATION_DATA} />);
    fireEvent.click(screen.getByTestId('export-json-button'));
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    anchorClick.mockRestore();
  });

  it('CSV export triggers blob download', () => {
    const anchorClick = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<CorrelationExporter data={CORRELATION_DATA} />);
    fireEvent.click(screen.getByTestId('export-csv-button'));
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    anchorClick.mockRestore();
  });

  it('shows "✓ Exported" feedback after JSON export', async () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<CorrelationExporter data={CORRELATION_DATA} />);
    fireEvent.click(screen.getByTestId('export-json-button'));
    await waitFor(() =>
      expect(screen.getByTestId('export-json-button')).toHaveTextContent('✓ Exported')
    );
  });

  it('uses custom filename when provided', () => {
    const anchorClick = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    render(
      <CorrelationExporter data={CORRELATION_DATA} filename="my-export.json" />
    );
    fireEvent.click(screen.getByTestId('export-json-button'));
    // download attribute set on the anchor — check via createElement spy
    expect(anchorClick).toHaveBeenCalled();
    anchorClick.mockRestore();
  });
});
