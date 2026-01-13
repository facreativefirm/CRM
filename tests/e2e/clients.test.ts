import { test, expect } from '@playwright/test';

test.describe('Admin Client Management', () => {
    test.beforeEach(async ({ page }) => {
        // Standard login flow (assumes dev environment seeds)
        await page.goto('/auth/login');
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/admin');
    });

    test('should navigate to clients and show the empty state or table', async ({ page }) => {
        await page.goto('/admin/clients');

        // Check if header is present
        await expect(page.locator('h1')).toContainText('Clients');

        // The page should either show a skeleton initially or the data
        const table = page.locator('table');
        const emptyState = page.locator('text=No clients found');

        await expect(table.or(emptyState)).toBeVisible();
    });

    test('should open add client modal/page', async ({ page }) => {
        await page.goto('/admin/clients');
        await page.click('text=Add New Client');
        await expect(page).toHaveURL('/admin/clients/add');
    });
});
