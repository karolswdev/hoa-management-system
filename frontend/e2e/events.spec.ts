import { test, expect, type Page } from '@playwright/test';

test.describe('Events', () => {
  async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.getByLabel(/password/i).fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test.describe('Member Events Page', () => {
    test('should display events page', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/events');

      await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    });

    test('should display upcoming and past event tabs', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/events');

      await expect(page.getByRole('tab', { name: /upcoming/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /past/i })).toBeVisible();
    });

    test('should switch between upcoming and past tabs', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/events');

      // Click past events tab
      await page.getByRole('tab', { name: /past/i }).click();
      await page.waitForTimeout(500);

      // Click back to upcoming
      await page.getByRole('tab', { name: /upcoming/i }).click();
      await page.waitForTimeout(500);
    });

    test('should redirect guests to login', async ({ page }) => {
      await page.goto('/events');
      await expect(page).toHaveURL(/\/login/i, { timeout: 5000 });
    });
  });

  test.describe('Admin Event Management', () => {
    test('should display admin events page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');

      await expect(page.getByRole('heading', { name: /event management/i })).toBeVisible();
    });

    test('should show create event button', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');

      await expect(page.getByRole('button', { name: /create event/i })).toBeVisible();
    });

    test('should open create event dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');

      await page.getByRole('button', { name: /create event/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/title/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
      await expect(page.getByLabel(/location/i)).toBeVisible();
    });

    test('should show validation errors for empty event form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');

      await page.getByRole('button', { name: /create event/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Try to submit empty form
      await page.getByRole('button', { name: /^create$/i }).click();

      // Should show validation errors
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 3000 });
    });

    test('should open create event dialog with all required fields', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');

      await page.getByRole('button', { name: /create event/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Verify all required form fields are present
      await expect(page.getByLabel(/title/i)).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
      await expect(page.getByLabel(/location/i)).toBeVisible();

      // Verify date/time picker fields exist
      const dateInputs = page.getByRole('dialog').locator('input');
      expect(await dateInputs.count()).toBeGreaterThanOrEqual(3);
    });
  });
});
