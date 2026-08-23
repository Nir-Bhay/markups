import { expect, test } from '@playwright/test';
import { getMarkdown, setMarkdown, waitForApp } from './helpers.js';

// The IMAGE user-attachment asset referenced in issue #40 ("picture link").
const ISSUE_40_IMAGE_ASSET =
    'https://github.com/user-attachments/assets/3a66e02c-ddde-4102-83d4-155caf426f20';

// Build a long document that mirrors the issue #39 scenario: many blocks, a
// tall table, and a distinct trailing "CREDIT" section that must be reachable
// in the preview when the editor reaches the bottom of the content.
function buildLongDoc() {
    const lines = [];
    for (let i = 1; i <= 40; i++) {
        lines.push(`## Section ${i}`);
        for (let j = 1; j <= 6; j++) {
            lines.push(`Paragraph ${i}.${j} with some ordinary words to fill the page height for scroll testing.`);
        }
    }
    lines.push('## CREDIT');
    lines.push('This is the credit / footer section that must be visible at the bottom of the preview when the editor reaches the bottom of the content.');
    return lines.join('\n');
}

test.describe('Reproduction harness — Issues #39 + #40', () => {
    test('#40: a GitHub picture link written with image syntax stays an image, never becomes "Open video"', async ({ page }) => {
        await waitForApp(page);

        await setMarkdown(page, `![screenshot](${ISSUE_40_IMAGE_ASSET})`);
        // let the preview render + any (wanted) replacements settle
        await page.waitForTimeout(600);

        // Fixed behaviour: the <img> stays a plain image in #output.
        // Buggy behaviour: processPreviewVideos swaps it for a <video> (which,
        // for a picture, errors into an "Open video" fallback link).
        await expect(page.locator(`#output img[src="${ISSUE_40_IMAGE_ASSET}"]`)).toHaveCount(1);
        await expect(page.locator('#output video')).toHaveCount(0);
        await expect(page.locator('#output .preview-video-fallback')).toHaveCount(0);
    });

    test('#39: scroll-sync reaches the preview bottom at the editor content end (no gray-bar distortion)', async ({ page }) => {
        await waitForApp(page);

        // Enable scroll sync via the settings checkbox (fires the change handler
        // that calls scrollSync.setEnabled(true) — the reliable path).
        await page.locator('#sync-scroll-checkbox').check();
        await expect(page.locator('#sync-scroll-checkbox')).toBeChecked();

        await setMarkdown(page, buildLongDoc());

        // Wait for the preview to render the CREDIT heading and anchors to build.
        await expect(page.locator('#output h2', { hasText: 'CREDIT' })).toBeVisible();
        await page.waitForTimeout(800);

        const m = await page.evaluate(async () => {
            const ed = window.editor;
            const preview = document.querySelector('.preview-wrapper');

            const layoutHeight = ed.getLayoutInfo().height;
            const scrollHeight = ed.getScrollHeight();
            const editorMax = Math.max(0, scrollHeight - layoutHeight);
            const lastLine = ed.getModel().getLineCount();
            const topOfLastLine = ed.getTopForLineNumber(lastLine);
            // Monaco's scroll max includes trailing gray-bar slack past the last
            // line. The content end is just past the last line (top of line+1).
            const contentEnd = ed.getTopForLineNumber(lastLine + 1);
            const grayBarSlack = editorMax - topOfLastLine;

            // Park the EDITOR at the CONTENT END (not the absolute scroll bar max).
            ed.setScrollTop(contentEnd);
            await new Promise((r) => requestAnimationFrame(r));
            await new Promise((r) => requestAnimationFrame(r));

            const previewMax = Math.max(0, preview.scrollHeight - preview.clientHeight);

            return {
                editorMax,
                topOfLastLine,
                contentEnd,
                grayBarSlack,
                previewScrollTop: preview.scrollTop,
                previewMax,
                ratio: previewMax > 0 ? preview.scrollTop / previewMax : 0
            };
        });

        // Console-visible evidence.
        console.log('[repro-39] metrics', JSON.stringify(m));

        // If Monaco's gray-bar slack is material, the old end-anchor (pinned to
        // editorMax) would have stretched the final sections and hidden the
        // bottom/credit section until the user scrolled through the whole bar.
        // Make sure the content-end is NOT buried under a huge gray bar.
        expect(m.grayBarSlack).toBeLessThan(m.editorMax * 0.5);
        // Hard requirement: the live preview must have reached its bottom when
        // the editor is parked at the content end.
        expect(m.previewScrollTop).toBeGreaterThan(m.previewMax - 60);
    });
});
