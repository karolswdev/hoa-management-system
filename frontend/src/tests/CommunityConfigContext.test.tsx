import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommunityConfigProvider, useCommunityConfig } from '../contexts/CommunityConfigContext';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getCommunityConfig: vi.fn(),
  },
}));

import { apiService } from '../services/api';

// Test component that uses the context
const TestConsumer = () => {
  const { config, loading, error } = useCommunityConfig();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'done'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <span data-testid="hoa-name">{config.hoa_name}</span>
      <span data-testid="hoa-description">{config.hoa_description}</span>
    </div>
  );
};

describe('CommunityConfigContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CommunityConfigProvider', () => {
    it('provides default config while loading', async () => {
      (apiService.getCommunityConfig as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CommunityConfigProvider>
          <TestConsumer />
        </CommunityConfigProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('hoa-name')).toHaveTextContent('HOA Community Hub');
    });

    it('loads and provides config from API', async () => {
      (apiService.getCommunityConfig as any).mockResolvedValue({
        hoa_name: 'Sunny Meadows HOA',
        hoa_description: 'A great place to live',
        contact_email: 'contact@sunny.com',
      });

      render(
        <CommunityConfigProvider>
          <TestConsumer />
        </CommunityConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      expect(screen.getByTestId('hoa-name')).toHaveTextContent('Sunny Meadows HOA');
      expect(screen.getByTestId('hoa-description')).toHaveTextContent('A great place to live');
    });

    it('falls back to defaults on API error', async () => {
      (apiService.getCommunityConfig as any).mockRejectedValue(new Error('Network error'));

      render(
        <CommunityConfigProvider>
          <TestConsumer />
        </CommunityConfigProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      // Should use defaults
      expect(screen.getByTestId('hoa-name')).toHaveTextContent('HOA Community Hub');
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load community configuration');
    });
  });

  describe('useCommunityConfig hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useCommunityConfig must be used within a CommunityConfigProvider');

      consoleSpy.mockRestore();
    });
  });
});
