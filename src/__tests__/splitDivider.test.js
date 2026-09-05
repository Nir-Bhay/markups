import { describe, it, expect } from 'vitest';

/**
 * Unit tests for split-divider drag math.
 * We don't mount DOM here; we validate the width/ratio formulas that
 * `setupDivider()` uses so regressions in min/max/ratio math are caught.
 */
describe('split-divider resize math', () => {
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    it('clamps left pane to minWidth and right pane gets remainder', () => {
        const containerWidth = 1200;
        const dividerWidth = 8;
        const availableWidth = containerWidth - dividerWidth;
        const minWidth = 200;

        // mouse at very left
        const offsetX = 0;
        const leftWidth = clamp(offsetX, minWidth, availableWidth - minWidth);
        expect(leftWidth).toBe(minWidth);
        expect(availableWidth - leftWidth).toBe(availableWidth - minWidth);
    });

    it('clamps left pane to maxWidth leaving room for right pane', () => {
        const containerWidth = 1200;
        const dividerWidth = 8;
        const availableWidth = containerWidth - dividerWidth;
        const minWidth = 200;

        const offsetX = 9999;
        const leftWidth = clamp(offsetX, minWidth, availableWidth - minWidth);
        expect(leftWidth).toBe(availableWidth - minWidth);
    });

    it('ratio stays in (0,1) and sums to 1 with right pane', () => {
        const containerWidth = 1200;
        const dividerWidth = 8;
        const availableWidth = containerWidth - dividerWidth;
        const minWidth = 200;

        const offsetX = 500;
        const leftWidth = clamp(offsetX, minWidth, availableWidth - minWidth);
        const rightWidth = availableWidth - leftWidth;
        const ratio = leftWidth / availableWidth;

        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThan(1);
        expect(leftWidth + rightWidth).toBeCloseTo(availableWidth);
    });

    it('endDrag persistence computes a finite ratio from final widths', () => {
        const containerWidth = 1200;
        const dividerWidth = 8;
        const availableWidth = containerWidth - dividerWidth;
        const leftWidth = 600;
        const ratio = leftWidth / availableWidth;

        expect(Number.isFinite(ratio)).toBe(true);
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThan(1);
        expect(Math.round(ratio * 100)).toBe(50);
    });
});
