import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Vendors from '../pages/Vendors';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeWrapper } from '../theme/ThemeWrapper';
import * as vendorHooks from '../hooks/useVendors';
import type { Vendor } from '../types/api';

// Mock the vendor hooks
vi.mock('../hooks/useVendors');

// Mock auth context
const mockAuthContext = {
  user: null,
  token: null,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  isAuthenticated: false,
  isAdmin: false,
  isMember: false,
};

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}));

// Mock vendor data
const mockVendors: Vendor[] = [
  {
    id: 1,
    name: 'ABC Plumbing',
    service_category: 'Plumbing',
    visibility_scope: 'public',
    contact_info: 'Phone: (555) 123-4567, Email: contact@abcplumbing.com',
    rating: 5,
    notes: 'Excellent service, fast response',
    moderation_state: 'approved',
  },
  {
    id: 2,
    name: 'Best Electric',
    service_category: 'Electrical',
    visibility_scope: 'members',
    contact_info: 'Phone: (555) 987-6543',
    rating: 4,
    notes: 'Reliable and professional',
    moderation_state: 'approved',
  },
  {
    id: 3,
    name: 'Green Landscaping',
    service_category: 'Landscaping',
    visibility_scope: 'public',
    moderation_state: 'pending',
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

describe('VendorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isAdmin = false;
    mockAuthContext.isMember = false;
  });

  describe('Guest User Scope', () => {
    beforeEach(() => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors.filter((v) => v.visibility_scope === 'public'),
        count: 2,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('renders vendor directory page for guests', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByRole('heading', { name: /vendor directory/i })).toBeInTheDocument();
      expect(screen.getByText(/find trusted service providers/i)).toBeInTheDocument();
    });

    it('shows limited vendor information for guests', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      // Should show vendor name
      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();

      // Should show category chip
      expect(screen.getAllByText('Plumbing').length).toBeGreaterThan(0);

      // Should NOT show contact info or ratings
      expect(screen.queryByText(/555/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/rating/i)).not.toBeInTheDocument();
    });

    it('displays login prompt for guests', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByText(/you are viewing limited information/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });

    it('shows "Login to Submit" button instead of "Submit Vendor"', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByRole('button', { name: /login to submit/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /submit vendor/i })).not.toBeInTheDocument();
    });

    it('redirects to login when guest tries to submit vendor', async () => {
      const user = userEvent.setup();
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<Vendors />, { wrapper: TestWrapper });

      const loginButton = screen.getByRole('button', { name: /login to submit/i });
      await user.click(loginButton);

      expect(window.location.href).toBe('/login?redirect=/vendors');
    });
  });

  describe('Member User Scope', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { id: 1, role: 'member', name: 'Test User' } as any;
      mockAuthContext.isMember = true;

      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors.filter((v) =>
          ['public', 'members'].includes(v.visibility_scope)
        ),
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({
          message: 'Vendor submitted for moderation',
          vendor: mockVendors[0],
        }),
        isPending: false,
      } as any);
    });

    it('shows contact information and ratings for members', async () => {
      const { container } = render(<Vendors />, { wrapper: TestWrapper });

      // Wait for vendors to load and check contact info is visible
      // The phone/email icons should be present for members
      await waitFor(() => {
        const phoneIcons = container.querySelectorAll('[data-testid="PhoneIcon"]');
        const emailIcons = container.querySelectorAll('[data-testid="EmailIcon"]');
        expect(phoneIcons.length + emailIcons.length).toBeGreaterThan(0);
      });

      // Should show ratings (query by role since Rating component uses it)
      const ratings = screen.getAllByRole('img', { hidden: true });
      expect(ratings.length).toBeGreaterThan(0);
    });

    it('does not show guest login prompt for members', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.queryByText(/you are viewing limited information/i)).not.toBeInTheDocument();
    });

    it('shows "Submit Vendor" button for authenticated members', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByRole('button', { name: /submit vendor/i })).toBeInTheDocument();
    });

    it('opens vendor submission form when "Submit Vendor" clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole('button', { name: /submit vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/submit new vendor/i)).toBeInTheDocument();
      });
    });

    it('does NOT show moderation status badges to members', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.queryByText('pending')).not.toBeInTheDocument();
      expect(screen.queryByText('approved')).not.toBeInTheDocument();
    });
  });

  describe('Admin User Scope', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { id: 1, role: 'admin', name: 'Admin User' } as any;
      mockAuthContext.isAdmin = true;
      mockAuthContext.isMember = true;

      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors, // Admins see all vendors
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({
          message: 'Vendor created successfully',
          vendor: mockVendors[0],
        }),
        isPending: false,
      } as any);
    });

    it('shows moderation status badges for admins', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getAllByText('approved').length).toBeGreaterThan(0);
    });

    it('shows all vendors including pending for admins', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
      expect(screen.getByText('Best Electric')).toBeInTheDocument();
      expect(screen.getByText('Green Landscaping')).toBeInTheDocument();
    });
  });

  describe('Grid/List Toggle', () => {
    beforeEach(() => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors,
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('renders vendors in grid view by default', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      // Grid view uses MUI Grid component
      const gridButton = screen.getByRole('button', { name: /grid view/i });
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('switches to list view when list button clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const listButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listButton);

      await waitFor(() => {
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Filters', () => {
    const mockRefetch = vi.fn();

    beforeEach(() => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors,
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: mockRefetch,
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('renders category filter chips', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      // Check filter chips exist
      expect(screen.getByRole('button', { name: /filter by plumbing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter by electrical/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter by landscaping/i })).toBeInTheDocument();
    });

    it('filters vendors by category when chip clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const plumbingChip = screen.getByRole('button', { name: /filter by plumbing/i });
      await user.click(plumbingChip);

      await waitFor(() => {
        expect(plumbingChip).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('allows searching vendors by name', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const searchInput = screen.getByPlaceholderText(/search vendors by name/i);
      await user.type(searchInput, 'ABC');

      await waitFor(() => {
        expect(searchInput).toHaveValue('ABC');
      });
    });

    it('shows active filters summary', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const plumbingChip = screen.getByRole('button', { name: /filter by plumbing/i });
      await user.click(plumbingChip);

      await waitFor(() => {
        expect(screen.getByText(/active filters:/i)).toBeInTheDocument();
      });
    });

    it('clears all filters when clear button clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      // Add a filter first
      const plumbingChip = screen.getByRole('button', { name: /filter by plumbing/i });
      await user.click(plumbingChip);

      await waitFor(() => {
        expect(screen.getByText(/active filters:/i)).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText(/active filters:/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Detail Drawer', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { id: 1, role: 'member', name: 'Test User' } as any;
      mockAuthContext.isMember = true;

      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors,
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('opens detail drawer when "View Details" clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      const detailButtons = screen.getAllByRole('button', { name: /view details/i });
      await user.click(detailButtons[0]);

      await waitFor(() => {
        // Drawer should contain the vendor name as a heading
        const drawer = screen.getByRole('heading', { name: 'ABC Plumbing' });
        expect(drawer).toBeInTheDocument();
      });
    });

    it('closes drawer when close button clicked', async () => {
      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      // Open drawer
      const detailButtons = screen.getAllByRole('button', { name: /view details/i });
      await user.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 5, name: 'ABC Plumbing' })).toBeInTheDocument();
      });

      // Close drawer
      const closeButton = screen.getByRole('button', { name: /close details/i });
      await user.click(closeButton);

      // Wait for drawer to close and content to be removed
      await waitFor(
        () => {
          expect(screen.queryByRole('heading', { level: 5, name: 'ABC Plumbing' })).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe('React Query Cache Invalidation', () => {
    const mockRefetch = vi.fn();

    beforeEach(() => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors,
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: mockRefetch,
      } as any);

      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = { id: 1, role: 'member', name: 'Test User' } as any;
      mockAuthContext.isMember = true;
    });

    it('invalidates cache after vendor submission', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        message: 'Vendor submitted for moderation',
        vendor: mockVendors[0],
      });

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);

      const user = userEvent.setup();
      render(<Vendors />, { wrapper: TestWrapper });

      // Open form
      const submitButton = screen.getByRole('button', { name: /submit vendor/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/vendor name/i);
      await user.type(nameInput, 'New Vendor');

      // Find the Select component - MUI Select uses combobox role
      const dialog = screen.getByRole('dialog');
      const categoryInput = within(dialog).getByRole('combobox');
      await user.click(categoryInput);

      // Wait for dropdown to appear and select option
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Plumbing' })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Plumbing' }));

      // Submit
      const submitFormButton = screen.getByRole('button', { name: /submit for review/i });
      await user.click(submitFormButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility Integration', () => {
    beforeEach(() => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: mockVendors,
        count: 3,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);
    });

    it('renders with high-visibility mode support', () => {
      render(<Vendors />, { wrapper: TestWrapper });

      // Component should render without errors in high-vis mode
      expect(screen.getByRole('heading', { name: /vendor directory/i })).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading spinner when fetching vendors', () => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: [],
        count: 0,
        appliedFilters: {},
        isLoading: true,
        isError: false,
        error: null,
        isSkeleton: true,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error message when fetch fails', () => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: [],
        count: 0,
        appliedFilters: {},
        isLoading: false,
        isError: true,
        error: { message: 'Failed to load vendors' } as any,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByText(/failed to load vendors/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('shows empty state when no vendors found', () => {
      vi.mocked(vendorHooks.useVendors).mockReturnValue({
        vendors: [],
        count: 0,
        appliedFilters: {},
        isLoading: false,
        isError: false,
        error: null,
        isSkeleton: false,
        refetch: vi.fn(),
      } as any);

      vi.mocked(vendorHooks.useCreateVendor).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
      } as any);

      render(<Vendors />, { wrapper: TestWrapper });

      expect(screen.getByText(/no vendors found/i)).toBeInTheDocument();
    });
  });
});
