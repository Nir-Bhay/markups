import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const deployment = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const csp = deployment.headers.find(item => item.source === '/(.*)').headers.find(item => item.key === 'Content-Security-Policy').value;

test('production CSP preserves preview while hostile HTML stays inert', async ({ page }) => {
    await page.route('**/*', async route => {
        if (route.request().isNavigationRequest() && new URL(route.request().url()).pathname === '/') {
            const response = await route.fetch();
            return route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
        }
        return route.continue();
    });
    await page.goto('/');
    // Detect accidentally reusing a modular server under a production label.
    if (process.env.PLAYWRIGHT_BUILT === '1') {
        await expect(page.locator('script[type="module"][src^="/assets/main-"]')).toHaveCount(1);
        await expect(page.locator('script[src^="/src/"]')).toHaveCount(0);
    } else if (process.env.MARKUPS_ENTRY !== 'modular') {
        await expect(page.locator('script[type="module"][src="/src/main.js"]')).toHaveCount(1);
    }
    await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 30_000 });
    await page.waitForFunction(() => typeof window.editor?.setValue === 'function');
    await page.evaluate(() => window.editor.setValue('# Security boundary\n\n<img src=x onerror="window.__previewXss=true"><a href="javascript:window.__previewXss=true">unsafe</a><svg onload="window.__previewXss=true"></svg>\n\n```mermaid\nflowchart LR\n A[Safe] --> B[Preview]\n```'));
    await expect(page.locator('#output')).toContainText('Security boundary');
    await expect(page.locator('#output .mermaid svg')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#output script, #output [onerror], #output [onload], #output a[href^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__previewXss)).toBeUndefined();
});
