import { describe, expect, it } from 'vitest';
import { createHeadingIdAllocator, slugifyHeading } from '../utils/heading-ids.js';

describe('heading id uniquify', () => {
    it('slugifies plain text', () => {
        expect(slugifyHeading('Hello World!')).toBe('hello-world');
        expect(slugifyHeading('  Repeated  ')).toBe('repeated');
    });

    it('emits GFM-style ids for duplicate headings', () => {
        const alloc = createHeadingIdAllocator();
        expect(alloc('Repeated')).toBe('repeated');
        expect(alloc('Repeated')).toBe('repeated-1');
        expect(alloc('Repeated')).toBe('repeated-2');
        expect(alloc('Other')).toBe('other');
        expect(alloc('Other')).toBe('other-1');
    });
});
