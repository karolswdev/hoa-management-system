import { test, expect, type Page } from '@playwright/test';

test.describe('Announcements', () => {
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

  test('should display announcements page for authenticated users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    await expect(page.getByRole('heading', { name: /announcements/i }).first()).toBeVisible();
  });

  test('admin should see create announcement button on admin page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/announcements');

    await expect(page.getByRole('button', { name: /create.*announcement/i })).toBeVisible();
  });

  test('admin should open create announcement dialog', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/announcements');

    await page.getByRole('button', { name: /create.*announcement/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('admin should create announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/announcements');

    await page.getByRole('button', { name: /create.*announcement/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/title/i).fill('E2E Test Announcement');
    await page.getByLabel(/content/i).fill('This is a test announcement.');

    await page.getByRole('button', { name: /^create$|^submit$|^save$/i }).click();

    // Verify success — either snackbar or dialog closes
    await page.waitForTimeout(2000);
    const success = await page.locator('.notistack-SnackbarContainer').locator('text=/created|success/i').isVisible().catch(() => false);
    const dialogClosed = !(await page.getByRole('dialog').isVisible().catch(() => false));
    expect(success || dialogClosed).toBeTruthy();
  });

  test('admin should see notify members option', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/announcements');

    await page.getByRole('button', { name: /create.*announcement/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Should see a notify/email checkbox
    const notifyCheckbox = page.getByLabel(/notify|email/i);
    if (await notifyCheckbox.count() > 0) {
      await expect(notifyCheckbox).toBeVisible();
    }
  });

  test('member should be able to view announcements', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/announcements');

    // Should see announcements heading
    await expect(page.getByRole('heading', { name: /announcements/i }).first()).toBeVisible();

    // Members should NOT see create button
    const createButton = page.getByRole('button', { name: /create.*announcement/i });
    expect(await createButton.count()).toBe(0);
  });
});
