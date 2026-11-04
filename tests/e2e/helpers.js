// Shared Playwright helper for the production-entry editor tests.
// Kept in tests/e2e so spellcheck suites work on Windows, macOS and Linux.
import { expect } from '@playwright/test';

export async function waitForApp(page) {
    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => typeof window.editor?.setValue === 'function', null, { timeout: 30_000 });
    // Wait for initial asynchronous notes/tabs restoration before setting content.
    await page.waitForFunction(() => Array.isArray(window.__markups_documents) && window.__markups_documents.length > 0, null, { timeout: 30_000 });
}

export async function getMarkdown(page) {
    return page.evaluate(() => window.editor?.getValue() ?? '');
}

export async function setMarkdown(page, markdown) {
    const expected = String(markdown);
    for (let attempt = 0; attempt < 8; attempt++) {
        await page.evaluate((value) => window.editor.setValue(value), expected);
        await page.waitForTimeout(250);
        if ((await getMarkdown(page)) === expected) return;
    }
    throw new Error('Markdown was replaced by a concurrent editor/tab restore');
}
