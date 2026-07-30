import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertCircle, AlertTriangle, Check, Info } from 'lucide-react';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders with the default variant, normal size, and rounded shape', () => {
    render(<Badge>Default badge</Badge>);

    const badge = screen.getByText('Default badge').closest('[data-slot="badge"]');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'border-terminal-gray/30',
      'bg-terminal-gray/10',
      'text-terminal-gray',
      'h-6',
      'px-3',
      'py-1',
      'rounded-full',
    );
  });

  it.each([
    ['success', 'border-terminal-green/30', 'bg-terminal-green/10', 'text-terminal-green'],
    ['error', 'border-terminal-danger/30', 'bg-terminal-danger/10', 'text-terminal-danger'],
    ['warning', 'border-terminal-warning/30', 'bg-terminal-warning/10', 'text-terminal-warning'],
    ['info', 'border-terminal-cyan/30', 'bg-terminal-cyan/10', 'text-terminal-cyan'],
  ] as const)(
    'renders the %s status variant',
    (variant, borderClass, backgroundClass, textClass) => {
      render(
        <Badge variant={variant} data-testid={`badge-${variant}`}>
          {variant}
        </Badge>,
      );

      expect(screen.getByTestId(`badge-${variant}`)).toHaveClass(
        borderClass,
        backgroundClass,
        textClass,
      );
    },
  );

  it.each([
    ['default', 'border-terminal-gray/30', 'bg-terminal-gray/10', 'text-terminal-gray'],
    ['primary', 'border-terminal-green/30', 'bg-terminal-green/10', 'text-terminal-green'],
    ['secondary', 'border-terminal-cyan/30', 'bg-terminal-cyan/10', 'text-terminal-cyan'],
    ['danger', 'border-terminal-danger/30', 'bg-terminal-danger/10', 'text-terminal-danger'],
    ['outline', 'border-current/30', 'bg-transparent', 'text-current'],
  ] as const)(
    'preserves the existing %s variant',
    (variant, borderClass, backgroundClass, textClass) => {
      render(
        <Badge variant={variant} data-testid={`badge-${variant}`}>
          {variant}
        </Badge>,
      );

      expect(screen.getByTestId(`badge-${variant}`)).toHaveClass(
        borderClass,
        backgroundClass,
        textClass,
      );
    },
  );

  it('renders the compact size', () => {
    render(
      <Badge size="compact" data-testid="compact-badge">
        Compact
      </Badge>,
    );

    expect(screen.getByTestId('compact-badge')).toHaveClass('h-5', 'px-2', 'py-0.5', 'text-xs');
  });

  it('renders the normal size', () => {
    render(
      <Badge size="normal" data-testid="normal-badge">
        Normal
      </Badge>,
    );

    expect(screen.getByTestId('normal-badge')).toHaveClass('h-6', 'px-3', 'py-1', 'text-xs');
  });

  it.each([
    ['sm', 'h-5', 'px-2', 'py-0.5', 'text-xs'],
    ['md', 'h-6', 'px-3', 'py-1', 'text-xs'],
    ['lg', 'h-8', 'px-4', 'py-1.5', 'text-sm'],
  ] as const)(
    'preserves the existing %s size',
    (size, heightClass, horizontalPadding, verticalPadding, textClass) => {
      render(
        <Badge size={size} data-testid={`badge-${size}`}>
          {size}
        </Badge>,
      );

      expect(screen.getByTestId(`badge-${size}`)).toHaveClass(
        heightClass,
        horizontalPadding,
        verticalPadding,
        textClass,
      );
    },
  );

  it('renders the rounded shape', () => {
    render(
      <Badge shape="rounded" data-testid="rounded-badge">
        Rounded
      </Badge>,
    );

    expect(screen.getByTestId('rounded-badge')).toHaveClass('rounded-full');
  });

  it('renders the square shape', () => {
    render(
      <Badge shape="square" data-testid="square-badge">
        Square
      </Badge>,
    );

    expect(screen.getByTestId('square-badge')).toHaveClass('rounded-sm');

    expect(screen.getByTestId('square-badge')).not.toHaveClass('rounded-full');
  });

  it.each([
    ['compact', '10'],
    ['normal', '12'],
    ['sm', '10'],
    ['md', '12'],
    ['lg', '14'],
  ] as const)('uses the correct default icon size for %s badges', (size, expectedSize) => {
    render(
      <Badge size={size} icon={Check} data-testid={`icon-badge-${size}`}>
        Complete
      </Badge>,
    );

    const icon = screen.getByTestId(`icon-badge-${size}`).querySelector('[data-slot="badge-icon"]');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', expectedSize);
    expect(icon).toHaveAttribute('height', expectedSize);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports a custom icon size', () => {
    render(
      <Badge icon={AlertTriangle} iconSize={18} data-testid="custom-icon-badge">
        Warning
      </Badge>,
    );

    const icon = screen.getByTestId('custom-icon-badge').querySelector('[data-slot="badge-icon"]');

    expect(icon).toHaveAttribute('width', '18');
    expect(icon).toHaveAttribute('height', '18');
  });

  it.each([
    ['success', Check],
    ['error', AlertCircle],
    ['warning', AlertTriangle],
    ['info', Info],
  ] as const)('renders an icon for the %s badge', (variant, Icon) => {
    render(
      <Badge variant={variant} icon={Icon} data-testid={`${variant}-icon-badge`}>
        {variant}
      </Badge>,
    );

    expect(
      screen.getByTestId(`${variant}-icon-badge`).querySelector('[data-slot="badge-icon"]'),
    ).toBeInTheDocument();
  });

  it('does not show a dismiss button by default', () => {
    render(<Badge>Persistent</Badge>);

    expect(
      screen.queryByRole('button', {
        name: 'Dismiss badge',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows a dismiss button when dismissible is enabled', () => {
    render(<Badge dismissible>Dismissible</Badge>);

    expect(
      screen.getByRole('button', {
        name: 'Dismiss badge',
      }),
    ).toBeInTheDocument();
  });

  it('supports a custom dismiss button label', () => {
    render(
      <Badge dismissible dismissLabel="Remove status">
        Removable
      </Badge>,
    );

    expect(
      screen.getByRole('button', {
        name: 'Remove status',
      }),
    ).toBeInTheDocument();
  });

  it('dismisses the badge and calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();

    render(
      <Badge dismissible onDismiss={onDismiss}>
        Temporary badge
      </Badge>,
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Dismiss badge',
      }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Temporary badge')).not.toBeInTheDocument();
  });

  it('forwards accessibility and HTML attributes', () => {
    render(
      <Badge
        aria-label="Contract status"
        data-testid="accessible-badge"
        data-contract-id="contract-123"
        className="custom-badge-class"
      >
        Active
      </Badge>,
    );

    const badge = screen.getByTestId('accessible-badge');

    expect(badge).toHaveAttribute('aria-label', 'Contract status');
    expect(badge).toHaveAttribute('data-contract-id', 'contract-123');
    expect(badge).toHaveClass('custom-badge-class');
  });

  it('forwards its ref', () => {
    const ref = React.createRef<HTMLSpanElement>();

    render(<Badge ref={ref}>Referenced</Badge>);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveAttribute('data-slot', 'badge');
  });
});
