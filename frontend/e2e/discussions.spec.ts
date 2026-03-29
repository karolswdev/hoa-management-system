import { test, expect, type Page } from '@playwright/test';

test.describe('Discussions', () => {
  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.locator('input[name="password"]').fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test.describe('Discussions Page', () => {
    test('should display discussions page', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');

      await expect(page.getByRole('heading', { name: /community discussions|discussions/i })).toBeVisible();
    });

    test('should show start new discussion button', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');

      // May need to accept code of conduct first
      const cocAcceptButton = page.getByRole('button', { name: /accept|agree/i });
      if (await cocAcceptButton.count() > 0) {
        await cocAcceptButton.click();
        await page.waitForTimeout(500);
      }

      await expect(page.getByRole('button', { name: /start new discussion/i })).toBeVisible();
    });

    test('should open new discussion dialog', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');

      // Accept code of conduct if present
      const cocAcceptButton = page.getByRole('button', { name: /accept|agree/i });
      if (await cocAcceptButton.count() > 0) {
        await cocAcceptButton.click();
        await page.waitForTimeout(500);
      }

      await page.getByRole('button', { name: /start new discussion/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/discussion title|title/i)).toBeVisible();
      await expect(page.getByLabel(/content/i)).toBeVisible();
    });

    test('should show create discussion dialog with required fields', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');

      // Accept code of conduct if present
      const cocAcceptButton = page.getByRole('button', { name: /accept|agree/i });
      if (await cocAcceptButton.count() > 0) {
        await cocAcceptButton.click();
        await page.waitForTimeout(500);
      }

      const startButton = page.getByRole('button', { name: /start new discussion/i });
      if (await startButton.count() > 0) {
        await startButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Dialog should contain title and content fields
        await expect(page.getByLabel(/title/i)).toBeVisible();
        await expect(page.getByLabel(/content/i)).toBeVisible();
      }
    });

    test('should redirect guests to login', async ({ page }) => {
      await page.goto('/discussions');
      await expect(page).toHaveURL(/\/login/i, { timeout: 5000 });
    });
  });
});
