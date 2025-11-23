# Accessibility Theme Token Specification

<!-- anchor: accessibility-theme-tokens -->

## Overview

This document enumerates the complete set of design tokens for the HOA Management System's accessibility-aware theming system. All tokens are defined with **two modes**—`standard` and `high-vis` (High Visibility)—enabling the application to seamlessly switch between visual presentations without component rewrites.

These tokens feed directly into `createAppTheme(mode)` and integrate with the [AccessibilityContext](../../frontend/src/contexts/AccessibilityContext.tsx) provider, which persists user preferences to `localStorage` under the `hoa_accessibility_mode` key.

**Cross-Reference:** This specification implements the design guidance outlined in `.codemachine/artifacts/architecture/06_UI_UX_Architecture.md` Section 1.0 and satisfies Task I2.T2 requirements.

---

## 1. Color Palette Tokens

Color tokens provide semantic naming for all UI colors, ensuring WCAG AA/AAA contrast ratios and support for color-blind users through multi-modal cues.

### 1.1 Primary Colors

| Token Key | Standard Mode | High Vis Mode | Usage | Notes |
|-----------|---------------|---------------|-------|-------|
| `color.primary.deepNavy` | `#003366` | `#003366` | Headers, nav bars, primary CTAs, form actions | Maintains hue in both modes; High Vis adds solid outlines |
| `color.primary.onyx` | `#000000` | `#000000` | High Vis button strokes, icon outlines, critical typography | Used sparingly in standard mode; primary in High Vis |
| `color.secondary.sage` | `#4F6B5A` | `#2E472F` | Cards, filter chips, vendor badges, secondary hover states | High Vis version lightened with thicker borders |
| `color.accent.sunlitAmber` | `#FFB347` | `#E6912B` | Status banners, poll warnings, unread indicators | Toned down in High Vis to reduce glare |

### 1.2 Neutral Colors

| Token Key | Standard Mode | High Vis Mode | Usage | Notes |
|-----------|---------------|---------------|-------|-------|
| `color.neutral.cloud` | `#F5F7FA` | `#FFFFFF` | Dashboard background, page backgrounds | Pure white in High Vis for maximum contrast |
| `color.neutral.granite` | `#4A4A4A` | `#000000` | Body text, table content, underlines | Onyx in High Vis for enhanced readability |
| `color.neutral.white` | `#FFFFFF` | `#FFFFFF` | Card backgrounds, modal surfaces | Consistent across modes |
| `color.neutral.black` | `#000000` | `#000000` | Maximum contrast elements | Reserved for critical emphasis |

### 1.3 Semantic State Colors

| Token Key | Standard Mode | High Vis Mode | Usage | Notes |
|-----------|---------------|---------------|-------|-------|
| `color.state.success.pine` | `#1E7344` | `#34A853` | Success messages, vote receipts, confirmation chips | Lightened in High Vis for mobile readability |
| `color.state.warning.harvest` | `#E37400` | `#E37400` | Deadline alerts, upcoming renewals | Pair with icons for color-blind accessibility |
| `color.state.error.brick` | `#B3261E` | `#B3261E` | Destructive actions, validation errors | Multi-modal cues required (no color-only) |
| `color.state.info.azure` | `#1D8CD8` | `#4FB3FF` | Tooltips, contextual help, inline guidance | Lightened for High Vis backgrounds |

### 1.4 Specialized Colors

| Token Key | Standard Mode | High Vis Mode | Usage | Notes |
|-----------|---------------|---------------|-------|-------|
| `color.special.highVisOutline` | `#1A1A1A` | `#1A1A1A` | Component borders, focus states, modal frames | 2px stroke width in High Vis |
| `color.special.gradientStart` | `#003366` | N/A | Hero banner gradient start | Disabled in High Vis |
| `color.special.gradientEnd` | `#4F6B5A` | N/A | Hero banner gradient end | Disabled in High Vis |
| `color.special.shadow` | `rgba(0, 0, 0, 0.15)` | N/A | Modal and button shadows | Converted to solid outlines in High Vis |
| `color.special.stateOverlay` | `rgba(255, 255, 255, 0.9)` | `rgba(255, 255, 224, 0.9)` | Disabled components, skeleton loaders | Tinted yellow in High Vis to avoid white stacking |

---

## 2. Typography Tokens

Typography tokens define font families, sizes, weights, line heights, and accessibility scaling factors.

### 2.1 Font Family

| Token Key | Value | Fallback Stack |
|-----------|-------|----------------|
| `typography.fontFamily.base` | `Inter` | `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif` |

**Notes:**
- Inter provides excellent legibility across screen sizes
- Fallback stack ensures consistent rendering on low-resource devices

### 2.2 Font Size Scale

| Token Key | Standard (px) | High Vis (px) | Usage | Line Height |
|-----------|---------------|---------------|-------|-------------|
| `typography.fontSize.xs` | `12` | `14` | Captions, badge labels, vendor tags | `1.5` |
| `typography.fontSize.sm` | `14` | `16` | Helper text, footers, metadata | `1.5` |
| `typography.fontSize.base` | `16` | `19.52` | Body copy, table text, button labels | `1.5` |
| `typography.fontSize.lg` | `20` | `24.4` | Section headers, card titles | `1.2` |
| `typography.fontSize.xl` | `24` | `29.28` | Hero copy, poll names, board headings | `1.2` |
| `typography.fontSize.2xl` | `32` | `39.04` | Landing hero, accessibility alerts | `1.2` |
| `typography.fontSize.3xl` | `40` | `48.8` | Marketing hero, release highlights | `1.2` |
| `typography.fontSize.4xl` | `48` | `58.56` | Major campaign banners (rare) | `1.2` |

**Scaling Factor:** High Vis multiplies base font size by `1.22` (122%)

### 2.3 Font Weights

| Token Key | Value | Usage |
|-----------|-------|-------|
| `typography.fontWeight.normal` | `400` | Body text, paragraph content |
| `typography.fontWeight.medium` | `500` | Interactive labels, secondary emphasis |
| `typography.fontWeight.semibold` | `600` | Headings, card titles |
| `typography.fontWeight.bold` | `700` | Short call-outs only (use sparingly) |

**Note:** Avoid 700 weight for extended text; reduces readability at larger sizes.

### 2.4 Line Heights

| Token Key | Value | Usage |
|-----------|-------|-------|
| `typography.lineHeight.body` | `1.5` | Body text, default paragraphs |
| `typography.lineHeight.heading` | `1.2` | Headings, titles |
| `typography.lineHeight.modal` | `1.75` | Modal content (limited width compensation) |
| `typography.lineHeight.list` | `2.0` | Bullet lists when fonts enlarge |

### 2.5 Letter Spacing

| Token Key | Value | Usage |
|-----------|-------|-------|
| `typography.letterSpacing.normal` | `0` | Default text |
| `typography.letterSpacing.uppercase` | `0.08em` | All uppercase text |
| `typography.letterSpacing.tabular` | `0.08em` | Numeric data, vote counts, dates |

**Accessibility Note:** All uppercase text MUST include the `0.08em` letter spacing for readability.

---

## 3. Spacing & Sizing Tokens

All spacing follows a **4px base unit** system for consistent rhythm and alignment.

### 3.1 Base Spacing Units

| Token Key | Value (px) | Multiplier | Usage |
|-----------|------------|------------|-------|
| `spacing.unit.base` | `4` | 1× | Minimum spacing increment |
| `spacing.unit.xs` | `8` | 2× | Tight spacing, row separators |
| `spacing.unit.sm` | `12` | 3× | Mobile container padding, condensed lists |
| `spacing.unit.md` | `16` | 4× | Standard form field padding, tablet containers |
| `spacing.unit.lg` | `24` | 6× | Desktop container padding, card spacing |
| `spacing.unit.xl` | `32` | 8× | Grid gutters, modal margins |
| `spacing.unit.2xl` | `64` | 16× | Section vertical spacing |

### 3.2 Interactive Target Sizes

| Token Key | Standard (px) | High Vis (px) | Usage |
|-----------|---------------|---------------|-------|
| `sizing.target.button` | `44` | `52` | Minimum button/toggle hit area |
| `sizing.target.icon` | `24` | `28` | Standard icon size |
| `sizing.target.navIcon` | `28` | `32` | Navigation icons |
| `sizing.target.calloutIcon` | `32` | `36` | Helper tooltip icons |

**Accessibility:** All interactive elements must meet minimum 44px touch target (WCAG 2.5.5).

### 3.3 Form Field Sizing

| Token Key | Standard (px) | High Vis (px) | Usage |
|-----------|---------------|---------------|-------|
| `sizing.field.height` | `48` | `56` | Input field height |
| `sizing.field.padding` | `12` | `12` | Internal field padding |
| `sizing.field.labelSpacing` | `4` | `8` | Label-to-input spacing |

### 3.4 Modal & Container Sizing

| Token Key | Value (px) | Usage |
|-----------|------------|-------|
| `sizing.modal.small` | `480` | Small modals max-width |
| `sizing.modal.medium` | `640` | Medium modals max-width |
| `sizing.modal.large` | `880` | Large modals max-width |
| `sizing.modal.mobileMargin` | `32` | Mobile full-width minus margin |
| `sizing.layout.maxContentWidth` | `1160` | Page content max-width |
| `sizing.layout.splitPaneRatio` | `60/40` | Two-column desktop split |

### 3.5 Grid System

| Token Key | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| `grid.columns` | `12` | `8` | `1` (stack) |
| `grid.gutter` | `32px` | `24px` | `16px` |
| `grid.breakpoint.mobile` | `< 600px` | — | — |
| `grid.breakpoint.tablet` | `600px - 1024px` | — | — |
| `grid.breakpoint.desktop` | `> 1024px` | — | — |

### 3.6 List & Table Density

| Token Key | Standard (px) | Condensed (px) | Usage |
|-----------|---------------|----------------|-------|
| `sizing.list.rowPadding` | `16` | `12` | Table/list row padding |
| `sizing.list.rowSeparator` | `8` | `8` | Row separator height |

---

## 4. Component-Level Tokens

Component tokens encapsulate specific styling for reusable UI components.

### 4.1 Border Radius

| Token Key | Standard (px) | High Vis (px) | Usage |
|-----------|---------------|---------------|-------|
| `component.borderRadius.core` | `8` | `4` | Cards, modals, inputs |
| `component.borderRadius.pill` | `999` | `999` | Chips, badges |
| `component.borderRadius.sharp` | `0` | `0` | Tables, strict layouts |

**Note:** High Vis uses crisper 4px radius for enhanced edge definition.

### 4.2 Shadow & Elevation

| Token Key | Standard | High Vis | Usage |
|-----------|----------|----------|-------|
| `component.elevation.sm` | `0px 1px 2px rgba(0,0,0,0.15)` | `2px solid #000 + 2px solid #FFF` | Card elevation |
| `component.elevation.md` | `0px 4px 12px rgba(0,0,0,0.15)` | `2px solid #000 + 2px solid #FFF` | Modal elevation |
| `component.elevation.lg` | `0px 8px 24px rgba(0,0,0,0.15)` | `3px solid #000 + 3px solid #FFF` | Floating actions |

**High Vis Strategy:** Convert shadows to double-border outlines for depth without blur.

### 4.3 Focus Ring

| Token Key | Light Background | Dark Background | Width |
|-----------|------------------|-----------------|-------|
| `component.focusRing.color` | `#1D8CD8` (Info Azure) | `#FFFFFF` | `2px` |
| `component.focusRing.offset` | `2px` | `2px` | `2px` |

### 4.4 Button Tokens

| Button Type | Background | Text Color | Border | Padding (V × H) | High Vis Border |
|-------------|------------|------------|--------|-----------------|-----------------|
| `primary` | `#003366` (Deep Navy) | `#FFFFFF` | None | `16px × 24px` | `2px #000000` |
| `secondary` | Transparent | `#4A4A4A` (Granite) | `1px #4A4A4A` | `16px × 24px` | `2px #000000` |
| `danger` | `#B3261E` (Brick) | `#FFFFFF` | `3px #B3261E` | `16px × 24px` | `3px #000000` |

**Notes:**
- All buttons maintain 44px minimum height (52px in High Vis)
- Danger buttons use uppercase text for additional emphasis
- Hover states fill transparent backgrounds

### 4.5 Surface Tokens

| Surface Type | Background | Border | Text Color | Usage |
|--------------|------------|--------|------------|-------|
| `surface.card` | `#FFFFFF` | `1px #E0E6ED` | `#4A4A4A` | Content cards |
| `surface.panel` | `#F5F7FA` | None | `#4A4A4A` | Side panels, filters |
| `surface.modal` | `#FFFFFF` | `2px #1A1A1A` (High Vis) | `#000000` (High Vis) | Modal dialogs |
| `surface.banner` | `#FFB347` | `1px #E6912B` | `#000000` | Alert banners |

### 4.6 Input Tokens

| Token Key | Standard | High Vis | Usage |
|-----------|----------|----------|-------|
| `component.input.border` | `1px solid #4A4A4A` | `2px solid #000000` | Default border |
| `component.input.borderError` | `1px solid #B3261E` | `2px solid #B3261E` | Error state |
| `component.input.borderFocus` | `2px solid #1D8CD8` | `2px solid #1D8CD8` | Focus state |
| `component.input.labelOffset` | `12px` | `12px` | Floating label top offset |
| `component.input.borderRadius` | `8px` | `4px` | Input corner radius |

### 4.7 Skeleton Loader Tokens

| Token Key | Standard | High Vis | Usage |
|-----------|----------|----------|-------|
| `component.skeleton.background` | `#E0E6ED` shimmer | Alternating stripes (12px height) | Loading placeholders |
| `component.skeleton.borderRadius` | `8px` | `4px` | Skeleton corner radius |
| `component.skeleton.animation` | Enabled | Disabled | Prevents flicker in High Vis |

### 4.8 Tooltip & Helper Popovers

| Token Key | Value | High Vis Override |
|-----------|-------|-------------------|
| `component.tooltip.background` | `#1D8CD8` (Info Azure) | `#1D8CD8` |
| `component.tooltip.border` | None | `1px solid #000000` |
| `component.tooltip.borderRadius` | `12px` | `4px` |
| `component.tooltip.caretOffset` | `8px` | `8px` |
| `component.tooltip.textColor` | `#FFFFFF` | `#FFFFFF` |

---

## 5. State & Interaction Tokens

### 5.1 Transition & Animation

| Token Key | Value | Reduced Motion |
|-----------|-------|----------------|
| `animation.duration.fast` | `150ms` | `0ms` |
| `animation.duration.standard` | `200ms` | `0ms` |
| `animation.duration.slow` | `250ms` | `0ms` |
| `animation.easing.standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | N/A |
| `animation.easing.success` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (easeOutBack) | N/A |

**Accessibility:** `prefers-reduced-motion` automatically short-circuits all transitions to 0ms.

### 5.2 Hover & Active States

| Component | Hover Effect | Active Effect |
|-----------|-------------|---------------|
| `button.primary` | Lighten 10% | Darken 5% |
| `button.secondary` | Fill with `#F5F7FA` | Fill with `#E0E6ED` |
| `link` | Underline | Underline + color shift |
| `card` | Elevation increase | None |

### 5.3 Disabled States

| Token Key | Visual Treatment | Opacity |
|-----------|------------------|---------|
| `state.disabled.overlay` | `rgba(255, 255, 255, 0.9)` standard, `rgba(255, 255, 224, 0.9)` High Vis | `0.5` |
| `state.disabled.cursor` | `not-allowed` | — |
| `state.disabled.textColor` | `#A0A0A0` | — |

---

## 6. Data Visualization Tokens

### 6.1 Chart Colors

| Token Key | Standard | High Vis | Pattern Overlay |
|-----------|----------|----------|-----------------|
| `chart.bar.primary` | `#003366` | `#003366` + `2px #000 outline` | Diagonal stripes |
| `chart.bar.secondary` | `#4F6B5A` | `#2E472F` + `2px #000 outline` | Dots |
| `chart.bar.tertiary` | `#FFB347` | `#E6912B` + `2px #000 outline` | Horizontal lines |

**Accessibility:** Pattern overlays ensure color-blind users can distinguish data series.

### 6.2 Poll Result Visualization

| Token Key | Value | Notes |
|-----------|-------|-------|
| `chart.poll.barHeight` | `32px` | Minimum height for readability |
| `chart.poll.barSpacing` | `8px` | Vertical spacing between bars |
| `chart.poll.labelPosition` | `end` | Data labels anchored at bar end |
| `chart.poll.outlineWidth` | `2px` (High Vis only) | Black outline for clarity |

---

## 7. Feature Flag & Badge Tokens

| Badge Type | Background | Border | Text Color | Icon |
|------------|------------|--------|------------|------|
| `badge.success` | `#1E7344` | `1px #34A853` | `#FFFFFF` | Checkmark |
| `badge.warning` | `#E37400` | `1px #FFB347` | `#000000` | Alert triangle |
| `badge.error` | `#B3261E` | `1px #B3261E` | `#FFFFFF` | X icon |
| `badge.neutral` | `#4A4A4A` | `1px #4A4A4A` | `#FFFFFF` | Circle |

**Accessibility:** All badges include `aria-live="polite"` for dynamic state changes.

---

## 8. Token Usage Guidelines

### 8.1 Theme Factory Integration

The `createAppTheme(mode)` factory function consumes these tokens via the `frontend/src/theme/tokens.json` file. The mode parameter (`'standard'` or `'high-vis'`) aligns with the `AccessibilityContext` state machine.

**Example Usage:**
```typescript
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { createAppTheme } from '@/theme/theme';

function App() {
  const { mode } = useAccessibility();
  const theme = createAppTheme(mode);

  return <ThemeProvider theme={theme}>...</ThemeProvider>;
}
```

### 8.2 Token Naming Conventions

- **Category-first:** `color.`, `typography.`, `spacing.`, `component.`, `animation.`, `state.`, `chart.`, `badge.`
- **Semantic naming:** Use role-based names (`primary`, `success`, `error`) over visual descriptors
- **Mode variants:** Standard values are the base; High Vis values are overrides
- **Consistency:** Keep token keys identical between Markdown documentation and JSON implementation

### 8.3 Validation Requirements

1. **WCAG Compliance:** All color combinations must meet AA contrast ratios (4.5:1 for body text, 3:1 for large text)
2. **Touch Targets:** Interactive elements must meet 44px minimum (52px in High Vis)
3. **Motion Sensitivity:** All animations respect `prefers-reduced-motion` OS setting
4. **Screen Reader Support:** State changes use `aria-live` regions; focus management follows logical order

### 8.4 Cross-References

- **Accessibility Context:** [frontend/src/contexts/AccessibilityContext.tsx](../../frontend/src/contexts/AccessibilityContext.tsx)
- **Accessibility Context Tests:** [frontend/src/contexts/AccessibilityContext.test.tsx](../../frontend/src/contexts/AccessibilityContext.test.tsx)
- **UI/UX Architecture:** `.codemachine/artifacts/architecture/06_UI_UX_Architecture.md`
- **Component Implementation:** Upcoming in I2.T3 (theme factory refactor)

---

## 9. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-23 | CodeImplementer | Initial token specification for I2.T2 |

---

## 10. Acceptance Checklist

- [x] Tokens cover color palette (primary, secondary, neutral, semantic states)
- [x] Tokens cover typography (font family, sizes, weights, line heights, letter spacing)
- [x] Tokens cover spacing & sizing (base units, interactive targets, grid system)
- [x] Tokens cover component-level specs (borders, shadows, buttons, surfaces, inputs)
- [x] Tokens cover state & interaction patterns (transitions, hover, disabled)
- [x] JSON file structure validated (see `frontend/src/theme/tokens.json`)
- [x] Markdown cross-links to accessibility context documentation
- [x] Standard and High Vis modes defined for all applicable tokens
- [x] Alignment with Section 1 design guidance from UI/UX Architecture
- [x] Ready for consumption by `createAppTheme(mode)` in I2.T3

---

**End of Specification**
