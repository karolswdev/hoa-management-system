import { createTheme, type Theme } from '@mui/material/styles';
import type { AccessibilityMode } from '../contexts/AccessibilityContext';
import tokens from './tokens.json';

/**
 * Creates a MUI theme based on the specified accessibility mode
 * Consumes tokenized design system values from tokens.json
 *
 * @param mode - Accessibility mode: 'standard' or 'high-vis'
 * @returns Configured MUI Theme object
 */
export const createAppTheme = (mode: AccessibilityMode): Theme => {
  // Select token set based on mode
  const modeTokens = tokens.modes[mode];

  return createTheme({
    palette: {
      primary: {
        main: modeTokens.color.primary.deepNavy,
        dark: modeTokens.color.primary.onyx,
        contrastText: modeTokens.color.neutral.white,
      },
      secondary: {
        main: modeTokens.color.secondary.sage,
        contrastText: modeTokens.color.neutral.white,
      },
      background: {
        default: modeTokens.color.neutral.cloud,
        paper: modeTokens.component.surface.card.background,
      },
      text: {
        primary: modeTokens.component.surface.card.textColor,
        secondary: modeTokens.color.neutral.granite,
      },
      success: {
        main: modeTokens.color.state.success.pine,
        contrastText: modeTokens.color.neutral.white,
      },
      warning: {
        main: modeTokens.color.state.warning.harvest,
        contrastText: modeTokens.color.neutral.black,
      },
      error: {
        main: modeTokens.color.state.error.brick,
        contrastText: modeTokens.color.neutral.white,
      },
      info: {
        main: modeTokens.color.state.info.azure,
        contrastText: modeTokens.color.neutral.white,
      },
    },
    typography: {
      fontFamily: modeTokens.typography.fontFamily.fallback,
      fontSize: modeTokens.typography.fontSize.base,
      h1: {
        fontSize: `${modeTokens.typography.fontSize['2xl']}px`,
        fontWeight: modeTokens.typography.fontWeight.semibold,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      h2: {
        fontSize: `${modeTokens.typography.fontSize.xl}px`,
        fontWeight: modeTokens.typography.fontWeight.semibold,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      h3: {
        fontSize: `${modeTokens.typography.fontSize.lg}px`,
        fontWeight: modeTokens.typography.fontWeight.semibold,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      h4: {
        fontSize: `${modeTokens.typography.fontSize.base}px`,
        fontWeight: modeTokens.typography.fontWeight.semibold,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      h5: {
        fontSize: `${modeTokens.typography.fontSize.sm}px`,
        fontWeight: modeTokens.typography.fontWeight.semibold,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      h6: {
        fontSize: `${modeTokens.typography.fontSize.sm}px`,
        fontWeight: modeTokens.typography.fontWeight.medium,
        lineHeight: modeTokens.typography.lineHeight.heading,
      },
      body1: {
        fontSize: `${modeTokens.typography.fontSize.base}px`,
        lineHeight: modeTokens.typography.lineHeight.body,
        fontWeight: modeTokens.typography.fontWeight.normal,
      },
      body2: {
        fontSize: `${modeTokens.typography.fontSize.sm}px`,
        lineHeight: modeTokens.typography.lineHeight.body,
        fontWeight: modeTokens.typography.fontWeight.normal,
      },
      button: {
        textTransform: 'none',
        fontWeight: modeTokens.typography.fontWeight.medium,
        fontSize: `${modeTokens.typography.fontSize.base}px`,
      },
      caption: {
        fontSize: `${modeTokens.typography.fontSize.xs}px`,
        lineHeight: modeTokens.typography.lineHeight.body,
      },
    },
    shape: {
      borderRadius: modeTokens.component.borderRadius.core,
    },
    spacing: modeTokens.spacing.unit.base,
    breakpoints: {
      values: {
        xs: 0,
        sm: modeTokens.grid.breakpoints.mobile,
        md: modeTokens.grid.breakpoints.tablet,
        lg: 1200,
        xl: 1536,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            // Respect reduced motion preference
            '@media (prefers-reduced-motion: reduce)': {
              '*': {
                animationDuration: '0.001ms !important',
                animationIterationCount: '1 !important',
                transitionDuration: '0.001ms !important',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.core,
            minHeight: modeTokens.sizing.target.button,
            padding: `${modeTokens.component.button.primary.paddingVertical}px ${modeTokens.component.button.primary.paddingHorizontal}px`,
            fontSize: `${modeTokens.typography.fontSize.base}px`,
            fontWeight: modeTokens.typography.fontWeight.medium,
            textTransform: 'none',
            transition: `all ${modeTokens.animation.duration.standard}ms ${modeTokens.animation.easing.standard}`,
            '&:focus-visible': {
              outline: `${modeTokens.component.focusRing.width}px solid ${modeTokens.component.focusRing.colorLight}`,
              outlineOffset: `${modeTokens.component.focusRing.offset}px`,
            },
          },
          contained: {
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.sm : 'none',
            border: modeTokens.component.button.primary.border === 'none'
              ? 'none'
              : modeTokens.component.button.primary.border,
            '&:hover': {
              boxShadow: mode === 'standard' ? modeTokens.component.elevation.md : 'none',
            },
          },
          outlined: {
            border: modeTokens.component.button.secondary.border,
            '&:hover': {
              backgroundColor: mode === 'high-vis'
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(0, 51, 102, 0.04)',
            },
          },
        },
        variants: [
          {
            props: { color: 'error' },
            style: {
              border: modeTokens.component.button.danger.border,
              fontWeight: modeTokens.typography.fontWeight.semibold,
            },
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.core,
            border: modeTokens.component.surface.card.border,
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.sm : 'none',
            backgroundColor: modeTokens.component.surface.card.background,
            color: modeTokens.component.surface.card.textColor,
            '&:hover': {
              boxShadow: mode === 'standard' ? modeTokens.component.elevation.md : 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.core,
            backgroundColor: modeTokens.component.surface.panel.background,
            border: modeTokens.component.surface.panel.border === 'none'
              ? 'none'
              : modeTokens.component.surface.panel.border,
          },
          elevation1: {
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.sm : 'none',
          },
          elevation2: {
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.md : 'none',
          },
          elevation3: {
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.lg : 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: modeTokens.component.input.borderRadius,
              minHeight: modeTokens.sizing.field.height,
              '& fieldset': {
                border: modeTokens.component.input.border,
              },
              '&:hover fieldset': {
                borderColor: modeTokens.color.neutral.granite,
              },
              '&.Mui-focused fieldset': {
                border: modeTokens.component.input.borderFocus,
              },
              '&.Mui-error fieldset': {
                border: modeTokens.component.input.borderError,
              },
            },
            '& .MuiInputLabel-root': {
              transform: `translate(14px, ${modeTokens.component.input.labelOffset}px) scale(1)`,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'standard' ? modeTokens.component.elevation.sm : 'none',
            borderBottom: mode === 'high-vis'
              ? `2px solid ${modeTokens.color.special.highVisOutline}`
              : 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            borderRight: mode === 'high-vis'
              ? `2px solid ${modeTokens.color.special.highVisOutline}`
              : '1px solid rgba(0,0,0,0.12)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.core,
            margin: `${modeTokens.spacing.unit.xs / 2}px ${modeTokens.spacing.unit.xs}px`,
            minHeight: modeTokens.sizing.target.button,
            '&:hover': {
              backgroundColor: `rgba(0, 51, 102, 0.08)`,
            },
            '&.Mui-selected': {
              backgroundColor: `rgba(0, 51, 102, 0.12)`,
              border: mode === 'high-vis'
                ? `2px solid ${modeTokens.color.primary.deepNavy}`
                : 'none',
              '&:hover': {
                backgroundColor: `rgba(0, 51, 102, 0.16)`,
              },
            },
            '&:focus-visible': {
              outline: `${modeTokens.component.focusRing.width}px solid ${modeTokens.component.focusRing.colorLight}`,
              outlineOffset: `${modeTokens.component.focusRing.offset}px`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.pill,
            fontSize: `${modeTokens.typography.fontSize.sm}px`,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: modeTokens.component.borderRadius.core,
            border: mode === 'high-vis' ? `2px solid ${modeTokens.color.special.highVisOutline}` : 'none',
          },
          standardSuccess: {
            backgroundColor: modeTokens.badge.success.background,
            color: modeTokens.badge.success.textColor,
            border: modeTokens.badge.success.border,
          },
          standardWarning: {
            backgroundColor: modeTokens.badge.warning.background,
            color: modeTokens.badge.warning.textColor,
            border: modeTokens.badge.warning.border,
          },
          standardError: {
            backgroundColor: modeTokens.badge.error.background,
            color: modeTokens.badge.error.textColor,
            border: modeTokens.badge.error.border,
          },
          standardInfo: {
            backgroundColor: modeTokens.color.state.info.azure,
            color: modeTokens.color.neutral.white,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: modeTokens.component.tooltip.background,
            color: modeTokens.component.tooltip.textColor,
            borderRadius: modeTokens.component.tooltip.borderRadius,
            border: modeTokens.component.tooltip.border === 'none'
              ? 'none'
              : modeTokens.component.tooltip.border,
            fontSize: `${modeTokens.typography.fontSize.sm}px`,
            padding: `${modeTokens.spacing.unit.xs}px ${modeTokens.spacing.unit.sm}px`,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: modeTokens.sizing.target.button,
            minHeight: modeTokens.sizing.target.button,
            '&:focus-visible': {
              outline: `${modeTokens.component.focusRing.width}px solid ${modeTokens.component.focusRing.colorLight}`,
              outlineOffset: `${modeTokens.component.focusRing.offset}px`,
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            fontSize: `${modeTokens.sizing.target.icon}px`,
          },
          fontSizeSmall: {
            fontSize: `${modeTokens.typography.fontSize.base}px`,
          },
          fontSizeLarge: {
            fontSize: `${modeTokens.sizing.target.navIcon}px`,
          },
        },
      },
    },
  });
};

/**
 * Status color mappings for consistent UI
 * Derived from token color palette for backward compatibility
 */
export const statusColors = {
  pending: tokens.modes.standard.color.state.warning.harvest,
  approved: tokens.modes.standard.color.state.success.pine,
  rejected: tokens.modes.standard.color.state.error.brick,
  active: tokens.modes.standard.color.state.success.pine,
  expired: tokens.modes.standard.color.neutral.granite,
} as const;

/**
 * Role color mappings
 * Derived from token color palette for backward compatibility
 */
export const roleColors = {
  admin: tokens.modes.standard.color.secondary.sage,
  member: tokens.modes.standard.color.primary.deepNavy,
} as const;

/**
 * Legacy theme export for backward compatibility
 * @deprecated Use createAppTheme('standard') instead
 */
export const theme = createAppTheme('standard');

export default createAppTheme;
