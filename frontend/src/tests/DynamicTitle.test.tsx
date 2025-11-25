import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DynamicTitle from '../components/common/DynamicTitle';
import { CommunityConfigProvider } from '../contexts/CommunityConfigContext';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getCommunityConfig: vi.fn(),
  },
}));

import { apiService } from '../services/api';

const renderWithProviders = (initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <CommunityConfigProvider>
        <DynamicTitle />
      </CommunityConfigProvider>
    </MemoryRouter>
  );
};

describe('DynamicTitle', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Original Title';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('sets document title with community name for dashboard', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Sunny Meadows HOA',
    });

    renderWithProviders('/dashboard');

    await vi.waitFor(() => {
      expect(document.title).toBe('Dashboard | Sunny Meadows HOA');
    });
  });

  it('uses default community name when loading', () => {
    (apiService.getCommunityConfig as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders('/dashboard');

    // Should use default while loading
    expect(document.title).toBe('Dashboard | HOA Community Hub');
  });

  it('sets correct title for announcements page', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/announcements');

    await vi.waitFor(() => {
      expect(document.title).toBe('Announcements | Test HOA');
    });
  });

  it('sets correct title for login page', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/login');

    await vi.waitFor(() => {
      expect(document.title).toBe('Sign In | Test HOA');
    });
  });

  it('sets correct title for admin pages', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/admin/users');

    await vi.waitFor(() => {
      expect(document.title).toBe('User Management | Test HOA');
    });
  });

  it('handles dynamic poll routes', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/polls/123');

    await vi.waitFor(() => {
      expect(document.title).toBe('Poll Details | Test HOA');
    });
  });

  it('handles poll receipt routes', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/polls/123/receipts/abc');

    await vi.waitFor(() => {
      expect(document.title).toBe('Poll Receipt | Test HOA');
    });
  });

  it('uses just community name for unknown routes', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    renderWithProviders('/unknown-page');

    await vi.waitFor(() => {
      expect(document.title).toBe('Test HOA');
    });
  });

  it('renders nothing (returns null)', async () => {
    (apiService.getCommunityConfig as any).mockResolvedValue({
      hoa_name: 'Test HOA',
    });

    const { container } = renderWithProviders('/dashboard');

    // DynamicTitle renders null, so nothing should be added to the container
    // The only thing in container should be the router structure
    expect(container.firstChild).toBeNull();
  });
});
