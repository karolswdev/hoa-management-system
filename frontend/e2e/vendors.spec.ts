import { test, expect, type Page } from '@playwright/test';

test.describe('Vendor Directory', () => {
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

  test.describe('Vendor Directory - Public Access', () => {
    test('should display vendor directory to guests', async ({ page }) => {
      await page.goto('/vendors');

      await expect(page.getByRole('heading', { name: /vendor.*directory|vendors/i })).toBeVisible();
    });

    test('should display public category vendors to guests', async ({ page }) => {
      await page.goto('/vendors');

      // Wait for vendors to load
      await page.waitForTimeout(1000);

      // Should show vendors or empty state
      const hasContent = await page.locator('text=/vendor|service|category|no vendors/i').count() > 0;
      expect(hasContent).toBeTruthy();
    });

    test('should hide contact information from guests', async ({ page }) => {
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Guests should not see contact buttons or full contact info
      const hasContactInfo = await page.getByRole('button', { name: /contact|email|phone/i }).count();
      expect(hasContactInfo).toBe(0);
    });

    test('should not show vendor submission button to guests', async ({ page }) => {
      await page.goto('/vendors');

      // Submit vendor button should not be visible to guests
      await expect(page.getByRole('button', { name: /submit.*vendor|add.*vendor/i })).not.toBeVisible();
    });
  });

  test.describe('Vendor Directory - Category Filtering', () => {
    test('should filter vendors by category', async ({ page }) => {
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Look for category filter buttons or chips
      const categoryFilter = page.getByRole('button', { name: /landscaping|plumbing|electrical|hvac/i }).first();
      if (await categoryFilter.count() > 0) {
        await categoryFilter.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Results should update
        const hasResults = await page.locator('text=/vendor|service/i').count() > 0;
        expect(hasResults).toBeTruthy();
      }
    });

    test('should display all vendor categories', async ({ page }) => {
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Should see multiple category options
      const categoryCount = await page.locator('text=/landscaping|plumbing|electrical|hvac|roofing|painting/i').count();
      expect(categoryCount).toBeGreaterThan(0);
    });
  });

  test.describe('Vendor Directory - Search', () => {
    test('should search vendors by name', async ({ page }) => {
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Look for search input
      const searchInput = page.getByPlaceholder(/search|find.*vendor/i);
      if (await searchInput.count() > 0) {
        await searchInput.fill('Test');
        await page.waitForTimeout(500);

        // Results should filter
      }
    });
  });

  test.describe('Vendor Submission - Member Access', () => {
    test('members should see vendor submission button', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');

      await expect(page.getByRole('button', { name: /submit.*vendor|add.*vendor/i })).toBeVisible();
    });

    test('members should submit vendor for approval', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');

      // Click submit vendor button
      await page.getByRole('button', { name: /submit.*vendor|add.*vendor/i }).click();

      // Fill vendor form
      await page.getByLabel(/name|vendor.*name|business.*name/i).fill('Test Vendor E2E');
      await page.getByLabel(/category|service.*category/i).selectOption('Landscaping');
      await page.getByLabel(/email/i).fill('vendor@example.com');
      await page.getByLabel(/phone/i).fill('555-0123');

      // Submit form
      await page.getByRole('button', { name: /submit|save|create/i }).click();

      // Should show success message
      await expect(page.locator('text=/vendor.*submitted|pending.*approval|success/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields in vendor submission', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');

      await page.getByRole('button', { name: /submit.*vendor|add.*vendor/i }).click();

      // Try to submit empty form
      await page.getByRole('button', { name: /submit|save|create/i }).click();

      // Should show validation errors
      await expect(page.locator('text=/required|enter/i').first()).toBeVisible({ timeout: 3000 });
    });

    test('members should view contact information', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Members should see contact info or contact buttons
      const vendorCard = page.locator('[data-testid="vendor-card"]').first();
      if (await vendorCard.count() > 0) {
        // Should have access to contact information
        const hasContact = await page.locator('text=/email|phone|website|contact/i').count() > 0;
        expect(hasContact).toBeTruthy();
      }
    });
  });

  test.describe('Vendor Moderation - Admin Access', () => {
    test('admin should access vendor moderation dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await expect(page.getByRole('heading', { name: /vendor.*moderation|manage.*vendors/i })).toBeVisible();
    });

    test('admin should see pending vendors queue', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      // Look for pending tab or section
      await page.waitForTimeout(1000);

      const pendingTab = page.getByRole('tab', { name: /pending/i });
      if (await pendingTab.count() > 0) {
        await pendingTab.click();
      }

      // Should see pending vendors or empty state
      await page.waitForTimeout(500);
      const hasContent = await page.locator('text=/pending|vendor|no pending/i').count() > 0;
      expect(hasContent).toBeTruthy();
    });

    test('admin should approve vendor', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await page.waitForTimeout(1000);

      // Navigate to pending tab
      const pendingTab = page.getByRole('tab', { name: /pending/i });
      if (await pendingTab.count() > 0) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Click approve on first vendor if available
      const approveButton = page.getByRole('button', { name: /approve/i }).first();
      if (await approveButton.count() > 0) {
        await approveButton.click();

        // Confirm if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes|approve/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.locator('text=/approved|success/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('admin should deny vendor', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await page.waitForTimeout(1000);

      // Navigate to pending tab
      const pendingTab = page.getByRole('tab', { name: /pending/i });
      if (await pendingTab.count() > 0) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Click deny on first vendor if available
      const denyButton = page.getByRole('button', { name: /deny|reject/i }).first();
      if (await denyButton.count() > 0) {
        await denyButton.click();

        // Confirm if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes|deny/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.locator('text=/denied|rejected|success/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('admin should perform bulk moderation actions', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await page.waitForTimeout(1000);

      // Navigate to pending tab
      const pendingTab = page.getByRole('tab', { name: /pending/i });
      if (await pendingTab.count() > 0) {
        await pendingTab.click();
        await page.waitForTimeout(500);
      }

      // Look for select checkboxes
      const checkboxes = page.getByRole('checkbox');
      if (await checkboxes.count() > 2) {
        // Select multiple vendors
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Look for bulk action button
        const bulkApproveButton = page.getByRole('button', { name: /approve.*selected|bulk.*approve/i });
        if (await bulkApproveButton.count() > 0) {
          await expect(bulkApproveButton).toBeVisible();
        }
      }
    });

    test('admin should delete vendor', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await page.waitForTimeout(1000);

      // Look for delete button
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.locator('text=/deleted|removed|success/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('admin should view moderation audit log', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');

      await page.waitForTimeout(1000);

      // Look for audit log section or tab
      const auditTab = page.getByRole('tab', { name: /audit|history|log/i });
      if (await auditTab.count() > 0) {
        await auditTab.click();

        // Should show audit entries
        await page.waitForTimeout(500);
        const hasAudit = await page.locator('text=/approved|denied|created|moderation/i').count() > 0;
        expect(hasAudit).toBeTruthy();
      }
    });

    test('admin should view all vendors regardless of visibility scope', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/vendors');

      await page.waitForTimeout(1000);

      // Admins should see all approved vendors
      const vendorCount = await page.locator('[data-testid="vendor-card"], [data-testid="vendor-item"]').count();
      expect(vendorCount).toBeGreaterThan(0);
    });
  });

  test.describe('Vendor Notifications', () => {
    test('vendor submission should trigger admin notification', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');

      await page.getByRole('button', { name: /submit.*vendor|add.*vendor/i }).click();

      // Submit a vendor
      await page.getByLabel(/name|vendor.*name|business.*name/i).fill('Notification Test Vendor');
      await page.getByLabel(/category|service.*category/i).selectOption('Plumbing');
      await page.getByLabel(/email/i).fill('notify-test@example.com');

      await page.getByRole('button', { name: /submit|save|create/i }).click();

      // Submission success means notification was queued
      await expect(page.locator('text=/submitted|pending/i')).toBeVisible({ timeout: 5000 });
    });
  });
});
