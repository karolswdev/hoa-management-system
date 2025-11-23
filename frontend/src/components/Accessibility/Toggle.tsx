import React, { useRef } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

/**
 * Analytics event structure for accessibility toggle interactions
 * Follows observability spec from UI_UX_Architecture.md:4-6
 */
interface AccessibilityAnalyticsEvent {
  action: 'toggle';
  entity: 'accessibility';
  context: 'navbar' | 'drawer';
  featureFlagState: {
    highVis: boolean;
  };
}

/**
 * Props for AccessibilityToggle component
 */
interface AccessibilityToggleProps {
  /**
   * Visual variant determines which context the toggle is used in
   * - 'navbar': Default AppBar toolbar usage
   * - 'drawer': Mobile drawer / sidebar usage
   */
  variant?: 'navbar' | 'drawer';

  /**
   * Optional callback fired when toggle is clicked
   * Receives the new high visibility state
   */
  onToggle?: (isHighVis: boolean) => void;

  /**
   * Optional analytics callback for tracking toggle interactions
   * Only fires once per session to avoid spamming logs
   */
  onAnalytics?: (event: AccessibilityAnalyticsEvent) => void;
}

/**
 * AccessibilityToggle Component
 *
 * A reusable button that toggles high visibility mode with proper ARIA states,
 * tooltips, and accessibility features. Meets WCAG 2.5.5 minimum touch target
 * requirements (44px standard, 52px in high-vis mode).
 *
 * Features:
 * - Icon button with Visibility/VisibilityOff icons
 * - Tooltip with contextual help text
 * - aria-pressed state for screen readers
 * - Keyboard navigation support
 * - Theme-aware sizing from tokens.json
 * - Optional analytics tracking (fires once per session)
 *
 * @example
 * ```tsx
 * // In AppBar toolbar
 * <AccessibilityToggle variant="navbar" />
 *
 * // In mobile drawer
 * <AccessibilityToggle variant="drawer" />
 *
 * // With analytics
 * <AccessibilityToggle
 *   variant="navbar"
 *   onAnalytics={(event) => console.log('Analytics:', event)}
 * />
 * ```
 */
const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({
  variant = 'navbar',
  onToggle,
  onAnalytics,
}) => {
  const theme = useTheme();
  const { isHighVisibility, toggleHighVisibility } = useAccessibility();
  const hasTrackedRef = useRef(false);

  /**
   * Handle toggle click - fires analytics once per session
   */
  const handleToggle = () => {
    const newState = !isHighVisibility;

    // Toggle the accessibility mode
    toggleHighVisibility();

    // Fire optional callback
    if (onToggle) {
      onToggle(newState);
    }

    // Fire analytics event only once per session
    if (!hasTrackedRef.current && onAnalytics) {
      hasTrackedRef.current = true;
      onAnalytics({
        action: 'toggle',
        entity: 'accessibility',
        context: variant,
        featureFlagState: {
          highVis: newState,
        },
      });
    }
  };

  // Determine tooltip text based on current state
  const tooltipText = isHighVisibility
    ? 'Disable High Visibility Mode'
    : 'Enable High Visibility Mode';

  // Determine aria-label for screen readers
  const ariaLabel = isHighVisibility
    ? 'Disable high visibility mode'
    : 'Enable high visibility mode';

  return (
    <Tooltip title={tooltipText} arrow>
      <IconButton
        onClick={handleToggle}
        color="inherit"
        aria-label={ariaLabel}
        aria-pressed={isHighVisibility}
        sx={{
          // Use theme sizing tokens for responsive touch targets
          // Standard mode: 44px (tokens.modes.standard.sizing.target.button)
          // High-vis mode: 52px (tokens.modes['high-vis'].sizing.target.button)
          minWidth: theme.spacing(isHighVisibility ? 6.5 : 5.5),
          minHeight: theme.spacing(isHighVisibility ? 6.5 : 5.5),
          // Apply focus ring from theme tokens
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.info.main}`,
            outlineOffset: '2px',
          },
        }}
      >
        {isHighVisibility ? (
          <VisibilityOff
            sx={{
              fontSize: isHighVisibility ? 28 : 24,
            }}
          />
        ) : (
          <Visibility
            sx={{
              fontSize: isHighVisibility ? 28 : 24,
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default AccessibilityToggle;
export type { AccessibilityToggleProps, AccessibilityAnalyticsEvent };
