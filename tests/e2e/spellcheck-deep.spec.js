import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { setMarkdown, waitForApp, getMarkdown } from './helpers.js';

const shots = path.join(process.env.USERPROFILE, 'spell-shots');
fs.mkdirSync(shots, { recursive: true });

const sample = [
    'teh recieve hello',
    '',
    'Look at https://example.com/recieveplease now.',
    '',
    'Inline `recieve` code.',
    '',
    '```',
    'recieve inside fence',
    '```',
    ''
].join('\n');

async function markers(page) {
    return page.evaluate(() => (window.__getSpellMarkers?.() || []).map((m) => ({
        message: m.message,
        line: m.startLineNumber,
        col: m.startColumn
    })));
}

test('deep spellcheck: markers, skips, menu, ignore, toggle', async ({ page }) => {
    test.setTimeout(90_000);
    await waitForApp(page);
    await page.waitForFunction(() => Array.isArray(window.__markups_documents) && window.__markups_documents.length > 0);
    await page.evaluate(() => {
        localStorage.removeItem('markups-spell-ignore');
        localStorage.removeItem('markups-spell-added');
        localStorage.setItem('markups-spellcheck', 'on');
    });
    await setMarkdown(page, sample);
    await expect.poll(() => getMarkdown(page), { timeout: 10_000 }).toContain('teh recieve hello');

    await expect.poll(async () => (await markers(page)).map((m) => m.message).sort(), { timeout: 20_000 })
        .toEqual(['Possible spelling: recieve', 'Possible spelling: teh']);

    const found = await markers(page);
    const offLimits = found.filter((m) => m.line !== 1);
    if (offLimits.length) throw new Error('marked outside prose: ' + JSON.stringify(found));

    await page.locator('#editor').screenshot({ path: path.join(shots, 'squiggles.png') });

    await page.evaluate(() => {
        window.editor.setPosition({ lineNumber: 1, column: 7 });
        window.editor.focus();
    });
    const box = await page.locator('#editor').boundingBox();
    await page.mouse.click(box.x + 40, box.y + 30, { button: 'right' });

    const menu = page.locator('.app-context-menu.visible');
    await expect(menu).toBeVisible();
    const labels = await menu.locator('.app-context-label').allTextContents();
    fs.writeFileSync(path.join(shots, 'menu-labels.json'), JSON.stringify(labels, null, 2));
    await menu.screenshot({ path: path.join(shots, 'menu.png') });

    if (!labels.includes('receive')) throw new Error('missing receive suggestion: ' + labels.join(' | '));
    if (!labels.includes('Ignore word')) throw new Error('missing Ignore word');
    if (!labels.includes('Add to dictionary')) throw new Error('missing Add to dictionary');
    if (!labels.some((l) => l.startsWith('Turn spell check'))) throw new Error('missing toggle');

    await menu.locator('.app-context-item', { hasText: 'receive' }).click();
    await expect.poll(() => getMarkdown(page)).toContain('teh receive hello');
    await expect.poll(async () => (await markers(page)).map((m) => m.message)).toEqual(['Possible spelling: teh']);

    await page.evaluate(() => {
        window.editor.setPosition({ lineNumber: 1, column: 2 });
        window.editor.focus();
    });
    await page.mouse.click(box.x + 40, box.y + 30, { button: 'right' });
    await expect(menu).toBeVisible();
    await menu.locator('.app-context-item', { hasText: 'Ignore word' }).click();
    await expect.poll(async () => await markers(page), { timeout: 10_000 }).toEqual([]);

    await setMarkdown(page, 'spelingg stays');
    await expect.poll(async () => (await markers(page)).length, { timeout: 10_000 }).toBe(1);
    await page.evaluate(() => {
        window.editor.setPosition({ lineNumber: 1, column: 3 });
        window.editor.focus();
    });
    await page.mouse.click(box.x + 40, box.y + 30, { button: 'right' });
    await menu.locator('.app-context-item', { hasText: 'Add to dictionary' }).click();
    await expect.poll(async () => await markers(page), { timeout: 10_000 }).toEqual([]);

    await setMarkdown(page, 'recieve again');
    await expect.poll(async () => (await markers(page)).length, { timeout: 10_000 }).toBe(1);
    await page.mouse.click(box.x + 40, box.y + 30, { button: 'right' });
    await menu.locator('.app-context-item', { hasText: 'Turn spell check off' }).click();
    await expect.poll(async () => await markers(page), { timeout: 10_000 }).toEqual([]);
    await page.locator('#editor').screenshot({ path: path.join(shots, 'toggled-off.png') });

    await page.mouse.click(box.x + 40, box.y + 30, { button: 'right' });
    await menu.locator('.app-context-item', { hasText: 'Turn spell check on' }).click();
    await expect.poll(async () => (await markers(page)).map((m) => m.message), { timeout: 10_000 })
        .toEqual(['Possible spelling: recieve']);
});
