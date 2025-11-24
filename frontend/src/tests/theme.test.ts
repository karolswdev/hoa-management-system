import { describe, it, expect } from 'vitest';
import { createAppTheme } from '../theme/theme';

describe('Theme Factory', () => {
  describe('createAppTheme', () => {
    it('creates standard mode theme with correct palette', () => {
      const theme = createAppTheme('standard');

      // Snapshot the entire theme configuration
      expect(theme).toMatchSnapshot();

      // Verify key palette values
      expect(theme.palette.primary.main).toBe('#003366');
      expect(theme.palette.secondary.main).toBe('#4F6B5A');
      expect(theme.palette.background.default).toBe('#F5F7FA');
      expect(theme.palette.error.main).toBe('#B3261E');
      expect(theme.palette.warning.main).toBe('#E37400');
      expect(theme.palette.success.main).toBe('#1E7344');
      expect(theme.palette.info.main).toBe('#1D8CD8');
    });

    it('creates standard mode theme with correct typography', () => {
      const theme = createAppTheme('standard');

      // Verify base font size and family
      expect(theme.typography.fontSize).toBe(16);
      expect(theme.typography.fontFamily).toContain('Inter');

      // Verify heading sizes
      expect(theme.typography.h1.fontSize).toBe('32px');
      expect(theme.typography.h2.fontSize).toBe('24px');
      expect(theme.typography.h3.fontSize).toBe('20px');

      // Verify body text
      expect(theme.typography.body1.fontSize).toBe('16px');
      expect(theme.typography.body1.lineHeight).toBe(1.5);

      // Verify caption (smallest text)
      expect(theme.typography.caption.fontSize).toBe('12px');
    });

    it('creates standard mode theme with correct component overrides', () => {
      const theme = createAppTheme('standard');

      // Verify button configuration
      expect(theme.components?.MuiButton?.styleOverrides?.root).toMatchObject({
        borderRadius: 8,
        minHeight: 44,
        textTransform: 'none',
      });

      // Verify card has shadows in standard mode
      const cardRoot = theme.components?.MuiCard?.styleOverrides?.root as Record<string, unknown>;
      expect(cardRoot?.boxShadow).toBe('0px 1px 2px rgba(0, 0, 0, 0.15)');

      // Verify focus ring configuration
      const buttonRoot = theme.components?.MuiButton?.styleOverrides?.root as Record<string, unknown>;
      const focusVisible = buttonRoot?.['&:focus-visible'] as Record<string, unknown>;
      expect(focusVisible?.outline).toContain('2px solid');
      expect(focusVisible?.outlineOffset).toBe('2px');
    });

    it('creates high-vis mode theme with correct palette', () => {
      const theme = createAppTheme('high-vis');

      // Snapshot the entire theme configuration
      expect(theme).toMatchSnapshot();

      // Verify key palette values (some colors change in high-vis)
      expect(theme.palette.primary.main).toBe('#003366');
      expect(theme.palette.secondary.main).toBe('#2E472F'); // Darker in high-vis
      expect(theme.palette.background.default).toBe('#FFFFFF'); // Pure white in high-vis
      expect(theme.palette.info.main).toBe('#4FB3FF'); // Lighter in high-vis
      expect(theme.palette.success.main).toBe('#34A853'); // Lighter in high-vis
    });

    it('creates high-vis mode theme with scaled typography', () => {
      const theme = createAppTheme('high-vis');

      // Verify font scaling (1.22x multiplier)
      expect(theme.typography.fontSize).toBe(19.52);

      // Verify scaled heading sizes
      expect(theme.typography.h1.fontSize).toBe('39.04px');
      expect(theme.typography.h2.fontSize).toBe('29.28px');
      expect(theme.typography.h3.fontSize).toBe('24.4px');

      // Verify scaled body text
      expect(theme.typography.body1.fontSize).toBe('19.52px');
      expect(theme.typography.body2.fontSize).toBe('16px');

      // Verify caption is scaled up from 12px to 14px
      expect(theme.typography.caption.fontSize).toBe('14px');
    });

    it('creates high-vis mode theme with enhanced component overrides', () => {
      const theme = createAppTheme('high-vis');

      // Verify increased button target size
      expect(theme.components?.MuiButton?.styleOverrides?.root).toMatchObject({
        borderRadius: 4, // Sharper corners in high-vis
        minHeight: 52, // Larger hit area
      });

      // Verify card has solid borders instead of shadows in high-vis
      const cardRoot = theme.components?.MuiCard?.styleOverrides?.root as Record<string, unknown>;
      expect(cardRoot?.boxShadow).toBe('none');
      expect(cardRoot?.border).toBe('2px solid #1A1A1A');

      // Verify AppBar has border in high-vis
      const appBarRoot = theme.components?.MuiAppBar?.styleOverrides?.root as Record<string, unknown>;
      expect(appBarRoot?.boxShadow).toBe('none');
      expect(appBarRoot?.borderBottom).toBe('2px solid #1A1A1A');

      // Verify text field borders are thicker
      const textFieldRoot = theme.components?.MuiTextField?.styleOverrides?.root as Record<string, unknown>;
      const outlinedInput = textFieldRoot?.['& .MuiOutlinedInput-root'] as Record<string, unknown>;
      const fieldset = outlinedInput?.['& fieldset'] as Record<string, unknown>;
      expect(fieldset?.border).toBe('2px solid #000000');
    });

    it('creates high-vis mode theme with larger interactive targets', () => {
      const theme = createAppTheme('high-vis');

      // Verify button target
      const buttonRoot = theme.components?.MuiButton?.styleOverrides?.root as Record<string, unknown>;
      expect(buttonRoot?.minHeight).toBe(52);

      // Verify icon button target
      const iconButtonRoot = theme.components?.MuiIconButton?.styleOverrides?.root as Record<string, unknown>;
      expect(iconButtonRoot?.minWidth).toBe(52);
      expect(iconButtonRoot?.minHeight).toBe(52);

      // Verify list item button target
      const listItemRoot = theme.components?.MuiListItemButton?.styleOverrides?.root as Record<string, unknown>;
      expect(listItemRoot?.minHeight).toBe(52);
    });

    it('creates high-vis mode theme with no animations', () => {
      const theme = createAppTheme('high-vis');

      // Verify button transitions are instant
      const buttonRoot = theme.components?.MuiButton?.styleOverrides?.root as Record<string, unknown>;
      expect(buttonRoot?.transition).toContain('0ms');
    });

    it('respects reduced motion in both modes', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Verify both themes include reduced motion styles
      const standardCssBaseline = standardTheme.components?.MuiCssBaseline?.styleOverrides as Record<string, unknown>;
      const highVisCssBaseline = highVisTheme.components?.MuiCssBaseline?.styleOverrides as Record<string, unknown>;

      expect(standardCssBaseline?.body).toHaveProperty('@media (prefers-reduced-motion: reduce)');
      expect(highVisCssBaseline?.body).toHaveProperty('@media (prefers-reduced-motion: reduce)');
    });

    it('maintains consistent spacing between modes', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Spacing unit should be consistent (MUI returns string with px)
      expect(standardTheme.spacing(1)).toBe('4px');
      expect(highVisTheme.spacing(1)).toBe('4px');

      // Breakpoints should be consistent
      expect(standardTheme.breakpoints.values.sm).toBe(600);
      expect(highVisTheme.breakpoints.values.sm).toBe(600);
      expect(standardTheme.breakpoints.values.md).toBe(1024);
      expect(highVisTheme.breakpoints.values.md).toBe(1024);
    });

    it('exports correct shape configuration per mode', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Standard has 8px border radius
      expect(standardTheme.shape.borderRadius).toBe(8);

      // High-vis has sharper 4px border radius
      expect(highVisTheme.shape.borderRadius).toBe(4);
    });

    it('configures alert components with proper borders in high-vis', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      const standardAlertRoot = standardTheme.components?.MuiAlert?.styleOverrides?.root as Record<string, unknown>;
      const highVisAlertRoot = highVisTheme.components?.MuiAlert?.styleOverrides?.root as Record<string, unknown>;

      // Standard mode has no border
      expect(standardAlertRoot?.border).toBe('none');

      // High-vis mode has visible border
      expect(highVisAlertRoot?.border).toContain('2px solid');
    });

    it('configures tooltip with appropriate styling per mode', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      const standardTooltip = standardTheme.components?.MuiTooltip?.styleOverrides?.tooltip as Record<string, unknown>;
      const highVisTooltip = highVisTheme.components?.MuiTooltip?.styleOverrides?.tooltip as Record<string, unknown>;

      // Both have info azure background
      expect(standardTooltip?.backgroundColor).toBe('#1D8CD8');
      expect(highVisTooltip?.backgroundColor).toBe('#1D8CD8');

      // Standard has no border
      expect(standardTooltip?.border).toBe('none');

      // High-vis has border
      expect(highVisTooltip?.border).toBe('1px solid #000000');

      // Border radius differs
      expect(standardTooltip?.borderRadius).toBe(12);
      expect(highVisTooltip?.borderRadius).toBe(4);
    });
  });

  describe('Theme consistency between modes', () => {
    it('maintains palette structure between modes', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Both should have same palette properties
      expect(Object.keys(standardTheme.palette)).toEqual(Object.keys(highVisTheme.palette));
    });

    it('maintains typography structure between modes', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Both should have same typography properties
      expect(Object.keys(standardTheme.typography)).toEqual(Object.keys(highVisTheme.typography));
    });

    it('maintains component override structure between modes', () => {
      const standardTheme = createAppTheme('standard');
      const highVisTheme = createAppTheme('high-vis');

      // Both should override same components
      const standardComponents = Object.keys(standardTheme.components || {});
      const highVisComponents = Object.keys(highVisTheme.components || {});
      expect(standardComponents).toEqual(highVisComponents);
    });
  });
});
