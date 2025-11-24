# Accessibility Context Documentation

## Overview

The `AccessibilityContext` provides a centralized state management solution for accessibility features across the HOA Management System frontend. It manages high visibility mode, contextual help displays, and reduced motion preferences with automatic localStorage persistence.

## Features

- **High Visibility Mode**: Toggle between standard and high-contrast themes
- **Contextual Helpers**: Show/hide help icons for complex form fields
- **Reduced Motion**: Respect user's system-level motion preferences
- **Persistent Storage**: Automatically saves preferences to `localStorage`
- **System Integration**: Detects and responds to OS-level accessibility settings
- **Type-Safe**: Full TypeScript support with exported types

## Installation & Setup

### 1. Wrap Your Application

Add the `AccessibilityProvider` to your app's provider stack in `App.tsx`:

```tsx
import { AccessibilityProvider } from './contexts/AccessibilityContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AccessibilityProvider>
        <NotificationProvider>
          <AuthProvider>
            {/* Your app content */}
          </AuthProvider>
        </NotificationProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}
```

**Important:** Place `AccessibilityProvider` outside `ThemeProvider` if you plan to dynamically switch themes based on accessibility mode (future enhancement).

### 2. Use the Hook in Components

```tsx
import { useAccessibility } from '@/contexts/AccessibilityContext';

function MyComponent() {
  const { isHighVisibility, toggleHighVisibility } = useAccessibility();

  return (
    <button onClick={toggleHighVisibility}>
      {isHighVisibility ? 'Disable' : 'Enable'} High Visibility
    </button>
  );
}
```

## API Reference

### Types

#### `AccessibilityMode`

```typescript
type AccessibilityMode = 'standard' | 'high-vis';
```

- `'standard'`: Default theme with normal contrast and font sizes
- `'high-vis'`: High contrast theme with 20-25% larger fonts

#### `AccessibilityPreferences`

```typescript
interface AccessibilityPreferences {
  mode: AccessibilityMode;
  showHelpers: boolean;
  reducedMotion: boolean;
}
```

### Context Values

The `useAccessibility()` hook returns:

| Property | Type | Description |
|----------|------|-------------|
| `preferences` | `AccessibilityPreferences` | Complete preferences object |
| `isHighVisibility` | `boolean` | Whether high visibility mode is active |
| `showHelpers` | `boolean` | Whether contextual helpers should be shown |
| `reducedMotion` | `boolean` | Whether reduced motion is preferred |
| `toggleHighVisibility` | `() => void` | Toggle high visibility on/off |
| `setHighVisibility` | `(enabled: boolean) => void` | Set high visibility explicitly |
| `toggleHelpers` | `() => void` | Toggle contextual helpers on/off |
| `setShowHelpers` | `(enabled: boolean) => void` | Set helpers explicitly |
| `setReducedMotion` | `(enabled: boolean) => void` | Set reduced motion preference |
| `resetPreferences` | `() => void` | Reset all preferences to defaults |

## Usage Examples

### Toggle High Visibility Mode

```tsx
function AccessibilityToggle() {
  const { isHighVisibility, toggleHighVisibility } = useAccessibility();

  return (
    <IconButton
      onClick={toggleHighVisibility}
      aria-label="Toggle high visibility mode"
      title="Increase text size and contrast for better visibility"
    >
      <TextIncreaseIcon />
    </IconButton>
  );
}
```

### Conditional Contextual Helpers

```tsx
function FormFieldWithHelper({ label, helpText }: Props) {
  const { showHelpers } = useAccessibility();

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField label={label} />
      {showHelpers && (
        <Tooltip title={helpText}>
          <HelpOutlineIcon fontSize="small" />
        </Tooltip>
      )}
    </Box>
  );
}
```

### Disable Animations for Reduced Motion

```tsx
function AnimatedCard() {
  const { reducedMotion } = useAccessibility();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        ease: 'easeOut'
      }}
    >
      <Card>Content</Card>
    </motion.div>
  );
}
```

### Settings Panel

```tsx
function AccessibilitySettings() {
  const {
    isHighVisibility,
    showHelpers,
    reducedMotion,
    setHighVisibility,
    setShowHelpers,
    setReducedMotion,
    resetPreferences
  } = useAccessibility();

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={isHighVisibility}
            onChange={(e) => setHighVisibility(e.target.checked)}
          />
        }
        label="High Visibility Mode"
      />
      <FormControlLabel
        control={
          <Switch
            checked={showHelpers}
            onChange={(e) => setShowHelpers(e.target.checked)}
          />
        }
        label="Show Contextual Help"
      />
      <FormControlLabel
        control={
          <Switch
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
        }
        label="Reduce Motion"
      />
      <Button onClick={resetPreferences}>Reset to Defaults</Button>
    </Box>
  );
}
```

## Persistence & Storage

### Storage Key

Preferences are stored in `localStorage` under the key:

```typescript
const STORAGE_KEY = 'hoa_accessibility_mode';
```

### Storage Format

```json
{
  "mode": "high-vis",
  "showHelpers": true,
  "reducedMotion": false
}
```

### Scope

Per the architectural decision (spec 2.5.5), accessibility preferences are **per-device** via localStorage:

- ✅ Zero backend impact
- ✅ Fast development velocity
- ✅ Simple for small user base (~40 homes)
- ❌ Not synced across devices (acceptable for v1.0)

**Future Enhancement:** Migrate to account-synced preferences if cross-device synchronization becomes a user need.

### Error Handling

The context gracefully handles:

- **Corrupted JSON**: Falls back to defaults
- **Invalid data types**: Sanitizes to valid values
- **localStorage quota exceeded**: Logs error, continues without crash
- **Missing localStorage**: Uses in-memory state only (server-side safe)

## Feature Flag Integration

### Bootstrap from Config Flags (Future)

The provider accepts optional `initialPreferences` for config flag bootstrap:

```tsx
// Example: Load from backend config on app startup
const [configFlags, setConfigFlags] = useState<ConfigFlags>();

useEffect(() => {
  apiService.getConfigFlags().then(setConfigFlags);
}, []);

return (
  <AccessibilityProvider
    initialPreferences={{
      mode: configFlags?.defaultAccessibilityMode,
      showHelpers: configFlags?.enableHelpersByDefault
    }}
  >
    <App />
  </AccessibilityProvider>
);
```

**Note:** As of v1.0, only admin endpoints expose config flags. The provider is designed to no-op gracefully if flag fetch fails, allowing frontend-only deployment.

### Dependencies

This feature depends on:

- **I1.T4**: Board governance schema (for future config storage)
- **I1.T5**: Governance API endpoints (for future flag retrieval)

When backend config endpoints are available for non-admin users, update the bootstrap logic to fetch and apply organization-wide defaults.

## Theme Integration (Future)

### Current State

The context manages accessibility mode but does **not yet** switch Material UI themes. This is by design for MVP delivery.

### Planned Integration

Task I2.T2 will refactor `frontend/src/theme/theme.ts` to:

1. Export `createAppTheme(mode: AccessibilityMode)` factory
2. Consume `useAccessibility()` in `App.tsx`
3. Dynamically regenerate theme when mode changes

**Example future code:**

```tsx
function App() {
  const { preferences } = useAccessibility();
  const theme = useMemo(
    () => createAppTheme(preferences.mode),
    [preferences.mode]
  );

  return (
    <ThemeProvider theme={theme}>
      {/* ... */}
    </ThemeProvider>
  );
}
```

### High Visibility Theme Specs (from spec 2.2)

When theme integration is complete, high-vis mode will apply:

- **Primary color**: `#000000` (Black) or `#003366` (Deep Navy)
- **Background**: `#FFFFFF` (Pure White)
- **Font size**: 20-25% larger than standard
- **Button padding**: Increased
- **Border thickness**: Increased for better contrast

## Testing

### Test Coverage

The test suite (`AccessibilityContext.test.tsx`) covers:

- ✅ Default state initialization
- ✅ High visibility toggle/set
- ✅ Contextual helpers toggle/set
- ✅ Reduced motion toggle/set
- ✅ localStorage persistence
- ✅ localStorage error handling (corrupted data, quota exceeded)
- ✅ System reduced motion detection
- ✅ System reduced motion change events
- ✅ Initial preferences (config flag bootstrap)
- ✅ Reset to defaults
- ✅ Hook usage outside provider (error case)
- ✅ Type safety

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm test AccessibilityContext
```

### Test Utilities

The test suite uses the standard RTL helpers from `frontend/src/test/test-utils.tsx`. The localStorage mock from `frontend/src/test/setup.ts` enables persistence testing without actual browser storage.

## Accessibility Compliance

This implementation supports WCAG 2.1 Level AA compliance:

- **1.4.3 Contrast (Minimum)**: High visibility mode ensures 4.5:1 contrast
- **1.4.4 Resize Text**: 20-25% font size increase without loss of functionality
- **2.3.3 Animation from Interactions**: Reduced motion respects `prefers-reduced-motion`
- **3.3.2 Labels or Instructions**: Contextual helpers provide additional guidance

## Troubleshooting

### Hook Error: "must be used within an AccessibilityProvider"

**Cause:** Using `useAccessibility()` outside the provider tree.

**Solution:** Ensure `AccessibilityProvider` wraps all components using the hook.

### Preferences Not Persisting

**Cause:** localStorage disabled or quota exceeded.

**Solution:** Check browser console for errors. Verify localStorage is enabled in browser settings.

### Reduced Motion Not Detecting System Preference

**Cause:** Browser doesn't support `matchMedia` or OS setting is off.

**Solution:** Use `setReducedMotion()` to manually enable. The context will still work without system detection.

### Theme Not Updating on Mode Change

**Cause:** Theme integration not yet implemented (as of I2.T1 completion).

**Solution:** This is expected. Wait for I2.T2 (theme refactor) to complete. The context is ready for integration.

## Migration Guide (Future)

### From localStorage to Account-Synced Preferences

If the team decides to implement Path B (account-synced preferences):

1. Add `accessibility_preferences` JSONB column to `Users` table
2. Update `AuthContext` to fetch preferences on login
3. Add API endpoints: `GET /api/users/me/preferences`, `PUT /api/users/me/preferences`
4. Update `AccessibilityProvider` to:
   - Accept `user` prop from `AuthContext`
   - Fetch preferences on mount if authenticated
   - POST updates to backend instead of only localStorage
   - Sync localStorage with backend response (for offline support)

**Note:** Keep localStorage as fallback for guest users and offline mode.

## Best Practices

1. **Always use the hook**: Don't access localStorage directly
2. **Test with reduced motion**: Verify animations respect the flag
3. **Document helper text**: Ensure all contextual helpers have meaningful content
4. **Avoid prop drilling**: Use the context hook in leaf components
5. **Reset on logout**: Call `resetPreferences()` when appropriate (optional per UX decision)

## Related Documentation

- [Accessibility Suite Specification](../../docs/specifications.md#22-accessibility-suite)
- [Architectural Decision: Persistence Scope](../../docs/specifications.md#255-accessibility-suite-activation-persistence-scope)
- [Theme Refactor Plan](../../docs/iterations/I2.md) (Task I2.T2)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For questions or issues:

1. Check test cases for usage examples
2. Review inline JSDoc comments in `AccessibilityContext.tsx`
3. Consult the team's accessibility champion
4. File an issue with the "accessibility" label
