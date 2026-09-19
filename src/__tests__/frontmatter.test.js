import { describe, it, expect } from 'vitest';
import { parseFrontmatter, frontmatterSyncForNote } from '../utils/frontmatter.js';

describe('utils/frontmatter', () => {
    it('parses scalar title/category and inline tag lists', () => {
        const { data, body, hasFrontmatter } = parseFrontmatter(
            '---\ntitle: Hello\ntags: [a, b]\ncategory: work\n---\n# Body\n'
        );
        expect(hasFrontmatter).toBe(true);
        expect(data.title).toBe('Hello');
        expect(data.tags).toEqual(['a', 'b']);
        expect(data.category).toBe('work');
        expect(body).toBe('# Body\n');
    });

    it('parses dash-style tag lists', () => {
        const { data } = parseFrontmatter('---\ntags:\n  - x\n  - y\n---\nbody');
        expect(data.tags).toEqual(['x', 'y']);
    });

    it('returns no frontmatter for plain docs', () => {
        expect(parseFrontmatter('# Hi').hasFrontmatter).toBe(false);
    });

    it('syncs only unset note fields', () => {
        const sync = frontmatterSyncForNote(
            { title: 'Untitled', tags: [], category: null },
            '---\ntitle: Real\ntags: t\n---\nbody'
        );
        expect(sync).toEqual({ title: 'Real', tags: ['t'] });
        expect(frontmatterSyncForNote(
            { title: 'Mine', tags: ['k'], category: 'c' },
            '---\ntitle: Other\ntags: z\ncategory: d\n---\nbody'
        )).toEqual({});
    });
});
