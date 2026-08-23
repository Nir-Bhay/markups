import { expect, test } from '@playwright/test';
import { setMarkdown, waitForApp } from './helpers.js';

const HEADER = '| Flag | Name | Description |';
const DIVIDER = '| --- | --- | --- |';

// Tall Table: many rows, long cell text that wraps → the preview table is much
// taller than the editor lines it occupies. This is the "Flag table" shape that
// exposed issue #39 (preview stalls short of the bottom / non-monotonic jumps).
function tallTableDoc() {
    const rows = [HEADER, DIVIDER];
    for (let i = 1; i <= 25; i++) {
        rows.push(
            '| :triangular_flag_on_post: | Item number ' + i +
            ' | Some fairly long descriptive text for row ' + i +
            ' that wraps over multiple lines in the rendered preview table because ' +
            'it keeps going on and on and on even after the cell runs out of width. |'
        );
    }
    rows.push('');
    rows.push('## CREDIT');
    rows.push('Credit section at the very bottom that must appear.');
    return rows.join('\n');
}

test('#39: preview scroll stays monotonic and reaches the bottom across a tall table', async ({ page }) => {
    await waitForApp(page);
    await page.locator('#sync-scroll-checkbox').check();
    await setMarkdown(page, tallTableDoc());
    await expect(page.locator('#output h2', { hasText: 'CREDIT' })).toBeVisible();
    await page.waitForTimeout(900);

    const curve = await page.evaluate(async () => {
        const ed = window.editor;
        const preview = document.querySelector('.preview-wrapper');
        const edMax = Math.max(0, ed.getScrollHeight() - ed.getLayoutInfo().height);
        const previewMax = Math.max(0, preview.scrollHeight - preview.clientHeight);

        const samples = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
            ed.setScrollTop((edMax * i) / steps);
            await new Promise((r) => requestAnimationFrame(r));
            await new Promise((r) => requestAnimationFrame(r));
            samples.push({ pvTop: Math.round(preview.scrollTop), edTop: Math.round(ed.getScrollTop()) });
        }
        return { edMax: Math.round(edMax), previewMax: Math.round(previewMax), samples };
    });

    // "halt then jump" = preview goes backwards (dip) or barely moves across a
    // large editor step (stall).
    const dips = [];
    const stalls = [];
    for (let i = 1; i < curve.samples.length; i++) {
        if (curve.samples[i].pvTop < curve.samples[i - 1].pvTop) {
            dips.push({ at: i, from: curve.samples[i - 1].pvTop, to: curve.samples[i].pvTop });
        }
        const edDelta = curve.samples[i].edTop - curve.samples[i - 1].edTop;
        const pvDelta = curve.samples[i].pvTop - curve.samples[i - 1].pvTop;
        if (edDelta > curve.edMax * 0.05 && pvDelta < curve.previewMax * 0.01) {
            stalls.push({ at: i, edDelta: Math.round(edDelta), pvDelta });
        }
    }
    const last = curve.samples[curve.samples.length - 1];
    const lastPct = curve.previewMax > 0 ? last.pvTop / curve.previewMax : 0;

    // Live evidence.
    console.log('tt lastPct ' + lastPct.toFixed(3) + ' dips ' + dips.length + ' stalls ' + stalls.length);

    expect(dips.length).toBe(0);
    expect(stalls.length).toBe(0);
    expect(lastPct).toBeGreaterThan(0.95);
});
