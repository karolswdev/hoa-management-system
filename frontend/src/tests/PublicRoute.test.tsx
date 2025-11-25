import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicRoute from '../components/common/PublicRoute';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../contexts/AuthContext';

const TestChild = () => <div data-testid="child">Child Content</div>;

describe('PublicRoute', () => {
  it('shows loading spinner while checking authentication', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestChild />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children when not authenticated', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <PublicRoute>
          <TestChild />
        </PublicRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <PublicRoute>
          <TestChild />
        </PublicRoute>
      </MemoryRouter>
    );

    // Child should not be rendered when redirecting
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });
});
