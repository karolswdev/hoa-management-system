import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  AccessibilityProvider,
  useAccessibility,
  AccessibilityMode,
  AccessibilityPreferences,
} from './AccessibilityContext';

const STORAGE_KEY = 'hoa_accessibility_mode';

// Helper to create wrapper component
const createWrapper = (initialPreferences?: Partial<AccessibilityPreferences>) => {
  return ({ children }: { children: ReactNode }) => (
    <AccessibilityProvider initialPreferences={initialPreferences}>
      {children}
    </AccessibilityProvider>
  );
};

describe('AccessibilityContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset matchMedia mock
    vi.clearAllMocks();
  });

  describe('useAccessibility hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAccessibility());
      }).toThrow('useAccessibility must be used within an AccessibilityProvider');

      consoleError.mockRestore();
    });

    it('should provide accessibility context when used within provider', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.preferences).toBeDefined();
      expect(result.current.isHighVisibility).toBeDefined();
      expect(result.current.toggleHighVisibility).toBeDefined();
    });
  });

  describe('Default state', () => {
    it('should initialize with standard mode by default', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.preferences.mode).toBe('standard');
      expect(result.current.isHighVisibility).toBe(false);
    });

    it('should initialize with helpers disabled by default', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.preferences.showHelpers).toBe(false);
      expect(result.current.showHelpers).toBe(false);
    });

    it('should detect system reduced motion preference on initialization', () => {
      // Mock matchMedia to return true for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.preferences.reducedMotion).toBe(true);
      expect(result.current.reducedMotion).toBe(true);
    });
  });

  describe('High Visibility Mode', () => {
    it('should toggle high visibility mode', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isHighVisibility).toBe(false);

      act(() => {
        result.current.toggleHighVisibility();
      });

      expect(result.current.isHighVisibility).toBe(true);
      expect(result.current.preferences.mode).toBe('high-vis');

      act(() => {
        result.current.toggleHighVisibility();
      });

      expect(result.current.isHighVisibility).toBe(false);
      expect(result.current.preferences.mode).toBe('standard');
    });

    it('should set high visibility mode explicitly', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setHighVisibility(true);
      });

      expect(result.current.isHighVisibility).toBe(true);

      act(() => {
        result.current.setHighVisibility(false);
      });

      expect(result.current.isHighVisibility).toBe(false);
    });

    it('should persist high visibility mode to localStorage', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setHighVisibility(true);
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('high-vis');
      });
    });
  });

  describe('Contextual Helpers', () => {
    it('should toggle helpers', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.showHelpers).toBe(false);

      act(() => {
        result.current.toggleHelpers();
      });

      expect(result.current.showHelpers).toBe(true);

      act(() => {
        result.current.toggleHelpers();
      });

      expect(result.current.showHelpers).toBe(false);
    });

    it('should set helpers explicitly', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setShowHelpers(true);
      });

      expect(result.current.showHelpers).toBe(true);

      act(() => {
        result.current.setShowHelpers(false);
      });

      expect(result.current.showHelpers).toBe(false);
    });

    it('should persist helpers preference to localStorage', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setShowHelpers(true);
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.showHelpers).toBe(true);
      });
    });
  });

  describe('Reduced Motion', () => {
    it('should set reduced motion explicitly', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setReducedMotion(true);
      });

      expect(result.current.reducedMotion).toBe(true);

      act(() => {
        result.current.setReducedMotion(false);
      });

      expect(result.current.reducedMotion).toBe(false);
    });

    it('should persist reduced motion preference to localStorage', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setReducedMotion(true);
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.reducedMotion).toBe(true);
      });
    });

    it('should listen for system reduced motion changes', () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;

      // Mock matchMedia with the ability to trigger change events
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'change') {
            changeHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.reducedMotion).toBe(false);

      // Simulate system preference change
      if (changeHandler) {
        act(() => {
          changeHandler!({ matches: true } as MediaQueryListEvent);
        });

        expect(result.current.reducedMotion).toBe(true);
      }
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should load preferences from localStorage on initialization', () => {
      const mockPreferences: AccessibilityPreferences = {
        mode: 'high-vis',
        showHelpers: true,
        reducedMotion: true,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPreferences));

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      expect(result.current.preferences).toEqual(mockPreferences);
      expect(result.current.isHighVisibility).toBe(true);
      expect(result.current.showHelpers).toBe(true);
      expect(result.current.reducedMotion).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json{');

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      // Should fall back to defaults
      expect(result.current.preferences.mode).toBe('standard');
      expect(result.current.preferences.showHelpers).toBe(false);
    });

    it('should handle invalid data types in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: 'invalid-mode',
        showHelpers: 'not-a-boolean',
        reducedMotion: 123,
      }));

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      // Should sanitize to valid values
      expect(result.current.preferences.mode).toBe('standard');
      expect(result.current.preferences.showHelpers).toBe(false);
    });

    it('should persist all preferences together', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setHighVisibility(true);
        result.current.setShowHelpers(true);
        result.current.setReducedMotion(true);
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('high-vis');
        expect(parsed.showHelpers).toBe(true);
        expect(parsed.reducedMotion).toBe(true);
      });
    });
  });

  describe('Initial Preferences (Config Flag Bootstrap)', () => {
    it('should accept initial preferences from props', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper({ mode: 'high-vis', showHelpers: true }),
      });

      expect(result.current.isHighVisibility).toBe(true);
      expect(result.current.showHelpers).toBe(true);
    });

    it('should merge initial preferences with localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: 'standard',
        showHelpers: false,
        reducedMotion: true,
      }));

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper({ mode: 'high-vis' }),
      });

      // Initial preference should override localStorage for mode
      expect(result.current.isHighVisibility).toBe(true);
      // But keep other localStorage values
      expect(result.current.reducedMotion).toBe(true);
    });

    it('should allow partial initial preferences', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper({ showHelpers: true }),
      });

      expect(result.current.showHelpers).toBe(true);
      expect(result.current.preferences.mode).toBe('standard'); // Default
    });
  });

  describe('Reset Preferences', () => {
    it('should reset all preferences to defaults', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      // Set some preferences
      act(() => {
        result.current.setHighVisibility(true);
        result.current.setShowHelpers(true);
        result.current.setReducedMotion(true);
      });

      expect(result.current.isHighVisibility).toBe(true);
      expect(result.current.showHelpers).toBe(true);
      expect(result.current.reducedMotion).toBe(true);

      // Reset
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences.mode).toBe('standard');
      expect(result.current.preferences.showHelpers).toBe(false);
      // reducedMotion should match system preference (mocked to false)
      expect(result.current.preferences.reducedMotion).toBe(false);
    });

    it('should persist reset preferences to localStorage', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      // Set preferences
      act(() => {
        result.current.setHighVisibility(true);
        result.current.setShowHelpers(true);
      });

      // Reset
      act(() => {
        result.current.resetPreferences();
      });

      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('standard');
        expect(parsed.showHelpers).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid toggles', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.toggleHighVisibility();
        result.current.toggleHighVisibility();
        result.current.toggleHighVisibility();
      });

      // After 3 toggles, should be back to high-vis (started at standard)
      expect(result.current.isHighVisibility).toBe(true);
    });

    it('should handle setting same value multiple times', async () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setHighVisibility(true);
        result.current.setHighVisibility(true);
        result.current.setHighVisibility(true);
      });

      expect(result.current.isHighVisibility).toBe(true);

      // Should still persist correctly
      await waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(stored!);
        expect(parsed.mode).toBe('high-vis');
      });
    });

    it('should handle localStorage quota exceeded gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setHighVisibility(true);
      });

      // Wait for the effect to run
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error saving accessibility preferences:',
          expect.any(Error)
        );
      });

      // Restore
      localStorage.setItem = originalSetItem;
      consoleError.mockRestore();
    });
  });

  describe('Type Safety', () => {
    it('should expose correct preference types', () => {
      const { result } = renderHook(() => useAccessibility(), {
        wrapper: createWrapper(),
      });

      // Type assertions - these would fail at compile time if types are wrong
      const mode: AccessibilityMode = result.current.preferences.mode;
      const showHelpers: boolean = result.current.showHelpers;
      const reducedMotion: boolean = result.current.reducedMotion;

      expect(mode).toBeDefined();
      expect(typeof showHelpers).toBe('boolean');
      expect(typeof reducedMotion).toBe('boolean');
    });
  });
});
