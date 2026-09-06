import { describe, it, expect } from 'vitest';
import { shouldRenderMermaid, shouldRenderKatex } from '../utils/preview-gates.js';

describe('preview-gates', () => {
    describe('shouldRenderMermaid', () => {
        it('returns true when preview.mermaid is true', () => {
            expect(shouldRenderMermaid({ preview: { mermaid: true } })).toBe(true);
        });

        it('returns false when preview.mermaid is false', () => {
            expect(shouldRenderMermaid({ preview: { mermaid: false } })).toBe(false);
        });

        it('returns true when settings is null (default)', () => {
            expect(shouldRenderMermaid(null)).toBe(true);
        });

        it('returns true when settings is empty object (default)', () => {
            expect(shouldRenderMermaid({})).toBe(true);
        });

        it('returns true when preview.mermaid is undefined (default)', () => {
            expect(shouldRenderMermaid({ preview: {} })).toBe(true);
        });
    });

    describe('shouldRenderKatex', () => {
        it('returns true when preview.mathRendering is true', () => {
            expect(shouldRenderKatex({ preview: { mathRendering: true } })).toBe(true);
        });

        it('returns false when preview.mathRendering is false', () => {
            expect(shouldRenderKatex({ preview: { mathRendering: false } })).toBe(false);
        });

        it('returns true when settings is null (default)', () => {
            expect(shouldRenderKatex(null)).toBe(true);
        });

        it('returns true when settings is empty object (default)', () => {
            expect(shouldRenderKatex({})).toBe(true);
        });

        it('returns true when preview.mathRendering is undefined (default)', () => {
            expect(shouldRenderKatex({ preview: {} })).toBe(true);
        });
    });
});
