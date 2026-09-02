export async function waitForApp(page) {
    await page.goto('/');
    // #output may be hidden in mobile view, so use 'attached' state
    await page.waitForSelector('#output', { state: 'attached' });
    await page.waitForFunction(() => {
        return Boolean(
            window.editor?.setValue ||
            (window.app && typeof window.app.setContent === 'function')
        );
    });
}

export async function setMarkdown(page, markdown) {
    await page.evaluate((value) => {
        if (window.editor?.setValue) {
            window.editor.setValue(value);
            return;
        }
        if (window.app?.setContent) {
            window.app.setContent(value);
            return;
        }
        throw new Error('No editor bridge is available');
    }, markdown);
}

export async function getMarkdown(page) {
    return page.evaluate(() => {
        if (window.editor?.getValue) return window.editor.getValue();
        if (window.app?.getContent) return window.app.getContent();
        throw new Error('No editor bridge is available');
    });
}

export async function selectMarkdownRange(page, startColumn, endColumn, lineNumber = 1) {
    await page.evaluate(({ lineNumber: line, startColumn: start, endColumn: end }) => {
        const range = {
            startLineNumber: line,
            startColumn: start,
            endLineNumber: line,
            endColumn: end
        };
        const editor = window.editor || window.app?.getEditor?.();
        if (!editor?.setSelection) throw new Error('No Monaco editor selection API is available');
        editor.focus();
        editor.setSelection(range);
    }, { lineNumber, startColumn, endColumn });
}
