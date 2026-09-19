import { test, expect } from '@playwright/test';

async function openProduction(page, width) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#toolbar')).toBeVisible();
    await expect(page.locator('#toolbar-density-toggle')).toBeVisible();
}

test.describe('responsive toolbar UX', () => {
    for (const width of [320, 480, 768, 900, 1280]) {
        test(`stays inside the viewport at ${width}px`, async ({ page }) => {
            await openProduction(page, width);
            const overflow = await page.evaluate(() => ({
                body: document.body.scrollWidth,
                viewport: document.documentElement.clientWidth,
                toolbar: document.getElementById('toolbar')?.scrollWidth || 0,
            }));
            expect(overflow.body).toBeLessThanOrEqual(overflow.viewport + 1);
            expect(overflow.toolbar).toBeGreaterThan(0);
            await expect(page.locator('#toolbar-overflow-btn')).toHaveAttribute('aria-expanded', 'false');
        });
    }

    test('expands secondary groups and persists customization', async ({ page }) => {
        await openProduction(page, 480);

        const density = page.locator('#toolbar-density-toggle');
        await density.click();
        await expect(density).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.toolbar-tools-group')).toBeVisible();

        await page.locator('#toolbar-customize').click();
        const panel = page.locator('#toolbar-customize-sheet');
        await expect(panel).toBeVisible();
        const modes = panel.locator('input[data-hide-id="modes"]');
        await modes.uncheck();
        await page.reload();
        await expect(page.locator('.toolbar-modes-group')).toBeHidden();
        await page.locator('#toolbar-customize').click();
        await expect(panel.locator('input[data-hide-id="modes"]')).not.toBeChecked();
    });

    test('focus mode hides preview and exposes bounded editor controls', async ({ page }) => {
        await openProduction(page, 1280);
        await page.locator('#focus-button').click();
        await expect(page.locator('body')).toHaveClass(/focus-mode/);
        await expect(page.locator('#output')).toBeHidden();
        await expect(page.locator('#focus-dock')).toBeVisible();
        await expect(page.locator('#focus-zoom-reset')).toHaveText('100%');
        await page.locator('#focus-zoom-in').click();
        await expect(page.locator('#focus-zoom-reset')).not.toHaveText('100%');
        await page.locator('#focus-exit').click();
        await expect(page.locator('body')).not.toHaveClass(/focus-mode/);
    });
});
