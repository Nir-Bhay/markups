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
            if ((item?.namespace === 'com.markdownlivepreview' && item?.key === 'docs') || key === 'com.markdownlivepreview.tabs') {
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

test('stores images in IndexedDB even when the legacy localStorage image mirror is full', async ({ page }) => {
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
    await expect(page.locator('#image-input')).toHaveAttribute('data-ready', 'true');
    await page.locator('#editor').click();
    await page.keyboard.press('Control+End');
    await page.locator('#image-input').setInputFiles({
        name: 'tiny.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/N8sAAAAASUVORK5CYII=',
            'base64'
        )
    });

    await expect.poll(() => page.evaluate(() => window.editor.getValue())).toContain('markups-img:img_');
    await expect(page.locator('#output img')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => {
        const document = window.__markups_documents.find((item) => item.id === window.__markups_activeDocId);
        return document?.content || '';
    })).toContain('markups-img:img_');
    await expect(page.locator('#save-status')).toHaveAttribute('data-state', 'saved');

    await page.reload();
    await expect(page.locator('#editor')).toBeVisible();
    await page.waitForFunction(() => typeof window.editor?.getValue === 'function');
    await expect.poll(() => page.evaluate(() => window.editor.getValue())).toContain('markups-img:img_');
    await expect(page.locator('#output img')).toHaveCount(1);
    await expect(page.locator('#output img')).toHaveAttribute('src', /^blob:/);
});
