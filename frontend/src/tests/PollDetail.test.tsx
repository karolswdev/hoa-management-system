import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PollDetailPage from '../pages/PollDetail';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as pollHooks from '../hooks/usePolls';
import type { Poll, PollOption } from '../types/api';

// Mock the poll hooks
vi.mock('../hooks/usePolls');

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

// Mock poll data
const mockPollOptions: PollOption[] = [
  {
    id: 1,
    poll_id: 1,
    option_text: 'Yes, extend hours',
    display_order: 1,
    vote_count: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    poll_id: 1,
    option_text: 'No, keep current hours',
    display_order: 2,
    vote_count: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockActivePoll: Poll = {
  id: 1,
  title: 'Community Pool Hours',
  description: 'Should we extend pool hours on weekends?',
  poll_type: 'informal',
  status: 'active',
  start_time: '2024-01-01T00:00:00Z',
  end_time: '2024-12-31T23:59:59Z',
  created_by: 1,
  allow_multiple: false,
  show_results_before_close: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  options: mockPollOptions,
  total_votes: 45,
  user_has_voted: false,
};

const mockBindingPoll: Poll = {
  ...mockActivePoll,
  id: 2,
  title: 'Annual Budget Approval',
  poll_type: 'binding',
  show_results_before_close: false,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <ThemeWrapper>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="*" element={children} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('PollDetailPage', () => {
  const mockSubmitVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock implementation for usePollDetail
    vi.mocked(pollHooks.usePollDetail).mockReturnValue({
      poll: mockActivePoll,
      options: mockPollOptions,
      isLoading: false,
      isSkeleton: false,
      error: null,
      isBinding: false,
      canVote: true,
      showResults: true,
      userHasVoted: false,
      isActive: true,
      isClosed: false,
      timeRemaining: 3600000,
    } as any);

    // Default mock implementation for useSubmitVote
    vi.mocked(pollHooks.useSubmitVote).mockReturnValue({
      submitVote: mockSubmitVote,
      isPending: false,
      receipt: null,
      voteHash: null,
    } as any);
  });

  describe('Rendering', () => {
    it('renders poll title and description', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText('Community Pool Hours')).toBeInTheDocument();
      expect(screen.getByText(/Should we extend pool hours/i)).toBeInTheDocument();
    });

    it('renders poll status banner', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText(/Poll Active/i)).toBeInTheDocument();
    });

    it('renders all poll options', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Options appear in both voting and results sections when showResults is true
      const yesOptions = screen.getAllByText('Yes, extend hours');
      const noOptions = screen.getAllByText('No, keep current hours');

      expect(yesOptions.length).toBeGreaterThan(0);
      expect(noOptions.length).toBeGreaterThan(0);
    });

    it('renders vote counts when results are visible', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText('30 votes')).toBeInTheDocument();
      expect(screen.getByText('15 votes')).toBeInTheDocument();
    });
  });

  describe('Voting Interface', () => {
    it('allows selecting a poll option', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Get the voting section option (first one, not the results one)
      const options = screen.getAllByLabelText('Yes, extend hours');
      const votingOption = options[0];
      await user.click(votingOption);

      expect(votingOption).toBeChecked();
    });

    it('allows changing selection for single-select polls', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Get voting section options (first ones)
      const option1 = screen.getAllByLabelText('Yes, extend hours')[0];
      const option2 = screen.getAllByLabelText('No, keep current hours')[0];

      await user.click(option1);
      expect(option1).toBeChecked();

      await user.click(option2);
      expect(option2).toBeChecked();
      expect(option1).not.toBeChecked();
    });

    it('submits vote when submit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const option = screen.getAllByLabelText('Yes, extend hours')[0];
      await user.click(option);

      const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitVote).toHaveBeenCalledWith(
          expect.objectContaining({
            pollId: 1,
            data: expect.objectContaining({
              option_ids: [1],
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('disables submit button when no option is selected', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading state while submitting vote', () => {
      vi.mocked(pollHooks.useSubmitVote).mockReturnValue({
        submitVote: mockSubmitVote,
        isPending: true,
        receipt: null,
        voteHash: null,
      } as any);

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText(/Submitting Vote/i)).toBeInTheDocument();
    });
  });

  describe('Binding Polls', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.usePollDetail).mockReturnValue({
        poll: mockBindingPoll,
        options: mockPollOptions,
        isLoading: false,
        isSkeleton: false,
        error: null,
        isBinding: true,
        canVote: true,
        showResults: false,
        userHasVoted: false,
        isActive: true,
        isClosed: false,
        timeRemaining: 3600000,
      } as any);
    });

    it('displays binding poll badge', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const bindingBadges = screen.getAllByText('Binding');
      expect(bindingBadges.length).toBeGreaterThan(0);
    });

    it('requests receipt for binding polls', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const option = screen.getAllByLabelText('Yes, extend hours')[0];
      await user.click(option);

      const submitButton = screen.getByRole('button', { name: /Submit Vote/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitVote).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              request_receipt: true,
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it('shows helper text for binding polls when option selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const option = screen.getAllByLabelText('Yes, extend hours')[0];
      await user.click(option);

      // Should show helper text about cryptographic hash
      expect(screen.getByText(/cryptographic hash for verification/i)).toBeInTheDocument();
    });
  });

  describe('Receipt Management', () => {
    it('loads saved receipt from localStorage', () => {
      const savedReceipt = {
        vote_hash: 'saved123hash456789abcdef',
        poll_id: 1,
      };
      localStorage.setItem('vote_receipt_1', JSON.stringify(savedReceipt));

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Hash should be truncated and displayed somewhere
      // Just check that the receipt chip is visible
      expect(screen.getByText(/Your Receipt/i)).toBeInTheDocument();
    });

    it('saves receipt to localStorage after voting', async () => {
      const mockReceipt = {
        vote_hash: 'new123hash456',
        poll_id: 1,
        poll_title: 'Community Pool Hours',
        option_text: 'Yes, extend hours',
        timestamp: '2024-01-01T12:00:00Z',
        verified: true,
      };

      vi.mocked(pollHooks.useSubmitVote).mockReturnValue({
        submitVote: mockSubmitVote,
        isPending: false,
        receipt: mockReceipt,
        voteHash: mockReceipt.vote_hash,
      } as any);

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const stored = localStorage.getItem('vote_receipt_1');
        expect(stored).toBeTruthy();
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.vote_hash).toBe('new123hash456');
        }
      });
    });
  });

  describe('Already Voted State', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.usePollDetail).mockReturnValue({
        poll: { ...mockActivePoll, user_has_voted: true },
        options: mockPollOptions,
        isLoading: false,
        isSkeleton: false,
        error: null,
        isBinding: false,
        canVote: false,
        showResults: true,
        userHasVoted: true,
        isActive: true,
        isClosed: false,
        timeRemaining: 3600000,
      } as any);
    });

    it('shows already voted message', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText(/You have already voted in this poll/i)).toBeInTheDocument();
    });

    it('does not show voting interface', () => {
      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.queryByText(/Cast Your Vote/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when poll fails to load', () => {
      vi.mocked(pollHooks.usePollDetail).mockReturnValue({
        poll: null,
        options: [],
        isLoading: false,
        isSkeleton: false,
        error: new Error('Not found'),
        isBinding: false,
        canVote: false,
        showResults: false,
        userHasVoted: false,
        isActive: false,
        isClosed: false,
        timeRemaining: null,
      } as any);

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load poll/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates back to polls list when back button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /Back to Polls/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/polls');
    });
  });
});
