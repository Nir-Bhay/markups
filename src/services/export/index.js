/**
 * Export Services Index
 * Re-exports all export services
 * @module services/export
 */

export { pdfExporter, PDFExporter } from './pdf.js';
export { htmlExporter, HTMLExporter } from './html.js';
export { markdownExporter, MarkdownExporter } from './markdown.js';
export { docxExporter, DOCXExporter } from './docx.js';
export { txtExporter, TxtExporter, markdownToPlainText } from './txt.js';
export {
    convertMermaidSvgsToImages,
    createExportWorkbench,
    destroyExportWorkbench,
    pickExportTimeoutMs,
    pickHtml2CanvasScale,
    raceExportJob,
    renderWorkbenchToPdf,
    stripExportChrome
} from './pdfPrep.js';

/**
 * Export manager - unified interface
 */
export const exportManager = {
    /**
     * Export to PDF
     * @param {string} markdown - Markdown content
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     */
    async toPDF(markdown, filename = 'document.pdf', options = {}) {
        const { pdfExporter } = await import('./pdf.js');
        return pdfExporter.exportAndDownload(markdown, filename, options);
    },

    /**
     * Export to HTML
     * @param {string} markdown - Markdown content
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     */
    async toHTML(markdown, filename = 'document.html', options = {}) {
        const { htmlExporter } = await import('./html.js');
        return htmlExporter.exportAndDownload(markdown, filename, options);
    },

    /**
     * Export to Markdown
     * @param {string} markdown - Markdown content
     * @param {string} filename - Output filename
     * @param {Object} options - Export options
     */
    async toMarkdown(markdown, filename = 'document.md', options = {}) {
        const { markdownExporter } = await import('./markdown.js');
        return markdownExporter.exportAndDownload(markdown, filename, options);
    },

    /**
     * Export to DOCX (Word-compatible HTML, reuses DOCXExporter).
     * @param {string} markdown - Markdown content
     * @param {string} filename - Output filename
     */
    async toDocx(markdown, filename = 'document.doc') {
        const { docxExporter } = await import('./docx.js');
        return docxExporter.export(markdown, filename);
    },

    /**
     * Export to plain text (reuses the canonical markdownToPlainText
     * converter — same output as the legacy quick/modal/preview paths).
     * @param {string} markdown - Markdown content
     * @param {string} filename - Output filename
     * @param {Object} options - Converter options (wordWrap, includeFrontmatter, title, dateStr)
     */
    async toTxt(markdown, filename = 'document.txt', options = {}) {
        const { markdownToPlainText } = await import('./txt.js');
        const { downloadFile } = await import('../../utils/file.js');
        const plainText = markdownToPlainText(markdown, options);
        const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
        downloadFile(blob, filename);
        return plainText;
    },

    /**
     * Print via a print-window (ported from the proven legacy path: sanitized
     * preview HTML plus `@media print`, `print()` then close).
     * @param {string} markdown - Markdown content
     * @param {string} [title='document'] - Window title
     */
    async print(markdown, title = 'document') {
        const { htmlExporter } = await import('./html.js');
        const content = htmlExporter.getContent(markdown);
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return false;
        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${title.replace(/[<>&"]/g, '')}</title>
<style>body { padding: 20px; } .markdown-body { max-width: 800px; margin: 0 auto; }
@media print { body { padding: 0; } .markdown-body { max-width: none; } }</style>
</head>
<body class="markdown-body">${content}</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        return true;
    },

    /**
     * Copy HTML to clipboard
     * @param {string} markdown - Markdown content
     */
    async copyAsHTML(markdown) {
        const { htmlExporter } = await import('./html.js');
        const html = htmlExporter.getContent(markdown);

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([html], { type: 'text/plain' })
                })
            ]);
            return true;
        } catch (err) {
            console.error('Failed to copy HTML:', err);
            return false;
        }
    }
};

export default exportManager;
