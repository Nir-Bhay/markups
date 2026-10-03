import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

test.describe('spell check', () => {
    test('marks misspelled words in the editor', async ({ page }) => {
        test.setTimeout(60_000);
        await waitForApp(page);
        await setMarkdown(page, 'teh recieve spelingg');

        await expect.poll(async () => page.evaluate(() => {
            const markers = window.__getSpellMarkers?.() || [];
            return markers.map((marker) => marker.message);
        }), { timeout: 20_000 }).toEqual(expect.arrayContaining([
            expect.stringContaining('teh'),
            expect.stringContaining('recieve')
        ]));
    });
});
