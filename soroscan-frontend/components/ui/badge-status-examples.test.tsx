/**
 * Badge and StatusIndicator Examples Tests
 * ──────────────────────────────────────────────────────────────────────────────
 * Tests for the examples showcasing Badge and StatusIndicator usage.
 */

import { render, screen } from '@testing-library/react';

import { BadgeStatusExamples } from './badge-status-examples';

describe('BadgeStatusExamples', () => {
  it('renders all example sections', () => {
    render(<BadgeStatusExamples />);

    expect(screen.getByText('Contract List Usage')).toBeInTheDocument();

    expect(screen.getByText('Event Explorer Usage')).toBeInTheDocument();

    expect(screen.getByText('Webhook List Usage')).toBeInTheDocument();

    expect(screen.getByText('Size Variants Showcase')).toBeInTheDocument();

    expect(screen.getByText('Color Variants Showcase')).toBeInTheDocument();
  });

  it('shows contract list examples with different statuses', () => {
    render(<BadgeStatusExamples />);

    expect(screen.getByText('contract_12345...abcdef')).toBeInTheDocument();

    expect(screen.getByText('contract_67890...xyz123')).toBeInTheDocument();

    expect(screen.getByText('contract_new456...def789')).toBeInTheDocument();

    expect(screen.getAllByLabelText('Status: Active').length).toBeGreaterThan(0);

    expect(screen.getAllByLabelText('Status: Failed').length).toBeGreaterThan(0);

    expect(screen.getAllByLabelText('Status: Pending').length).toBeGreaterThan(0);
  });

  it('shows event explorer examples with dot-only indicators', () => {
    render(<BadgeStatusExamples />);

    expect(screen.getByText('Transfer Event')).toBeInTheDocument();
    expect(screen.getByText('Mint Event')).toBeInTheDocument();
    expect(screen.getByText('Burn Event')).toBeInTheDocument();

    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Real-time')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('shows webhook list examples with compact status indicators', () => {
    render(<BadgeStatusExamples />);

    expect(screen.getByText('https://api.example.com/webhook')).toBeInTheDocument();

    expect(screen.getByText('https://webhook.service.com/events')).toBeInTheDocument();

    expect(screen.getByText('https://broken.endpoint.com/hook')).toBeInTheDocument();

    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Retrying')).toBeInTheDocument();
    expect(screen.getByText('Attempt 2/3')).toBeInTheDocument();
  });

  it('displays size variants correctly', () => {
    render(<BadgeStatusExamples />);

    expect(screen.getByText('Small:')).toBeInTheDocument();
    expect(screen.getByText('Medium:')).toBeInTheDocument();
    expect(screen.getByText('Large:')).toBeInTheDocument();

    expect(screen.getByText('SM Badge')).toBeInTheDocument();
    expect(screen.getByText('MD Badge')).toBeInTheDocument();
    expect(screen.getByText('LG Badge')).toBeInTheDocument();
  });

  it('displays all color variants', () => {
    render(<BadgeStatusExamples />);

    const colorVariants = [
      'Default',
      'Primary',
      'Secondary',
      'Success',
      'Warning',
      'Danger',
      'Outline',
    ];

    colorVariants.forEach((variant) => {
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });

  it('shows proper visual hierarchy with status indicators and badges', () => {
    render(<BadgeStatusExamples />);

    const statusElements = screen.getAllByRole('status');

    expect(statusElements.length).toBeGreaterThan(0);

    const eventCountText = screen.getByText('1.2k Events');
    const eventCountBadge = eventCountText.closest('[data-slot="badge"]');

    expect(eventCountBadge).toBeInTheDocument();
    expect(eventCountBadge).toHaveClass('inline-flex', 'items-center');

    expect(eventCountBadge?.querySelector('[data-slot="badge-icon"]')).toBeInTheDocument();
  });

  it('demonstrates accessibility features', () => {
    render(<BadgeStatusExamples />);

    const accessibleLabels = ['Status: Active', 'Status: Failed', 'Status: Pending'];

    accessibleLabels.forEach((label) => {
      const matchingIndicators = screen.getAllByLabelText(label);

      expect(matchingIndicators.length).toBeGreaterThan(0);

      matchingIndicators.forEach((indicator) => {
        expect(indicator).toHaveAttribute('role', 'status');
      });
    });
  });
});
