# Accessibility Features

This document describes the accessibility features implemented in the HOA Management System frontend.

## Table of Contents

- [Overview](#overview)
- [Accessibility Context](#accessibility-context)
- [High Visibility Mode](#high-visibility-mode)
- [Accessibility Toggle Component](#accessibility-toggle-component)
- [Theme Integration](#theme-integration)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

The HOA Management System is designed with accessibility as a core feature, not an afterthought. We follow WCAG 2.1 Level AA guidelines to ensure the application is usable by everyone, including users with visual, motor, or cognitive disabilities.

### Key Features

- **High Visibility Mode**: Enhanced contrast and larger text for users with low vision
- **Keyboard Navigation**: Full keyboard support throughout the application
- **Screen Reader Support**: Proper ARIA labels, roles, and states
- **Touch Target Sizing**: Minimum 44px touch targets (52px in high-vis mode)
- **Reduced Motion Support**: Respects `prefers-reduced-motion` OS settings
- **Persistent Preferences**: Accessibility settings saved to localStorage

## Accessibility Context

The `AccessibilityContext` manages accessibility preferences across the entire application.

### Location

`frontend/src/contexts/AccessibilityContext.tsx`

### Usage

```tsx
import { useAccessibility } from '../../contexts/AccessibilityContext';

function MyComponent() {
  const { isHighVisibility, toggleHighVisibility, showHelpers } = useAccessibility();

  return (
    <div>
      <p>High Visibility: {isHighVisibility ? 'On' : 'Off'}</p>
      <button onClick={toggleHighVisibility}>Toggle</button>
    </div>
  );
}
```

### Available Methods

- `isHighVisibility`: Boolean indicating if high-vis mode is active
- `toggleHighVisibility()`: Toggle high-vis mode on/off
- `setHighVisibility(enabled)`: Set high-vis mode explicitly
- `showHelpers`: Boolean for contextual help icons
- `toggleHelpers()`: Toggle helper visibility
- `reducedMotion`: Boolean for motion preference
- `resetPreferences()`: Reset all preferences to defaults

### Storage

Preferences are persisted to `localStorage` under the key `hoa_accessibility_mode` as a JSON object:

```json
{
  "mode": "standard" | "high-vis",
  "showHelpers": false,
  "reducedMotion": false
}
```

## High Visibility Mode

High Visibility Mode transforms the interface to support users with low vision or visual processing difficulties.

### Visual Changes

| Feature | Standard Mode | High Visibility Mode |
|---------|--------------|---------------------|
| Font Size | 16px base | 19.52px base (22% larger) |
| Touch Targets | 44px minimum | 52px minimum |
| Borders | 1px | 2px |
| Border Radius | 8px | 4px (crisper edges) |
| Shadows | Soft shadows | Solid double borders |
| Contrast | WCAG AA (4.5:1) | Enhanced contrast |
| Animations | 200ms transitions | 0ms (instant) |

### How to Toggle

Users can toggle High Visibility Mode from:
1. **AppBar Toolbar**: Icon button in top navigation
2. **Mobile Drawer**: Button in sidebar navigation

### Automatic Detection

The system automatically detects and respects the OS-level `prefers-reduced-motion` setting.

## Accessibility Toggle Component

The `AccessibilityToggle` component is a reusable button that allows users to toggle High Visibility Mode.

### Location

`frontend/src/components/Accessibility/Toggle.tsx`

### Usage

```tsx
import AccessibilityToggle from '../components/Accessibility/Toggle';

// In AppBar
<AccessibilityToggle variant="navbar" />

// In Drawer
<AccessibilityToggle variant="drawer" />

// With callbacks
<AccessibilityToggle
  variant="navbar"
  onToggle={(isHighVis) => console.log('Toggled:', isHighVis)}
  onAnalytics={(event) => console.log('Analytics:', event)}
/>
```

### Props

- `variant?: 'navbar' | 'drawer'` - Visual context (default: 'navbar')
- `onToggle?: (isHighVis: boolean) => void` - Callback fired on each toggle
- `onAnalytics?: (event) => void` - Analytics callback (fires once per session)

### Accessibility Features

#### ARIA States
- `aria-label`: Descriptive label for screen readers
- `aria-pressed`: Indicates toggle state (true/false)
- Dynamic labels: "Enable/Disable High Visibility Mode"

#### Keyboard Support
- **Tab**: Focus the button
- **Enter**: Activate toggle
- **Space**: Activate toggle
- **Focus Ring**: 2px outline with 2px offset (theme-aware)

#### Touch Targets
- **Standard Mode**: 44px × 44px (WCAG 2.5.5 compliant)
- **High-Vis Mode**: 52px × 52px (enhanced for easier tapping)

#### Tooltips
- Hover: Shows contextual help text
- Text changes based on current state
- Tooltip background uses Info Azure color token

### Analytics

The toggle fires a privacy-safe analytics event on first interaction per session:

```typescript
{
  action: 'toggle',
  entity: 'accessibility',
  context: 'navbar' | 'drawer',
  featureFlagState: {
    highVis: true | false
  }
}
```

**Privacy Notes:**
- No user identifiers included
- Only fires once per session
- Anonymized data only
- Development: Logs to console
- Production: Silent (per observability spec)

## Theme Integration

Accessibility mode integrates with the MUI theme system via tokenized design values.

### Token File

`frontend/src/theme/tokens.json`

Contains two mode sets:
- `modes.standard`: Default appearance
- `modes.high-vis`: Enhanced accessibility

### Theme Factory

```tsx
import { createAppTheme } from '../theme/theme';

const theme = createAppTheme('standard'); // or 'high-vis'
```

### Dynamic Theme Switching

The `App.tsx` component listens to `AccessibilityContext` and updates the theme automatically:

```tsx
const { preferences } = useAccessibility();
const theme = useMemo(() => createAppTheme(preferences.mode), [preferences.mode]);

return (
  <ThemeProvider theme={theme}>
    {/* App content */}
  </ThemeProvider>
);
```

## Testing

Comprehensive tests ensure accessibility features work correctly.

### Test File

`frontend/src/tests/AccessibilityToggle.test.tsx`

### Test Coverage

- **Rendering**: Correct icon, button, and tooltip rendering
- **ARIA States**: aria-label, aria-pressed attributes
- **Keyboard Navigation**: Tab, Enter, Space key support
- **Touch Targets**: Minimum size requirements
- **State Persistence**: localStorage integration
- **Analytics**: Event firing and session tracking
- **Theme Integration**: Token-based sizing and colors

### Running Tests

```bash
# Run all tests
npm test

# Run accessibility tests only
npm test AccessibilityToggle

# Run with coverage
npm test -- --coverage
```

### Writing Accessible Components

When creating new components, follow these patterns:

```tsx
import { useAccessibility } from '../../contexts/AccessibilityContext';

function MyButton() {
  const { isHighVisibility } = useAccessibility();

  return (
    <button
      aria-label="Descriptive action"
      aria-pressed={isPressed}
      style={{
        minWidth: isHighVisibility ? '52px' : '44px',
        minHeight: isHighVisibility ? '52px' : '44px',
      }}
    >
      Click Me
    </button>
  );
}
```

## Best Practices

### Do's ✅

1. **Use Semantic HTML**: `<button>`, `<nav>`, `<main>`, etc.
2. **Provide ARIA Labels**: Especially for icon-only buttons
3. **Respect Theme Tokens**: Use `theme.spacing()` and token values
4. **Test with Keyboard**: Ensure all features work without a mouse
5. **Check Focus Indicators**: All interactive elements should show focus
6. **Support Reduced Motion**: Disable animations when requested
7. **Maintain Touch Targets**: 44px minimum (52px high-vis)
8. **Test with Screen Readers**: NVDA, JAWS, VoiceOver

### Don'ts ❌

1. **Don't Hard-Code Colors**: Use theme palette tokens
2. **Don't Hard-Code Sizes**: Use theme spacing/sizing tokens
3. **Don't Skip Focus Styles**: Never use `outline: none` without replacement
4. **Don't Ignore Keyboard Users**: All mouse actions need keyboard equivalents
5. **Don't Use Color Alone**: Combine with icons, text, or patterns
6. **Don't Override User Preferences**: Respect OS-level settings
7. **Don't Create Tiny Targets**: Minimum 44px per WCAG 2.5.5
8. **Don't Forget Mobile**: Test on real devices with real fingers

### Checklist for New Features

- [ ] All interactive elements have `aria-label` or visible text
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrows)
- [ ] Focus indicators are visible and meet contrast requirements
- [ ] Touch targets meet 44px minimum (52px in high-vis)
- [ ] Component works in both standard and high-vis modes
- [ ] Colors meet WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Screen reader announces state changes with `aria-live`
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are programmatically associated (aria-describedby)

## Resources

### Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (macOS/iOS)

### Internal Documentation
- `frontend/src/theme/tokens.json` - Design token definitions
- `.codemachine/artifacts/architecture/06_UI_UX_Architecture.md` - Full UI/UX spec
- `.codemachine/artifacts/plan/02_Iteration_I2.md` - Accessibility suite plan

---

**Last Updated**: 2025-11-23
**Task ID**: I2.T4
**Iteration**: I2 (Accessibility Suite MVP)
