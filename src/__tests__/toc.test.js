// Tests for features/toc/index.js — heading extraction, tree building, and
// markdown TOC generation. These feed the navigation sidebar, so a wrong
// heading or anchor id breaks document navigation.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TOCManager } from '../features/toc/index.js';

describe('features/toc — heading extraction', () => {
    let toc;

    beforeEach(() => {
        toc = new TOCManager();
        toc.dispose(); // reset the singleton before grabbing a fresh instance
        toc = new TOCManager();
    });

    afterEach(() => toc.dispose());

    const flat = (content) => {
        toc.update(content);
        return toc.getFlat();
    };

    it('extracts heading level, text, and line number', () => {
        const items = flat('# Title\n\n## Section\nbody\n### Sub');
        expect(items.map(i => [i.level, i.text, i.line])).toEqual([
            [1, 'Title', 1],
            [2, 'Section', 3],
            [3, 'Sub', 5]
        ]);
    });

    it('ignores headings without a space after # and over-6 levels', () => {
        expect(flat('#NoSpace\n#######toomany\nplain text')).toEqual([]);
    });

    it('skips headings inside fenced code blocks', () => {
        const items = flat('```js\n# Not A Heading\nconst x = 1;\n```\n\n# Real Heading');
        expect(items).toEqual([
            expect.objectContaining({ level: 1, text: 'Real Heading', line: 6 })
        ]);
    });

    it('strips bold, italic, inline-code, and link formatting from headings', () => {
        const items = flat('# **Bold** *it* `code` [link text](http://x.com)');
        expect(items[0].text).toBe('Bold it code link text');
    });

    it('generates anchor ids from heading text', () => {
        expect(flat('# Hello World! #2 (2026)')[0].id).toBe('hello-world-2-2026');
        expect(flat('# Multi--dash   word')[0].id).toBe('multi-dash-word');
        // \w is ASCII-only, so non-Latin letters are dropped from the slug.
        expect(flat('# Café')[0].id).toBe('caf');
    });
});

describe('features/toc — tree building', () => {
    let toc;

    beforeEach(() => {
        toc = new TOCManager();
        toc.dispose();
        toc = new TOCManager();
    });

    afterEach(() => toc.dispose());

    it('nests headings under their nearest higher-level parent', () => {
        toc.update('# A\n## B\n### C\n## D\n# E');
        const tree = toc.getTree();
        expect(tree.map(n => [n.text, n.children.map(c => c.text)])).toEqual([
            ['A', ['B', 'D']],
            ['E', []]
        ]);
        expect(tree[0].children[0].children.map(c => c.text)).toEqual(['C']);
    });

    it('handles heading level jumps by nesting under the previous parent', () => {
        toc.update('# H1\n### H3\n#### H4');
        const tree = toc.getTree();
        expect(tree[0].children[0].text).toBe('H3');
        expect(tree[0].children[0].children[0].text).toBe('H4');
    });
});

describe('features/toc — update & markdown output', () => {
    let toc;

    beforeEach(() => {
        toc = new TOCManager();
        toc.dispose();
        toc = new TOCManager();
    });

    afterEach(() => toc.dispose());

    it('clears items when content is empty', () => {
        toc.update('# A');
        expect(toc.getFlat()).toHaveLength(1);
        toc.update('');
        expect(toc.getFlat()).toEqual([]);
        expect(toc.getTree()).toEqual([]);
    });

    it('renders markdown TOC respecting level filters', () => {
        toc.update('# A\n## B\n### C');
        expect(toc.toMarkdown()).toBe('- [A](#a)\n  - [B](#b)\n    - [C](#c)');
        expect(toc.toMarkdown({ minLevel: 2, maxLevel: 2 })).toBe('- [B](#b)');
    });

    it('supports ordered TOC lists (1. bullet per level)', () => {
        toc.update('# A\n## B');
        expect(toc.toMarkdown({ ordered: true })).toBe('1. [A](#a)\n  1. [B](#b)');
    });

    it('getFlat returns a new array; getTree returns a deep copy', () => {
        toc.update('# A\n## B');
        const flatCopy = toc.getFlat();
        flatCopy.length = 0;
        expect(toc.getFlat()).toHaveLength(2);

        const treeCopy = toc.getTree();
        treeCopy[0].children.length = 0;
        treeCopy[0].text = 'changed';
        expect(toc.getTree()[0].text).toBe('A');
        expect(toc.getTree()[0].children).toHaveLength(1);
    });
});
