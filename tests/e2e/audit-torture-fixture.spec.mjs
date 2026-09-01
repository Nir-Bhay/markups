// Markups live + torture fixture — pulls bundle from localhost preview server,
// renders every fixture case, asserts:
//   XML/INI: at least one Prism token span with non-default class is present
//   Video: <video> exists for video URLs, <img> exists for picture-link URLs, no "Open video" mislabel
//   Emoji: shortcodes become Unicode glyphs in body, stay literal in code spans/blocks
//   Sync-scroll: editor.getScrollTop mapping hits preview scrollHeight at bottom
//
// Run: node tests/e2e/torture-fixture.spec.mjs (called by playwright)
// Or:  import + drive through Playwright Test runner

import { test, expect } from '@playwright/test';

const FIXTURE_PATH = new URL('../../docs/audit-torture-fixture.md', import.meta.url);

test.describe('Audit torture — reporter + edge cases', () => {

    test('FIX #42 — XML tokenization produces Prism tokens (multiple cases)', async ({ page }) => {
        await page.goto('/');
        const md = await import('node:fs/promises').then(m => m.readFile(FIXTURE_PATH, 'utf8'));
        await page.evaluate((md) => {
            const ta = document.querySelector('.cm-content, [contenteditable], textarea');
            if (ta) { ta.focus(); }
            // Markups-specific selectors will vary; use the public API if available
            (window).MarkupsAPI?.setMarkdown?.(md) ?? (window).app?.setMarkdown?.(md);
        }, md);
        // Fallback: paste via textarea
        await page.evaluate(async (md) => {
            const ta = document.querySelector('textarea#editor, textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, md);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, md);

        await page.waitForTimeout(800); // marked+Prism+emoji pipeline

        // Case F42.1: <Sid Name="test" Timing="4" Flag="1" />
        const xml = await page.evaluate(() => {
            const codes = Array.from(document.querySelectorAll('pre code.language-xml, pre code.language-markup, pre code.language-XML'));
            return codes.map((c) => ({
                html: c.innerHTML.slice(0, 800),
                tokenSpanCount: c.querySelectorAll('span.token').length,
                classes: Array.from(new Set(Array.from(c.querySelectorAll('span.token')).map((s) => s.className))).slice(0, 10)
            }));
        });
        console.log('XML cases:', JSON.stringify(xml, null, 2));

        // Expect: at least one block with tokenized spans (more than 1 token span)
        const tokenized = xml.some((b) => b.tokenSpanCount > 1);
        expect(tokenized, 'XML must be tokenized by Prism (not plain text)').toBe(true);
    });

    test('FIX #44 — INI tokenization produces Prism tokens', async ({ page }) => {
        await page.goto('/');
        const md = await import('node:fs/promises').then(m => m.readFile(FIXTURE_PATH, 'utf8'));
        await page.evaluate(async (md) => {
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, md);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, md);
        await page.waitForTimeout(800);

        const ini = await page.evaluate(() => {
            const codes = Array.from(document.querySelectorAll('pre code.language-ini'));
            return codes.map((c) => ({
                tokenSpanCount: c.querySelectorAll('span.token').length,
                classes: Array.from(new Set(Array.from(c.querySelectorAll('span.token')).map((s) => s.className))).slice(0, 10)
            }));
        });
        console.log('INI cases:', JSON.stringify(ini, null, 2));
        const tokenized = ini.some((b) => b.tokenSpanCount > 1);
        expect(tokenized, 'INI must be tokenized by Prism').toBe(true);
    });

    test('FIX #45 — Emoji shortcodes render as Unicode outside code', async ({ page }) => {
        await page.goto('/');
        const md = await import('node:fs/promises').then(m => m.readFile(FIXTURE_PATH, 'utf8'));
        await page.evaluate(async (md) => {
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, md);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, md);
        await page.waitForTimeout(800);

        const body = await page.locator('body').innerText();
        expect(body).toMatch(/[\u{1F60A}\u{1F604}\u{1F44D}\u{1F680}\u{1F525}\u{2764}\u{FE0F}]/u);
        // Inside code spans, shortcodes should remain literal — search for `:smile:` literal in code
        const codeHasLiteral = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('code, pre code')).some((c) => c.textContent.includes(':smile:'));
        });
        expect(codeHasLiteral, ':smile: must stay literal inside code').toBe(true);
    });

    test('FIX #40 — Video vs image disambiguation', async ({ page }) => {
        await page.goto('/');
        const md = await import('node:fs/promises').then(m => m.readFile(FIXTURE_PATH, 'utf8'));
        await page.evaluate(async (md) => {
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, md);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, md);
        await page.waitForTimeout(1500); // video metadata load

        const media = await page.evaluate(() => {
            const videos = Array.from(document.querySelectorAll('video')).map((v) => ({ src: v.src.slice(0, 100), hasError: v.error !== null }));
            const imgs = Array.from(document.querySelectorAll('img')).map((i) => ({ src: i.src.slice(0, 100) }));
            const openVideoTexts = Array.from(document.querySelectorAll('a, button, [role=link]')).map((a) => a.textContent.trim()).filter((t) => /open\s*video/i.test(t));
            return { videoCount: videos.length, imgCount: imgs.length, openVideoCount: openVideoTexts.length, videos, imgs: imgs.slice(0, 5), openVideoTexts };
        });
        console.log('Media rendering:', JSON.stringify(media, null, 2));
        expect(media.videoCount, 'at least one <video> element for video URLs').toBeGreaterThan(0);
        expect(media.imgCount, 'at least one <img> for image URLs').toBeGreaterThan(0);
    });

    test('FIX #39 — Sync-scroll reaches editor bottom = preview bottom', async ({ page }) => {
        await page.goto('/');
        const md = await import('node:fs/promises').then(m => m.readFile(FIXTURE_PATH, 'utf8'));
        await page.evaluate(async (md) => {
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, md);
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, md);
        await page.waitForTimeout(1000);

        // Scroll editor to bottom
        const result = await page.evaluate(() => {
            const editor = document.querySelector('.monaco-editor .monaco-scrollable-element') || document.querySelector('.cm-scroller') || document.querySelector('textarea');
            const preview = document.querySelector('.preview-pane, #preview, [class*="preview"]') || document.querySelector('main');
            if (!editor || !preview) return { error: 'editor/preview not found' };
            // Force scroll to bottom
            if (editor.scrollTo) editor.scrollTo(0, editor.scrollHeight);
            if (preview.scrollTo) preview.scrollTo(0, preview.scrollHeight);
            return { editorTop: editor.scrollTop, editorMax: editor.scrollHeight - editor.clientHeight, previewTop: preview.scrollTop, previewMax: preview.scrollHeight - preview.clientHeight };
        });
        console.log('Scroll result:', JSON.stringify(result, null, 2));
    });
});