import { test, expect } from '@playwright/test';

test('loads the editor shell', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Markups/i);
    await expect(page.locator('#editor')).toBeVisible();
    await expect(page.locator('#output')).toBeVisible();
});

test.describe('responsive toolbar', () => {
    for (const width of [320, 480, 768, 900, 1280]) {
        test(`stays usable at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/');

            const toolbar = page.locator('#toolbar');
            const overflowButton = page.locator('#toolbar-overflow-btn');
            await expect(toolbar).toBeVisible();
            await expect(overflowButton).toBeVisible();
            await page.waitForFunction(() => Boolean(window.mobileUIManager));

            const dimensions = await page.evaluate(() => ({
                viewport: document.documentElement.clientWidth,
                pageWidth: document.documentElement.scrollWidth,
                toolbarWidth: document.getElementById('toolbar')?.scrollWidth ?? 0,
                toolbarClientWidth: document.getElementById('toolbar')?.clientWidth ?? 0
            }));
            expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport);
            expect(dimensions.toolbarWidth).toBeGreaterThanOrEqual(dimensions.toolbarClientWidth);

            await overflowButton.click();
            await expect(overflowButton).toHaveAttribute('aria-expanded', 'true');
            await expect(page.locator('#toolbar-overflow-sheet')).toHaveAttribute('aria-hidden', 'false');
            await expect(page.locator('.toolbar-overflow-icon').first()).toBeVisible();
            await expect(page.locator('[data-action="emoji"]')).toBeVisible();
            await expect(page.locator('[data-action="ai-writer"]')).toBeVisible();

            await page.keyboard.press('Escape');
            await expect(overflowButton).toHaveAttribute('aria-expanded', 'false');
            await expect(page.locator('#toolbar-overflow-sheet')).toHaveAttribute('aria-hidden', 'true');
        });
    }
});

test('keeps production toolbar actions in priority order', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const ids = await page.locator('#toolbar > .toolbar-group button').evaluateAll((buttons) =>
        buttons.map((button) => button.id)
    );
    expect(ids.indexOf('toolbar-ul')).toBeGreaterThan(-1);
    expect(ids.indexOf('toolbar-ul')).toBeLessThan(ids.indexOf('toolbar-link'));
    expect(ids.indexOf('toolbar-link')).toBeLessThan(ids.indexOf('toolbar-code'));
    expect(ids.indexOf('toolbar-copy-markdown')).toBeGreaterThan(ids.indexOf('ai-writer-button'));
});

test('preview toolbar control uses the existing view-mode flow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const previewButton = page.locator('#toolbar-preview-toggle');
    await previewButton.click();
    await expect(page.locator('body')).toHaveClass(/view-preview/);
    await expect(previewButton).toHaveAttribute('aria-pressed', 'true');

    await previewButton.click();
    await expect(page.locator('body')).toHaveClass(/view-split/);
    await expect(previewButton).toHaveAttribute('aria-pressed', 'false');
});
