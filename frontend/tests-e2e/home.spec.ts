import { test, expect } from '@playwright/test';

test('home page renders header and table', async ({ page }) => {
    await page.goto('/ru');
    await expect(page.getByTestId('filters')).toBeVisible();
    await expect(page.getByTestId('listing-table')).toBeVisible();
});

test('filter by action BUY applies without navigation and table remains visible', async ({ page }) => {
    await page.goto('/ru');
    await expect(page.getByTestId('filters')).toBeVisible();
    const actionSelect = page.locator('select:has(option[value="BUY"])').first();
    await actionSelect.selectOption('BUY');
    await page.getByTestId('apply-filters').click();
    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.getByTestId('listing-table')).toBeVisible();
});

test('header has neon sign-up button and sign-in link', async ({ page }) => {
    await page.goto('/ru');
    const signUp = page.getByTestId('sign-up-btn');
    const signIn = page.getByTestId('sign-in-btn');
    await expect(signUp).toBeVisible();
    await expect(signIn).toBeVisible();
}); 