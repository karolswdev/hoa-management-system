import { test, expect } from '@playwright/test';

test.describe('Announcements', () => {
  // Helper function to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test('should display announcements page for authenticated users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    await expect(page.getByRole('heading', { name: /announcements/i })).toBeVisible();
  });

  test('admin should be able to create announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    // Click create announcement button
    await page.getByRole('button', { name: /create.*announcement/i }).click();

    // Fill in announcement form
    await page.getByLabel(/title/i).fill('Test Announcement');
    await page.getByLabel(/content/i).fill('This is a test announcement content.');

    // Submit the form
    await page.getByRole('button', { name: /create|submit|save/i }).click();

    // Verify success message
    await expect(page.locator('text=/announcement.*created/i')).toBeVisible({ timeout: 5000 });

    // Verify announcement appears in list
    await expect(page.getByText('Test Announcement')).toBeVisible();
  });

  test('admin should be able to send email notification with announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    await page.getByRole('button', { name: /create.*announcement/i }).click();

    await page.getByLabel(/title/i).fill('Important Notice');
    await page.getByLabel(/content/i).fill('This is an important notice for all members.');

    // Check the notify checkbox
    await page.getByLabel(/notify.*members|send.*email/i).check();

    await page.getByRole('button', { name: /create|submit|save/i }).click();

    // Verify success message mentions email notification
    await expect(page.locator('text=/announcement.*created/i')).toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to edit announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    // Click edit on first announcement
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Update title
    const titleInput = page.getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill('Updated Announcement Title');

    // Save changes
    await page.getByRole('button', { name: /update|save/i }).click();

    // Verify success message
    await expect(page.locator('text=/announcement.*updated/i')).toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to delete announcement', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/announcements');

    // Get initial announcement count
    const announcementsBeforeDelete = await page.locator('[data-testid="announcement-item"]').count();

    // Click delete on first announcement
    await page.getByRole('button', { name: /delete/i }).first().click();

    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    // Verify success message
    await expect(page.locator('text=/announcement.*deleted/i')).toBeVisible({ timeout: 5000 });

    // Verify announcement is removed from list
    const announcementsAfterDelete = await page.locator('[data-testid="announcement-item"]').count();
    expect(announcementsAfterDelete).toBeLessThan(announcementsBeforeDelete);
  });

  test('member should be able to view announcements', async ({ page }) => {
    // Login as regular member (adjust credentials as needed)
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.getByLabel(/password/i).fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/announcements');

    // Should see announcements but not create/edit/delete buttons
    await expect(page.getByRole('heading', { name: /announcements/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create.*announcement/i })).not.toBeVisible();
  });
});
