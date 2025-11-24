# Contexts

This directory contains React Context providers for global state management across the HOA Management System frontend.

## Available Contexts

### AccessibilityContext

Manages accessibility preferences including high visibility mode, contextual helpers, and reduced motion settings.

**Quick Usage:**

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

**Features:**
- High visibility mode toggle
- Contextual help display control
- Reduced motion preference detection
- Automatic localStorage persistence
- System accessibility setting detection

**Documentation:** See [ACCESSIBILITY_CONTEXT.md](../docs/ACCESSIBILITY_CONTEXT.md) for complete API reference and examples.

---

### AuthContext

Manages user authentication state, login/logout operations, and user profile data.

**Quick Usage:**

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return isAuthenticated ? (
    <div>Welcome, {user.name}! <button onClick={logout}>Logout</button></div>
  ) : (
    <div>Please log in</div>
  );
}
```

---

### NotificationContext

Manages application-wide notifications and toast messages using notistack.

**Quick Usage:**

```tsx
import { useNotification } from '@/contexts/NotificationContext';

function MyComponent() {
  const { showSuccess, showError } = useNotification();

  const handleAction = async () => {
    try {
      await someApiCall();
      showSuccess('Operation completed successfully');
    } catch (error) {
      showError('Operation failed');
    }
  };
}
```

---

## Provider Setup

All contexts are initialized in `App.tsx` in the following order:

```tsx
<ThemeProvider>
  <CssBaseline />
  <LocalizationProvider>
    <AccessibilityProvider>
      <NotificationProvider>
        <AuthProvider>
          {/* App routes */}
        </AuthProvider>
      </NotificationProvider>
    </AccessibilityProvider>
  </LocalizationProvider>
</ThemeProvider>
```

**Note:** Order matters! Inner providers can consume outer contexts.

## Creating New Contexts

When creating a new context, follow the established pattern:

1. **Define types** for the context value and provider props
2. **Create the context** with `createContext<Type | undefined>(undefined)`
3. **Implement the provider** component with state management
4. **Export a custom hook** that validates context usage
5. **Write comprehensive tests** covering all scenarios
6. **Document the API** with usage examples

**Example template:**

```tsx
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface MyContextType {
  value: string;
  setValue: (value: string) => void;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [value, setValue] = useState('');

  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = (): MyContextType => {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

## Testing Contexts

All contexts should have corresponding `.test.tsx` files with coverage for:

- Default state initialization
- State updates and mutations
- Persistence (if applicable)
- Error handling
- Hook usage outside provider (error case)
- Edge cases and boundary conditions

Use the shared test utilities from `@/test/test-utils.tsx` for consistent testing setup.

## Best Practices

1. **Hook naming**: Always prefix with `use` (e.g., `useAuth`, `useAccessibility`)
2. **Error messages**: Include the provider name for clarity when hooks are used incorrectly
3. **Type safety**: Export all relevant types for consumer use
4. **Documentation**: Add JSDoc comments for IntelliSense support
5. **Memoization**: Use `useMemo`/`useCallback` for complex values/functions
6. **Persistence**: Handle localStorage errors gracefully (quota, disabled, etc.)
7. **Testing**: Achieve >90% coverage for all contexts

## Related Documentation

- [Test Utilities](../test/test-utils.tsx)
- [Accessibility Context API](../docs/ACCESSIBILITY_CONTEXT.md)
- [Project Architecture](../../docs/architecture.md)
