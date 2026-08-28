import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  Skeleton,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonText,
} from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with the expected accessibility attributes', () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
  });

  it('uses the rectangle and shimmer variants by default', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md', 'animate-shimmer');
  });

  it('supports pulse animation', () => {
    render(<Skeleton data-testid="skeleton" animation="pulse" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
  });

  it('supports disabling animation', () => {
    render(<Skeleton data-testid="skeleton" animation="none" />);

    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).not.toHaveClass('animate-pulse');
    expect(skeleton).not.toHaveClass('animate-shimmer');
  });

  it('supports circle and text variants', () => {
    const { rerender } = render(<Skeleton data-testid="skeleton" variant="circle" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full');

    rerender(<Skeleton data-testid="skeleton" variant="text" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('h-4', 'w-full', 'rounded');
  });

  it('converts numeric dimensions to pixels', () => {
    render(<Skeleton data-testid="skeleton" width={120} height={80} />);

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      width: '120px',
      height: '80px',
    });
  });

  it('uses string dimensions without changing them', () => {
    render(<Skeleton data-testid="skeleton" width="50%" height="2rem" />);

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      width: '50%',
      height: '2rem',
    });
  });

  it('supports named animation speeds', () => {
    const { rerender } = render(
      <Skeleton data-testid="skeleton" animation="pulse" animationSpeed="fast" />,
    );

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      animationDuration: '700ms',
    });

    rerender(<Skeleton data-testid="skeleton" animation="pulse" animationSpeed="slow" />);

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      animationDuration: '2.5s',
    });
  });

  it('supports numeric and custom animation speeds', () => {
    const { rerender } = render(<Skeleton data-testid="skeleton" animationSpeed={900} />);

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      animationDuration: '900ms',
    });

    rerender(<Skeleton data-testid="skeleton" animationSpeed="1.2s" />);

    expect(screen.getByTestId('skeleton')).toHaveStyle({
      animationDuration: '1.2s',
    });
  });

  it('forwards its ref', () => {
    const ref = React.createRef<HTMLDivElement>();

    render(<Skeleton ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('SkeletonText', () => {
  it('renders the configured number of pulsing lines', () => {
    render(<SkeletonText data-testid="skeleton-text" lines={3} />);

    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('[data-slot="skeleton-text-line"]');

    expect(lines).toHaveLength(3);

    lines.forEach((line) => {
      expect(line).toHaveClass('animate-pulse');
    });
  });

  it('supports custom container and line dimensions', () => {
    render(
      <SkeletonText
        data-testid="skeleton-text"
        lines={2}
        width={320}
        lineHeight={18}
        gap={12}
        lineWidths={['100%', '45%']}
      />,
    );

    const container = screen.getByTestId('skeleton-text');
    const lines = container.querySelectorAll('[data-slot="skeleton-text-line"]');

    expect(container).toHaveStyle({
      width: '320px',
      gap: '12px',
    });

    expect(lines[0]).toHaveStyle({
      width: '100%',
      height: '18px',
    });

    expect(lines[1]).toHaveStyle({
      width: '45%',
      height: '18px',
    });
  });
});

describe('SkeletonCard', () => {
  it('renders stacked card placeholders', () => {
    render(<SkeletonCard data-testid="skeleton-card" lines={2} showAvatar />);

    const card = screen.getByTestId('skeleton-card');

    expect(card).toBeInTheDocument();
    expect(card.querySelector('[data-slot="skeleton-card-media"]')).toBeInTheDocument();
    expect(card.querySelector('[data-slot="skeleton-card-avatar"]')).toBeInTheDocument();
    expect(card.querySelector('[data-slot="skeleton-card-title"]')).toBeInTheDocument();
    expect(card.querySelectorAll('[data-slot="skeleton-text-line"]')).toHaveLength(2);
  });

  it('supports configurable card dimensions', () => {
    render(
      <SkeletonCard data-testid="skeleton-card" width={420} height="24rem" showMedia={false} />,
    );

    expect(screen.getByTestId('skeleton-card')).toHaveStyle({
      width: '420px',
      height: '24rem',
    });
  });
});

describe('SkeletonTable', () => {
  it('renders the configured rows and columns', () => {
    render(<SkeletonTable data-testid="skeleton-table" rows={4} columns={3} />);

    const table = screen.getByTestId('skeleton-table');

    expect(table.querySelectorAll('[data-slot="skeleton-table-header-cell"]')).toHaveLength(3);

    expect(table.querySelectorAll('[data-slot="skeleton-table-row"]')).toHaveLength(4);

    expect(table.querySelectorAll('[data-slot="skeleton-table-cell"]')).toHaveLength(12);
  });

  it('can render without a header', () => {
    render(<SkeletonTable data-testid="skeleton-table" showHeader={false} />);

    expect(
      screen.getByTestId('skeleton-table').querySelector('[data-slot="skeleton-table-header"]'),
    ).not.toBeInTheDocument();
  });

  it('supports configurable table dimensions and speed', () => {
    render(
      <SkeletonTable data-testid="skeleton-table" width="80%" height={360} animationSpeed="fast" />,
    );

    const table = screen.getByTestId('skeleton-table');
    const firstCell = table.querySelector('[data-slot="skeleton-table-cell"]');

    expect(table).toHaveStyle({
      width: '80%',
      height: '360px',
    });

    expect(firstCell).toHaveStyle({
      animationDuration: '700ms',
    });
  });
});

describe('SkeletonChart', () => {
  it('renders a chart placeholder with configurable bars', () => {
    render(<SkeletonChart data-testid="skeleton-chart" bars={6} />);

    const chart = screen.getByTestId('skeleton-chart');

    expect(chart.querySelectorAll('[data-slot="skeleton-chart-bar"]')).toHaveLength(6);
  });

  it('supports configurable chart dimensions and animation', () => {
    render(
      <SkeletonChart
        data-testid="skeleton-chart"
        width={640}
        height="20rem"
        animation="shimmer"
        animationSpeed="slow"
      />,
    );

    const chart = screen.getByTestId('skeleton-chart');
    const firstBar = chart.querySelector('[data-slot="skeleton-chart-bar"]');

    expect(chart).toHaveStyle({
      width: '640px',
      height: '20rem',
    });

    expect(firstBar).toHaveClass('animate-shimmer');
    expect(firstBar).toHaveStyle({
      animationDuration: '2.5s',
    });
  });
});
