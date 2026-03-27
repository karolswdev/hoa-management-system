import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('text=/name.*required|full name.*required/i')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/email.*required/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByLabel(/^password$/i).fill('TestPass123!');
    await page.getByLabel(/confirm password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('text=/valid.*email|invalid.*email/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('newuser@example.com');
    await page.getByLabel(/^password$/i).fill('TestPass123!');
    await page.getByLabel(/confirm password/i).fill('DifferentPass456!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('text=/passwords.*match|password.*match/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for already registered email', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Existing User');
    await page.getByLabel(/email address/i).fill('admin@example.com');
    await page.getByLabel(/^password$/i).fill('TestPass123!');
    await page.getByLabel(/confirm password/i).fill('TestPass123!');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.locator('text=/already.*registered|already.*exists|email.*taken/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/i);
  });
});
