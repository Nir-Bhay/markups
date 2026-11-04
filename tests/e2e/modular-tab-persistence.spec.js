import { test, expect } from '@playwright/test';

async function readNote(page, noteId) {
    return page.evaluate((id) => new Promise((resolve, reject) => {
        const request = indexedDB.open('markups_db');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction('notes', 'readonly');
            const get = transaction.objectStore('notes').get(id);
            get.onsuccess = () => resolve(get.result || null);
            get.onerror = () => reject(get.error);
            transaction.oncomplete = () => database.close();
            transaction.onerror = () => reject(transaction.error);
        };
    }), noteId);
}

test('modular tabs persist independently through IndexedDB and reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible();
    await page.waitForFunction(() => Array.isArray(window.__markups_documents));
    const modularEntry = await page.evaluate(() => typeof window.app?.createTab === 'function');
    test.skip(!modularEntry, 'This persistence journey targets the modular app entry.');

    await page.waitForFunction(() => {
        const tab = window.__markups_documents?.find((item) => item.id === window.__markups_activeDocId);
        return Number.isInteger(tab?.noteId) && Boolean(tab?.stableId);
    });

    const firstTab = await page.evaluate(() => {
        const tab = window.__markups_documents.find((item) => item.id === window.__markups_activeDocId);
        window.editor.setValue('# First durable document');
        return { id: tab.id, noteId: tab.noteId, stableId: tab.stableId };
    });
    await expect.poll(() => readNote(page, firstTab.noteId).then((note) => note?.content)).toBe('# First durable document');

    const secondTab = await page.evaluate(async () => {
        const tab = await window.__markups_createFile();
        window.editor.setValue('# Second durable document');
        return { id: tab.id, noteId: tab.noteId, stableId: tab.stableId };
    });
    expect(secondTab.noteId).not.toBe(firstTab.noteId);
    expect(secondTab.stableId).not.toBe(firstTab.stableId);
    await expect.poll(() => readNote(page, secondTab.noteId).then((note) => note?.content)).toBe('# Second durable document');

    await page.locator(`[data-tab-id="${firstTab.id}"]`).click();
    await expect.poll(() => page.evaluate(() => window.editor.getValue())).toBe('# First durable document');
    await expect.poll(() => readNote(page, firstTab.noteId).then((note) => note?.content)).toBe('# First durable document');

    await page.reload();
    await page.waitForFunction(() => window.__markups_documents?.length === 2);
    const afterReload = await page.evaluate(() => window.__markups_documents.map(({ id, noteId, stableId }) => ({ id, noteId, stableId })));
    expect(afterReload.map((tab) => tab.noteId).sort()).toEqual([firstTab.noteId, secondTab.noteId].sort());
    expect(afterReload.map((tab) => tab.stableId).sort()).toEqual([firstTab.stableId, secondTab.stableId].sort());
    await expect.poll(() => readNote(page, firstTab.noteId).then((note) => note?.content)).toBe('# First durable document');
    await expect.poll(() => readNote(page, secondTab.noteId).then((note) => note?.content)).toBe('# Second durable document');
});
