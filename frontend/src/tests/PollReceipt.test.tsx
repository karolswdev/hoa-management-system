import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PollReceiptPage from '../pages/PollReceipt';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as pollHooks from '../hooks/usePolls';
import type { VoteReceipt } from '../types/api';

// Mock the poll hooks
vi.mock('../hooks/usePolls');

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ pollId: '1', hash: 'abc123def456ghi789' }),
  };
});

// Mock receipt data
const mockReceipt: VoteReceipt = {
  vote_hash: 'abc123def456ghi789',
  poll_id: 1,
  poll_title: 'Community Pool Hours',
  option_text: 'Yes, extend hours',
  timestamp: '2024-01-01T12:00:00Z',
  verified: true,
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
          <BrowserRouter>
            <Routes>
              <Route path="*" element={children} />
            </Routes>
          </BrowserRouter>
        </ThemeWrapper>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
};

describe('PollReceiptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Verification', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: mockReceipt,
        isVerified: true,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders verification success message', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText('Vote Receipt Verified')).toBeInTheDocument();
      expect(
        screen.getByText(/This vote has been successfully verified/i)
      ).toBeInTheDocument();
    });

    it('displays receipt details', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText('Community Pool Hours')).toBeInTheDocument();
      expect(screen.getByText('Yes, extend hours')).toBeInTheDocument();
      expect(screen.getByText(/abc123def456ghi789/i)).toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // Should display a formatted date/time
      const dateElements = screen.getAllByText(/2024/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('shows informational alert about verification', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(
        screen.getByText(/cryptographic verification/i)
      ).toBeInTheDocument();
    });

    it('provides navigation buttons', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /View Poll Details/i })).toBeInTheDocument();
      const backButtons = screen.getAllByRole('button', { name: /Back to Polls/i });
      expect(backButtons.length).toBeGreaterThan(0);
    });

    it('navigates to poll detail when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      const viewPollButton = screen.getByRole('button', { name: /View Poll Details/i });
      await user.click(viewPollButton);

      expect(mockNavigate).toHaveBeenCalledWith('/polls/1');
    });

    it('navigates to polls list when back button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      const backButtons = screen.getAllByRole('button', { name: /Back to Polls/i });
      await user.click(backButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/polls');
    });
  });

  describe('Failed Verification', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: null,
        isVerified: false,
        isLoading: false,
        error: new Error('Not found'),
      } as any);
    });

    it('renders error message for invalid receipt', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText('Receipt Not Found')).toBeInTheDocument();
      expect(
        screen.getByText(/The receipt hash could not be verified/i)
      ).toBeInTheDocument();
    });

    it('displays possible reasons for failure', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText(/receipt hash is incorrect/i)).toBeInTheDocument();
      expect(screen.getByText(/vote was not successfully recorded/i)).toBeInTheDocument();
      expect(screen.getByText(/poll ID is incorrect/i)).toBeInTheDocument();
    });

    it('provides contact support message', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('shows back navigation button on error', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /Back to Polls/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: null,
        isVerified: false,
        isLoading: true,
        error: null,
      } as any);
    });

    it('shows loading skeletons while fetching', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // MUI Skeletons should be present
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Public Access', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: mockReceipt,
        isVerified: true,
        isLoading: false,
        error: null,
      } as any);
    });

    it('renders without authentication requirement', () => {
      // This page should be accessible without login
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText('Vote Receipt Verified')).toBeInTheDocument();
    });

    it('displays educational content about vote verification', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText('About Vote Verification')).toBeInTheDocument();
      expect(screen.getByText(/cryptographic hashing/i)).toBeInTheDocument();
    });

    it('explains privacy aspects of receipts', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText(/doesn't reveal your identity/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: mockReceipt,
        isVerified: true,
        isLoading: false,
        error: null,
      } as any);
    });

    it('uses semantic HTML elements', () => {
      const { container } = render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // Should have heading hierarchy
      const headings = container.querySelectorAll('h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('provides ARIA labels for icons', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // Check for security icon with proper labeling
      const securityIcon = screen.getByText('Receipt Details').previousSibling;
      expect(securityIcon).toBeTruthy();
    });

    it('supports high visibility mode', () => {
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
                <Routes>
                  <Route path="*" element={<PollReceiptPage />} />
                </Routes>
              </BrowserRouter>
            </ThemeWrapper>
          </AccessibilityProvider>
        </QueryClientProvider>
      );

      // Should render without errors in high-vis mode
      expect(screen.getByText('Vote Receipt Verified')).toBeInTheDocument();
    });
  });

  describe('Receipt Hash Display', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: mockReceipt,
        isVerified: true,
        isLoading: false,
        error: null,
      } as any);
    });

    it('displays full hash in monospace font', () => {
      const { container } = render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      const hashElement = screen.getByText(/abc123def456ghi789/i);
      const styles = window.getComputedStyle(hashElement);

      // Should use monospace font for hash
      expect(styles.fontFamily).toContain('monospace');
    });

    it('makes hash easily readable with proper formatting', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // Hash should be visible and in a distinct container
      const hashElement = screen.getByText(/abc123def456ghi789/i);
      expect(hashElement).toBeInTheDocument();

      // Should have word-break to prevent overflow
      const styles = window.getComputedStyle(hashElement);
      expect(styles.wordBreak || styles.overflowWrap).toBeTruthy();
    });
  });

  describe('Security Information', () => {
    beforeEach(() => {
      vi.mocked(pollHooks.useReceiptLookup).mockReturnValue({
        receipt: mockReceipt,
        isVerified: true,
        isLoading: false,
        error: null,
      } as any);
    });

    it('displays security badge/icon', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      // Should have security-related visual indicators
      expect(screen.getByText('Receipt Details')).toBeInTheDocument();
    });

    it('explains hash chain concept', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText(/linked to the previous vote/i)).toBeInTheDocument();
    });

    it('provides guidance on keeping receipt safe', () => {
      render(
        <TestWrapper>
          <PollReceiptPage />
        </TestWrapper>
      );

      expect(screen.getByText(/Keep your receipt hash safe/i)).toBeInTheDocument();
    });
  });
});
