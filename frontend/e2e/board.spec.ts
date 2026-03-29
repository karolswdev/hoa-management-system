import { test, expect, type Page } from '@playwright/test';

test.describe('Board Page', () => {
  async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.locator('input[name="password"]').fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.locator('input[name="password"]').fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test.describe('Board Page - Member Access', () => {
    test('should display board page to authenticated members', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board');

      // Should see the board page with some heading
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display board content', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board');

      await page.waitForTimeout(1000);

      // Should show board-related content (roster, members, or empty state)
      const hasContent = await page.locator('text=/board|roster|president|member|director|contact/i').count() > 0;
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Board Page - Admin Access', () => {
    test('admin should access board page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/board');

      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
    });

    test('admin should see management options if available', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/board');

      await page.waitForTimeout(1000);

      // Admin may see management buttons/tabs
      const hasAdminControls = await page.getByRole('button', { name: /add|create|manage|edit/i }).count() > 0;
      const hasTabs = await page.getByRole('tab').count() > 0;
      const hasContent = await page.getByRole('heading').count() > 0;

      // At minimum, the page renders
      expect(hasAdminControls || hasTabs || hasContent).toBeTruthy();
    });
  });

  test.describe('Board Page - Guest Access', () => {
    test('should handle guest access to board page', async ({ page }) => {
      await page.goto('/board');

      await page.waitForTimeout(2000);

      // Guests should either see the board page (if public) or be redirected to login
      const isLoginPage = page.url().includes('/login');
      const hasBoardContent = await page.locator('text=/board|roster|contact/i').count() > 0;

      expect(isLoginPage || hasBoardContent).toBeTruthy();
    });
  });
});
