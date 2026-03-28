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

vi.mock('../services/api', () => ({
  apiService: {
    getUsers: vi.fn(() =>
      Promise.resolve({
        count: 3,
        users: [
          { id: 5, name: 'Jane Chair', email: 'jane@test.com', role: 'member', status: 'approved', email_verified: true, is_system_user: false, created_at: '', updated_at: '' },
          { id: 6, name: 'Bob Member', email: 'bob@test.com', role: 'member', status: 'approved', email_verified: true, is_system_user: false, created_at: '', updated_at: '' },
          { id: 7, name: 'Alice New', email: 'alice@test.com', role: 'member', status: 'approved', email_verified: true, is_system_user: false, created_at: '', updated_at: '' },
        ],
      })
    ),
  },
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

  it('renders the page title and description', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Committee Management')).toBeInTheDocument();
    expect(screen.getByText(/create and manage review committees/i)).toBeInTheDocument();
  });

  it('renders new committee button', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByRole('button', { name: /new committee/i })).toBeInTheDocument();
  });

  it('renders committee cards with names', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Architectural Review')).toBeInTheDocument();
    expect(screen.getByText('Landscaping Review')).toBeInTheDocument();
  });

  it('renders active and inactive status chips', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders member names and roles on active committee card', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Jane Chair')).toBeInTheDocument();
    expect(screen.getByText('Bob Member')).toBeInTheDocument();
    expect(screen.getByText('Chair')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Members (2)')).toBeInTheDocument();
  });

  it('renders approval expiration info', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Approvals valid for 365 days')).toBeInTheDocument();
  });

  it('opens create dialog with helpful text', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /new committee/i }));
    expect(screen.getByText('Create a New Committee')).toBeInTheDocument();
    expect(screen.getByText(/a committee is a group/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/committee name/i)).toBeInTheDocument();
  });

  it('creates committee on dialog save', async () => {
    mockCreateMutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });

    await user.click(screen.getByRole('button', { name: /new committee/i }));
    await user.type(screen.getByLabelText(/committee name/i), 'New Committee');
    await user.click(screen.getByRole('button', { name: /create committee/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
    });
  });

  it('opens add person dialog with user search', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /add person/i }));
    expect(screen.getByText(/add a person to architectural review/i)).toBeInTheDocument();
    expect(screen.getByText(/search for a community member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search for a person/i)).toBeInTheDocument();
  });

  it('shows deactivate confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    await user.click(screen.getByRole('button', { name: /deactivate committee/i }));
    expect(screen.getByText('Deactivate Committee?')).toBeInTheDocument();
    expect(screen.getByText(/will no longer receive new requests/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep active/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, deactivate/i })).toBeInTheDocument();
  });

  it('shows remove member confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    // Get the remove button for Jane Chair using tooltip
    const removeButtons = screen.getAllByTestId('PersonRemoveIcon');
    await user.click(removeButtons[0].closest('button')!);
    expect(screen.getByText('Remove Committee Member?')).toBeInTheDocument();
    expect(screen.getByText(/no longer be able to review/i)).toBeInTheDocument();
  });

  it('shows inactive committees section separately', () => {
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Inactive Committees')).toBeInTheDocument();
  });

  it('shows empty state when no committees exist', async () => {
    const hooks = await import('../hooks/useCommittees');
    vi.mocked(hooks.useCommittees).mockReturnValue({
      committees: [],
      isLoading: false,
    } as ReturnType<typeof hooks.useCommittees>);
    render(<CommitteeManagementPage />, { wrapper: TestWrapper });
    expect(screen.getByText('No Committees Yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first committee/i })).toBeInTheDocument();
  });
});
