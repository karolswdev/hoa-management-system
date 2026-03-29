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
  useCreateArcRequest: vi.fn(() => ({ mutateAsync: mockMutateAsync, isPending: false })),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper><SnackbarProvider><BrowserRouter>{children}</BrowserRouter></SnackbarProvider></ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('ArcSubmitPage', () => {
  beforeEach(() => { mockNavigate.mockClear(); mockMutateAsync.mockClear(); });

  it('renders the page title', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Submit a Review Request')).toBeInTheDocument();
  });

  it('renders helpful description', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/tell us about the change/i)).toBeInTheDocument();
  });

  it('renders breadcrumb with link to My Requests', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText('My Requests')).toBeInTheDocument();
  });

  it('renders form fields with labels', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByLabelText(/property address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what type of change/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/describe your project/i)).toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders info alert about uploading files', () => {
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/upload photos, plans/i)).toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/arc');
  });

  it('shows friendly validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter the property address/i)).toBeInTheDocument();
    });
  });

  it('shows friendly description length error', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.type(screen.getByLabelText(/property address/i), '123 Test St');
    await user.type(screen.getByLabelText(/describe your project/i), 'Too short');
    await user.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => {
      expect(screen.getByText(/provide more detail/i)).toBeInTheDocument();
    });
  });

  it('submits form and navigates on success', { timeout: 15000 }, async () => {
    mockMutateAsync.mockResolvedValue({
      arcRequest: { id: 42, property_address: '123 Test St', category_id: 1, description: 'A detailed description here', submitter_id: 1, created_at: '', updated_at: '' },
      workflow: { id: 10 },
    });
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });

    await user.type(screen.getByLabelText(/property address/i), '123 Test St');
    await user.click(screen.getByLabelText(/what type of change/i));
    await user.click(screen.getByText('Fence'));
    await user.type(screen.getByLabelText(/describe your project/i), 'A detailed description of the proposed fence installation');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => { expect(mockMutateAsync).toHaveBeenCalled(); });
    await waitFor(() => { expect(mockNavigate).toHaveBeenCalledWith('/arc/42'); });
  });

  it('renders category options with descriptions', async () => {
    const user = userEvent.setup();
    render(<ArcSubmitPage />, { wrapper: TestWrapper });
    await user.click(screen.getByLabelText(/what type of change/i));
    expect(screen.getByText('Fence')).toBeInTheDocument();
    expect(screen.getByText('Fence changes')).toBeInTheDocument();
    expect(screen.getByText('Landscaping')).toBeInTheDocument();
  });
});
