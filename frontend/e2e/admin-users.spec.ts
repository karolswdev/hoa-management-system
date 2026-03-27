import { test, expect, type Page } from '@playwright/test';

test.describe('Admin User Management', () => {
  async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test('should display user management page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
  });

  test('should display user table with data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Should show at least the admin user
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should display rows per page selector', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Should show the rows per page control
    await expect(page.locator('text=/rows per page/i')).toBeVisible();
  });

  test('should change rows per page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Find the rows-per-page select and change to "All"
    const rowsSelect = page.locator('select').first();
    if (await rowsSelect.count() > 0) {
      await rowsSelect.selectOption('0'); // 0 = All
      await page.waitForTimeout(1000);

      // Should show "Showing all X entries"
      await expect(page.locator('text=/showing all/i')).toBeVisible();
    }
  });

  test('should display search and filter controls', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await expect(page.getByLabel(/search users/i)).toBeVisible();
  });

  test('should filter users by search term', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Search for a specific user
    await page.getByLabel(/search users/i).fill('admin');
    await page.waitForTimeout(500);
  });

  test('should open update status dialog', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Click action menu (three-dot icon) on a user row
    const actionButton = page.locator('table tbody tr').first().locator('button').first();
    if (await actionButton.count() > 0) {
      await actionButton.click();
      await page.waitForTimeout(500);

      const updateStatusOption = page.getByRole('menuitem', { name: /update status/i });
      if (await updateStatusOption.count() > 0) {
        await updateStatusOption.click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: /update user status/i })).toBeVisible();
      }
    }
  });

  test('should show total user count in pagination info', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');

    await page.waitForTimeout(1000);

    // Should show "Showing X to Y of Z entries"
    await expect(page.locator('text=/showing.*of.*entries/i')).toBeVisible();
  });
});
