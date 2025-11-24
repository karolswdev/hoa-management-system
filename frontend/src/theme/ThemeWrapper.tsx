import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import type { ReactNode } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { createAppTheme } from './theme';

interface ThemeWrapperProps {
  children: ReactNode;
}

/**
 * ThemeWrapper component
 *
 * Bridges AccessibilityContext with MUI ThemeProvider by dynamically
 * creating and applying the appropriate theme based on accessibility mode.
 *
 * This component must be rendered as a child of AccessibilityProvider
 * to access the current accessibility mode preference.
 *
 * The theme is memoized to prevent unnecessary re-creation on unrelated
 * re-renders, only updating when the accessibility mode changes.
 *
 * @example
 * ```tsx
 * <AccessibilityProvider>
 *   <ThemeWrapper>
 *     <App />
 *   </ThemeWrapper>
 * </AccessibilityProvider>
 * ```
 */
export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const { preferences } = useAccessibility();

  // Memoize theme creation to avoid unnecessary re-renders
  // Only re-create theme when accessibility mode changes
  const theme = useMemo(
    () => createAppTheme(preferences.mode),
    [preferences.mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
