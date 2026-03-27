import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import CommitteeManagementPage from '../pages/admin/CommitteeManagementPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockCommittees = [
  {
    id: 1,
    name: 'Architectural Review',
    description: 'Reviews architectural change requests',
    status: 'active' as const,
    approval_expiration_days: 365,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    members: [
      { id: 1, user_id: 5, committee_id: 1, role: 'chair' as const, created_at: '', user: { id: 5, name: 'Jane Chair', email: 'jane@test.com' } },
      { id: 2, user_id: 6, committee_id: 1, role: 'member' as const, created_at: '', user: { id: 6, name: 'Bob Member', email: 'bob@test.com' } },
    ],
  },
  {
    id: 2,
    name: 'Landscaping Review',
    description: null,
    status: 'inactive' as const,
    approval_expiration_days: 180,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    members: [],
  },
];

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockDeactivateMutateAsync = vi.fn();
const mockAddMemberMutateAsync = vi.fn();
const mockRemoveMemberMutateAsync = vi.fn();

vi.mock('../hooks/useCommittees', () => ({
  useCommittees: vi.fn(() => ({
    committees: mockCommittees,
    isLoading: false,
  })),
  useCreateCommittee: vi.fn(() => ({ mutateAsync: mockCreateMutateAsync, isPending: false })),
  useUpdateCommittee: vi.fn(() => ({ mutateAsync: mockUpdateMutateAsync, isPending: false })),
  useDeactivateCommittee: vi.fn(() => ({ mutateAsync: mockDeactivateMutateAsync, isPending: false })),
  useAddCommitteeMember: vi.fn(() => ({ mutateAsync: mockAddMemberMutateAsync, isPending: false })),
  useRemoveCommitteeMember: vi.fn(() => ({ mutateAsync: mockRemoveMemberMutateAsync, isPending: false })),
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

describe('CommitteeManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Committee Management')).toBeInTheDocument();
  });

  it('renders create committee button', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /create committee/i })).toBeInTheDocument();
  });

  it('renders committee rows', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Architectural Review')).toBeInTheDocument();
    expect(screen.getByText('Landscaping Review')).toBeInTheDocument();
  });

  it('renders committee status chips', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('2')).toBeInTheDocument(); // Architectural Review has 2 members
    expect(screen.getByText('0')).toBeInTheDocument(); // Landscaping Review has 0
  });

  it('opens create dialog on button click', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /create committee/i }));
    // Dialog title + button both say "Create Committee", so check for dialog-specific content
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('creates committee on dialog save', async () => {
    mockCreateMutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });

    await user.click(screen.getByRole('button', { name: /create committee/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'New Committee');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        name: 'New Committee',
        description: '',
        approval_expiration_days: 365,
      });
    });
  });

  it('expands to show members on row expand click', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });

    // Click the expand button for the first committee
    const expandButtons = screen.getAllByTestId('ExpandMoreIcon');
    await user.click(expandButtons[0].closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('Jane Chair')).toBeInTheDocument();
      expect(screen.getByText('Bob Member')).toBeInTheDocument();
    });
  });

  it('renders table headers', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });
});
