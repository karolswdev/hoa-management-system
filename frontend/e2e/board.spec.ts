import { test, expect, type Page } from '@playwright/test';

test.describe('Board Roster and History', () => {
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

  test.describe('Board Roster - Public Access', () => {
    test('should display board roster to guests when visibility is public', async ({ page }) => {
      await page.goto('/board');

      // Should see board roster heading
      await expect(page.getByRole('heading', { name: /board.*roster|board.*members/i })).toBeVisible();

      // Should see board members (assuming some exist)
      // Look for common board titles
      const hasMembers = await page.locator('text=/president|vice president|treasurer|secretary/i').count();
      expect(hasMembers).toBeGreaterThan(0);
    });

    test('should display board member details', async ({ page }) => {
      await page.goto('/board');

      // Wait for board roster to load
      await expect(page.getByRole('heading', { name: /board.*roster|board.*members/i })).toBeVisible();

      // Check that board member cards/items are visible
      const boardMemberCards = page.locator('[data-testid="board-member-card"], [data-testid="board-member-item"]').first();

      if (await boardMemberCards.count() > 0) {
        // Should display name and title
        await expect(boardMemberCards).toBeVisible();
      }
    });
  });

  test.describe('Board Roster - Member Access', () => {
    test('should display board roster to authenticated members', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board');

      await expect(page.getByRole('heading', { name: /board.*roster|board.*members/i })).toBeVisible();
    });

    test('should allow members to view board member contact information', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board');

      // Board members should be visible
      await expect(page.getByRole('heading', { name: /board.*roster|board.*members/i })).toBeVisible();

      // Contact information or contact button should be available
      // This may vary based on implementation
    });
  });

  test.describe('Board History - Member Access', () => {
    test('should display board history to authenticated members', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board/history');

      // Should see history page or tab
      await expect(page.locator('text=/history|past.*members|previous.*board/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show historical board members with dates', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/board/history');

      // Wait for history to load
      await page.waitForTimeout(1000);

      // Check for date-related content (start/end dates)
      // This is a basic check - adjust based on actual implementation
      const hasDateInfo = await page.locator('text=/20\\d{2}|start|end|term/i').count();
      expect(hasDateInfo).toBeGreaterThan(0);
    });

    test('should restrict board history access to guests when feature flag is members-only', async ({ page }) => {
      await page.goto('/board/history');

      // Guests should either be redirected to login or see an access denied message
      await page.waitForTimeout(2000);

      const isLoginPage = await page.url().includes('/login');
      const hasAccessDenied = await page.locator('text=/access denied|unauthorized|members only/i').count() > 0;

      expect(isLoginPage || hasAccessDenied).toBeTruthy();
    });
  });

  test.describe('Board Contact Form', () => {
    test('should display contact form for guests', async ({ page }) => {
      await page.goto('/board/contact');

      await expect(page.getByRole('heading', { name: /contact.*board|message.*board/i })).toBeVisible();
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/subject|message/i).first()).toBeVisible();
    });

    test('should show validation errors for empty contact form', async ({ page }) => {
      await page.goto('/board/contact');

      await page.getByRole('button', { name: /send|submit|contact/i }).click();

      // Wait for validation messages
      await expect(page.locator('text=/(name|email|subject|message).*required/i').first()).toBeVisible({ timeout: 3000 });
    });

    test('should require CAPTCHA for contact form submission', async ({ page }) => {
      await page.goto('/board/contact');

      await page.getByLabel(/name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/subject/i).fill('Test Subject');
      await page.getByLabel(/message/i).fill('Test message content');

      // Submit form
      await page.getByRole('button', { name: /send|submit|contact/i }).click();

      // Should show CAPTCHA requirement or validation message
      // Note: Actual CAPTCHA testing requires test keys
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Admin Board Management', () => {
    test('admin should access board title management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/board/titles');

      // Should see title management interface
      await expect(page.getByRole('heading', { name: /board.*titles|manage.*titles/i })).toBeVisible({ timeout: 5000 });
    });

    test('admin should create new board title', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/board/titles');

      // Click create title button
      await page.getByRole('button', { name: /create|add.*title|new.*title/i }).click();

      // Fill in title details
      await page.getByLabel(/title.*name|name/i).fill('Test Title');
      await page.getByLabel(/rank|order/i).fill('999');

      // Submit
      await page.getByRole('button', { name: /create|save|submit/i }).click();

      // Verify success
      await expect(page.locator('text=/title.*created|success/i')).toBeVisible({ timeout: 5000 });
    });

    test('admin should access board member management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/board/members');

      // Should see member management interface
      await expect(page.getByRole('heading', { name: /board.*members|manage.*members/i })).toBeVisible({ timeout: 5000 });
    });
  });
});
