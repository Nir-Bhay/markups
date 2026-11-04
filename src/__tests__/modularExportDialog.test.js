import { afterEach, describe, expect, it, vi } from 'vitest';
const { toDocx, copy } = vi.hoisted(() => ({ toDocx: vi.fn(), copy: vi.fn() }));
vi.mock('../services/export/index.js', () => ({ exportManager: { toDocx } }));
vi.mock('../utils/clipboard.js', () => ({ copyToClipboard: copy }));
vi.mock('../core/markdown/index.js', () => ({ markdownService: { parse: () => '<p>Preview</p>' } }));
vi.mock('../ui/toast/index.js', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { initializeExportDialog } from '../features/export-dialog/index.js';
import { enhancePreviewCode } from '../features/preview-code/index.js';

describe('modular export and code controls', () => {
    let instance;
    afterEach(() => { instance?.dispose(); document.body.innerHTML = ''; vi.clearAllMocks(); });
    it('exports the latest portable document as .doc and restores its trigger focus', async () => {
        document.body.innerHTML = `<button id="export-btn">Export</button><div id="export-modal-overlay"></div><div id="export-modal"><button data-format="docx">Word (.doc)</button><div id="export-page-content"></div><button id="export-confirm-btn">Confirm</button></div>`;
        const portable = vi.fn(async text => `${text} portable`);
        instance = initializeExportDialog({ getMarkdown: () => 'newest', getPortableMarkdown: portable, getFilename: extension => `note.${extension}` });
        document.querySelector('#export-btn').focus();
        document.querySelector('#export-btn').click();
        expect(document.querySelector('#export-modal').classList.contains('active')).toBe(true);
        document.querySelector('[data-format="docx"]').click();
        document.querySelector('#export-confirm-btn').click();
        await vi.waitFor(() => expect(toDocx).toHaveBeenCalledWith('newest portable', 'note.doc'));
        await vi.waitFor(() => expect(document.activeElement.id).toBe('export-btn'));
    });
    it('keeps the dialog and document intact if an image cannot be made portable', async () => {
        document.body.innerHTML = `<button id="export-btn">Export</button><div id="export-modal"><button data-format="docx">Word</button><button id="export-confirm-btn">Confirm</button></div>`;
        instance = initializeExportDialog({ getMarkdown: () => 'original', getPortableMarkdown: async () => { throw new Error('Missing local image'); }, getFilename: () => 'note.doc' });
        document.querySelector('#export-btn').click();
        document.querySelector('[data-format="docx"]').click();
        document.querySelector('#export-confirm-btn').click();
        await vi.waitFor(() => expect(document.querySelector('#export-confirm-btn').disabled).toBe(false));
        expect(toDocx).not.toHaveBeenCalled();
        expect(document.querySelector('#export-modal').classList.contains('active')).toBe(true);
    });
    it('copies only fence source and does not duplicate controls on refresh', async () => {
        document.body.innerHTML = '<article><pre><code class="language-js">const x = 1;</code></pre></article>';
        const article = document.querySelector('article');
        copy.mockResolvedValue(true);
        enhancePreviewCode(article);
        enhancePreviewCode(article);
        expect(article.querySelectorAll('button')).toHaveLength(1);
        article.querySelector('button').click();
        await vi.waitFor(() => expect(copy).toHaveBeenCalledWith('const x = 1;'));
        expect(article.querySelector('code').textContent).toBe('const x = 1;');
    });
});
