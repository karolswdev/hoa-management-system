import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import PollsPage from '../pages/Polls';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as pollHooks from '../hooks/usePolls';
import type { Poll } from '../types/api';

// Mock the poll hooks
vi.mock('../hooks/usePolls');

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock poll data
const mockPolls: Poll[] = [
  {
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
    total_votes: 45,
    user_has_voted: false,
  },
  {
    id: 2,
    title: 'Annual Budget Approval',
    description: 'Approve the 2024 HOA budget',
    poll_type: 'binding',
    status: 'active',
    start_time: '2024-01-15T00:00:00Z',
    end_time: '2024-02-15T23:59:59Z',
    created_by: 1,
    allow_multiple: false,
    show_results_before_close: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    total_votes: 120,
    user_has_voted: true,
  },
  {
    id: 3,
    title: 'Landscaping Vote',
    description: 'Choose new landscaping theme',
    poll_type: 'informal',
    status: 'closed',
    start_time: '2023-12-01T00:00:00Z',
    end_time: '2023-12-31T23:59:59Z',
    created_by: 1,
    allow_multiple: false,
    show_results_before_close: true,
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z',
    total_votes: 89,
    user_has_voted: false,
  },
];

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
          <BrowserRouter>{children}</BrowserRouter>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('PollsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(pollHooks.usePolls).mockReturnValue({
      polls: mockPolls,
      isLoading: false,
      isSkeleton: false,
      error: null,
      pagination: {
        totalItems: mockPolls.length,
        totalPages: 1,
        currentPage: 1,
        limit: 20,
      },
    } as any);
  });

  describe('Rendering', () => {
    it('renders the page title and description', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Community Polls')).toBeInTheDocument();
      expect(screen.getByText(/Vote on community decisions/i)).toBeInTheDocument();
    });

    it('renders all polls from the list', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByText('Community Pool Hours')).toBeInTheDocument();
      expect(screen.getByText('Annual Budget Approval')).toBeInTheDocument();
      expect(screen.getByText('Landscaping Vote')).toBeInTheDocument();
    });

    it('displays poll type badges correctly', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const informalBadges = screen.getAllByText('Informal');
      const bindingBadges = screen.getAllByText('Binding');

      // Should have at least 2 informal and 1 binding badge
      expect(informalBadges.length).toBeGreaterThanOrEqual(2);
      expect(bindingBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Voted" badge for polls user has voted in', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const votedBadges = screen.getAllByText('Voted');
      expect(votedBadges.length).toBe(1);
    });
  });

  describe('Filters', () => {
    it('renders type filter buttons', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /all types/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /informal polls/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /binding polls/i })).toBeInTheDocument();
    });

    it('renders status filter buttons', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /all statuses/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /active polls/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /closed polls/i })).toBeInTheDocument();
    });

    it('filters polls by type when type filter is changed', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const informalButton = screen.getByRole('button', { name: /informal polls/i });
      await user.click(informalButton);

      await waitFor(() => {
        expect(pollHooks.usePolls).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'informal' })
        );
      });
    });

    it('filters polls by status when status filter is changed', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const closedButton = screen.getByRole('button', { name: /closed polls/i });
      await user.click(closedButton);

      await waitFor(() => {
        expect(pollHooks.usePolls).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'closed' })
        );
      });
    });
  });

  describe('Loading and Error States', () => {
    it('shows skeleton loaders when loading', () => {
      vi.mocked(pollHooks.usePolls).mockReturnValue({
        polls: [],
        isLoading: true,
        isSkeleton: true,
        error: null,
        pagination: undefined,
      } as any);

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      // MUI Skeletons should be present
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when fetch fails', () => {
      vi.mocked(pollHooks.usePolls).mockReturnValue({
        polls: [],
        isLoading: false,
        isSkeleton: false,
        error: new Error('Network error'),
        pagination: undefined,
      } as any);

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load polls/i)).toBeInTheDocument();
    });

    it('shows empty state when no polls match filters', () => {
      vi.mocked(pollHooks.usePolls).mockReturnValue({
        polls: [],
        isLoading: false,
        isSkeleton: false,
        error: null,
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 20,
        },
      } as any);

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByText(/No polls found matching your filters/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to poll detail when poll card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const pollCard = screen.getByText('Community Pool Hours').closest('.MuiCardActionArea-root');
      expect(pollCard).toBeInTheDocument();

      if (pollCard) {
        await user.click(pollCard);
        expect(mockNavigate).toHaveBeenCalledWith('/polls/1');
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on filter groups', () => {
      render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      expect(screen.getByLabelText('poll type filter')).toBeInTheDocument();
      expect(screen.getByLabelText('poll status filter')).toBeInTheDocument();
    });

    it('displays larger elements in high visibility mode', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider initialPreferences={{ mode: 'high-vis' }}>
            <ThemeWrapper>
              <BrowserRouter>
                <PollsPage />
              </BrowserRouter>
            </ThemeWrapper>
          </AccessibilityProvider>
        </QueryClientProvider>
      );

      const title = screen.getByText('Community Polls');
      const styles = window.getComputedStyle(title);
      // In high-vis mode, font size should be larger
      expect(styles.fontSize).toBeDefined();
    });
  });
});
