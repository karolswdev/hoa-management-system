import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Screenshot output directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

// Helper function to ensure standard accessibility mode for consistent screenshots
async function ensureStandardMode(page: Page) {
  await page.evaluate(() => {
    // Set accessibility preferences to standard mode
    const preferences = {
      mode: 'standard',
      showHelpers: false,
      reducedMotion: false,
    };
    localStorage.setItem('hoa_accessibility_mode', JSON.stringify(preferences));
  });
}

// Helper functions for authentication
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await ensureStandardMode(page);
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('Admin123!@#');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
}

async function loginAsMember(page: Page) {
  await page.goto('/login');
  await ensureStandardMode(page);
  await page.getByLabel(/email/i).fill('member@example.com');
  await page.getByLabel(/password/i).fill('Member123!@#');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
}

async function takeScreenshot(page: Page, name: string, fullPage: boolean = false) {
  // Wait a moment for any animations to complete
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: fullPage,
  });
}

test.describe('Generate User Guide Screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Public/Authentication Screens', () => {
    test('01 - Login Page', async ({ page }) => {
      await page.goto('/login');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '01-login-page', true);
    });

    test('02 - Login Page with Validation Errors', async ({ page }) => {
      await page.goto('/login');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      const emailField = page.getByLabel(/email/i);
      const passwordField = page.getByLabel(/password/i);
      await emailField.focus();
      await passwordField.focus();
      await emailField.blur();
      await passwordField.blur();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '02-login-validation-errors');
    });

    test('03 - Registration Page', async ({ page }) => {
      await page.goto('/register');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-registration-page', true);
    });

    test('04 - Forgot Password Page', async ({ page }) => {
      await page.goto('/forgot-password');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '04-forgot-password-page', true);
    });

    test('05 - Public Home Page', async ({ page }) => {
      await page.goto('/');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '05-public-home-page', true);
    });
  });

  test.describe('Member Screens', () => {
    test('06 - Member Dashboard', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '06-member-dashboard', true);
    });

    test('07 - Member Announcements List', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/announcements');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '07-member-announcements-list', true);
    });

    test('08 - Member Events Page - Upcoming Tab', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '08-member-events-upcoming', true);
    });

    test('09 - Member Events Page - Past Tab', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      // Click on Past Events tab
      const pastTab = page.getByRole('tab', { name: /past.*events/i });
      if (await pastTab.isVisible()) {
        await pastTab.click();
        await page.waitForTimeout(500);
      }
      await takeScreenshot(page, '09-member-events-past', true);
    });

    test('10 - Member Documents Page', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '10-member-documents-page', true);
    });

    test('11 - Member Discussions List', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '11-member-discussions-list', true);
    });

    test('12 - Member Discussions - Code of Conduct Modal', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');
      await page.waitForLoadState('networkidle');
      // Wait for Code of Conduct modal to appear if it exists
      await page.waitForTimeout(1500);
      // Check if CoC modal is visible
      const cocModal = page.getByRole('dialog', { name: /code.*of.*conduct/i });
      if (await cocModal.isVisible({ timeout: 2000 })) {
        await page.waitForTimeout(500);
        await takeScreenshot(page, '12-discussions-code-of-conduct-modal');
      } else {
        // If no CoC modal, take screenshot of discussions page
        await takeScreenshot(page, '12-discussions-code-of-conduct-modal');
      }
    });

    test('13 - Member Create Discussion', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/discussions');
      await page.waitForLoadState('networkidle');
      // Accept CoC if modal is present
      const cocModal = page.getByRole('dialog', { name: /code.*of.*conduct/i });
      if (await cocModal.isVisible({ timeout: 2000 })) {
        const checkbox = page.getByRole('checkbox', { name: /read.*agree/i });
        if (await checkbox.isVisible()) {
          await checkbox.check();
          await page.waitForTimeout(300);
        }
        const acceptButton = page.getByRole('button', { name: /accept.*continue/i });
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          await page.waitForTimeout(1000);
        }
      }
      // Click create discussion button
      const createButton = page.getByRole('button', { name: /create.*discussion|new.*discussion|start.*new/i });
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '13-member-create-discussion-dialog');
      } else {
        // Take screenshot of discussion list anyway
        await takeScreenshot(page, '13-member-create-discussion-dialog');
      }
    });

    test('14 - Member Profile Page', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '14-member-profile-page', true);
    });
  });

  test.describe('Admin Screens', () => {
    test('15 - Admin Dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '14-admin-dashboard', true);
    });

    test('15 - Admin Users Management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '15-admin-users-management', true);
    });

    test('16 - Admin Users - Filter and Search', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      // Try to interact with filters if they exist
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '16-admin-users-filters');
      }
    });

    test('17 - Admin Announcements Management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '17-admin-announcements-management', true);
    });

    test('18 - Admin Create Announcement Dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      // Click create button
      const createButton = page.getByRole('button', { name: /create.*announcement/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '18-admin-create-announcement-dialog');
      }
    });

    test('19 - Admin Create Announcement - Filled Form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*announcement/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        // Fill the form
        await page.getByLabel(/title/i).fill('Monthly HOA Meeting');
        await page.getByLabel(/content/i).fill('Join us for our monthly HOA meeting on the first Tuesday of next month at 7:00 PM in the community center.');
        // Check notify checkbox if available
        const notifyCheckbox = page.getByLabel(/notify.*members|send.*email/i);
        if (await notifyCheckbox.isVisible()) {
          await notifyCheckbox.check();
        }
        await page.waitForTimeout(500);
        await takeScreenshot(page, '19-admin-create-announcement-filled');
      }
    });

    test('20 - Admin Events Management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '20-admin-events-management', true);
    });

    test('21 - Admin Create Event Dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/events');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*event|new.*event/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '21-admin-create-event-dialog');
      }
    });

    test('22 - Admin Documents Management', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/documents');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '22-admin-documents-management', true);
    });

    test('23 - Admin Upload Document Dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/documents');
      await page.waitForLoadState('networkidle');
      const uploadButton = page.getByRole('button', { name: /upload.*document|add.*document/i });
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '23-admin-upload-document-dialog');
      }
    });

    test('24 - Admin System Configuration', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/config');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '24-admin-system-configuration', true);
    });

    test('25 - Admin Audit Logs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '25-admin-audit-logs', true);
    });

    test('26 - Admin Audit Logs - Filters', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit');
      await page.waitForLoadState('networkidle');
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '26-admin-audit-logs-filters');
      }
    });
  });

  test.describe('Additional UI States', () => {
    test('27 - Navigation Menu (Member)', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      // Try to open navigation menu if it exists (mobile or drawer)
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.isVisible({ timeout: 2000 })) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '27-navigation-menu-member');
      } else {
        // Desktop layout - take screenshot showing sidebar navigation
        await takeScreenshot(page, '27-navigation-menu-member');
      }
    });

    test('28 - Navigation Menu (Admin)', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.isVisible({ timeout: 2000 })) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '28-navigation-menu-admin');
      } else {
        // Desktop layout - take screenshot showing sidebar navigation
        await takeScreenshot(page, '28-navigation-menu-admin');
      }
    });

    test('29 - Success Notification Example', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*announcement/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        // Fill minimal form
        await page.getByLabel(/title/i).fill('Screenshot Test Announcement');
        await page.getByLabel(/content/i).fill('Test content for screenshot.');
        // Submit
        const submitButton = page.getByRole('button', { name: /create|submit|save/i });
        await submitButton.click();
        // Wait for success notification
        await page.waitForTimeout(1500);
        await takeScreenshot(page, '29-success-notification');
      }
    });
  });

  test.describe('Democracy & Vendor Screens', () => {
    test('30 - Member Polls Overview', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '30-member-polls', true);
    });

    test('31 - Poll Detail', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls/1');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '31-poll-detail', true);
    });

    test('32 - Poll Receipt Verification', async ({ page }) => {
      await page.goto('/polls/1/receipts/RCPT-DEMO-001');
      await ensureStandardMode(page);
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '32-poll-receipt', true);
    });

    test('33 - Vendor Directory (Member)', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '33-vendor-directory-member', true);
    });

    test('34 - Vendor Management (Admin)', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '34-admin-vendor-management', true);
    });

    test('35 - Submit Vendor Form (Empty)', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');
      await page.waitForLoadState('networkidle');
      // Click submit vendor button
      const submitButton = page.getByRole('button', { name: /submit.*vendor|add.*vendor/i });
      await submitButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '35-vendor-submit-form-empty');
    });

    test('36 - Submit Vendor Form - Category Dropdown Open', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');
      await page.waitForLoadState('networkidle');
      // Click submit vendor button
      const submitButton = page.getByRole('button', { name: /submit.*vendor|add.*vendor/i });
      await submitButton.click();
      await page.waitForTimeout(1000);
      // Open category dropdown
      const categorySelect = page.getByRole('combobox', { name: /service.*category|category/i });
      await categorySelect.click();
      await page.waitForTimeout(800); // Wait for dropdown animation
      await takeScreenshot(page, '36-vendor-category-dropdown-open');
    });

    test('37 - Submit Vendor Form (Filled)', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');
      await page.waitForLoadState('networkidle');

      // Open vendor submission form
      const submitButton = page.getByRole('button', { name: /submit.*vendor|add.*vendor/i });
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Fill vendor name field
      const nameField = page.getByLabel('Vendor Name');
      await expect(nameField).toBeVisible({ timeout: 5000 });
      await nameField.fill('ABC Plumbing Services');
      await page.waitForTimeout(300);

      // Select category - click dropdown and select first available option
      const categorySelect = page.getByRole('combobox', { name: 'Service Category' });
      await expect(categorySelect).toBeVisible({ timeout: 5000 });
      await categorySelect.click();
      await page.waitForTimeout(1000); // Wait for dropdown animation

      // Click the first available option (whatever it is)
      const firstOption = page.getByRole('option').first();
      await expect(firstOption).toBeVisible({ timeout: 5000 });
      await firstOption.click();
      await page.waitForTimeout(500);

      // Fill contact information
      const contactField = page.getByLabel('Contact Information');
      await expect(contactField).toBeVisible({ timeout: 5000 });
      await contactField.fill('Phone: (555) 123-4567\nEmail: contact@abcplumbing.com');
      await page.waitForTimeout(300);

      // Fill notes
      const notesField = page.getByLabel('Notes');
      await expect(notesField).toBeVisible({ timeout: 5000 });
      await notesField.fill('Excellent service, highly recommended!');
      await page.waitForTimeout(500);

      await takeScreenshot(page, '37-vendor-submit-form-filled');
    });

    test('38 - Vendor Detail Drawer', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/vendors');
      await page.waitForLoadState('networkidle');

      // Try clicking on a vendor card directly
      const vendorCard = page.locator('[data-testid="vendor-card"]').first();
      const cardButton = vendorCard.locator('button').first();

      // Try detail button or click the card itself
      const detailButton = page.getByRole('button', { name: /view.*details|details/i }).first();

      if (await detailButton.isVisible({ timeout: 2000 })) {
        await detailButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '38-vendor-detail-drawer');
      } else if (await cardButton.isVisible({ timeout: 2000 })) {
        await cardButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '38-vendor-detail-drawer');
      } else {
        // Take screenshot anyway showing vendor list
        console.log('No vendor detail button found - capturing vendor list');
        await takeScreenshot(page, '38-vendor-detail-drawer');
      }
    });

    test('39 - Admin Create Poll Form', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      // Click create poll button
      const createButton = page.getByRole('button', { name: /create.*poll|new.*poll/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '39-admin-create-poll-form');
      }
    });

    test('40 - Admin Create Poll Form (Filled)', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/polls');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*poll|new.*poll/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(1000);
        // Fill poll form
        await page.getByLabel(/title/i).fill('Approve New Pool Hours?');
        const descField = page.getByLabel(/description|details/i);
        if (await descField.isVisible()) {
          await descField.fill('Vote to approve extended pool hours from 6am-10pm during summer months');
        }
        // Fill options (one per line in a single textarea)
        const optionsField = page.getByLabel(/options/i);
        if (await optionsField.isVisible()) {
          await optionsField.fill('Yes - Approve new hours\nNo - Keep current hours\nAbstain');
        }
        await page.waitForTimeout(500);
        await takeScreenshot(page, '40-admin-create-poll-filled');
      }
    });

    test('41 - Poll Voting Interface', async ({ page }) => {
      await loginAsMember(page);
      await page.goto('/polls/1');
      await page.waitForLoadState('networkidle');
      // Scroll to voting section if needed
      await page.waitForTimeout(500);
      await takeScreenshot(page, '41-poll-voting-interface', true);
    });

    test('42 - Poll Results (Closed Poll)', async ({ page }) => {
      await loginAsMember(page);
      // Navigate to a closed poll or poll results page
      await page.goto('/polls/1');
      await page.waitForLoadState('networkidle');
      // Scroll to results section
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '42-poll-results-view', true);
    });

    test('43 - Admin Vendor Approval Actions', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/vendors');
      await page.waitForLoadState('networkidle');
      // Click pending tab
      const pendingTab = page.getByRole('tab', { name: /pending/i });
      if (await pendingTab.isVisible()) {
        await pendingTab.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '43-admin-vendor-approval-pending');
      }
    });
  });
});
