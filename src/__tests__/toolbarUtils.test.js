import { describe, expect, it } from 'vitest';
import { clearMarkdownFormatting } from '../features/toolbar/utils.js';

describe('clearMarkdownFormatting', () => {
    it('removes common Markdown wrappers while preserving content', () => {
        const source = '# Title\n\n**bold** and *italic* with [a link](https://example.com)';

        expect(clearMarkdownFormatting(source)).toBe('Title\n\nbold and italic with a link');
    });

    it('removes list, quote, task, code, and divider markers', () => {
        const source = '- [x] Done\n> quoted\n\n```js\nconst value = 1;\n```\n\n---';

        expect(clearMarkdownFormatting(source)).toBe('Done\nquoted\n\nconst value = 1;');
    });

    it('does not change empty selections', () => {
        expect(clearMarkdownFormatting('')).toBe('');
        expect(clearMarkdownFormatting(null)).toBe('');
    });
});
