import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import ArcSubmitPage from '../pages/member/ArcSubmitPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockMutateAsync = vi.fn();
vi.mock('../hooks/useArcRequests', () => ({
  useArcCategories: vi.fn(() => ({
    categories: [
      { id: 1, name: 'Fence', description: 'Fence changes', is_active: true, sort_order: 0, created_at: '', updated_at: '' },
      { id: 2, name: 'Paint/Exterior Color', description: null, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
      { id: 3, name: 'Landscaping', description: null, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
    ],
    isLoading: false,
  })),
  useCreateArcRequest: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper>
          <SnackbarProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </SnackbarProvider>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('ArcSubmitPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutateAsync.mockClear();
  });

  it('renders the page title', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Submit Architectural Review Request')).toBeInTheDocument();
  });

  it('renders breadcrumb with link to ARC Requests', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText('ARC Requests')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByLabelText(/property address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/arc');
  });

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => {
      expect(screen.getByText(/property address is required/i)).toBeInTheDocument();
    });
  });

  it('shows description minimum length error', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.type(screen.getByLabelText(/property address/i), '123 Test St');
    await user.type(screen.getByLabelText(/description/i), 'Too short');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form and navigates on success', async () => {
    mockMutateAsync.mockResolvedValue({
      arcRequest: { id: 42, property_address: '123 Test St', category_id: 1, description: 'A detailed description here', submitter_id: 1, created_at: '', updated_at: '' },
      workflow: { id: 10 },
    });

    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });

    await user.type(screen.getByLabelText(/property address/i), '123 Test St');

    // Open the category select and pick Fence
    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    await user.click(screen.getByText('Fence'));

    await user.type(screen.getByLabelText(/description/i), 'A detailed description of the proposed fence installation');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        property_address: '123 Test St',
        category_id: 1,
        description: 'A detailed description of the proposed fence installation',
        submit_immediately: true,
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/arc/42');
    });
  });

  it('renders category options from hook', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByLabelText(/category/i));
    expect(screen.getByText('Fence')).toBeInTheDocument();
    expect(screen.getByText('Paint/Exterior Color')).toBeInTheDocument();
    expect(screen.getByText('Landscaping')).toBeInTheDocument();
  });
});
