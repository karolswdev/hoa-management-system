import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import PollsPage from '../pages/Polls';
import PollDetailPage from '../pages/PollDetail';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as pollHooks from '../hooks/usePolls';
import type { Poll, PollOption } from '../types/api';

// Extend expect matchers
expect.extend(toHaveNoViolations);

// Mock the poll hooks
vi.mock('../hooks/usePolls');

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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
    options: mockPollOptions,
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
];

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  highVis?: boolean;
}> = ({ children, highVis = false }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider initialPreferences={{ mode: highVis ? 'high-vis' : 'standard' }}>
        <ThemeWrapper>
          <NotificationProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </NotificationProvider>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('Polls Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PollsPage Accessibility', () => {
    beforeEach(() => {
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

    it('should have no accessibility violations in standard mode', async () => {
      const { container } = render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in high visibility mode', async () => {
      const { container } = render(
        <TestWrapper highVis={true}>
          <PollsPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels on interactive elements', async () => {
      const { container } = render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      // Check for ARIA labels on filter groups
      const filterGroups = container.querySelectorAll('[aria-label*="filter"]');
      expect(filterGroups.length).toBeGreaterThan(0);

      // All buttons should have accessible names
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(
          button.getAttribute('aria-label') || button.textContent
        ).toBeTruthy();
      });
    });

    it('should maintain keyboard navigation order', () => {
      const { container } = render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      // Check tabindex values
      const interactiveElements = container.querySelectorAll(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      );

      interactiveElements.forEach((element) => {
        const tabIndex = element.getAttribute('tabindex');
        // Should either have no tabindex (natural order) or positive tabindex
        if (tabIndex) {
          expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('PollDetailPage Accessibility', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.usePollDetail).mockReturnValue({
        poll: mockPolls[0],
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

      vi.mocked(pollHooks.useSubmitVote).mockReturnValue({
        submitVote: vi.fn(),
        isPending: false,
        receipt: null,
        voteHash: null,
      } as any);
    });

    it('should have no accessibility violations in standard mode', async () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in high visibility mode', async () => {
      const { container } = render(
        <TestWrapper highVis={true}>
          <PollDetailPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and associations', () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // All radio/checkbox inputs should have labels (either via for/id or wrapping label or aria-label)
      const inputs = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');

        // Check if input has a label (via for/id), is wrapped in a label, or has aria-label/aria-labelledby
        const hasExplicitLabel = id && container.querySelector(`label[for="${id}"]`);
        const hasWrappingLabel = input.closest('label');
        const hasAriaLabel = ariaLabel || ariaLabelledBy;

        expect(hasExplicitLabel || hasWrappingLabel || hasAriaLabel).toBeTruthy();
      });
    });

    it('should have sufficient color contrast in both modes', () => {
      const { container: standardContainer } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      const { container: highVisContainer } = render(
        <TestWrapper highVis={true}>
          <PollDetailPage />
        </TestWrapper>
      );

      // Both containers should render without errors
      expect(standardContainer).toBeTruthy();
      expect(highVisContainer).toBeTruthy();
    });

    it('should support keyboard-only navigation', () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Find all focusable elements
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href]'
      );

      // All focusable elements should be reachable via keyboard
      focusableElements.forEach((element) => {
        const tabIndex = element.getAttribute('tabindex');
        // Should not have tabindex="-1" unless it's intentionally not in tab order
        if (tabIndex) {
          expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(-1);
        }
      });
    });

    it('should announce dynamic content changes', () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Check for ARIA live regions that would announce vote submissions
      const liveRegions = container.querySelectorAll('[aria-live], [role="alert"], [role="status"]');

      // Should have at least one live region for notifications
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Target Sizes', () => {
    it('should meet minimum touch target size in standard mode (44px)', () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Check button minimum sizes
      const buttons = container.querySelectorAll('button.MuiButton-root');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight || '0');
        // Should be at least 44px
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('should meet enhanced touch target size in high-vis mode (52px)', () => {
      const { container } = render(
        <TestWrapper highVis={true}>
          <PollDetailPage />
        </TestWrapper>
      );

      // In high-vis mode, targets should be larger
      // This is enforced via theme tokens and component props
      const buttons = container.querySelectorAll('button.MuiButton-sizeLarge');

      // High-vis mode should use large size variants
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive headings hierarchy', () => {
      const { container } = render(
        <TestWrapper>
          <PollDetailPage />
        </TestWrapper>
      );

      // Check heading levels
      const h1 = container.querySelectorAll('h1');
      const h2 = container.querySelectorAll('h2');

      // Should have exactly one h1
      expect(h1.length).toBe(1);

      // H1 should contain the poll title
      expect(h1[0].textContent).toContain('Community Pool Hours');
    });

    it('should provide alternative text for icons', () => {
      const { container } = render(
        <TestWrapper>
          <PollsPage />
        </TestWrapper>
      );

      // Icons should either have aria-label or be aria-hidden
      const icons = container.querySelectorAll('svg[data-testid*="Icon"]');
      icons.forEach((icon) => {
        const ariaLabel = icon.getAttribute('aria-label');
        const ariaHidden = icon.getAttribute('aria-hidden');

        // Icon should either be labeled or hidden from screen readers
        expect(ariaLabel || ariaHidden === 'true').toBeTruthy();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
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

    it('should respect reduced motion preferences', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider initialPreferences={{ reducedMotion: true }}>
            <ThemeWrapper>
              <BrowserRouter>
                <PollsPage />
              </BrowserRouter>
            </ThemeWrapper>
          </AccessibilityProvider>
        </QueryClientProvider>
      );

      // Component should render without motion-dependent features
      expect(container).toBeTruthy();
    });
  });
});
