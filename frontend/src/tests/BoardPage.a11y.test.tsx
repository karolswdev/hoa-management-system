import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../pages/BoardPage';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as boardHooks from '../hooks/useBoard';

// Extend expect matchers
expect.extend(toHaveNoViolations);

// Mock the board hooks
vi.mock('../hooks/useBoard');

// Mock board data
const mockBoardMembers = [
  {
    id: 1,
    name: 'John Doe',
    position: 'President',
    email: 'john@hoa.com',
    phone: '555-0100',
    term_start: '2023-01-01',
    term_end: null,
    rank: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    position: 'Vice President',
    email: 'jane@hoa.com',
    term_start: '2023-01-01',
    term_end: null,
    rank: 2,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockHistoryItems = [
  {
    id: 1,
    member_name: 'Alice Johnson',
    position: 'President',
    term_start: '2021-01-01',
    term_end: '2022-12-31',
    created_at: '2021-01-01T00:00:00Z',
  },
  {
    id: 2,
    member_name: 'Bob Williams',
    position: 'Treasurer',
    term_start: '2021-01-01',
    term_end: '2022-12-31',
    created_at: '2021-01-01T00:00:00Z',
  },
];

const mockBoardConfig = {
  visibility: 'public' as const,
  showContactInfo: true,
  historyVisibility: 'members-only' as const,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; isHighVis?: boolean }> = ({
  children,
  isHighVis = false,
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AccessibilityProvider
          initialPreferences={{
            mode: isHighVis ? 'high-vis' : 'standard',
            showHelpers: true,
          }}
        >
          <ThemeWrapper>
            <NotificationProvider>
              <AuthProvider>{children}</AuthProvider>
            </NotificationProvider>
          </ThemeWrapper>
        </AccessibilityProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BoardPage Accessibility Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock useBoardRoster
    vi.spyOn(boardHooks, 'useBoardRoster').mockReturnValue({
      members: mockBoardMembers,
      isSkeleton: false,
      error: null,
      lastFetched: new Date().toISOString(),
      isLoading: false,
      isError: false,
      data: { members: mockBoardMembers, lastFetched: new Date().toISOString() },
      refetch: vi.fn(),
    } as any);

    // Mock useBoardHistory
    vi.spyOn(boardHooks, 'useBoardHistory').mockReturnValue({
      historyItems: mockHistoryItems,
      pagination: {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      },
      isSkeleton: false,
      error: null,
      isLoading: false,
      isError: false,
      data: {
        data: mockHistoryItems,
        pagination: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
        },
      },
      refetch: vi.fn(),
    } as any);

    // Mock useBoardConfig
    vi.spyOn(boardHooks, 'useBoardConfig').mockReturnValue({
      config: mockBoardConfig,
      visibility: mockBoardConfig.visibility,
      historyVisibility: mockBoardConfig.historyVisibility,
      showContactInfo: mockBoardConfig.showContactInfo,
      configLoading: false,
      isLoading: false,
      isError: false,
      error: null,
      data: mockBoardConfig,
      refetch: vi.fn(),
    } as any);

    // Mock useBoardContact
    vi.spyOn(boardHooks, 'useBoardContact').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as any);
  });

  describe('Standard Mode Accessibility', () => {
    it('should have no accessibility violations in roster view (standard mode)', async () => {
      const { container } = render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Board of Directors')).toBeInTheDocument();
      });

      // Run axe accessibility checks
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Board of Directors')).toBeInTheDocument();
      });

      // Check for proper tab structure
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      expect(tabList).toHaveAttribute('aria-label', 'Board sections');

      // Check for tab panels
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('aria-controls', `board-tabpanel-${index}`);
      });
    });

    it('should have accessible board roster region', async () => {
      render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const rosterRegion = screen.getByRole('region', { name: /board members roster/i });
        expect(rosterRegion).toBeInTheDocument();
      });
    });
  });

  describe('High-Visibility Mode Accessibility', () => {
    it('should have no accessibility violations in high-vis mode', async () => {
      const { container } = render(
        <TestWrapper isHighVis={true}>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Board of Directors')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain proper contrast ratios in high-vis mode', async () => {
      const { container } = render(
        <TestWrapper isHighVis={true}>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Board of Directors')).toBeInTheDocument();
      });

      // Check contrast compliance
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results.violations.filter((v) => v.id === 'color-contrast')).toHaveLength(0);
    });
  });

  describe('Loading State Accessibility', () => {
    it('should have no violations during skeleton loading state', async () => {
      // Override mocks to show loading state
      vi.spyOn(boardHooks, 'useBoardRoster').mockReturnValue({
        members: [],
        isSkeleton: true,
        error: null,
        lastFetched: undefined,
        isLoading: true,
        isError: false,
        data: undefined,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(boardHooks, 'useBoardConfig').mockReturnValue({
        config: undefined,
        visibility: undefined,
        historyVisibility: undefined,
        showContactInfo: false,
        configLoading: true,
        isLoading: true,
        isError: false,
        error: null,
        data: undefined,
        refetch: vi.fn(),
      } as any);

      const { container } = render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Board of Directors')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Feature Flag Gating Accessibility', () => {
    it('should have accessible alerts when roster is restricted to members', async () => {
      // Mock members-only visibility
      vi.spyOn(boardHooks, 'useBoardConfig').mockReturnValue({
        config: { ...mockBoardConfig, visibility: 'members-only' },
        visibility: 'members-only' as const,
        historyVisibility: mockBoardConfig.historyVisibility,
        showContactInfo: false,
        configLoading: false,
        isLoading: false,
        isError: false,
        error: null,
        data: { ...mockBoardConfig, visibility: 'members-only' },
        refetch: vi.fn(),
      } as any);

      const { container } = render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/only available to authenticated HOA members/i);
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Contact Form Accessibility', () => {
    it('should have accessible form when contact tab is active', async () => {
      const { container } = render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      // Click on contact tab
      const contactTab = screen.getByRole('tab', { name: /contact/i });
      contactTab.click();

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and descriptions', async () => {
      render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      // Switch to contact tab
      const contactTab = screen.getByRole('tab', { name: /contact/i });
      contactTab.click();

      await waitFor(() => {
        // Check for form with proper structure
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();

        // Check for input fields by ID (more reliable than role queries for MUI)
        expect(screen.getByLabelText(/full name/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByLabelText(/subject/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByLabelText(/message/i, { selector: 'textarea' })).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between tabs', async () => {
      render(
        <TestWrapper>
          <BoardPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      });

      // MUI Tabs uses roving tabindex pattern - only selected tab is focusable
      // This is an accepted accessibility pattern for tab widgets per ARIA spec
      const tabs = screen.getAllByRole('tab');
      const selectedTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      expect(selectedTab).toHaveAttribute('tabindex', '0');

      // Other tabs should have tabindex="-1" (roving tabindex pattern)
      const unselectedTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'false');
      unselectedTabs.forEach((tab) => {
        expect(tab).toHaveAttribute('tabindex', '-1');
      });
    });
  });
});
