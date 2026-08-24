import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

test('G1: typing must NOT re-create/reload the preview video — same node persists', async ({ page }) => {
    await waitForApp(page);
    await setMarkdown(page, `# Head\n\ntext before\n\n${VIDEO}\n\ntext after`);
    await page.waitForTimeout(1200);

    // Initial render: exactly one embedded video.
    await expect(page.locator('#output .preview-video video')).toHaveCount(1);

    // Tag the live video element so we can prove the SAME DOM node survives edits.
    const identity = await page.evaluate(() => {
        const v = document.querySelector('#output .preview-video video');
        if (!v) return null;
        window.__videoEl = v;
        v.setAttribute('data-probe-tag', 'persist-me');
        return { src: v.getAttribute('src'), preload: v.getAttribute('preload') };
    });
    expect(identity).not.toBeNull();
    console.log('identity(src,preload) =', identity);

    // Simulate typing several times (each debounces ~300ms + re-renders the preview).
    for (let i = 0; i < 4; i++) {
        await page.evaluate((n) => {
            const ed = window.editor || window.app?.getEditor?.();
            ed.setValue(ed.getValue() + `\ntyping line ${n}`);
        }, i);
        await page.waitForTimeout(550);
    }

    const result = await page.evaluate(() => {
        const v = document.querySelector('#output .preview-video video');
        return {
            sameNodeObject: v === window.__videoEl, // THE definitive check
            probeTagStillThere: v?.getAttribute('data-probe-tag') === 'persist-me',
            count: document.querySelectorAll('#output .preview-video video').length,
            src: v?.getAttribute('src')
        };
    });
    console.log('after typing:', result);

    // The SAME <video> DOM node must persist (not re-created) — means no reload/no flicker.
    expect(result.sameNodeObject).toBe(true);
    expect(result.probeTagStillThere).toBe(true);
    expect(result.count).toBe(1);
    expect(result.src).toBe(VIDEO);
});
