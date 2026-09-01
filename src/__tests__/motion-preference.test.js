import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('motion preference (a11y M1)', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../../public/css/style.css'), 'utf8');
    const reducedBlock = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\{[\s\S]*?\}/);

    it('declares a prefers-reduced-motion: reduce media query', () => {
        expect(reducedBlock).not.toBeNull();
    });

    it('zeroes animation-duration and transition-duration inside the media query', () => {
        const block = reducedBlock?.[0] ?? '';
        expect(block).toContain('animation-duration');
        expect(block).toContain('transition-duration');
        expect(block).toContain('0.01ms');
    });
});
