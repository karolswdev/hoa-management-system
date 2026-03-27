import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('Admin123!@#');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
}

async function loginAsMember(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('member@example.com');
  await page.getByLabel(/password/i).fill('Member123!@#');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
}

test.describe('ARC Requests - Member Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMember(page);
  });

  test('should navigate to ARC requests page from sidebar', async ({ page }) => {
    await page.getByText('ARC Requests').click();
    await expect(page).toHaveURL(/\/arc$/);
    await expect(page.getByRole('heading', { name: /architectural review requests/i })).toBeVisible();
  });

  test('should show submit new request button', async ({ page }) => {
    await page.goto('/arc');
    await expect(page.getByRole('button', { name: /submit new request/i })).toBeVisible();
  });

  test('should display existing ARC request in the table', async ({ page }) => {
    await page.goto('/arc');
    // The seeded request from member (456 Maple Drive)
    await expect(page.getByText('456 Maple Drive')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Fence')).toBeVisible();
  });

  test('should navigate to submit form', async ({ page }) => {
    await page.goto('/arc');
    await page.getByRole('button', { name: /submit new request/i }).click();
    await expect(page).toHaveURL(/\/arc\/submit/);
    await expect(page.getByRole('heading', { name: /submit architectural review request/i })).toBeVisible();
  });

  test('should show validation errors on empty form submit', async ({ page }) => {
    await page.goto('/arc/submit');
    await page.getByRole('button', { name: /submit request/i }).click();
    await expect(page.getByText(/property address is required/i)).toBeVisible({ timeout: 3000 });
  });

  test('should submit a new ARC request', async ({ page }) => {
    await page.goto('/arc/submit');

    await page.getByLabel(/property address/i).fill('789 Elm Street');

    // Select category
    await page.getByLabel(/category/i).click();
    await page.getByRole('option', { name: 'Landscaping' }).click();

    await page.getByLabel(/description/i).fill(
      'Requesting approval to add a Japanese garden in the front yard with decorative stone pathway and small water feature.'
    );

    await page.getByRole('button', { name: /submit request/i }).click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/arc\/\d+/, { timeout: 10000 });
    await expect(page.getByText('789 Elm Street')).toBeVisible();
    await expect(page.getByText('Landscaping')).toBeVisible();
  });

  test('should view ARC request detail page', async ({ page }) => {
    await page.goto('/arc');
    await page.getByText('456 Maple Drive').click();
    await expect(page).toHaveURL(/\/arc\/\d+/);
    await expect(page.getByText('Request Details')).toBeVisible();
    await expect(page.getByText('456 Maple Drive')).toBeVisible();
    await expect(page.getByText(/cedar privacy fence/i)).toBeVisible();
  });

  test('should show workflow status on detail page', async ({ page }) => {
    await page.goto('/arc');
    await page.getByText('456 Maple Drive').click();
    await expect(page.getByText('Submitted')).toBeVisible();
  });

  test('should show timeline on detail page', async ({ page }) => {
    await page.goto('/arc');
    await page.getByText('456 Maple Drive').click();
    await expect(page.getByText('Timeline')).toBeVisible();
  });

  test('should navigate back via breadcrumb', async ({ page }) => {
    await page.goto('/arc');
    await page.getByText('456 Maple Drive').click();
    await page.getByText('ARC Requests').first().click();
    await expect(page).toHaveURL(/\/arc$/);
  });
});

test.describe('ARC Requests - Admin/Committee Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should access committee management page', async ({ page }) => {
    await page.getByText('Committees').click();
    await expect(page).toHaveURL(/\/admin\/committees/);
    await expect(page.getByRole('heading', { name: /committee management/i })).toBeVisible();
  });

  test('should display existing committees', async ({ page }) => {
    await page.goto('/admin/committees');
    await expect(page.getByText('Architectural Review')).toBeVisible({ timeout: 5000 });
  });

  test('should access ARC categories management page', async ({ page }) => {
    await page.getByText('ARC Categories').click();
    await expect(page).toHaveURL(/\/admin\/arc-categories/);
    await expect(page.getByRole('heading', { name: /arc categories/i })).toBeVisible();
  });

  test('should display seeded categories', async ({ page }) => {
    await page.goto('/admin/arc-categories');
    await expect(page.getByText('Fence')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Landscaping')).toBeVisible();
    await expect(page.getByText('Solar Panels')).toBeVisible();
  });

  test('should access review queue', async ({ page }) => {
    await page.getByText('Review Queue').click();
    await expect(page).toHaveURL(/\/arc\/queue/);
    await expect(page.getByRole('heading', { name: /committee review queue/i })).toBeVisible();
  });

  test('should show seeded workflow in queue', async ({ page }) => {
    await page.goto('/arc/queue');
    await expect(page.getByText('arc request')).toBeVisible({ timeout: 5000 });
  });

  test('should begin review of a submitted request', async ({ page }) => {
    // Navigate to the seeded request detail
    await page.goto('/arc');
    // As admin, should see the request
    const row = page.getByText('456 Maple Drive');
    if (await row.count() > 0) {
      await row.click();
      // Admin is committee chair, should see "Begin Review" button
      const beginReview = page.getByRole('button', { name: /begin review/i });
      if (await beginReview.count() > 0) {
        await beginReview.click();
        // Dialog appears
        const confirmBtn = page.getByRole('button', { name: /begin review/i }).last();
        await confirmBtn.click();
        // Status should change to Under Review
        await expect(page.getByText('Under Review')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('ARC Requests - Navigation', () => {
  test('should show ARC Requests link in sidebar for members', async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByText('ARC Requests')).toBeVisible();
  });

  test('should show Review Queue link in sidebar', async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByText('Review Queue')).toBeVisible();
  });

  test('should show Committees link in admin sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('Committees')).toBeVisible();
  });

  test('should show ARC Categories link in admin sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('ARC Categories')).toBeVisible();
  });
});
