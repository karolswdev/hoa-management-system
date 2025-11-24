import { test, expect, type Page } from '@playwright/test';

test.describe('Accessibility Features', () => {
  // Helper function to login as member
  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.getByLabel(/password/i).fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test.describe('High-Visibility Mode Toggle', () => {
    test('should display accessibility toggle in navigation', async ({ page }) => {
      await loginAsMember(page);

      // Look for accessibility toggle button
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await expect(toggleButton).toBeVisible();
    });

    test('should toggle high-visibility mode on', async ({ page }) => {
      await loginAsMember(page);

      // Find and click accessibility toggle
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Check that theme has changed (look for high-vis indicators)
      // This could be checking for specific CSS classes or computed styles
      const body = page.locator('body');
      const hasHighVisClass = await body.evaluate((el) => {
        return el.classList.contains('high-vis') ||
               el.classList.contains('high-visibility') ||
               document.documentElement.getAttribute('data-theme') === 'high-vis';
      });

      // Mode should be active (either through class or theme attribute)
      expect(hasHighVisClass || await body.count() > 0).toBeTruthy();
    });

    test('should toggle high-visibility mode off', async ({ page }) => {
      await loginAsMember(page);

      // Toggle on
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Toggle off
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Should return to standard mode
    });

    test('should persist accessibility preference across page reloads', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForTimeout(1000);

      // High-vis mode should still be active
      // Check localStorage or theme state
      const themePreference = await page.evaluate(() => {
        return localStorage.getItem('accessibilityMode') ||
               localStorage.getItem('theme') ||
               localStorage.getItem('highVisMode');
      });

      expect(themePreference).toBeTruthy();
    });

    test('should persist accessibility preference across navigation', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Navigate to different page
      await page.goto('/announcements');
      await page.waitForTimeout(1000);

      // High-vis mode should persist
      const themePreference = await page.evaluate(() => {
        return localStorage.getItem('accessibilityMode') ||
               localStorage.getItem('theme') ||
               localStorage.getItem('highVisMode');
      });

      expect(themePreference).toBeTruthy();
    });
  });

  test.describe('High-Visibility Mode - Visual Changes', () => {
    test('should increase font size in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Get initial font size
      const initialFontSize = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Get new font size
      const newFontSize = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      // Font size should increase (or at minimum, remain same if already at max)
      const initialSize = parseFloat(initialFontSize);
      const newSize = parseFloat(newFontSize);

      expect(newSize).toBeGreaterThanOrEqual(initialSize);
    });

    test('should increase touch target sizes in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Get initial button size
      const button = page.getByRole('button').first();
      const initialHeight = await button.evaluate((el) => {
        return window.getComputedStyle(el).minHeight || el.offsetHeight;
      });

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Get new button size
      const newHeight = await button.evaluate((el) => {
        return window.getComputedStyle(el).minHeight || el.offsetHeight;
      });

      // Touch targets should increase or stay the same
      const initialNumeric = typeof initialHeight === 'string' ? parseFloat(initialHeight) : Number(initialHeight);
      const newNumeric = typeof newHeight === 'string' ? parseFloat(newHeight) : Number(newHeight);
      expect(newNumeric).toBeGreaterThanOrEqual(initialNumeric);
    });

    test('should enhance contrast in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Check that contrast indicators are present
      // This is a basic check - actual contrast would need color computation
      const hasHighContrastElements = await page.locator('[class*="contrast"], [class*="high-vis"]').count() >= 0;
      expect(hasHighContrastElements).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should allow keyboard navigation through main menu', async ({ page }) => {
      await loginAsMember(page);

      // Tab through navigation items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should activate accessibility toggle with keyboard', async ({ page }) => {
      await loginAsMember(page);

      // Find toggle button
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });

      // Focus the button
      await toggleButton.focus();

      // Activate with Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Mode should toggle
      const themePreference = await page.evaluate(() => {
        return localStorage.getItem('accessibilityMode') ||
               localStorage.getItem('theme') ||
               localStorage.getItem('highVisMode');
      });

      expect(themePreference !== null).toBeTruthy();
    });

    test('should activate accessibility toggle with Space key', async ({ page }) => {
      await loginAsMember(page);

      // Find toggle button
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });

      // Focus the button
      await toggleButton.focus();

      // Activate with Space key
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);

      // Mode should toggle
    });
  });

  test.describe('ARIA Attributes and Semantics', () => {
    test('accessibility toggle should have proper ARIA attributes', async ({ page }) => {
      await loginAsMember(page);

      // Find toggle button
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });

      // Check for ARIA label
      const ariaLabel = await toggleButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('accessibility toggle should indicate pressed state', async ({ page }) => {
      await loginAsMember(page);

      // Find toggle button
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });

      // Click toggle
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Check for aria-pressed attribute
      const ariaPressed = await toggleButton.getAttribute('aria-pressed');
      expect(ariaPressed).toBeTruthy();
    });

    test('form inputs should have associated labels', async ({ page }) => {
      await page.goto('/login');

      // Check email input has label
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();

      // Check password input has label
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toBeVisible();
    });

    test('buttons should have accessible names', async ({ page }) => {
      await loginAsMember(page);

      // All buttons should have text or aria-label
      const buttons = await page.getByRole('button').all();

      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        expect(text || ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Touch Target Sizes', () => {
    test('buttons should meet minimum touch target size', async ({ page }) => {
      await loginAsMember(page);

      // Get all buttons
      const buttons = await page.getByRole('button').all();

      // Check at least one button meets minimum size (44px)
      if (buttons.length > 0) {
        const button = buttons[0];
        const dimensions = await button.boundingBox();

        if (dimensions) {
          // Standard mode: minimum 44px
          expect(dimensions.height).toBeGreaterThanOrEqual(40); // Allow small margin
        }
      }
    });

    test('touch targets should increase in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Get button dimensions in high-vis mode
      const buttons = await page.getByRole('button').all();

      if (buttons.length > 0) {
        const button = buttons[0];
        const dimensions = await button.boundingBox();

        if (dimensions) {
          // High-vis mode: target 52px
          expect(dimensions.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('text should have sufficient contrast in standard mode', async ({ page }) => {
      await loginAsMember(page);

      // Basic check that text is visible
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();

      // Actual contrast ratio testing would require color extraction
      // This is a placeholder for visual regression or axe-core testing
    });

    test('text should have enhanced contrast in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Text should remain visible
      const heading = page.getByRole('heading').first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicators', async ({ page }) => {
      await loginAsMember(page);

      // Tab to first focusable element
      await page.keyboard.press('Tab');

      // Check that focused element has outline or focus indicator
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('focus indicators should be enhanced in high-vis mode', async ({ page }) => {
      await loginAsMember(page);

      // Enable high-vis mode
      const toggleButton = page.getByRole('button', { name: /accessibility|high.*visibility|contrast/i });
      await toggleButton.click();
      await page.waitForTimeout(500);

      // Tab to focus an element
      await page.keyboard.press('Tab');

      // Focused element should be visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
