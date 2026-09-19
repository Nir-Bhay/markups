import { test, expect } from '@playwright/test';
import { encodeDocToHash } from '../../src/services/share/linkShare.js';

test.describe('no-server share', () => {
    test('opens the share dialog with a generated link and file action', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/');
        await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 20_000 });
        await expect(page.locator('#share-btn')).toBeVisible();

        await page.locator('#share-btn').click();
        const modal = page.locator('#share-modal');
        await expect(modal).toBeVisible();
        await expect(page.locator('#share-download-file-btn')).toBeVisible();

        const output = page.locator('#share-link-output');
        await expect(output).not.toHaveValue('Generating link…', { timeout: 10_000 });
        const value = await output.inputValue();
        if (value) {
            expect(value).toContain('#s=');
            await expect(page.locator('#share-copy-link-btn')).toBeEnabled();
        } else {
            await expect(page.locator('#share-status')).toContainText(/file share/i);
        }

        await page.locator('#share-modal-close').click();
        await expect(modal).not.toHaveClass(/active/);
    });

    test('opens a shared hash in a new tab without replacing the current doc', async ({ page }) => {
        const hash = await encodeDocToHash('# Shared heading\n\nhello-from-share', 'Shared heading');
        page.on('dialog', (dialog) => dialog.accept());

        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(`/#${hash}`);
        await expect(page.locator('#editor')).toBeVisible();
        await expect(page.getByRole('tab', { name: /Shared heading/i })).toBeVisible({ timeout: 15_000 });
        await expect(page.locator('.header-tab')).toHaveCount(2);
    });

    test('import dialog exposes a share-link field', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/');
        await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 20_000 });
        await page.locator('#import-button').click();
        await expect(page.locator('#import-modal')).toBeVisible();
        await expect(page.locator('#import-link-input')).toBeVisible();
        await page.locator('#import-modal-close').click();
        await expect(page.locator('#import-modal')).not.toHaveClass(/active/);
    });
});
