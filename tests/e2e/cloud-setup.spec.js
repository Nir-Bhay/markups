import { test, expect } from '@playwright/test';

test('keeps optional cloud and provider actions inactive until configured', async ({ page }) => {
    const backendRequests = [];
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
        if (['fetch', 'xhr'].includes(request.resourceType()) && /appwrite|cloud-api|connector-api|\/v1\/(account|functions)/i.test(request.url())) {
            backendRequests.push(request.url());
        }
    });

    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-clarity-mask', 'True');
    await page.waitForTimeout(1500);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
    await expect(page.getByText(/Browser image storage could not be initialized/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cloud and connected accounts' })).toBeVisible();
    await expect(page.locator('#cloud-account-btn')).toHaveAttribute('data-cloud-bound', 'true');
    await page.getByRole('button', { name: 'Cloud and connected accounts' }).click();

    await expect(page.getByRole('heading', { name: 'Markups Cloud · Not available in this build' })).toBeVisible();
    await expect(page.getByText(/Existing Drive files are never replaced in this build/)).toBeVisible();
    await expect(page.locator('#drive-actions')).toBeHidden();
    await expect(page.locator('#drive-selected')).toContainText('No Google account access has been requested');
    await expect(page.locator('#cloud-auth-state')).toBeHidden();
    expect(backendRequests).toEqual([]);
    await expect(page.locator('script[src*="googletagmanager.com"], script[src*="clarity.ms"], script[src*="/_vercel/insights/"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('#cloud-account-btn')).toBeFocused();
});
