import { describe, it, expect } from 'vitest';
import {
    parseFrontMatter,
    renderFrontMatterCard,
    blankFrontMatterLines
} from '../utils/front-matter.js';

describe('parseFrontMatter', () => {
    it('parses a simple key/value block', () => {
        const md = '---\ntitle: Hello\ndate: 2026-09-02\n---\n\n# Body\n';
        const parsed = parseFrontMatter(md);
        expect(parsed).not.toBeNull();
        expect(parsed.frontMatter.title).toBe('Hello');
        expect(parsed.frontMatter.date).toBe('2026-09-02');
        expect(parsed.body).toBe('\n# Body\n');
        expect(parsed.lineCount).toBe(4);
    });

    it('returns null when there is no front matter', () => {
        expect(parseFrontMatter('# Just markdown\n')).toBeNull();
        expect(parseFrontMatter('')).toBeNull();
        expect(parseFrontMatter(null)).toBeNull();
    });

    it('returns null when the closing fence is missing', () => {
        expect(parseFrontMatter('---\ntitle: Unfinished\n')).toBeNull();
    });

    it('does not treat a code fence on line 1 as front matter', () => {
        const md = '```\n---\n```\n';
        expect(parseFrontMatter(md)).toBeNull();
    });

    it('only parses a block that starts on line 1', () => {
        const md = '# Intro\n---\ntitle: Not FM\n---\n';
        expect(parseFrontMatter(md)).toBeNull();
    });

    it('parses list values under a key', () => {
        const md = '---\ntags:\n  - one\n  - two\n---\nbody';
        const parsed = parseFrontMatter(md);
        expect(parsed.frontMatter.tags).toEqual(['one', 'two']);
    });

    it('strips surrounding quotes from values', () => {
        const md = '---\ntitle: "Quoted"\nauthor: \'Single\'\n---\n';
        const parsed = parseFrontMatter(md);
        expect(parsed.frontMatter.title).toBe('Quoted');
        expect(parsed.frontMatter.author).toBe('Single');
    });

    it('handles CRLF line endings', () => {
        const md = '---\r\ntitle: CRLF\r\n---\r\nbody';
        const parsed = parseFrontMatter(md);
        expect(parsed.frontMatter.title).toBe('CRLF');
        expect(parsed.body).toBe('body');
    });

    it('accepts ... as the closing fence', () => {
        const md = '---\nkey: value\n...\nbody';
        const parsed = parseFrontMatter(md);
        expect(parsed.frontMatter.key).toBe('value');
    });

    it('reports the correct lineCount including both fences', () => {
        const md = '---\na: 1\nb: 2\nc: 3\n---\nrest';
        const parsed = parseFrontMatter(md);
        expect(parsed.lineCount).toBe(5);
    });
});

describe('renderFrontMatterCard', () => {
    it('renders an escaped key/value table', () => {
        const html = renderFrontMatterCard({ title: '<b>Evil</b>', author: 'Me' });
        expect(html).toContain('front-matter-card');
        expect(html).toContain('&lt;b&gt;Evil&lt;/b&gt;');
        expect(html).not.toContain('<b>Evil</b>');
        expect(html).toContain('author');
    });

    it('renders array values as comma-separated text', () => {
        const html = renderFrontMatterCard({ tags: ['a', 'b'] });
        expect(html).toContain('a, b');
    });

    it('returns an empty string for empty or invalid input', () => {
        expect(renderFrontMatterCard({})).toBe('');
        expect(renderFrontMatterCard(null)).toBe('');
        expect(renderFrontMatterCard(undefined)).toBe('');
    });
});

describe('blankFrontMatterLines', () => {
    it('blanks the block but preserves line count', () => {
        const md = '---\ntitle: X\n---\n# Heading\nline';
        const result = blankFrontMatterLines(md);
        const resultLines = result.split('\n');
        const originalLines = md.split('\n');
        expect(resultLines.length).toBe(originalLines.length);
        expect(resultLines[3]).toBe('# Heading');
        expect(result).not.toContain('title:');
    });

    it('returns the input unchanged when no block is present', () => {
        const md = '# Plain\n';
        expect(blankFrontMatterLines(md)).toBe(md);
    });
});
