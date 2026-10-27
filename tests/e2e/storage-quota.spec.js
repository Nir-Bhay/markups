import { test, expect } from '@playwright/test';

test('preserves IndexedDB documents when the localStorage backup is full', async ({ page }) => {
    await page.addInitScript(() => {
        const nativeSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            let item;
            try {
                item = JSON.parse(String(value));
            } catch {
                // Non-JSON localStorage entries pass through unchanged.
            }
            if (item?.namespace === 'com.markdownlivepreview' && item?.key === 'docs') {
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            }
            return nativeSetItem.call(this, key, value);
        };
    });

    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible();
    await page.waitForFunction(() => typeof window.__markups_createFile === 'function');
    await page.evaluate(async () => {
        for (let i = 0; i < 6; i++) {
            await window.__markups_createFile();
        }
    });

    await page.locator('#editor').click();
    await page.keyboard.type('# Quota recovery check');
    await expect(page.getByText(/Browser backup storage is full/i)).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__markups_documents.length)).toBe(7);

    await page.reload();
    await page.waitForFunction(() => window.__markups_documents?.length === 7);
    await expect(page.locator('#save-status')).toContainText('All changes saved');
});

test('does not insert an image reference when image data cannot be persisted', async ({ page }) => {
    await page.addInitScript(() => {
        const nativeSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
            let item;
            try {
                item = JSON.parse(String(value));
            } catch {
                // Non-JSON localStorage entries pass through unchanged.
            }
            if (item?.namespace === 'com.markdownlivepreview' && item?.key === 'image_store') {
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            }
            return nativeSetItem.call(this, key, value);
        };
    });

    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible();
    await page.locator('#image-input').setInputFiles({
        name: 'tiny.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/N8sAAAAASUVORK5CYII=',
            'base64'
        )
    });

    await expect(page.getByText(/The image was not inserted/i)).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.editor.getValue())).not.toContain('markups-img:');
    await expect(page.locator('#output img')).toHaveCount(0);
});
