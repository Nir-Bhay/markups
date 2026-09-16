import { test, expect } from '@playwright/test';

const DOC = [
    '# Doc title',
    '',
    'First paragraph.',
    '',
    '- alpha',
    '- beta',
    '',
    '```mermaid',
    'graph TD;A-->B;',
    '```',
    '',
    '![Shot](https://example.com/a.png) {width=50% align=center}',
    '',
    'Second paragraph.',
    ''
].join('\n');

async function setDoc(page, markdown, token) {
    // Late tab/IndexedDB restore can overwrite the editor right after setValue.
    for (let attempt = 0; attempt < 8; attempt++) {
        await page.evaluate((md) => window.editor.setValue(md), markdown);
        await page.waitForTimeout(400);
        const kept = await page.evaluate(
            (head) => (window.editor?.getValue() || '').startsWith(head),
            markdown.slice(0, 40)
        );
        if (kept) break;
    }
    await expect(page.locator('#output')).toContainText(token, { timeout: 20_000 });
    await page.waitForTimeout(600);
}

async function boot(page, markdown = DOC) {
    // The header hides .edit-mode-toggle below 1280px, so use a wide viewport.
    await page.setViewportSize({ width: 1600, height: 1000 });
    // Start from a clean vault so an earlier run cannot restore a stale tab.
    await page.addInitScript(async () => {
        try { localStorage.clear(); } catch { /* ignore */ }
        try {
            const dbs = (await indexedDB.databases?.()) || [];
            for (const db of dbs) {
                if (db?.name) { try { indexedDB.deleteDatabase(db.name); } catch { /* ignore */ } }
            }
        } catch { /* ignore */ }
    });
    await page.goto('/');
    await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 30_000 });
    await page.waitForFunction(() => typeof window.editor?.setValue === 'function', null, { timeout: 30_000 });
    await page.waitForTimeout(1200);
    await page.locator('#view-split').click();
    await setDoc(page, markdown, 'First paragraph');
}

test('Document Mode syncs the edited block without re-rendering the preview', async ({ page }) => {
    await boot(page);
    await page.locator('#live-preview-edit-toggle').click();
    await page.waitForTimeout(300);

    const result = await page.evaluate(async () => {
        const output = document.querySelector('#output');

        // Detect any full preview re-render (innerHTML replacement).
        let innerHtmlWrites = 0;
        const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(output, 'innerHTML', {
            set(value) {
                innerHtmlWrites += 1;
                return descriptor.set.call(this, value);
            },
            get() {
                return descriptor.get.call(this);
            }
        });

        const findParagraph = (needle) =>
            [...output.querySelectorAll('p')].find((p) => (p.textContent || '').includes(needle));

        const first = findParagraph('First paragraph');
        const second = findParagraph('Second paragraph');
        if (!first || !second) {
            return { missingBlock: true, paragraphCount: output.querySelectorAll('p').length };
        }
        const hasSourceLine = first.hasAttribute('data-source-line');

        first.textContent = 'First paragraph EDITED';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 700));
        const afterFirst = window.editor.getValue();

        second.textContent = 'Second paragraph EDITED';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 700));
        const afterSecond = window.editor.getValue();

        return { innerHtmlWrites, hasSourceLine, afterFirst, afterSecond };
    });

    expect(result.missingBlock).toBeUndefined();
    expect(result.hasSourceLine).toBe(true);
    expect(result.innerHtmlWrites).toBe(0);

    // First edit landed, everything else survived.
    expect(result.afterFirst).toContain('First paragraph EDITED');
    expect(result.afterFirst).toContain('```mermaid');
    expect(result.afterFirst).toContain('graph TD;A-->B;');
    expect(result.afterFirst).not.toContain('<svg');
    expect(result.afterFirst).not.toMatch(/@keyframes/);
    expect(result.afterFirst).toContain('{width=50% align=center}');
    expect(result.afterFirst).toContain('- alpha');
    expect(result.afterFirst).toContain('- beta');
    expect(result.afterFirst).toContain('# Doc title');
    expect(result.afterFirst.match(/Doc title/g)).toHaveLength(1);

    // Second edit: no doubling from stale line mapping.
    expect(result.afterSecond).toContain('First paragraph EDITED');
    expect(result.afterSecond).toContain('Second paragraph EDITED');
    expect(result.afterSecond.match(/First paragraph EDITED/g)).toHaveLength(1);
    expect(result.afterSecond.match(/Second paragraph EDITED/g)).toHaveLength(1);
    expect(result.afterSecond.match(/- alpha/g)).toHaveLength(1);

    // No document ballooning (the mermaid SVG-dump regression inflated 42KB → 162KB).
    expect(result.afterSecond.length).toBeLessThan(1500);
});

test('leaving Document Mode keeps the preview and Markdown stable', async ({ page }) => {
    await boot(page);
    await page.locator('#live-preview-edit-toggle').click();
    await page.waitForTimeout(300);

    const edited = await page.evaluate(async () => {
        const output = document.querySelector('#output');
        const paragraph = [...output.querySelectorAll('p')]
            .find((p) => (p.textContent || '').includes('First paragraph'));
        if (!paragraph) return false;
        paragraph.textContent = 'Edited in document mode';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 700));
        return true;
    });

    expect(edited).toBe(true);

    const markdownBefore = await page.evaluate(() => window.editor.getValue());
    expect(markdownBefore).toContain('Edited in document mode');

    const innerHtmlWrites = await page.evaluate(async () => {
        const output = document.querySelector('#output');
        let writes = 0;
        const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(output, 'innerHTML', {
            set(value) {
                writes += 1;
                return descriptor.set.call(this, value);
            },
            get() {
                return descriptor.get.call(this);
            }
        });

        document.querySelector('#markdown-mode-toggle').click();
        await new Promise((resolve) => setTimeout(resolve, 300));
        return writes;
    });

    const markdownAfter = await page.evaluate(() => window.editor.getValue());
    const contentEditable = await page.locator('#output').getAttribute('contenteditable');

    expect(innerHtmlWrites).toBe(0);
    expect(markdownAfter).toBe(markdownBefore);
    expect(contentEditable).toBe('false');
});
