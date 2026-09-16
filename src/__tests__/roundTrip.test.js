import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import { serializePreviewToMarkdown } from '../features/live-preview-edit/index.js';

/**
 * DOM → Markdown is the "untested half" of every WYSIWYG. The contract that
 * matters is a fixed point: serialize → parse → serialize must be stable, so an
 * edit-save cycle can never drift the document a little further from itself.
 */
function toDom(html) {
    const root = document.createElement('article');
    root.innerHTML = html;
    return root;
}

function serializeHtml(html) {
    return serializePreviewToMarkdown(toDom(html));
}

const CORPUS = [
    '# Title\n\nHello **bold** and *italic*.\n',
    '## Heading two\n\nA paragraph with a [link](https://example.com).\n',
    '- one\n- two\n- three\n',
    '1. first\n2. second\n',
    '> a quote\n',
    '    indented code\n',
    '```js\nconst x = 1;\n```\n',
    '| A | B |\n| --- | --- |\n| 1 | 2 |\n',
    '---\n',
    'Text with `inline code` inside.\n'
];

describe('preview → Markdown fixed point', () => {
    CORPUS.forEach((markdown) => {
        it(`is idempotent for: ${JSON.stringify(markdown)}`, () => {
            const html = marked.parse(markdown);
            const once = serializeHtml(html);
            const twice = serializeHtml(marked.parse(once));
            expect(twice).toBe(once);
        });
    });

    it('does not grow code fences across repeated round trips', () => {
        let markdown = '```js\nconst x = 1;\n```\n';
        for (let i = 0; i < 4; i++) {
            markdown = serializeHtml(marked.parse(markdown));
        }
        expect(markdown).toBe('```js\nconst x = 1;\n```\n');
    });

    it('does not renumber ordered lists across repeated round trips', () => {
        let markdown = '7. seven\n8. eight\n';
        for (let i = 0; i < 3; i++) {
            markdown = serializeHtml(marked.parse(markdown));
        }
        expect(markdown.trim()).toBe('7. seven\n8. eight');
    });
});
