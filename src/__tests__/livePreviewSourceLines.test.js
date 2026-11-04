import { describe, expect, it } from 'vitest';
import { annotateSourceLines, extractMarkdownBlockStarts } from '../features/live-preview-edit/source-lines.js';

describe('live preview source-line anchors', () => {
    it('finds the start line for common top-level Markdown blocks', () => {
        const markdown = [
            '# Title', '', 'A paragraph.', '', '- alpha', '- beta', '',
            '```mermaid', 'graph TD;A-->B;', '```', '', '> A quote', '', '---', ''
        ].join('\n');

        expect(extractMarkdownBlockStarts(markdown)).toEqual([
            { line: 1, type: 'heading' },
            { line: 3, type: 'paragraph' },
            { line: 5, type: 'list' },
            { line: 8, type: 'code' },
            { line: 12, type: 'quote' },
            { line: 14, type: 'hr' }
        ]);
    });

    it('maps rendered blocks in order and refreshes stale line anchors', () => {
        const root = document.createElement('div');
        root.innerHTML = '<h1 data-source-line="90">Title</h1><p>First</p><ul><li>One</li></ul><p>Second</p>';
        const markdown = '# Title\n\nFirst\n\n- One\n\nSecond';

        annotateSourceLines(root, markdown);

        expect(Array.from(root.children).map((element) => element.getAttribute('data-source-line')))
            .toEqual(['1', '3', '5', '7']);
    });

    it('does not assign Markdown lines to generated Mermaid labels', () => {
        const root = document.createElement('div');
        root.innerHTML = '<svg class="mermaid"><foreignObject><p>A</p><p>B</p></foreignObject></svg><p>After diagram</p>';
        const markdown = '```mermaid\ngraph TD;A-->B;\n```\n\nAfter diagram';

        annotateSourceLines(root, markdown);

        const diagram = root.querySelector('.mermaid');
        expect(diagram.getAttribute('data-source-line')).toBe('1');
        expect(diagram.querySelectorAll('[data-source-line]')).toHaveLength(0);
        expect(root.lastElementChild.getAttribute('data-source-line')).toBe('5');
    });
});
