import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

test('G1: typing a doc reuses the same video (preload=none) instead of reloading metadata', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, `# Head\n\ntext before\n\n${VIDEO}\n\ntext after`);
    await page.waitForTimeout(1200);

    // First render: brand-new video is allowed to preload metadata.
    await expect(page.locator('#output .preview-video video')).toHaveCount(1);
    const firstPreload = await page.locator('#output .preview-video video').getAttribute('preload');
    console.log('first render preload =', firstPreload);
    expect(firstPreload).toBe('metadata');

    // Simulate several typing keystrokes (each debounces ~300ms + re-renders).
    for (let i = 0; i < 4; i++) {
        await page.evaluate((n) => {
            const ed = window.editor || window.app?.getEditor?.();
            ed.setValue(ed.getValue() + `\ntyping line ${n}`);
        }, i);
        await page.waitForTimeout(550);
    }

    // Re-render of the same URL must now skip the metadata fetch.
    const afterPreload = await page.locator('#output .preview-video video').getAttribute('preload');
    console.log('after typing preload =', afterPreload);
    expect(afterPreload).toBe('none');

    // Still exactly one embedded video (no duplicates stacked on re-renders).
    await expect(page.locator('#output .preview-video video')).toHaveCount(1);

    // The source location is preserved.
    expect(await page.locator('#output .preview-video video').getAttribute('src')).toBe(VIDEO);
});
