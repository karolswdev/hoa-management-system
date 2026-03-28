import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import ArcRequestsPage from '../pages/member/ArcRequestsPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockArcRequests = [
  {
    id: 1, submitter_id: 1, property_address: '123 Oak Lane', category_id: 1,
    description: 'New fence installation', created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z',
    category: { id: 1, name: 'Fence', description: null, is_active: true, sort_order: 0, created_at: '', updated_at: '' },
    workflow: { id: 1, committee_id: 1, request_type: 'arc_request', request_id: 1, status: 'submitted' as const, submitted_by: 1, expires_at: null, appeal_count: 0, created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  },
  {
    id: 2, submitter_id: 1, property_address: '456 Maple Dr', category_id: 2,
    description: 'Exterior paint change', created_at: '2026-03-21T10:00:00Z', updated_at: '2026-03-21T10:00:00Z',
    category: { id: 2, name: 'Paint/Exterior Color', description: null, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
    workflow: { id: 2, committee_id: 1, request_type: 'arc_request', request_id: 2, status: 'approved' as const, submitted_by: 1, expires_at: '2027-03-21T10:00:00Z', appeal_count: 0, created_at: '2026-03-21T10:00:00Z', updated_at: '2026-03-21T10:00:00Z' },
  },
];

vi.mock('../hooks/useArcRequests', () => ({
  useArcRequests: vi.fn(() => ({
    arcRequests: mockArcRequests,
    pagination: { page: 1, limit: 10, total: 2, pages: 1 },
    isLoading: false, isError: false,
  })),
  useArcCategories: vi.fn(() => ({ categories: [], isLoading: false })),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper><BrowserRouter>{children}</BrowserRouter></ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('ArcRequestsPage', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('renders the page title', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText('My Review Requests')).toBeInTheDocument();
  });

  it('renders page description', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/track the status/i)).toBeInTheDocument();
  });

  it('renders new request button', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /new request/i })).toBeInTheDocument();
  });

  it('navigates to submit page on button click', async () => {
    const user = userEvent.setup();
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /new request/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/arc/submit');
  });

  it('renders request rows with # prefix', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('renders category names', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Fence')).toBeInTheDocument();
    expect(screen.getByText('Paint/Exterior Color')).toBeInTheDocument();
  });

  it('renders workflow status badges', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    // "Submitted" appears both as table header and status badge
    expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows chevron arrow on rows', () => {
    const { container } = render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(container.querySelectorAll('[data-testid="ChevronRightIcon"]').length).toBeGreaterThan(0);
  });

  it('navigates to detail page on row click', async () => {
    const user = userEvent.setup();
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    await user.click(screen.getByText('123 Oak Lane'));
    expect(mockNavigate).toHaveBeenCalledWith('/arc/1');
  });

  it('renders table headers', () => {
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Property')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  // Keep this test last - it overrides the mock
  it('shows friendly empty state when no requests', async () => {
    const hooks = await import('../hooks/useArcRequests');
    vi.mocked(hooks.useArcRequests).mockReturnValue({
      arcRequests: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 }, isLoading: false,
    } as ReturnType<typeof hooks.useArcRequests>);
    render(<ArcRequestsPage />, { wrapper: TestWrapper });
    expect(screen.getByText('No Requests Yet')).toBeInTheDocument();
    expect(screen.getByText(/planning a change/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit your first/i })).toBeInTheDocument();
  });
});
