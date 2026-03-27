import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import ArcRequestsPage from '../pages/member/ArcRequestsPage';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi, describe, it, expect } from 'vitest';

expect.extend(toHaveNoViolations);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../hooks/useArcRequests', () => ({
  useArcRequests: vi.fn(() => ({
    arcRequests: [
      {
        id: 1,
        submitter_id: 1,
        property_address: '123 Oak Lane',
        category_id: 1,
        description: 'New fence',
        created_at: '2026-03-20T10:00:00Z',
        updated_at: '2026-03-20T10:00:00Z',
        category: { id: 1, name: 'Fence', description: null, is_active: true, sort_order: 0, created_at: '', updated_at: '' },
        workflow: {
          id: 1, committee_id: 1, request_type: 'arc_request', request_id: 1,
          status: 'submitted' as const, submitted_by: 1, expires_at: null,
          appeal_count: 0, created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z',
        },
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    isLoading: false,
  })),
}));

const TestWrapper: React.FC<{ children: React.ReactNode; highVis?: boolean }> = ({ children, highVis = false }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider initialPreferences={highVis ? { mode: 'high-vis', showHelpers: false, reducedMotion: false } : undefined}>
        <ThemeWrapper>
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('ArcRequestsPage Accessibility', () => {
  it('should have no accessibility violations in standard mode', async () => {
    const { container } = render(<ArcRequestsPage />, { wrapper: TestWrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in high-vis mode', async () => {
    const HighVisWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TestWrapper highVis>{children}</TestWrapper>
    );
    const { container } = render(<ArcRequestsPage />, { wrapper: HighVisWrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(<ArcRequestsPage />, { wrapper: TestWrapper });
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should have accessible table structure', () => {
    const { container } = render(<ArcRequestsPage />, { wrapper: TestWrapper });
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    const headers = container.querySelectorAll('th');
    expect(headers.length).toBe(5);
  });

  it('submit button should be keyboard accessible', () => {
    const { container } = render(<ArcRequestsPage />, { wrapper: TestWrapper });
    const button = container.querySelector('button');
    expect(button).not.toHaveAttribute('tabindex', '-1');
  });
});
