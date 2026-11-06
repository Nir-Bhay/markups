import { test, expect } from '@playwright/test';
import { waitForApp, getMarkdown, setMarkdown } from './helpers.js';

const COLD_DRAFT = '# Cold-start storage check\n\nA disposable note saved during the first browser session.';
const OFFLINE_DRAFT = '# Offline storage check\n\nA disposable note edited while the browser is offline.';

async function readPersistedNote(page) {
    return page.evaluate(async () => {
        const document = window.__markups_documents?.find((item) => Number.isInteger(item.noteId));
        const storage = window.__qaNoteStorage;
        if (!document || !storage) return null;
        const note = await storage.getNote(document.noteId);
        return note?.content ?? null;
    });
}

test('cold boot, offline edit, and warm reload preserve the IndexedDB draft', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await waitForApp(page);
    await expect(page.locator('#output')).toContainText('Welcome to Markups');

    // Reuse the app's own storage service for a direct persistence assertion.
    // Import it before going offline so the test does not need a network fetch.
    await page.evaluate(async () => {
        window.__qaNoteStorage = (await import('/src/core/storage/noteStorage.js')).noteStorage;
    });

    await setMarkdown(page, COLD_DRAFT);
    await expect.poll(() => getMarkdown(page)).toBe(COLD_DRAFT);
    await expect.poll(() => readPersistedNote(page), { timeout: 20_000 }).toBe(COLD_DRAFT);

    // Local editing and IndexedDB writes should continue without a network connection.
    await page.context().setOffline(true);
    await setMarkdown(page, OFFLINE_DRAFT);
    await expect.poll(() => readPersistedNote(page), { timeout: 20_000 }).toBe(OFFLINE_DRAFT);
    await page.context().setOffline(false);

    // A warm reload must restore the most recent offline edit from local storage.
    await waitForApp(page);
    await expect.poll(() => getMarkdown(page), { timeout: 20_000 }).toBe(OFFLINE_DRAFT);

    // Repeated warm start guards against restoration that only works once.
    await waitForApp(page);
    await expect.poll(() => getMarkdown(page), { timeout: 20_000 }).toBe(OFFLINE_DRAFT);
});
