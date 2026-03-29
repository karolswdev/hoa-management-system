import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/HOA|Sanderson Creek/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for validation messages
    await expect(page.locator('text=/email is required/i')).toBeVisible();
    await expect(page.locator('text=/password is required/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message
    await expect(page.locator('text=/invalid.*email|invalid.*password|invalid.*credentials/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // This test assumes you have a test user in your database
    // Adjust credentials as needed for your test environment
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.locator('input[name="password"]').fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  });

  test('should have link to register page', async ({ page }) => {
    const registerLink = page.getByText(/sign up here/i);
    await expect(registerLink).toBeVisible();
    // Verify the link href points to register
    const href = await registerLink.getAttribute('href');
    expect(href).toBe('/register');
  });

  test('should have link to forgot password page', async ({ page }) => {
    const forgotLink = page.getByText(/forgot your password/i);
    await expect(forgotLink).toBeVisible();
    // Verify the link href points to forgot-password
    const href = await forgotLink.getAttribute('href');
    expect(href).toBe('/forgot-password');
  });
});
