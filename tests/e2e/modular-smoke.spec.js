import { test, expect } from '@playwright/test';

// No production window.editor hook: this exercises the actual modular entry through its UI.
test('modular editor accepts a real edit and renders Markdown', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const editor = page.locator('.monaco-editor').first();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('# Modular smoke\n\nA **real** edit.');
    await expect(page.locator('#output h1')).toHaveText('Modular smoke');
    await expect(page.locator('#output strong')).toHaveText('real');
    await expect(page.locator('.app-error')).toHaveCount(0);
    expect(errors).toEqual([]);
});

test('modular built pages preserve canonical route and asset responses', async ({ request }) => {
    for (const route of ['/landing', '/privacy-policy', '/terms', '/seo/compatibility-lab']) {
        const response = await request.get(route);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain(`href="https://markups.dev${route}"`);
    }
    const image = await request.get('/image/og-image.png');
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
});
