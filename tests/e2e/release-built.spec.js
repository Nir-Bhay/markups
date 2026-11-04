import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { waitForApp, setMarkdown } from './helpers.js';

test.skip(process.env.PLAYWRIGHT_BUILT !== '1', 'Compiled-output release checks use test:e2e:built.');

test('compiled editor initializes without exceptions and highlights supported grammars', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await waitForApp(page);
    await setMarkdown(page, '# Compiled release\n\n```javascript\nconst answer = 42;\n```\n\n```typescript\nconst name: string = "release";\n```\n\n```python\ndef greet():\n    return True\n```');
    await expect(page.locator('#output')).toContainText('Compiled release');
    for (const language of ['javascript', 'typescript', 'python']) {
        await expect(page.locator(`#output code.language-${language} .token`).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('every intended sitemap URL serves its own compiled canonical page', async ({ request }) => {
    const urls = [...readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    for (const url of urls) {
        const response = await request.get(new URL(url).pathname);
        expect(response.status(), url).toBe(200);
        const html = await response.text();
        expect(html, url).toMatch(/<h1[\s>]/i);
        expect(html, url).toContain(url);
        const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
        expect(canonical, url).toBe(url);
    }
});

test('a saved draft survives a warm offline reload through the service worker', async ({ page, context }) => {
    await waitForApp(page);
    await setMarkdown(page, '# Offline release recovery\n\nKeep this local draft.');
    // setValue is a programmatic model flush and intentionally does not
    // autosave. Exercise an actual user edit and verify IndexedDB, not an
    // initial stale "saved" label, before testing recovery.
    await page.locator('#editor').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' Offline typed.');
    await expect.poll(() => page.evaluate(() => new Promise(resolve => {
        const open = indexedDB.open('markups_db');
        open.onerror = () => resolve(false);
        open.onsuccess = () => {
            const database = open.result;
            const read = database.transaction('notes', 'readonly').objectStore('notes').getAll();
            read.onerror = () => { database.close(); resolve(false); };
            read.onsuccess = () => {
                const saved = read.result.some(note => note.content?.includes('Offline release recovery') && note.content.includes('Offline typed.'));
                database.close();
                resolve(saved);
            };
        };
    }))).toBe(true);
    await expect(page.locator('#save-status')).toContainText('All changes saved');
    await page.waitForFunction(async () => {
        if (navigator.serviceWorker.controller?.state !== 'activated') return false;
        const names = await caches.keys();
        const name = names.find(name => name.startsWith('markdown-live-preview-app'));
        if (!name) return false;
        const cache = await caches.open(name);
        return Boolean(await cache.match(location.href, { ignoreVary: true }));
    });
    await context.setOffline(true);
    try {
        // Confirm offline emulation has reached the worker/network target
        // before replacing the page. This also verifies the real cache path.
        await expect.poll(() => page.evaluate(async () => {
            try { return (await fetch(location.href)).status; } catch { return 0; }
        })).toBe(200);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page.locator('#output')).toContainText('Offline release recovery', { timeout: 30000 });
        expect(await page.evaluate(() => window.editor.getValue())).toContain('Keep this local draft.');
    } finally {
        await context.setOffline(false);
    }
});
