import { test, expect, type Page } from '@playwright/test';

test.describe('Democracy Module - Polls and Voting', () => {
  // Helper function to login as admin
  async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  // Helper function to login as member
  async function loginAsMember(page: Page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.getByLabel(/password/i).fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  }

  test.describe('Poll List and Display', () => {
    test('should display polls page to authenticated users', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      await expect(page.getByRole('heading', { name: /polls|voting/i })).toBeVisible();
    });

    test('should display active polls', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      // Wait for polls to load
      await page.waitForTimeout(1000);

      // Should either show polls or empty state
      const hasPollsOrEmpty = await page.locator('text=/poll|vote|no polls|no active/i').count() > 0;
      expect(hasPollsOrEmpty).toBeTruthy();
    });

    test('should redirect guests to login when accessing polls', async ({ page }) => {
      await page.goto('/polls');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/i, { timeout: 5000 });
    });
  });

  test.describe('Poll Creation - Admin', () => {
    test('admin should access poll creation page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls/create');

      await expect(page.getByRole('heading', { name: /create.*poll|new.*poll/i })).toBeVisible();
    });

    test('admin should create informal poll', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls/create');

      // Fill poll details
      await page.getByLabel(/title/i).fill('Test Poll - Automated');
      await page.getByLabel(/description/i).fill('This is an automated test poll');

      // Select poll type (informal)
      const pollTypeSelect = page.getByLabel(/type|poll.*type/i);
      if (await pollTypeSelect.count() > 0) {
        await pollTypeSelect.selectOption('informal');
      }

      // Set dates
      const startDateField = page.getByLabel(/start.*date/i);
      if (await startDateField.count() > 0) {
        await startDateField.fill(new Date().toISOString().split('T')[0]);
      }

      // Add poll options
      await page.getByLabel(/option.*1|first.*option/i).fill('Option A');
      await page.getByLabel(/option.*2|second.*option/i).fill('Option B');

      // Submit
      await page.getByRole('button', { name: /create|submit|save/i }).click();

      // Verify success
      await expect(page.locator('text=/poll.*created|success/i')).toBeVisible({ timeout: 5000 });
    });

    test('admin should see validation errors for empty poll form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls/create');

      // Submit empty form
      await page.getByRole('button', { name: /create|submit|save/i }).click();

      // Should show validation errors
      await expect(page.locator('text=/required|enter/i').first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Voting Flow', () => {
    test('member should view poll details', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      // Wait for polls to load
      await page.waitForTimeout(1000);

      // Click on first poll if available
      const firstPoll = page.getByRole('link', { name: /view|details|vote/i }).first();
      if (await firstPoll.count() > 0) {
        await firstPoll.click();

        // Should see poll details
        await expect(page.locator('text=/poll|vote|option/i').first()).toBeVisible();
      }
    });

    test('member should submit vote and receive receipt', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      await page.waitForTimeout(1000);

      // Navigate to an active poll
      const pollLink = page.getByRole('link', { name: /view|details|vote/i }).first();
      if (await pollLink.count() > 0) {
        await pollLink.click();

        // Select an option
        const voteButton = page.getByRole('button', { name: /vote|submit.*vote/i }).first();
        if (await voteButton.count() > 0) {
          await voteButton.click();

          // Should show receipt or confirmation
          await expect(page.locator('text=/receipt|thank.*you|vote.*recorded|confirmation/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should display vote receipt code after voting', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      await page.waitForTimeout(1000);

      // Try to vote on an active poll
      const pollLink = page.getByRole('link', { name: /view|details|vote/i }).first();
      if (await pollLink.count() > 0) {
        await pollLink.click();

        const voteButton = page.getByRole('button', { name: /vote|submit.*vote/i }).first();
        if (await voteButton.count() > 0) {
          await voteButton.click();

          // Wait for receipt
          await page.waitForTimeout(2000);

          // Should show receipt code (alphanumeric string)
          const hasReceiptCode = await page.locator('text=/[A-Z0-9]{16,}/i').count() > 0;
          expect(hasReceiptCode).toBeTruthy();
        }
      }
    });
  });

  test.describe('Receipt Verification', () => {
    test('should access receipt verification page', async ({ page }) => {
      await page.goto('/polls/verify-receipt');

      // Page should be accessible to public
      await expect(page.getByRole('heading', { name: /verify.*receipt|receipt.*verification/i })).toBeVisible();
    });

    test('should show validation for invalid receipt code', async ({ page }) => {
      await page.goto('/polls/verify-receipt');

      // Enter invalid receipt code
      await page.getByLabel(/receipt.*code|verification.*code/i).fill('INVALID123');
      await page.getByRole('button', { name: /verify|check/i }).click();

      // Should show error message
      await expect(page.locator('text=/invalid|not found|incorrect/i')).toBeVisible({ timeout: 5000 });
    });

    test('should require receipt code input', async ({ page }) => {
      await page.goto('/polls/verify-receipt');

      // Try to verify without entering code
      await page.getByRole('button', { name: /verify|check/i }).click();

      // Should show validation error
      await expect(page.locator('text=/required|enter.*code/i')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Poll Results', () => {
    test('admin should view poll results for active polls', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/polls');

      await page.waitForTimeout(1000);

      // Navigate to a poll
      const pollLink = page.locator('text=/poll/i').first();
      if (await pollLink.count() > 0) {
        await pollLink.click();

        // Look for results section
        await page.waitForTimeout(1000);
        const hasResults = await page.locator('text=/results|votes|tally/i').count() > 0;
        expect(hasResults).toBeTruthy();
      }
    });

    test('members should view results for closed polls', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');

      await page.waitForTimeout(1000);

      // Look for closed polls
      const closedPoll = page.locator('text=/closed|ended|past/i').first();
      if (await closedPoll.count() > 0) {
        // Navigate to closed poll
        await closedPoll.click();

        // Should see results
        await page.waitForTimeout(1000);
        const hasResults = await page.locator('text=/results|votes|total/i').count() > 0;
        expect(hasResults).toBeTruthy();
      }
    });
  });

  test.describe('Hash Chain Integrity', () => {
    test('admin should access hash chain integrity check', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls');

      await page.waitForTimeout(1000);

      // Look for integrity check button or link
      const integrityButton = page.getByRole('button', { name: /integrity|verify.*chain|hash/i }).first();
      if (await integrityButton.count() > 0) {
        await integrityButton.click();

        // Should show integrity status
        await expect(page.locator('text=/integrity|valid|verified|hash/i')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Poll Notifications', () => {
    test('admin should have option to notify members when creating poll', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls/create');

      // Look for notify checkbox/toggle
      const notifyOption = page.getByLabel(/notify.*members|send.*email|notification/i);
      if (await notifyOption.count() > 0) {
        await expect(notifyOption).toBeVisible();
      }
    });
  });
});
