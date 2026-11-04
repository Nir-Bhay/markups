import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers.js';

test('moves a document to Trash and restores the same file-tree identity', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());
    await waitForApp(page);
    await page.evaluate(() => window.__markups_createFile());

    const documentId = await page.evaluate(() => window.__markups_documents.at(-1)?.id);
    expect(documentId).toBeTruthy();
    await page.locator('#explorer-toggle-btn').click();
    const row = page.locator(`.explorer-node-row[data-node-id="${documentId}"]`);
    await expect(row).toBeVisible();
    const deleteButton = row.locator('[data-action="delete"]');
    const label = await deleteButton.getAttribute('aria-label');
    expect(label).toMatch(/^Delete .+\.md$/);
    await deleteButton.click();
    await expect(row).toHaveCount(0);

    await page.getByRole('button', { name: 'Open Trash' }).click();
    await expect(page.getByRole('heading', { name: 'Trash' })).toBeVisible();
    const restoreButton = page.getByRole('button', { name: `Restore ${label.slice('Delete '.length)}` });
    await expect(restoreButton).toBeVisible();
    await restoreButton.click();

    await expect(page.locator(`.explorer-node-row[data-node-id="${documentId}"]`)).toBeVisible();
    await expect(page.getByText('Trash is empty.')).toBeVisible();
    await expect(page.locator('#tabs-list .header-tab')).toHaveCount(2);
});
