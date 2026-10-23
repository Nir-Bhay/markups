import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const screenshotDir = 'test-results/discovery-screenshots';

test('About and guides are keyboard accessible without a hidden SEO summary', async ({ page }) => {
    await page.goto('/');
    const about = page.locator('.editor-about');
    const summary = about.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(about).toHaveAttribute('open', '');
    await expect(about.getByRole('heading', { name: 'Free online Markdown editor' })).toBeVisible();
    await expect(about.getByRole('link', { name: 'Test diagrams, math and exports' }))
        .toHaveAttribute('href', '/seo/compatibility-lab');
    await expect(page.locator('.crawl-summary')).toHaveCount(0);
    mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: `${screenshotDir}/about-desktop.png` });
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(about).not.toHaveAttribute('open', '');
});

test('Mobile navigation includes the product walkthrough and compatibility guide', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForFunction(() => !!window.editor);
    await page.locator('#mobile-header-menu').click();
    await expect(page.locator('#mobile-nav-drawer')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    const drawer = await page.locator('#mobile-nav-drawer').boundingBox();
    expect(drawer.x).toBeGreaterThanOrEqual(0);
    expect(drawer.x + drawer.width).toBeLessThanOrEqual(375);
    await expect(page.locator('#mobile-nav-drawer a[href="/landing"]')).toBeVisible();
    mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: `${screenshotDir}/guides-mobile.png` });
    await expect(page.locator('#mobile-nav-drawer a[href="/landing"]')).toHaveText('About & guides');
    await expect(page.locator('#mobile-nav-drawer a[href="/seo/compatibility-lab"]'))
        .toHaveText('Test diagrams, math and exports');
});

test('Live-preview guide states actual export limitations', async ({ request }) => {
    const response = await request.get('/seo/markdown-live-preview-editor');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('PDF export is image-based');
    expect(html).not.toMatch(/what you see is what you get|match what you see in the preview exactly|definition list rendering/i);
});

test('context-menu scrolling stays open and native window scroll closes without error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.waitForFunction(() => !!window.editor);
    const menu = page.locator('.app-context-menu');
    await expect(menu).toHaveCount(1);
    await expect(page.locator('#output')).toContainText('Welcome to Markups');
    await page.locator('#editor').dispatchEvent('contextmenu', { clientX: 150, clientY: 180 });
    await expect(menu).toBeVisible();
    await menu.dispatchEvent('scroll');
    await expect(menu).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await expect(menu).toBeHidden();
    expect(errors).toEqual([]);
});
