import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Screenshot output directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const ADMIN_AUTH_FILE = path.join(__dirname, '..', '.auth', 'admin.json');
const MEMBER_AUTH_FILE = path.join(__dirname, '..', '.auth', 'member.json');

async function takeScreenshot(page: Page, name: string, fullPage: boolean = false) {
  // Wait a moment for any animations to complete
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: fullPage,
  });
}

// Setup: Login once and save auth state
test.describe('Setup Authentication', () => {
  test('Setup Admin Auth', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('Admin123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
  });

  test('Setup Member Auth', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('member@example.com');
    await page.getByLabel(/password/i).fill('Member123!@#');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.context().storageState({ path: MEMBER_AUTH_FILE });
  });
});

test.describe('Generate User Guide Screenshots', () => {
  test.describe('Public/Authentication Screens', () => {
    test('01 - Login Page', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '01-login-page', true);
    });

    test('02 - Login Page with Validation Errors', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '02-login-validation-errors');
    });

    test('03 - Registration Page', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-registration-page', true);
    });

    test('04 - Forgot Password Page', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '04-forgot-password-page', true);
    });

    test('05 - Public Home Page', async ({ page }) => {
      await page.goto('/public');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '05-public-home-page', true);
    });
  });

  test.describe('Member Screens', () => {
    test.use({ storageState: MEMBER_AUTH_FILE });

    test('06 - Member Dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '06-member-dashboard', true);
    });

    test('07 - Member Announcements List', async ({ page }) => {
      await page.goto('/announcements');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '07-member-announcements-list', true);
    });

    test('08 - Member Events Page - Upcoming Tab', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '08-member-events-upcoming', true);
    });

    test('09 - Member Events Page - Past Tab', async ({ page }) => {
      await page.goto('/events');
      await page.waitForLoadState('networkidle');
      // Click on Past Events tab
      const pastTab = page.getByRole('tab', { name: /past/i });
      const isVisible = await pastTab.isVisible().catch(() => false);
      if (isVisible) {
        await pastTab.click();
        await page.waitForTimeout(500);
      }
      await takeScreenshot(page, '09-member-events-past', true);
    });

    test('10 - Member Documents Page', async ({ page }) => {
      await page.goto('/documents');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '10-member-documents-page', true);
    });

    test('11 - Member Discussions List', async ({ page }) => {
      await page.goto('/discussions');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '11-member-discussions-list', true);
    });

    test('12 - Member Create Discussion', async ({ page }) => {
      await page.goto('/discussions');
      await page.waitForLoadState('networkidle');
      // Click create discussion button
      const createButton = page.getByRole('button', { name: /create.*discussion|new.*discussion/i }).first();
      const isVisible = await createButton.isVisible().catch(() => false);
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '12-member-create-discussion-dialog');
      }
    });

    test('13 - Member Profile Page', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '13-member-profile-page', true);
    });
  });

  test.describe('Admin Screens', () => {
    test.use({ storageState: ADMIN_AUTH_FILE });

    test('14 - Admin Dashboard', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '14-admin-dashboard', true);
    });

    test('15 - Admin Users Management', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '15-admin-users-management', true);
    });

    test('16 - Admin Users - Filter and Search', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      // Try to interact with filters if they exist
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      const isVisible = await filterButton.isVisible().catch(() => false);
      if (isVisible) {
        await filterButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '16-admin-users-filters');
      }
    });

    test('17 - Admin Announcements Management', async ({ page }) => {
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '17-admin-announcements-management', true);
    });

    test('18 - Admin Create Announcement Dialog', async ({ page }) => {
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      // Click create button
      const createButton = page.getByRole('button', { name: /create.*announcement|new.*announcement/i }).first();
      const isVisible = await createButton.isVisible().catch(() => false);
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '18-admin-create-announcement-dialog');
      }
    });

    test('19 - Admin Create Announcement - Filled Form', async ({ page }) => {
      await page.goto('/admin/announcements');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*announcement|new.*announcement/i }).first();
      const isVisible = await createButton.isVisible().catch(() => false);
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(500);
        // Fill the form
        await page.getByLabel(/title/i).fill('Monthly HOA Meeting');
        await page.getByLabel(/content|message|description/i).first().fill('Join us for our monthly HOA meeting on the first Tuesday of next month at 7:00 PM in the community center.');
        await page.waitForTimeout(500);
        await takeScreenshot(page, '19-admin-create-announcement-filled');
      }
    });

    test('20 - Admin Events Management', async ({ page }) => {
      await page.goto('/admin/events');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '20-admin-events-management', true);
    });

    test('21 - Admin Create Event Dialog', async ({ page }) => {
      await page.goto('/admin/events');
      await page.waitForLoadState('networkidle');
      const createButton = page.getByRole('button', { name: /create.*event|new.*event/i }).first();
      const isVisible = await createButton.isVisible().catch(() => false);
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '21-admin-create-event-dialog');
      }
    });

    test('22 - Admin Documents Management', async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '22-admin-documents-management', true);
    });

    test('23 - Admin Upload Document Dialog', async ({ page }) => {
      await page.goto('/admin/documents');
      await page.waitForLoadState('networkidle');
      const uploadButton = page.getByRole('button', { name: /upload.*document|add.*document/i }).first();
      const isVisible = await uploadButton.isVisible().catch(() => false);
      if (isVisible) {
        await uploadButton.click();
        await page.waitForTimeout(1000);
        await takeScreenshot(page, '23-admin-upload-document-dialog');
      }
    });

    test('24 - Admin System Configuration', async ({ page }) => {
      await page.goto('/admin/config');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '24-admin-system-configuration', true);
    });

    test('25 - Admin Audit Logs', async ({ page }) => {
      await page.goto('/admin/audit');
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '25-admin-audit-logs', true);
    });

    test('26 - Admin Audit Logs - Filters', async ({ page }) => {
      await page.goto('/admin/audit');
      await page.waitForLoadState('networkidle');
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      const isVisible = await filterButton.isVisible().catch(() => false);
      if (isVisible) {
        await filterButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '26-admin-audit-logs-filters');
      }
    });
  });

  test.describe('Additional UI States', () => {
    test('27 - Navigation Menu (Member)', async ({ page }) => {
      // Use member auth
      await page.context().addCookies(JSON.parse(require('fs').readFileSync(MEMBER_AUTH_FILE, 'utf8')).cookies);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      // Try to open navigation menu if it exists (mobile or drawer)
      const menuButton = page.getByRole('button', { name: /menu/i }).first();
      const isVisible = await menuButton.isVisible().catch(() => false);
      if (isVisible) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '27-navigation-menu-member');
      }
    });

    test('28 - Navigation Menu (Admin)', async ({ page }) => {
      // Use admin auth
      await page.context().addCookies(JSON.parse(require('fs').readFileSync(ADMIN_AUTH_FILE, 'utf8')).cookies);
      await page.goto('/admin/dashboard');
      await page.waitForLoadState('networkidle');
      const menuButton = page.getByRole('button', { name: /menu/i }).first();
      const isVisible = await menuButton.isVisible().catch(() => false);
      if (isVisible) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, '28-navigation-menu-admin');
      }
    });
  });
});
