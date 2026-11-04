import { createFocusTrap } from '../../utils/dom.js';
import { exportManager } from '../../services/export/index.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import { markdownService } from '../../core/markdown/index.js';
import { toast } from '../../ui/toast/index.js';

/** Bind the existing export dialog to the modular entry's current document. */
export function initializeExportDialog({ getMarkdown, getPortableMarkdown = async value => value, getFilename, getPreview, onReset }) {
    const dialog = document.getElementById('export-modal');
    if (!dialog) return { dispose() {} };
    const controller = new AbortController();
    const { signal } = controller;
    const overlay = document.getElementById('export-modal-overlay');
    const confirm = document.getElementById('export-confirm-btn');
    const buttons = [...dialog.querySelectorAll('[data-format]')];
    let format = 'pdf';
    let busy = false;
    let trap;
    let previousFocus;
    const bind = (element, action) => element?.addEventListener('click', action, { signal });
    const close = () => {
        if (busy) return;
        dialog.classList.remove('active');
        overlay?.classList.remove('active');
        trap?.deactivate();
        previousFocus?.focus?.({ preventScroll: true });
    };
    const selectFormat = (next) => {
        format = next;
        buttons.forEach(button => button.classList.toggle('active', button.dataset.format === format));
        dialog.querySelectorAll('.export-options').forEach(panel => panel.classList.toggle('hidden', panel.id !== `${format}-options`));
        const label = document.getElementById('export-btn-text');
        if (label) label.textContent = `Export ${format === 'docx' ? 'Word (.doc)' : format.toUpperCase()}`;
    };
    const open = () => {
        previousFocus = document.activeElement;
        dialog.classList.add('active');
        overlay?.classList.add('active');
        selectFormat(format);
        const preview = document.getElementById('export-page-content');
        if (preview) preview.innerHTML = markdownService.parse(getMarkdown());
        trap = createFocusTrap(dialog);
        trap.activate();
    };
    bind(document.getElementById('export-btn'), open);
    ['export-modal-close', 'export-cancel-btn'].forEach(id => bind(document.getElementById(id), close));
    bind(overlay, close);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && dialog.classList.contains('active')) close();
    }, { signal });
    buttons.forEach(button => bind(button, async () => {
        if (busy) return;
        const next = button.dataset.format;
        if (next === 'copy-md' || next === 'copy-html') {
            try {
                const markdown = await getPortableMarkdown(getMarkdown());
                const ok = next === 'copy-md' ? await copyToClipboard(markdown) : await exportManager.copyAsHTML(markdown);
                if (ok) toast.success('Copied to clipboard');
                else toast.error('Could not copy. Download a file instead.');
            } catch (error) {
                toast.error(error?.message || 'Could not prepare this document for copying.');
            }
        } else if (next === 'reset') {
            close();
            onReset?.();
        } else selectFormat(next);
    }));
    bind(confirm, async () => {
        if (busy) return;
        busy = true;
        confirm.disabled = true;
        dialog.setAttribute('aria-busy', 'true');
        const label = document.getElementById('export-btn-text');
        if (label) label.textContent = 'Exporting…';
        try {
            const markdown = await getPortableMarkdown(getMarkdown());
            const filename = extension => getFilename(extension);
            if (format === 'pdf') await exportManager.toPDF(markdown, filename('pdf'), {
                jsPDF: { unit: 'mm', format: document.getElementById('export-paper-size')?.value || 'a4', orientation: document.getElementById('export-orientation')?.value || 'portrait' }
            });
            else if (format === 'docx') await exportManager.toDocx(markdown, filename('doc'));
            else if (format === 'markdown') await exportManager.toMarkdown(markdown, filename('md'));
            else if (format === 'html') await exportManager.toHTML(markdown, filename('html'));
            else if (format === 'txt') await exportManager.toTxt(markdown, filename('txt'), {
                wordWrap: Boolean(document.getElementById('export-word-wrap')?.checked),
                includeFrontmatter: Boolean(document.getElementById('export-frontmatter')?.checked)
            });
            else if (format === 'print') {
                if (!await exportManager.print(markdown, filename(''))) throw new Error('Allow the print window in your browser.');
            } else if (format === 'png') {
                const { default: html2canvas } = await import('html2canvas');
                const { downloadBlob } = await import('../../utils/file.js');
                const canvas = await html2canvas(getPreview(), { useCORS: true, scale: 1 });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) throw new Error('Could not generate an image.');
                downloadBlob(blob, filename('png'));
            }
            busy = false;
            close();
        } catch (error) {
            toast.error(error?.message || 'Export failed. Your document has not changed.');
        } finally {
            busy = false;
            confirm.disabled = false;
            dialog.removeAttribute('aria-busy');
            selectFormat(format);
        }
    });
    return { open, dispose() { trap?.deactivate(); controller.abort(); } };
}
