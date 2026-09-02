import { expect, test } from '@playwright/test';
import { getMarkdown, selectMarkdownRange, setMarkdown, waitForApp } from './helpers.js';

test.describe('core editor runtime smoke tests', () => {
    test('toolbar bold and italic buttons modify the Monaco Markdown source', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, 'hello');
        await selectMarkdownRange(page, 1, 6);
        await page.locator('#toolbar-bold').click();
        await expect.poll(async () => getMarkdown(page)).toBe('**hello**');

        await setMarkdown(page, 'hello');
        await selectMarkdownRange(page, 1, 6);
        await page.locator('#toolbar-italic').click();
        await expect.poll(async () => getMarkdown(page)).toBe('*hello*');
    });

    test('search overlay finds preview/editor matches', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, 'alpha beta alpha');
        await page.locator('#search-btn').click();
        await expect(page.locator('#search-overlay')).not.toHaveClass(/hidden/);
        await page.locator('#search-input').fill('alpha');

        await expect(page.locator('#search-match-count')).toHaveText('1 of 2');
        await expect(page.locator('#output .search-highlight')).toHaveCount(2);
    });

    test('opening export modal keeps PDF exporter libraries lazy', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, '# Export smoke');
        await expect.poll(async () => page.evaluate(() =>
            performance.getEntriesByType('resource').some((entry) => /pdf-html2pdf|html2pdf/i.test(entry.name))
        )).toBe(false);

        await page.locator('#export-btn').click();
        await expect(page.locator('#export-modal')).toBeVisible();
        await expect(page.locator('#export-btn-text')).toHaveText(/Export PDF/i);

        await expect.poll(async () => page.evaluate(() =>
            performance.getEntriesByType('resource').some((entry) => /pdf-html2pdf|html2pdf/i.test(entry.name))
        )).toBe(false);
    });

    test('mobile preview switch shows rendered preview mode', async ({ page }) => {
        // Set mobile viewport BEFORE app loads so mobile module bootstraps in mobile state
        await page.setViewportSize({ width: 390, height: 844 });
        await waitForApp(page);
        // Wait for mobile module lazy-load to finish (it exposes window.mobileUIManager)
        await page.waitForFunction(() => Boolean(window.mobileUIManager), { timeout: 15_000 });

        await setMarkdown(page, '# Mobile preview');
        // Click mobile view switcher preview button
        await page.locator('.mobile-view-btn[data-view="preview"]').click();
        // Mobile module is async; give the setView() a tick to apply classes
        await expect(page.locator('body')).toHaveClass(/view-preview/, { timeout: 5000 });
        await expect(page.locator('.mobile-view-btn[data-view="preview"]')).toHaveClass(/active/);
        await expect(page.locator('#output h1')).toHaveText('Mobile preview');
    });
});
