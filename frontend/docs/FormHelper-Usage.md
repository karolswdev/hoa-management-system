# FormHelper Component Usage Guide

## Overview

The `FormHelper` component is a molecule-level UI component that provides contextual help for form fields in the HOA Management System. It renders as a question mark (?) icon button that opens an accessible popover containing help text.

**Key Features:**
- Conditional rendering based on accessibility context (`showHelpers` preference)
- Fully accessible with WCAG 2.1 AA compliance
- Theme-aware styling for standard and high-visibility modes
- Focus trap and keyboard navigation support
- Meets minimum touch target requirements (44px standard, 52px high-vis)

---

## Installation

The component is located at:
```
frontend/src/components/common/FormHelper.tsx
```

Import it into your component:
```tsx
import FormHelper from '../components/common/FormHelper';
```

---

## Basic Usage

### Simple Example

```tsx
import FormHelper from '../components/common/FormHelper';

function MyForm() {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        label="Email"
        aria-describedby="email-help"
      />
      <FormHelper
        helpText="Enter your official HOA email address for communications."
        helpContentId="email-help"
      />
    </Box>
  );
}
```

### With Custom ARIA Label

```tsx
<FormHelper
  helpText="Select the board role according to HOA bylaws."
  ariaLabel="Help for board role selection"
  helpContentId="role-help"
/>
```

### Complete Form Field with Helper

```tsx
<Box display="flex" alignItems="flex-start" gap={1}>
  <TextField
    id="member-name"
    label="Full Name"
    aria-describedby="name-help"
    inputProps={{
      'aria-label': 'Member full name',
      'aria-required': 'true',
    }}
    fullWidth
  />
  <FormHelper
    helpText="Enter the member's full legal name as it appears on official documents."
    ariaLabel="Help for member name field"
    helpContentId="name-help"
    testId="name-helper"
  />
</Box>
```

---

## Props API

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `helpText` | `string` | Yes | - | The help text to display in the popover |
| `ariaLabel` | `string` | No | `"Help information"` | ARIA label for the icon button |
| `helpContentId` | `string` | No | Auto-generated | ID for the help content (used for `aria-describedby`) |
| `testId` | `string` | No | - | data-testid attribute for testing |

---

## Accessibility Features

### Conditional Rendering

The FormHelper **only renders when `showHelpers` is enabled** in the AccessibilityContext. This prevents visual clutter for users who don't need contextual help.

```tsx
// Helper will only appear if user has enabled helpers in accessibility settings
const { showHelpers } = useAccessibility();

// Component automatically handles this:
if (!showHelpers) {
  return null;
}
```

### ARIA Attributes

The component implements proper ARIA semantics:

```tsx
<IconButton
  aria-label="Help information"
  aria-haspopup="dialog"
  aria-expanded={isOpen}
  aria-controls={isOpen ? popoverId : undefined}
>
```

### Keyboard Navigation

- **Tab**: Focus the help icon button
- **Enter/Space**: Open the popover
- **Escape**: Close the popover and return focus to the button
- **Click Away**: Close the popover

### Focus Management

The component automatically:
1. Traps focus when the popover is open
2. Returns focus to the trigger button when closed
3. Manages focus with ESC key press

---

## Theme Integration

### Standard Mode

- Icon size: **24px**
- Button size: **44px** (minimum touch target)
- Border: None
- Background: Info Azure (#1D8CD8)
- Text color: White (#FFFFFF)

### High-Visibility Mode

- Icon size: **28px**
- Button size: **52px** (enhanced touch target)
- Border: **2px solid Info Azure**
- Background: Info Azure (#4FB3FF - brighter in high-vis)
- Border on popover: **1px solid Onyx**
- No box shadow (replaced with borders)

---

## Examples

### Example 1: Board Contact Form

```tsx
import { Box, TextField } from '@mui/material';
import FormHelper from '../components/common/FormHelper';

function BoardContactForm() {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Name Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-name"
          label="Full Name"
          aria-describedby="contact-name-help"
          fullWidth
          required
        />
        <FormHelper
          helpText="Enter your full legal name as it appears on official HOA documents."
          ariaLabel="Help for full name field"
          helpContentId="contact-name-help"
        />
      </Box>

      {/* Subject Field */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          id="contact-subject"
          label="Subject"
          aria-describedby="contact-subject-help"
          fullWidth
          required
        />
        <FormHelper
          helpText="Briefly summarize your inquiry or concern (minimum 10 characters)."
          ariaLabel="Help for subject field"
          helpContentId="contact-subject-help"
        />
      </Box>
    </Box>
  );
}
```

### Example 2: Admin Board Management Modal

```tsx
import { Dialog, DialogContent, TextField, Box } from '@mui/material';
import FormHelper from '../components/common/FormHelper';

function BoardManagementModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        {/* Role Selection */}
        <Box display="flex" alignItems="flex-start" gap={1}>
          <FormControl fullWidth required>
            <InputLabel id="role-label">Board Role</InputLabel>
            <Select
              labelId="role-label"
              aria-describedby="role-help"
            >
              <MenuItem value="President">President</MenuItem>
              <MenuItem value="Vice President">Vice President</MenuItem>
            </Select>
          </FormControl>
          <FormHelper
            helpText="Select the official board position. Roles determine voting rights and responsibilities per HOA bylaws."
            ariaLabel="Help for role field"
            helpContentId="role-help"
          />
        </Box>

        {/* Term Dates */}
        <Box display="flex" alignItems="flex-start" gap={1}>
          <TextField
            type="date"
            label="Term Start Date"
            aria-describedby="term-start-help"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormHelper
            helpText="Enter the date when this board member's term officially begins."
            ariaLabel="Help for term start date"
            helpContentId="term-start-help"
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
```

### Example 3: Multi-Line Help Text

```tsx
<FormHelper
  helpText="Provide detailed information about your inquiry, including relevant dates, locations, or policy references. Messages must be at least 20 characters and should clearly describe your concern or request."
  ariaLabel="Help for message field"
  helpContentId="message-help"
/>
```

---

## Testing

### Conditional Rendering Tests

```tsx
import { render, screen } from '@testing-library/react';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import FormHelper from '../components/common/FormHelper';

test('does not render when showHelpers is false', () => {
  render(
    <AccessibilityProvider initialPreferences={{ showHelpers: false }}>
      <FormHelper helpText="Test" testId="helper" />
    </AccessibilityProvider>
  );

  expect(screen.queryByTestId('helper')).not.toBeInTheDocument();
});

test('renders when showHelpers is true', () => {
  render(
    <AccessibilityProvider initialPreferences={{ showHelpers: true }}>
      <FormHelper helpText="Test" testId="helper" />
    </AccessibilityProvider>
  );

  expect(screen.getByTestId('helper')).toBeInTheDocument();
});
```

### Popover Behavior Tests

```tsx
import { fireEvent, waitFor } from '@testing-library/react';

test('opens popover on click', async () => {
  render(
    <AccessibilityProvider initialPreferences={{ showHelpers: true }}>
      <FormHelper helpText="Help text" testId="helper" />
    </AccessibilityProvider>
  );

  const button = screen.getByTestId('helper');
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });
});

test('closes popover on ESC key', async () => {
  render(
    <AccessibilityProvider initialPreferences={{ showHelpers: true }}>
      <FormHelper helpText="Help text" testId="helper" />
    </AccessibilityProvider>
  );

  const button = screen.getByTestId('helper');

  // Open popover
  fireEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  // Close with ESC
  fireEvent.keyDown(button, { key: 'Escape' });
  await waitFor(() => {
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
  });
});
```

---

## Best Practices

### 1. Always Link to Form Fields

Use `aria-describedby` to connect the helper to its form field:

```tsx
<TextField
  aria-describedby="field-help"
/>
<FormHelper helpContentId="field-help" />
```

### 2. Write Clear, Concise Help Text

✅ **Good:**
```tsx
helpText="Enter your full legal name as it appears on official HOA documents."
```

❌ **Avoid:**
```tsx
helpText="Name" // Too vague
helpText="This is the field where you should enter your name which is the name that appears on your documents..." // Too verbose
```

### 3. Use Semantic Container Layout

Align helpers with field labels:

```tsx
<Box display="flex" alignItems="flex-start" gap={1}>
  <TextField fullWidth />
  <FormHelper helpText="..." />
</Box>
```

### 4. Provide Context-Specific Help

Tailor help text to the specific form and user context:

```tsx
// Board contact form
<FormHelper helpText="Provide a valid email where the board can respond." />

// Admin member management
<FormHelper helpText="Member email must match HOA registration records." />
```

### 5. Test Accessibility

Always test with:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High-visibility mode enabled
- Helpers toggled on/off

---

## Common Patterns

### Pattern 1: Required Field with Helper

```tsx
<Box display="flex" alignItems="flex-start" gap={1}>
  <TextField
    label="Email"
    required
    aria-describedby="email-help"
    inputProps={{
      'aria-required': 'true',
    }}
    fullWidth
  />
  <FormHelper
    helpText="Your email will be used for HOA communications and voting notifications."
    helpContentId="email-help"
  />
</Box>
```

### Pattern 2: Helper with Validation

```tsx
<Box display="flex" alignItems="flex-start" gap={1}>
  <TextField
    label="Subject"
    error={Boolean(errors.subject)}
    helperText={errors.subject || "Minimum 10 characters"}
    aria-describedby="subject-help"
    inputProps={{
      'aria-invalid': Boolean(errors.subject),
      minLength: 10,
    }}
    fullWidth
  />
  <FormHelper
    helpText="Briefly summarize your inquiry (minimum 10 characters)."
    helpContentId="subject-help"
  />
</Box>
```

### Pattern 3: Complex Multi-Step Helper

```tsx
<FormHelper
  helpText="Step 1: Select the board role. Step 2: Verify the term dates match the election results. Step 3: Add a brief biography highlighting relevant experience."
  ariaLabel="Multi-step guidance for board member creation"
  helpContentId="multi-step-help"
/>
```

---

## Troubleshooting

### Helper Not Showing

**Problem:** FormHelper icon doesn't appear

**Solution:** Check that `showHelpers` is enabled in AccessibilityContext:

```tsx
// In your app or settings page
const { setShowHelpers } = useAccessibility();
setShowHelpers(true);
```

### Popover Not Opening

**Problem:** Clicking the icon does nothing

**Solution:** Verify the component is wrapped in `ThemeProvider` and `AccessibilityProvider`:

```tsx
<ThemeProvider theme={createAppTheme('standard')}>
  <AccessibilityProvider>
    <FormHelper helpText="..." />
  </AccessibilityProvider>
</ThemeProvider>
```

### ARIA Connection Issues

**Problem:** Screen reader doesn't announce help text with field

**Solution:** Ensure `helpContentId` matches `aria-describedby`:

```tsx
<TextField aria-describedby="my-field-help" />
<FormHelper helpContentId="my-field-help" />
```

### Focus Not Returning

**Problem:** Focus doesn't return to button after closing popover

**Solution:** This is handled automatically. If it's not working, check that you're not preventing default behavior on ESC key elsewhere in your form.

---

## Related Components

- **AccessibilityContext** (`frontend/src/contexts/AccessibilityContext.tsx`) - Manages `showHelpers` state
- **AccessibilityToggle** (`frontend/src/components/Accessibility/Toggle.tsx`) - UI control to enable/disable helpers
- **ContactForm** (`frontend/src/components/Board/ContactForm.tsx`) - Example usage in a form
- **BoardManagementModal** (`frontend/src/pages/admin/BoardManagement.tsx`) - Example usage in a modal

---

## Design Tokens Reference

The FormHelper uses the following design tokens from `theme/tokens.json`:

| Token | Standard | High-Vis | Usage |
|-------|----------|----------|-------|
| `sizing.target.icon` | 24px | 28px | Icon size |
| `sizing.target.button` | 44px | 52px | Button touch target |
| `color.state.info.azure` | #1D8CD8 | #4FB3FF | Button & popover color |
| `color.primary.onyx` | #000000 | #000000 | Border color (high-vis) |
| `component.tooltip.borderRadius` | 12px | 12px | Popover border radius |
| `component.focusRing.width` | 2px | 2px | Focus outline width |
| `component.focusRing.offset` | 2px | 2px | Focus outline offset |

---

## Changelog

### Version 1.0.0 (2025-11-23)
- Initial implementation
- Conditional rendering based on `showHelpers` context
- Accessible popover with focus trap
- Theme-aware styling for standard and high-vis modes
- WCAG 2.1 AA compliance
- Comprehensive test suite

---

## Support

For questions or issues with the FormHelper component:
1. Check this documentation
2. Review the component source code and inline comments
3. Run the test suite: `npm test FormHelper.test.tsx`
4. Check the accessibility architecture doc: `.codemachine/artifacts/architecture/06_UI_UX_Architecture.md`
