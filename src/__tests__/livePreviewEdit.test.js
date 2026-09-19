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

    it('preserves markups-img refs instead of resolved data/blob URLs', () => {
        const root = document.createElement('article');
        root.innerHTML = `
            <p>
              <img
                alt="Diagram"
                src="data:image/png;base64,AAAA"
                data-original-src="markups-img:img_abc123"
              />
            </p>
        `;

        expect(serializePreviewToMarkdown(root)).toBe('![Diagram](markups-img:img_abc123)\n');
    });

    it('rebuilds a mermaid fence from the stashed source instead of dumping SVG', () => {
        const root = document.createElement('article');
        const diagram = document.createElement('div');
        diagram.className = 'mermaid';
        diagram.dataset.mermaidCode = 'graph TD;A-->B';
        diagram.innerHTML = '<svg><style>#mermaid-1{fill:red}</style><path d="M0 0"/></svg>';
        root.appendChild(diagram);

        const markdown = serializePreviewToMarkdown(root);
        expect(markdown).toBe('```mermaid\ngraph TD;A-->B\n```\n');
        expect(markdown).not.toContain('<svg');
        expect(markdown).not.toContain('mermaid-1');
    });

    it('preserves an ordered list start value and GFM task checkboxes', () => {
        const root = document.createElement('article');
        root.innerHTML = `
            <ol start="7"><li>seven</li><li>eight</li></ol>
            <ul>
              <li><input type="checkbox" checked disabled> done</li>
              <li><input type="checkbox" disabled> todo</li>
            </ul>
        `;

        const markdown = serializePreviewToMarkdown(root);
        expect(markdown).toContain('7. seven\n8. eight');
        expect(markdown).toContain('- [x] done');
        expect(markdown).toContain('- [ ] todo');
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
            <article id="output">
                <h1 data-source-line="1">Old title</h1>
                <p data-source-line="3">Old paragraph</p>
                <p data-source-line="5">Second paragraph</p>
                <div class="mermaid" data-source-line="7" data-mermaid-code="graph TD;A-->B"></div>
                <div class="preview-video" data-source-line="11"><video src="https://example.com/demo.mp4"></video></div>
            </article>
        `;

        let sourceMarkdown = [
            '# Old title',
            '',
            'Old paragraph',
            '',
            'Second paragraph',
            '',
            '```mermaid',
            'graph TD;A-->B',
            '```',
            '',
            'https://example.com/demo.mp4',
            ''
        ].join('\n');

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
        expect(output.querySelector('.mermaid')?.getAttribute('contenteditable')).toBe('false');
    });

    it('syncs only the edited block back to Markdown', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const paragraph = output.querySelectorAll('p')[0];
        paragraph.textContent = 'Updated paragraph only';
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        expect(onMarkdownChange.mock.calls[0][0]).toContain('Updated paragraph only');
        expect(onMarkdownChange.mock.calls[0][0]).toContain('Second paragraph');
        expect(onMarkdownChange.mock.calls[0][0]).toContain('```mermaid');
    });

    it('skips the sync when serialization is unchanged (no-op guard prevents doubling)', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const paragraph = output.querySelectorAll('p')[0];
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).not.toHaveBeenCalled();
    });

    it('never falls back to a whole-document serialize when no block anchor exists', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        // Replace the annotated DOM with an anchorless copy (simulates an edit
        // in a region with no source mapping).
        output.innerHTML = '<h1>Unanchored</h1><p>Also unanchored</p>';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).not.toHaveBeenCalled();
    });

    it('ignores edits inside protected (atomic) blocks', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const mermaid = output.querySelector('.mermaid');
        mermaid.textContent = 'tampered';
        output.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).not.toHaveBeenCalled();
    });

    it('shifts following source lines after a multi-line edit', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const paragraph = output.querySelectorAll('p')[0];
        paragraph.innerHTML = 'a<br>b';
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).toHaveBeenCalled();
        // Second paragraph was on line 5; the first grew by one line.
        expect(output.querySelectorAll('p')[1].getAttribute('data-source-line')).toBe('6');
    });

    it('runs a second edit correctly after the first (no stale line doubling)', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        const [first, second] = output.querySelectorAll('p');

        first.textContent = 'First edit';
        first.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        second.textContent = 'Second edit';
        second.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        const finalMarkdown = onMarkdownChange.mock.calls.at(-1)[0];
        expect(finalMarkdown).toContain('First edit');
        expect(finalMarkdown).toContain('Second edit');
        expect(finalMarkdown.match(/First edit/g)).toHaveLength(1);
        expect(finalMarkdown.match(/Second edit/g)).toHaveLength(1);
    });

    it('syncs and exits cleanly when disabled', () => {
        const { controller, output, onMarkdownChange, onExit } = setupController();

        controller.toggleEditing(true);
        const paragraph = output.querySelectorAll('p')[0];
        paragraph.textContent = 'Done';
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        controller.toggleEditing(false);

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        expect(onMarkdownChange.mock.calls[0][0]).toContain('Done');
        expect(onExit).toHaveBeenCalledOnce();
        expect(output.getAttribute('contenteditable')).toBe('false');
    });

    it('does not rewrite Markdown when Document Mode is toggled without edits', () => {
        const { controller, onMarkdownChange, onExit } = setupController();

        controller.toggleEditing(true);
        controller.toggleEditing(false);

        expect(onMarkdownChange).not.toHaveBeenCalled();
        expect(onExit).toHaveBeenCalledOnce();
    });

    it('protects images from contenteditable mutation and keeps markups-img refs', () => {
        const { controller, output } = setupController();
        output.innerHTML = `
            <p data-source-line="1">
              <img alt="Shot" src="data:image/png;base64,AAAA" data-original-src="markups-img:img_keep123" />
            </p>
        `;

        controller.toggleEditing(true);
        expect(output.querySelector('img')?.getAttribute('contenteditable')).toBe('false');
        expect(serializePreviewToMarkdown(output)).toContain('markups-img:img_keep123');
        expect(serializePreviewToMarkdown(output)).not.toContain('data:image/png');
    });

    it('never re-serializes an image-bearing block (layout state stays intact)', () => {
        const { controller, output, onMarkdownChange } = setupController();
        output.innerHTML = `
            <p data-source-line="1">
              <img alt="Shot" src="https://example.com/a.png" data-image-width="50%" />
            </p>
        `;

        controller.toggleEditing(true);
        const paragraph = output.querySelector('p');
        paragraph.appendChild(document.createTextNode(' edited'));
        paragraph.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);

        expect(onMarkdownChange).not.toHaveBeenCalled();
    });

    it('flushes pending debounced edits on syncFromPreview', () => {
        const { controller, output, onMarkdownChange } = setupController();

        controller.toggleEditing(true);
        output.querySelectorAll('p')[0].textContent = 'Pending title';
        output.dispatchEvent(new Event('input', { bubbles: true }));

        // Before debounce fires, force flush via public sync API
        controller.syncFromPreview();

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        expect(onMarkdownChange.mock.calls[0][0]).toContain('Pending title');
    });
});

describe('Document Mode block shapes', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    function setup(domHtml, sourceMarkdown) {
        document.body.innerHTML = `
            <button id="markdown-toggle" type="button">Markdown</button>
            <button id="toggle" type="button">Document</button>
            <article id="output">${domHtml}</article>
        `;
        let source = sourceMarkdown;
        const onMarkdownChange = vi.fn((next) => { source = next; });
        const controller = new LivePreviewEditController({
            output: '#output',
            toggle: '#toggle',
            markdownToggle: '#markdown-toggle',
            getSourceMarkdown: () => source,
            onMarkdownChange,
            debounceMs: 20
        });
        controller.initialize();
        return { controller, output: document.querySelector('#output'), onMarkdownChange };
    }

    function fire(controller, output) {
        output.dispatchEvent(new Event('input', { bubbles: true }));
        vi.advanceTimersByTime(25);
    }

    it('syncs a heading edit without touching following blocks', () => {
        const { controller, output, onMarkdownChange } = setup(
            '<h1 data-source-line="1">Old title</h1><p data-source-line="3">Body</p>',
            '# Old title\n\nBody\n'
        );

        controller.toggleEditing(true);
        output.querySelector('h1').textContent = 'New title';
        fire(controller, output);

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        expect(onMarkdownChange.mock.calls[0][0]).toBe('# New title\n\nBody\n');
    });

    it('syncs a list edit and keeps every other list item', () => {
        const { controller, output, onMarkdownChange } = setup(
            '<ul data-source-line="1"><li>alpha</li><li>beta</li></ul>',
            '- alpha\n- beta\n'
        );

        controller.toggleEditing(true);
        const ul = output.querySelector('ul');
        const li = document.createElement('li');
        li.textContent = 'gamma';
        ul.appendChild(li);
        fire(controller, output);

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        const next = onMarkdownChange.mock.calls[0][0];
        expect(next).toContain('- alpha');
        expect(next).toContain('- beta');
        expect(next).toContain('- gamma');
        expect(next.match(/- alpha/g)).toHaveLength(1);
    });

    it('edits a blockquote through its nested paragraph exactly once', () => {
        const { controller, output, onMarkdownChange } = setup(
            '<blockquote data-source-line="1"><p>Quoted line</p></blockquote>',
            '> Quoted line\n'
        );

        controller.toggleEditing(true);
        output.querySelector('blockquote p').textContent = 'Quoted line edited';
        fire(controller, output);

        expect(onMarkdownChange).toHaveBeenCalledTimes(1);
        expect(onMarkdownChange.mock.calls[0][0]).toBe('> Quoted line edited\n');
    });

    it('never rewrites a block that has no snapshot baseline', () => {
        const { controller, output, onMarkdownChange } = setup(
            '<p data-source-line="1">Original</p>',
            'Original\n'
        );

        controller.toggleEditing(true);
        // A node that appears after the snapshot was taken has no baseline.
        const injected = document.createElement('p');
        injected.setAttribute('data-source-line', '1');
        injected.textContent = 'Injected';
        output.appendChild(injected);
        fire(controller, output);

        expect(onMarkdownChange).not.toHaveBeenCalled();
    });

    it('keeps significant blank lines inside fenced code untouched', () => {
        const source = 'Paragraph\n\n```js\nconst a = 1;\n\n\nconst b = 2;\n```\n';

        const next = replaceMarkdownBlockAtLine(source, 1, 'New paragraph\n');

        expect(next).toBe('New paragraph\n\n```js\nconst a = 1;\n\n\nconst b = 2;\n```\n');
    });

    it('preserves a trailing newline-less document when splicing', () => {
        const next = replaceMarkdownBlockAtLine('Old\n\nTail', 1, 'New\n');

        expect(next).toBe('New\n\nTail');
    });
});
