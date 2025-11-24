import React, { useState, useRef, useCallback } from 'react';
import {
  IconButton,
  Popover,
  Typography,
  Box,
  ClickAwayListener,
  useTheme,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

/**
 * Props for FormHelper component
 */
export interface FormHelperProps {
  /**
   * Contextual help text to display in the popover
   */
  helpText: string;

  /**
   * Optional aria-label for the help icon button
   * Defaults to "Help information"
   */
  ariaLabel?: string;

  /**
   * Optional id for the help content
   * Used for aria-describedby association
   */
  helpContentId?: string;

  /**
   * Optional data-testid for testing purposes
   */
  testId?: string;
}

/**
 * FormHelper Component
 *
 * A molecule component that renders a contextual help icon (?) with an accessible
 * popover containing help text. Only visible when accessibility helpers are enabled
 * via AccessibilityContext (showHelpers === true).
 *
 * Features:
 * - Conditional rendering based on accessibility context
 * - Accessible popover with proper ARIA attributes
 * - Focus trap when popover is open
 * - ESC key to close
 * - Click-away to close
 * - Theme-aware styling from tokens.json
 * - Meets WCAG 2.1 AA standards
 *
 * Design Tokens Used:
 * - Info Azure background for popover
 * - Onyx border in High Vis mode
 * - 12px border radius for popover
 * - 44px/52px minimum touch target (standard/high-vis)
 * - 24px/28px icon size (standard/high-vis)
 *
 * @example
 * ```tsx
 * <FormHelper
 *   helpText="Enter your full legal name as it appears on official documents."
 *   ariaLabel="Help for full name field"
 *   helpContentId="name-field-help"
 * />
 * ```
 *
 * @example With TextField
 * ```tsx
 * <Box display="flex" alignItems="center" gap={1}>
 *   <TextField
 *     label="Full Name"
 *     aria-describedby="name-field-help"
 *   />
 *   <FormHelper
 *     helpText="Enter your full legal name as it appears on official documents."
 *     helpContentId="name-field-help"
 *   />
 * </Box>
 * ```
 */
const FormHelper: React.FC<FormHelperProps> = ({
  helpText,
  ariaLabel = 'Help information',
  helpContentId,
  testId,
}) => {
  const theme = useTheme();
  const { showHelpers, isHighVisibility } = useAccessibility();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOpen = Boolean(anchorEl);
  const popoverId = helpContentId || `form-helper-popover-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Handle opening the popover
   */
  const handleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Handle closing the popover
   */
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    // Return focus to the trigger button
    buttonRef.current?.focus();
  }, []);

  /**
   * Handle ESC key to close popover
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    },
    [isOpen, handleClose]
  );

  // Don't render if helpers are disabled
  if (!showHelpers) {
    return null;
  }

  // Calculate icon size based on mode
  // Standard: 24px, High-vis: 28px (per tokens.json)
  const iconSize = isHighVisibility ? 28 : 24;

  // Calculate button size based on mode
  // Standard: 44px, High-vis: 52px (per tokens.json)
  const buttonSize = isHighVisibility ? 52 : 44;

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={handleOpen}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        data-testid={testId}
        onKeyDown={handleKeyDown}
        sx={{
          // Use theme spacing for consistent sizing
          minWidth: buttonSize,
          minHeight: buttonSize,
          // Info Azure color for the icon
          color: theme.palette.info.main,
          // High-vis mode border for better visibility
          border: isHighVisibility ? `2px solid ${theme.palette.info.main}` : 'none',
          borderRadius: '50%',
          // Hover state
          '&:hover': {
            backgroundColor: isHighVisibility
              ? 'rgba(29, 140, 216, 0.08)'
              : 'rgba(29, 140, 216, 0.04)',
          },
          // Focus ring from theme tokens
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.info.main}`,
            outlineOffset: '2px',
          },
        }}
      >
        <HelpOutline
          sx={{
            fontSize: iconSize,
          }}
        />
      </IconButton>

      <Popover
        id={popoverId}
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        // Ensure popover is accessible
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${popoverId}-title`}
        // Close on ESC key
        disableRestoreFocus={false}
        // Enable focus trap
        disableEnforceFocus={false}
        sx={{
          '& .MuiPopover-paper': {
            // Info Azure background with white text
            backgroundColor: theme.palette.info.main,
            color: theme.palette.info.contrastText,
            // Border radius from tokens (12px for tooltips/popovers)
            borderRadius: '12px',
            // Onyx border in high-vis mode
            border: isHighVisibility
              ? `1px solid ${theme.palette.primary.dark}`
              : 'none',
            // Padding from theme spacing
            padding: theme.spacing(2),
            // Max width for readability
            maxWidth: 320,
            // Box shadow in standard mode, none in high-vis
            boxShadow: isHighVisibility
              ? 'none'
              : '0px 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Box>
            <Typography
              id={`${popoverId}-title`}
              variant="body2"
              sx={{
                fontSize: theme.typography.body2.fontSize,
                lineHeight: theme.typography.body2.lineHeight,
                // Ensure text is readable
                color: 'inherit',
              }}
            >
              {helpText}
            </Typography>
          </Box>
        </ClickAwayListener>
      </Popover>
    </>
  );
};

export default FormHelper;
