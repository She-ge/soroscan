import { render, screen } from '@testing-library/react';
import AdminLoading from '@/app/admin/loading';
import AlertsLoading from '@/app/alerts/loading';
import LiveLoading from '@/app/live/loading';
import ReportsLoading from '@/app/reports/loading';
import ContractsImportPage from '@/app/admin/contracts-import/page';
import DedupConfigPage from '@/app/admin/dedup/page';
import QueryBuilderReportPage from '@/app/reports/query-builder/page';

// Mock auth module
jest.mock('@/lib/auth', () => ({
  getAccessToken: jest.fn(() => 'mock-token'),
}));

describe('Route Loading Components', () => {
  it('renders AdminLoading with role status and aria-busy', () => {
    render(<AdminLoading />);
    const loadingElem = screen.getByRole('status', { name: /loading admin dashboard/i });
    expect(loadingElem).toBeInTheDocument();
    expect(loadingElem).toHaveAttribute('aria-busy', 'true');
  });

  it('renders AlertsLoading with role status and aria-busy', () => {
    render(<AlertsLoading />);
    const loadingElem = screen.getByRole('status', { name: /loading alerts/i });
    expect(loadingElem).toBeInTheDocument();
    expect(loadingElem).toHaveAttribute('aria-busy', 'true');
  });

  it('renders LiveLoading with role status and aria-busy', () => {
    render(<LiveLoading />);
    const loadingElem = screen.getByRole('status', { name: /loading live event stream/i });
    expect(loadingElem).toBeInTheDocument();
    expect(loadingElem).toHaveAttribute('aria-busy', 'true');
  });

  it('renders ReportsLoading with role status and aria-busy', () => {
    render(<ReportsLoading />);
    const loadingElem = screen.getByRole('status', { name: /loading report builder/i });
    expect(loadingElem).toBeInTheDocument();
    expect(loadingElem).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Page Empty States', () => {
  it('renders ContractsImportPage with empty state for import history', () => {
    render(<ContractsImportPage />);
    expect(screen.getByTestId('contracts-import-empty')).toBeInTheDocument();
    expect(screen.getByText('No contract imports')).toBeInTheDocument();
  });

  it('renders DedupConfigPage with empty state for duplicate records', () => {
    render(<DedupConfigPage />);
    expect(screen.getByTestId('dedup-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No duplicate records')).toBeInTheDocument();
  });

  it('renders QueryBuilderReportPage preview section', () => {
    render(<QueryBuilderReportPage />);
    expect(screen.getByTestId('query-builder-results')).toBeInTheDocument();
  });
});
