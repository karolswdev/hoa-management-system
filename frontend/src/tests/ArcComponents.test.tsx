import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { WorkflowComment, WorkflowAttachment, WorkflowInstance } from '../types/api';

// Mock hooks
const mockAddComment = vi.fn();
const mockUpload = vi.fn();
const mockPerformTransition = vi.fn();

vi.mock('../hooks/useWorkflows', () => ({
  useAddWorkflowComment: () => ({ mutate: mockAddComment, isPending: false }),
  useUploadWorkflowAttachments: () => ({ mutate: mockUpload, isPending: false }),
  usePerformTransition: () => ({ mutate: mockPerformTransition, isPending: false }),
}));

vi.mock('../services/api', () => ({
  apiService: {
    downloadWorkflowAttachment: vi.fn().mockResolvedValue(new Blob(['test'])),
  },
}));

import CommentThread from '../components/ARC/CommentThread';
import FileAttachments from '../components/ARC/FileAttachments';
import TransitionActions from '../components/ARC/TransitionActions';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper>{children}</ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

const makeComment = (overrides: Partial<WorkflowComment> = {}): WorkflowComment => ({
  id: 1,
  workflow_id: 1,
  created_by: 1,
  content: 'Test comment',
  is_internal: false,
  created_at: '2026-03-20T10:00:00Z',
  author: { id: 1, name: 'Alice' },
  ...overrides,
});

const makeAttachment = (overrides: Partial<WorkflowAttachment> = {}): WorkflowAttachment => ({
  id: 1,
  workflow_id: 1,
  uploaded_by: 1,
  original_file_name: 'plan.pdf',
  file_path: '/uploads/plan.pdf',
  file_size: 2048,
  mime_type: 'application/pdf',
  created_at: '2026-03-20T10:00:00Z',
  ...overrides,
});

const makeWorkflow = (overrides: Partial<WorkflowInstance> = {}): WorkflowInstance => ({
  id: 1,
  committee_id: 1,
  request_type: 'arc_request',
  request_id: 1,
  status: 'submitted',
  submitted_by: 1,
  expires_at: null,
  appeal_count: 0,
  created_at: '2026-03-20T10:00:00Z',
  updated_at: '2026-03-20T10:00:00Z',
  ...overrides,
});

// ─── CommentThread ───────────────────────────────────────────────────────────

describe('CommentThread', () => {
  beforeEach(() => {
    mockAddComment.mockClear();
  });

  it('renders comments sorted by date', () => {
    const comments = [
      makeComment({ id: 2, content: 'Second', created_at: '2026-03-21T10:00:00Z' }),
      makeComment({ id: 1, content: 'First', created_at: '2026-03-20T10:00:00Z' }),
    ];
    render(
      <CommentThread comments={comments} isCommitteeMember={false} workflowId={1} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('filters internal comments for non-committee members', () => {
    const comments = [
      makeComment({ id: 1, content: 'Public comment' }),
      makeComment({ id: 2, content: 'Internal note', is_internal: true }),
    ];
    render(
      <CommentThread comments={comments} isCommitteeMember={false} workflowId={1} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText('Public comment')).toBeInTheDocument();
    expect(screen.queryByText('Internal note')).not.toBeInTheDocument();
  });

  it('submits a comment when send button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CommentThread comments={[]} isCommitteeMember={false} workflowId={1} />,
      { wrapper: TestWrapper }
    );
    await user.type(screen.getByPlaceholderText('Add a comment...'), 'Hello world');
    await user.click(screen.getByRole('button'));
    expect(mockAddComment).toHaveBeenCalledWith(
      { workflowId: 1, data: { content: 'Hello world', is_internal: false } },
      expect.any(Object)
    );
  });

  it('shows internal checkbox for committee members', () => {
    render(
      <CommentThread comments={[]} isCommitteeMember={true} workflowId={1} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});

// ─── FileAttachments ─────────────────────────────────────────────────────────

describe('FileAttachments', () => {
  beforeEach(() => {
    mockUpload.mockClear();
  });

  it('renders attachment list with formatted file size', () => {
    const attachments = [
      makeAttachment({ file_size: 500 }),
      makeAttachment({ id: 2, original_file_name: 'photo.jpg', file_size: 1536000 }),
    ];
    render(
      <FileAttachments attachments={attachments} workflowId={1} canUpload={false} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    // 500 B
    expect(screen.getByText(/500 B/)).toBeInTheDocument();
    // 1536000 bytes = 1.5 MB
    expect(screen.getByText(/1\.5 MB/)).toBeInTheDocument();
  });

  it('renders KB-range file sizes', () => {
    render(
      <FileAttachments attachments={[makeAttachment({ file_size: 2048 })]} workflowId={1} canUpload={false} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
  });

  it('triggers download when download button clicked', async () => {
    const user = userEvent.setup();
    // Mock URL methods
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(
      <FileAttachments attachments={[makeAttachment()]} workflowId={1} canUpload={false} />,
      { wrapper: TestWrapper }
    );
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  it('handles file upload', () => {
    render(
      <FileAttachments attachments={[]} workflowId={1} canUpload={true} />,
      { wrapper: TestWrapper }
    );
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({ workflowId: 1 })
    );
  });
});

// ─── TransitionActions ───────────────────────────────────────────────────────

describe('TransitionActions', () => {
  beforeEach(() => {
    mockPerformTransition.mockClear();
  });

  it('renders available transitions for submitter on submitted workflow', () => {
    render(
      <TransitionActions workflow={makeWorkflow({ status: 'submitted' })} isSubmitter={true} isCommitteeMember={false} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
  });

  it('renders available transitions for committee on submitted workflow', () => {
    render(
      <TransitionActions workflow={makeWorkflow({ status: 'submitted' })} isSubmitter={false} isCommitteeMember={true} />,
      { wrapper: TestWrapper }
    );
    expect(screen.getByRole('button', { name: 'Begin Review' })).toBeInTheDocument();
  });

  it('opens dialog on button click and confirms transition', async () => {
    const user = userEvent.setup();
    render(
      <TransitionActions workflow={makeWorkflow({ status: 'submitted' })} isSubmitter={false} isCommitteeMember={true} />,
      { wrapper: TestWrapper }
    );
    await user.click(screen.getByRole('button', { name: 'Begin Review' }));
    // Dialog should open
    expect(screen.getByText('Perform Transition')).toBeInTheDocument();
    // Click confirm
    const dialogButtons = screen.getAllByRole('button', { name: 'Begin Review' });
    await user.click(dialogButtons[dialogButtons.length - 1]);
    expect(mockPerformTransition).toHaveBeenCalledWith(
      expect.objectContaining({ workflowId: 1, data: { to_status: 'under_review' } }),
      expect.any(Object)
    );
  });

  it('shows confirm text for destructive transitions', async () => {
    const user = userEvent.setup();
    render(
      <TransitionActions workflow={makeWorkflow({ status: 'submitted' })} isSubmitter={true} isCommitteeMember={false} />,
      { wrapper: TestWrapper }
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    render(
      <TransitionActions workflow={makeWorkflow({ status: 'submitted' })} isSubmitter={true} isCommitteeMember={false} />,
      { wrapper: TestWrapper }
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });
  });

  it('returns null when no transitions are available', () => {
    const { container } = render(
      <TransitionActions workflow={makeWorkflow({ status: 'approved' })} isSubmitter={false} isCommitteeMember={false} />,
      { wrapper: TestWrapper }
    );
    expect(container.innerHTML).toBe('');
  });
});
