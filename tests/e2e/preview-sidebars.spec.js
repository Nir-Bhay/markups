import { test, expect } from '@playwright/test';

test('preview close buttons hide the TOC and backlinks panels', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForSelector('#backlinks-button');

    await page.click('#view-preview');
    await expect(page.locator('body')).toHaveClass(/view-preview/);

    const toc = page.locator('#toc-sidebar');
    if (!(await toc.isVisible())) {
        await page.click('#toc-button');
    }
    await expect(toc).toBeVisible();
    await page.click('#toc-close-btn');
    await expect(toc).toBeHidden();

    await page.click('#toc-button');
    await expect(toc).toBeVisible();
    await page.click('#toc-button');
    await expect(toc).toBeHidden();

    const backlinks = page.locator('#backlinks-sidebar');
    await page.click('#backlinks-button');
    await expect(backlinks).toBeVisible();
    await page.locator('#backlinks-sidebar .toc-close-btn').click();
    await expect(backlinks).toBeHidden();

    await page.click('#backlinks-button');
    await expect(backlinks).toBeVisible();
    await page.click('#backlinks-button');
    await expect(backlinks).toBeHidden();
});
