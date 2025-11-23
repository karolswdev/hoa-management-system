import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Accessibility mode types
 * - standard: Default theme with normal contrast and font sizes
 * - high-vis: High contrast theme with increased font sizes (20-25% larger)
 */
export type AccessibilityMode = 'standard' | 'high-vis';

/**
 * Complete accessibility preferences object
 */
export interface AccessibilityPreferences {
  /** Current accessibility mode (standard or high-vis) */
  mode: AccessibilityMode;
  /** Whether to show contextual help icons for complex form fields */
  showHelpers: boolean;
  /** Whether to respect user's reduced motion preference */
  reducedMotion: boolean;
}

/**
 * Context type for accessibility features
 */
interface AccessibilityContextType {
  /** Current accessibility preferences */
  preferences: AccessibilityPreferences;
  /** Whether high visibility mode is active */
  isHighVisibility: boolean;
  /** Whether contextual helpers should be shown */
  showHelpers: boolean;
  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
  /** Toggle high visibility mode on/off */
  toggleHighVisibility: () => void;
  /** Set high visibility mode explicitly */
  setHighVisibility: (enabled: boolean) => void;
  /** Toggle contextual helpers on/off */
  toggleHelpers: () => void;
  /** Set contextual helpers explicitly */
  setShowHelpers: (enabled: boolean) => void;
  /** Set reduced motion preference explicitly */
  setReducedMotion: (enabled: boolean) => void;
  /** Reset all preferences to defaults */
  resetPreferences: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * localStorage key for persisting accessibility preferences
 */
const STORAGE_KEY = 'hoa_accessibility_mode';

/**
 * Default accessibility preferences
 */
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  mode: 'standard',
  showHelpers: false,
  reducedMotion: false,
};

/**
 * Detect if user prefers reduced motion from system settings
 */
const getSystemReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Load preferences from localStorage with fallback to defaults
 */
const loadPreferences = (): AccessibilityPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with system reduced motion preference
      return {
        ...DEFAULT_PREFERENCES,
        reducedMotion: getSystemReducedMotion(),
      };
    }

    const parsed = JSON.parse(stored);

    // Validate parsed data
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        ...DEFAULT_PREFERENCES,
        reducedMotion: getSystemReducedMotion(),
      };
    }

    // Merge with defaults to handle missing properties
    return {
      mode: parsed.mode === 'high-vis' ? 'high-vis' : 'standard',
      showHelpers: typeof parsed.showHelpers === 'boolean' ? parsed.showHelpers : DEFAULT_PREFERENCES.showHelpers,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : getSystemReducedMotion(),
    };
  } catch (error) {
    console.error('Error loading accessibility preferences:', error);
    return {
      ...DEFAULT_PREFERENCES,
      reducedMotion: getSystemReducedMotion(),
    };
  }
};

/**
 * Save preferences to localStorage
 */
const savePreferences = (preferences: AccessibilityPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving accessibility preferences:', error);
  }
};

interface AccessibilityProviderProps {
  children: ReactNode;
  /** Optional initial preferences (useful for testing or config flag bootstrap) */
  initialPreferences?: Partial<AccessibilityPreferences>;
}

/**
 * AccessibilityProvider component
 *
 * Manages accessibility preferences including high visibility mode, contextual helpers,
 * and reduced motion settings. Persists preferences to localStorage for guest/member users.
 *
 * @example
 * ```tsx
 * <AccessibilityProvider>
 *   <App />
 * </AccessibilityProvider>
 * ```
 *
 * @example With initial preferences from config flags
 * ```tsx
 * <AccessibilityProvider initialPreferences={{ mode: 'high-vis' }}>
 *   <App />
 * </AccessibilityProvider>
 * ```
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialPreferences
}) => {
  // Load initial state from localStorage or use provided initial preferences
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const loaded = loadPreferences();
    if (initialPreferences) {
      return {
        ...loaded,
        ...initialPreferences,
      };
    }
    return loaded;
  });

  // Sync preferences to localStorage whenever they change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Listen for system reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: event.matches,
      }));
    };

    // Use the modern addEventListener API
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleHighVisibility = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      mode: prev.mode === 'standard' ? 'high-vis' : 'standard',
    }));
  }, []);

  const setHighVisibility = useCallback((enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      mode: enabled ? 'high-vis' : 'standard',
    }));
  }, []);

  const toggleHelpers = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      showHelpers: !prev.showHelpers,
    }));
  }, []);

  const setShowHelpers = useCallback((enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      showHelpers: enabled,
    }));
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      reducedMotion: enabled,
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences({
      ...DEFAULT_PREFERENCES,
      reducedMotion: getSystemReducedMotion(),
    });
  }, []);

  const value: AccessibilityContextType = {
    preferences,
    isHighVisibility: preferences.mode === 'high-vis',
    showHelpers: preferences.showHelpers,
    reducedMotion: preferences.reducedMotion,
    toggleHighVisibility,
    setHighVisibility,
    toggleHelpers,
    setShowHelpers,
    setReducedMotion,
    resetPreferences,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Hook to access accessibility context
 *
 * @throws Error if used outside of AccessibilityProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isHighVisibility, toggleHighVisibility } = useAccessibility();
 *
 *   return (
 *     <button onClick={toggleHighVisibility}>
 *       {isHighVisibility ? 'Disable' : 'Enable'} High Visibility
 *     </button>
 *   );
 * }
 * ```
 */
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
