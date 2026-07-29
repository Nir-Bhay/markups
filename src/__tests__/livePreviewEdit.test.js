import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    LivePreviewEditController,
    replaceMarkdownBlockAtLine,
    serializePreviewToMarkdown
} from '../features/live-preview-edit/index.js';

describe('live preview edit serializer', () => {
    it('serializes common rich-text blocks back to Markdown', () => {
        const root = document.createElement('article');
        root.innerHTML = `
            <h1>Title</h1>
            <p>Hello <strong>bold</strong> and <em>italic</em> <a href="https://example.com">link</a>.</p>
            <ul><li>One</li><li>Two</li></ul>
            <blockquote><p>Quote</p></blockquote>
        `;

        expect(serializePreviewToMarkdown(root)).toBe([
            '# Title',
            '',
            'Hello **bold** and *italic* [link](https://example.com).',
            '',
            '- One',
            '- Two',
            '',
            '> Quote',
            ''
        ].join('\n'));
    });

    it('serializes a single edited block with its Markdown syntax intact', () => {
        const heading = document.createElement('h1');
        heading.textContent = 'Edited heading';

        const paragraph = document.createElement('p');
        paragraph.innerHTML = 'Edited <strong>paragraph</strong>';

        expect(serializePreviewToMarkdown(heading)).toBe('# Edited heading\n');
        expect(serializePreviewToMarkdown(paragraph)).toBe('Edited **paragraph**\n');
    });

    it('serializes code blocks and tables', () => {
        const root = document.createElement('article');
        root.innerHTML = `
            <pre><div class="code-block-header"><button>Copy</button></div><code class="language-js">const x = 1;</code></pre>
            <table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>
        `;

        expect(serializePreviewToMarkdown(root)).toContain('```js\nconst x = 1;\n```');
        expect(serializePreviewToMarkdown(root)).toContain('| A | B |\n| --- | --- |\n| 1 | 2 |');
    });

    it('converts embedded video widgets back to source links', () => {
        const root = document.createElement('article');
        root.innerHTML = `
            <div class="preview-video"><video src="https://example.com/demo.mp4"></video></div>
            <div class="preview-video preview-video--embed"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></div>
        `;

        const markdown = serializePreviewToMarkdown(root);
        expect(markdown).toContain('https://example.com/demo.mp4');
        expect(markdown).toContain('https://youtu.be/dQw4w9WgXcQ');
    });
});

describe('block-level Markdown replacement', () => {
    it('replaces only the edited heading block and preserves surrounding Markdown', () => {
        const source = '# Old title\n\nParagraph stays\n';
        const next = replaceMarkdownBlockAtLine(source, 1, '# New title\n');

        expect(next).toBe('# New title\n\nParagraph stays\n');
    });

    it('replaces only the edited paragraph block and preserves heading/list context', () => {
        const source = '# Title\n\nOld paragraph\n\n- One\n- Two\n';
        const next = replaceMarkdownBlockAtLine(source, 3, 'New paragraph\n');

        expect(next).toBe('# Title\n\nNew paragraph\n\n- One\n- Two\n');
    });
});

describe('LivePreviewEditController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    function setupController() {
        document.body.innerHTML = `
            <button id="markdown-toggle" type="button" aria-pressed="true">Markdown Mode</button>
            <button id="toggle" type="button" aria-pressed="false">Document Mode</button>
            <article id="output"><h1 data-source-line="1">Old title</h1><p data-source-line="3">Old paragraph</p><div class="preview-video"><video src="https://example.com/demo.mp4"></video></div></article>
        `;

        let sourceMarkdown = '# Old title\n\nOld paragraph\n';
        const onMarkdownChange = vi.fn((next) => { sourceMarkdown = next; });
        const onExit = vi.fn();
        const showToast = vi.fn();
        const controller = new LivePreviewEditController({
            output: '#output',
            toggle: '#toggle',
            markdownToggle: '#markdown-toggle',
            getSourceMarkdown: () => sourceMarkdown,
            onMarkdownChange,
            onExit,
            showToast,
            debounceMs: 20
        });
        controller.initialize();

        return {
            controller,
            output: document.querySelector('#output'),
            toggle: document.querySelector('#toggle'),
            markdownToggle: document.querySelector('#markdown-toggle'),
            onMarkdownChange,
            onExit,
            showToast
        };
    }

    it('toggles contenteditable state and protects media widgets', () => {
        const { controller, output, toggle, markdownToggle } = setupController();

        controller.toggleEditing(true);

        expect(output.getAttribute('contenteditable')).toBe('true');
        expect(output.classList.contains('preview-content--editable')).toBe(true);
        expect(toggle.getAttribute('aria-pressed')).toBe('true');
        expect(markdownToggle.getAttribute('aria-pressed')).toBe('false');
        expect(output.querySelector('.preview-video')?.getAttribute('contenteditable')).toBe('false');
    });

    it('syncs edited preview content back to Markdown', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        output.innerHTML = '<h1>New title</h1><p>Updated paragraph</p>';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).toHaveBeenCalledWith('# New title\n\nUpdated paragraph\n');
    });

    it('uses block-level sync when the edited block has a source line', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const paragraph = output.querySelector('p');
        paragraph.textContent = 'Updated paragraph only';
        const range = document.createRange();
        range.selectNodeContents(paragraph);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).toHaveBeenCalledWith('# Old title\n\nUpdated paragraph only\n');
    });

    it('syncs and exits cleanly when disabled', () => {
        const { controller, output, onMarkdownChange, onExit } = setupController();

        controller.toggleEditing(true);
        output.innerHTML = '<h2>Done</h2>';
        controller.toggleEditing(false);

        expect(onMarkdownChange).toHaveBeenLastCalledWith('## Done\n');
        expect(onExit).toHaveBeenCalledOnce();
        expect(output.getAttribute('contenteditable')).toBe('false');
    });
});
