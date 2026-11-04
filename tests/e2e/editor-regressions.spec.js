import { test, expect } from '@playwright/test';

async function bootEditor(page, width = 1280) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#editor')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#output')).toContainText('Welcome to Markups', { timeout: 30_000 });
    await expect(page.locator('#tabs-list button, #tabs-list [role="tab"]')).not.toHaveCount(0, {
        timeout: 30_000
    });
    await page.waitForFunction(() => typeof window.editor?.setValue === 'function', null, {
        timeout: 30_000
    });
}

async function getSplitGeometry(page) {
    return page.evaluate(() => {
        const container = document.querySelector('#container');
        const editor = document.querySelector('#edit');
        const preview = document.querySelector('#preview');
        const divider = document.querySelector('#split-divider');
        const editorWidth = editor.getBoundingClientRect().width;
        const previewWidth = preview.getBoundingClientRect().width;

        return {
            containerWidth: container.getBoundingClientRect().width,
            editorWidth,
            previewWidth,
            dividerWidth: divider.getBoundingClientRect().width,
            editorWidthStyle: editor.style.width,
            ratio: editorWidth / (editorWidth + previewWidth)
        };
    });
}

test('split divider resizes the real panes, survives viewport resize, and view modes fill the workspace', async ({ page }) => {
    await bootEditor(page);
    await page.locator('#view-split').click();

    const before = await getSplitGeometry(page);
    const handle = page.locator('#split-divider');
    const handleBox = await handle.boundingBox();
    expect(handleBox).not.toBeNull();

    const startX = handleBox.x + handleBox.width / 2;
    const centerY = handleBox.y + handleBox.height / 2;
    await page.mouse.move(startX, centerY);
    await page.mouse.down();
    await page.mouse.move(startX + 160, centerY, { steps: 8 });
    await page.mouse.up();

    await expect.poll(async () => (await getSplitGeometry(page)).editorWidth)
        .toBeGreaterThan(before.editorWidth + 100);

    const afterDrag = await getSplitGeometry(page);
    expect(afterDrag.previewWidth).toBeLessThan(before.previewWidth - 100);
    expect(afterDrag.editorWidthStyle).toMatch(/px$/);
    expect(afterDrag.editorWidth + afterDrag.previewWidth + afterDrag.dividerWidth)
        .toBeLessThanOrEqual(afterDrag.containerWidth + 1);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(async () => {
        const resized = await getSplitGeometry(page);
        return Math.abs(resized.ratio - afterDrag.ratio);
    }).toBeLessThan(0.03);

    await page.locator('#view-preview').click();
    await expect(page.locator('#edit')).toBeHidden();
    await expect.poll(() => page.locator('#preview').evaluate((pane) =>
        pane.getBoundingClientRect().width
    )).toBeGreaterThan(1300);

    await page.locator('#view-code').click();
    await expect(page.locator('#preview')).toBeHidden();
    await expect.poll(() => page.locator('#edit').evaluate((pane) =>
        pane.getBoundingClientRect().width
    )).toBeGreaterThan(1300);

    await page.locator('#view-split').click();
    await expect(page.locator('#split-divider')).toBeVisible();
    await expect.poll(async () => (await getSplitGeometry(page)).editorWidth)
        .toBeGreaterThan(300);
    await expect.poll(async () => (await getSplitGeometry(page)).previewWidth)
        .toBeGreaterThan(300);
});

test('real editor typing updates the preview and keeps source lines in sync', async ({ page }) => {
    await bootEditor(page);

    const markdown = [
        '# Live preview regression',
        '',
        'First edit',
        '',
        '| Item | State |',
        '| --- | --- |',
        '| Table | Ready |'
    ].join('\n');

    await page.evaluate((value) => {
        const editor = window.editor;
        editor.setValue(value);
        editor.focus();
        editor.setPosition({ lineNumber: 3, column: 'First edit'.length + 1 });
    }, markdown);

    const output = page.locator('#output');
    await expect(output.locator('h1')).toHaveText('Live preview regression');
    await expect(output.locator('p').first()).toHaveText('First edit');
    await expect(output.locator('p').first()).toHaveAttribute('data-source-line', '3');
    await expect(output.locator('table')).toHaveCount(1);
    await expect(output.locator('table')).toContainText('Ready');

    await page.keyboard.type(' updated');
    await expect(output.locator('p').first()).toHaveText('First edit updated');
    await expect(output.locator('p').first()).toHaveAttribute('data-source-line', '3');
});

test('Mermaid blocks do not shift source lines for the following paragraphs', async ({ page }) => {
    await bootEditor(page);
    const markdown = [
        '# Diagram mapping',
        '',
        '```mermaid',
        'graph LR',
        '  A --> B',
        '```',
        '',
        'First paragraph after diagram',
        '',
        'Second paragraph after diagram'
    ].join('\n');

    await page.evaluate((value) => window.editor.setValue(value), markdown);
    const output = page.locator('#output');
    await expect(output.locator('.mermaid svg')).toBeVisible();
    await expect(output.locator('h1')).toHaveAttribute('data-source-line', '1');
    await expect(output.locator('> .mermaid')).toHaveAttribute('data-source-line', '3');
    await expect(output.locator('> p').nth(0)).toHaveAttribute('data-source-line', '8');
    await expect(output.locator('> p').nth(1)).toHaveAttribute('data-source-line', '10');
});

test('live preview keeps Markdown paragraph breaks without adding extra vertical gaps', async ({ page }) => {
    await bootEditor(page);
    await page.evaluate(() => window.editor.setValue('First paragraph\n\n> Quote\n\nSecond paragraph'));

    const paragraphs = page.locator('#output > p');
    const quote = page.locator('#output > blockquote');
    await expect(paragraphs).toHaveCount(2);
    await expect(paragraphs.nth(0)).toHaveText('First paragraph');
    await expect(quote).toContainText('Quote');
    await expect(paragraphs.nth(1)).toHaveText('Second paragraph');
    await expect(paragraphs.nth(0)).toHaveCSS('margin-top', '0px');
    await expect(paragraphs.nth(0)).toHaveCSS('margin-bottom', '0px');
    await expect(quote).toHaveCSS('margin-top', '0px');
    await expect(quote).toHaveCSS('margin-bottom', '0px');
    const lineHeightRatio = await paragraphs.nth(0).evaluate((paragraph) => {
        const style = getComputedStyle(paragraph);
        return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
    });
    expect(lineHeightRatio).toBeCloseTo(1.3, 2);
});

test('green toolbar density control toggles and reports its expanded state', async ({ page }) => {
    await bootEditor(page);

    const toggle = page.locator('#toolbar-density-toggle');
    const modeTools = page.locator('.toolbar-modes-group');
    const initialState = await toggle.getAttribute('aria-expanded');
    expect(['true', 'false']).toContain(initialState);

    await toggle.click();
    const nextState = initialState === 'true' ? 'false' : 'true';
    await expect(toggle).toHaveAttribute('aria-expanded', nextState);
    await expect(toggle).toHaveAttribute(
        'aria-label',
        nextState === 'true' ? 'Collapse toolbar' : 'Expand toolbar'
    );

    if (nextState === 'true') {
        await expect(modeTools).toBeVisible();
    } else {
        await expect(modeTools).toBeHidden();
    }
});
