import { describe, it, expect } from 'vitest';
import { clampMonotonic, findAnchorSegment } from '../utils/scroll-sync.js';

describe('scroll sync mapping (Issue #39)', () => {
    it('clampMonotonic removes backwards positions that caused "halt then jump"', () => {
        const anchors = [
            { line: 1, previewTop: 0, editorTop: 0 },
            // out-of-order preview top — a common artifact of imperfect annotation
            { line: 20, previewTop: 90, editorTop: 300 },
            { line: 30, previewTop: 40, editorTop: 500 },
            { line: 50, previewTop: 500, editorTop: 800 }
        ];
        clampMonotonic(anchors, 'previewTop');

        expect(anchors.map((a) => a.previewTop)).toEqual([0, 90, 90, 500]);
        // non-decreasing, no backwards jump
        for (let i = 1; i < anchors.length; i++) {
            expect(anchors[i].previewTop).toBeGreaterThanOrEqual(anchors[i - 1].previewTop);
        }
    });

    it('findAnchorSegment picks the bracketing segment and local progress', () => {
        const anchors = [
            { line: 1, previewTop: 0, editorTop: 0 },
            { line: 20, previewTop: 100, editorTop: 200 },
            { line: 40, previewTop: 300, editorTop: 500 }
        ];

        const seg = findAnchorSegment(150, 'editorTop', anchors);
        expect(seg.a).toBe(anchors[0]);
        expect(seg.b).toBe(anchors[1]);
        // t = (150-0)/(200-0) = 0.75
        expect(seg.t).toBeCloseTo(0.75);
    });

    it('findAnchorSegment clamps behind the first / past the last anchor', () => {
        const anchors = [
            { line: 1, previewTop: 0, editorTop: 0 },
            { line: 10, previewTop: 100, editorTop: 200 },
            { line: 20, previewTop: 500, editorTop: 900 }
        ];

        const atStart = findAnchorSegment(-50, 'previewTop', anchors);
        expect(atStart.t).toBe(0);
        expect(atStart.a).toBe(anchors[0]);

        const atEnd = findAnchorSegment(1e9, 'editorTop', anchors);
        expect(atEnd.a).toBe(anchors[2]);
        expect(atEnd.t).toBe(1);
    });
});
