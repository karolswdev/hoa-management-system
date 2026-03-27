import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import ArcDetailPage from '../pages/member/ArcDetailPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { WorkflowStatus } from '../types/api';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: '1' }), useNavigate: () => vi.fn() };
});

const mockAuthContext = {
  user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'member' as const, status: 'approved' as const, email_verified: true, is_system_user: false, created_at: '', updated_at: '' },
  isAdmin: false,
  isAuthenticated: true,
  isMember: true,
  token: 'mock-token',
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockArcRequest = {
  id: 1,
  submitter_id: 1,
  property_address: '123 Oak Lane',
  category_id: 1,
  description: 'Install a new 6-foot cedar fence along the backyard perimeter.',
  created_at: '2026-03-20T10:00:00Z',
  updated_at: '2026-03-20T10:00:00Z',
  submitter: { id: 1, name: 'Test User', email: 'test@test.com' },
  category: { id: 1, name: 'Fence', description: null, is_active: true, sort_order: 0, created_at: '', updated_at: '' },
  workflow: { id: 10 },
};

const mockWorkflow = {
  id: 10,
  committee_id: 1,
  request_type: 'arc_request',
  request_id: 1,
  status: 'under_review' as WorkflowStatus,
  submitted_by: 1,
  expires_at: null,
  appeal_count: 0,
  created_at: '2026-03-20T10:00:00Z',
  updated_at: '2026-03-20T10:00:00Z',
  committee: {
    id: 1,
    name: 'Architectural Review',
    description: null,
    status: 'active' as const,
    approval_expiration_days: 365,
    created_at: '',
    updated_at: '',
    members: [
      { id: 1, user_id: 5, committee_id: 1, role: 'chair' as const, created_at: '' },
    ],
  },
  submitter: { id: 1, name: 'Test User', email: 'test@test.com' },
  transitions: [
    { id: 1, workflow_id: 10, from_status: 'draft' as WorkflowStatus, to_status: 'submitted' as WorkflowStatus, performed_by: 1, performed_at: '2026-03-20T10:00:00Z', performer: { id: 1, name: 'Test User' } },
    { id: 2, workflow_id: 10, from_status: 'submitted' as WorkflowStatus, to_status: 'under_review' as WorkflowStatus, performed_by: 5, performed_at: '2026-03-21T10:00:00Z', performer: { id: 5, name: 'Committee Chair' } },
  ],
  comments: [
    { id: 1, workflow_id: 10, created_by: 5, content: 'Please provide fence material details.', is_internal: false, created_at: '2026-03-21T11:00:00Z', author: { id: 5, name: 'Committee Chair' } },
  ],
  attachments: [],
};

vi.mock('../hooks/useArcRequests', () => ({
  useArcRequest: vi.fn(() => ({
    arcRequest: mockArcRequest,
    isLoading: false,
  })),
}));

vi.mock('../hooks/useWorkflows', () => ({
  useWorkflow: vi.fn(() => ({
    workflow: mockWorkflow,
    isLoading: false,
  })),
  usePerformTransition: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useAddWorkflowComment: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUploadWorkflowAttachments: vi.fn(() => ({
    mutate: vi.fn(),
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

describe('ArcDetailPage', () => {
  it('renders request details', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('123 Oak Lane')).toBeInTheDocument();
    expect(screen.getByText('Fence')).toBeInTheDocument();
    expect(screen.getByText(/install a new 6-foot cedar fence/i)).toBeInTheDocument();
  });

  it('renders request ID in title', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('ARC Request #1')).toBeInTheDocument();
  });

  it('renders workflow status badge', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0);
  });

  it('renders submitter name', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
  });

  it('renders timeline transitions', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getAllByText('Committee Chair').length).toBeGreaterThan(0);
  });

  it('renders comments', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Please provide fence material details.')).toBeInTheDocument();
  });

  it('renders section headings', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Request Details')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('renders breadcrumb', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('ARC Requests')).toBeInTheDocument();
    expect(screen.getByText('Request #1')).toBeInTheDocument();
  });

  it('renders transition actions for submitter', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    // Submitter should see Withdraw button for under_review status
    expect(screen.getByRole('button', { name: /withdraw/i })).toBeInTheDocument();
  });

  it('shows no attachments message', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('No attachments.')).toBeInTheDocument();
  });

  it('shows comment input field', () => {
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
  });

  it('shows not found when request is null', async () => {
    const hooks = await import('../hooks/useArcRequests');
    vi.mocked(hooks.useArcRequest).mockReturnValue({
      arcRequest: undefined,
      isLoading: false,
    } as ReturnType<typeof hooks.useArcRequest>);
    render(<ArcDetailPage />, { wrapper: TestWrapper });
    expect(screen.getByText('Request not found.')).toBeInTheDocument();
  });
});
