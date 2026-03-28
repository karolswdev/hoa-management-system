import { test, expect, type Page } from '@playwright/test';

test.describe('Profile Management', () => {
  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.locator('input[name="password"]').fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test('should display profile page', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
  });

  test('should display personal information', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: /personal information/i })).toBeVisible();
    // Should show member's email
    await expect(page.locator('text=/member@example.com/i')).toBeVisible();
  });

  test('should show edit profile and change password buttons', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change password/i })).toBeVisible();
  });

  test('should open edit profile dialog', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await page.getByRole('button', { name: /edit profile/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible();
  });

  test('should open change password dialog', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await page.getByRole('button', { name: /change password/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    await expect(page.getByLabel(/^new password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm.*password/i)).toBeVisible();
  });

  test('should show validation error for wrong current password', async ({ page }) => {
    await loginAsMember(page);
    await page.goto('/profile');

    await page.getByRole('button', { name: /change password/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/current password/i).fill('WrongPassword123!');
    await page.getByLabel(/^new password$/i).fill('NewTestPass456!');
    await page.getByLabel(/confirm.*password/i).fill('NewTestPass456!');

    await page.getByRole('button', { name: /^change password$/i }).click();

    // Should show error — either in dialog or as a snackbar notification
    const errorInDialog = page.getByRole('dialog').locator('text=/incorrect|wrong|invalid|failed/i');
    const errorSnackbar = page.locator('.notistack-SnackbarContainer').locator('text=/incorrect|wrong|invalid|failed/i');
    await expect(errorInDialog.or(errorSnackbar)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect guests to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/i, { timeout: 5000 });
  });
});
