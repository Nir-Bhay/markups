import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    captureSubtreeCanvas,
    createExportWorkbench,
    destroyExportWorkbench,
    ignoreElementsOutsideSubtree,
    isHtml2CanvasCloneError,
    pickExportTimeoutMs,
    pickHtml2CanvasScale,
    renderWorkbenchToPdf,
    stripExportChrome
} from '../services/export/pdfPrep.js';

describe('pdfPrep helpers', () => {
    it('preserves Mermaid SVG IDs and marker references while removing HTML IDs', () => {
        const root = document.createElement('div');
        root.innerHTML = '<h1 id="heading">Title</h1><svg id="diagram"><defs><marker id="arrow" /></defs><path marker-end="url(#arrow)" /></svg>';
        stripExportChrome(root);
        expect(root.querySelector('h1').id).toBe('');
        expect(root.querySelector('svg').id).toBe('diagram');
        expect(root.querySelector('marker').id).toBe('arrow');
        expect(root.querySelector('path').getAttribute('marker-end')).toBe('url(#arrow)');
    });
    it('does not drop unannotated table structure or styles from later PDF pages', async () => {
        const workbench = document.createElement('div');
        workbench.innerHTML = '<table><tbody><tr><td>Last page data</td></tr></tbody></table>';
        document.body.appendChild(workbench);
        Object.defineProperties(workbench, { scrollWidth: { value: 720 }, scrollHeight: { value: 1200 } });
        const captures = [];
        const html2canvas = vi.fn(async (_root, options) => {
            captures.push(options);
            return { toDataURL: () => 'data:image/jpeg;base64,AA==' };
        });
        class FakePDF {
            constructor() { this.internal = { pageSize: { getWidth: () => 8.5, getHeight: () => 11 } }; }
            addImage() {}
            addPage() {}
        }
        await renderWorkbenchToPdf(workbench, { html2canvas, JsPDF: FakePDF, pageNumbers: false });
        expect(captures).toHaveLength(2);
        expect(captures[1].ignoreElements(workbench)).toBe(false);
        expect(captures[1].ignoreElements(workbench.querySelector('tbody'))).toBe(false);
        expect(captures[1].ignoreElements(document.head)).toBe(false);
        workbench.remove();
    });
    it('keeps measured boundary margins when a capture engine inserts pseudo nodes', () => {
        const style = document.createElement('style');
        style.textContent = '.pdf-fixture h1 { margin-top: 24px; } .pdf-fixture > :first-child { margin-top: 0; }';
        document.head.appendChild(style);
        const source = document.createElement('article');
        source.className = 'pdf-fixture';
        source.innerHTML = '<h1>First heading</h1><p>Last paragraph</p>';
        const workbench = createExportWorkbench(source);
        const heading = workbench.querySelector('h1');
        workbench.querySelector('article').prepend(document.createElement('html2canvaspseudoelement'));
        expect(getComputedStyle(heading).marginTop).toBe('0px');
        destroyExportWorkbench(workbench);
        style.remove();
    });
    it('picks lower html2canvas scale for taller documents', () => {
        expect(pickHtml2CanvasScale(5000)).toBe(1.75);
        expect(pickHtml2CanvasScale(20000)).toBe(1.5);
        expect(pickHtml2CanvasScale(30000)).toBe(1.25);
        expect(pickHtml2CanvasScale(50000)).toBe(1.15);
        expect(pickHtml2CanvasScale(5000, { diagramCount: 12 })).toBe(1.15);
    });

    it('extends timeout for very tall documents', () => {
        expect(pickExportTimeoutMs(5000)).toBe(90_000);
        expect(pickExportTimeoutMs(25000)).toBe(120_000);
        expect(pickExportTimeoutMs(45000)).toBe(180_000);
    });

    it('strips interactive export chrome without removing content', () => {
        const root = document.createElement('div');
        root.innerHTML = `
            <h1 id="title">Title</h1>
            <pre><button class="code-copy-btn">Copy</button><code>x = 1</code></pre>
            <button class="preview-video-edit-btn">Edit</button>
            <div contenteditable="true"><p>Hello</p></div>
            <img class="preview-image preview-image--selected" alt="a" />
            <iframe src="https://www.youtube.com/embed/x"></iframe>
        `;
        stripExportChrome(root);
        expect(root.querySelector('.code-copy-btn')).toBeNull();
        expect(root.querySelector('.preview-video-edit-btn')).toBeNull();
        expect(root.querySelector('[contenteditable]')).toBeNull();
        expect(root.querySelector('iframe')).toBeNull();
        expect(root.querySelector('#title')).toBeNull();
        expect(root.querySelector('h1')?.textContent).toBe('Title');
        expect(root.querySelector('code')?.textContent).toBe('x = 1');
        expect(root.querySelector('img')?.classList.contains('preview-image--selected')).toBe(false);
        expect(root.querySelector('[data-export-media-placeholder]')?.textContent).toBe('[Embedded media]');
    });

    it('keeps the export workbench in the viewport instead of far off-screen', () => {
        const source = document.createElement('div');
        source.innerHTML = '<p>Hello</p>';
        const workbench = createExportWorkbench(source, { widthCss: '7.5in' });
        try {
            expect(workbench.style.left).not.toContain('-12000');
            expect(workbench.closest('[data-export-host]')).toBeTruthy();
            expect(document.body.contains(workbench)).toBe(true);
        } finally {
            destroyExportWorkbench(workbench);
        }
    });

    it('ignores app chrome outside the export subtree', () => {
        const root = document.createElement('div');
        const outsider = document.createElement('div');
        expect(ignoreElementsOutsideSubtree(outsider, root)).toBe(true);
        expect(ignoreElementsOutsideSubtree(root, root)).toBe(false);
        const html = document.createElement('html');
        expect(ignoreElementsOutsideSubtree(html, root)).toBe(false);
        const host = document.createElement('div');
        host.appendChild(root);
        expect(ignoreElementsOutsideSubtree(host, root)).toBe(false);
    });

    it('retries html2canvas when the clone iframe cannot find the element', async () => {
        const root = document.createElement('div');
        const canvas = document.createElement('canvas');
        const html2canvas = vi.fn()
            .mockRejectedValueOnce(new Error('Unable to find element in cloned iframe'))
            .mockResolvedValueOnce(canvas);
        const out = await captureSubtreeCanvas(html2canvas, root, { scale: 1, width: 100, height: 100 });
        expect(out).toBe(canvas);
        expect(html2canvas).toHaveBeenCalledTimes(2);
        expect(isHtml2CanvasCloneError(new Error('Unable to find element in cloned iframe'))).toBe(true);
    });

    it('allows html2canvas clone iframes in CSP', () => {
        const html = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8');
        const vercel = readFileSync(resolve(import.meta.dirname, '../../vercel.json'), 'utf8');
        // about:blank is not a valid CSP source token. Same-origin clone
        // frames inherit their creator's origin; real PDF download is also
        // covered by the compiled browser suite.
        expect(html).toMatch(/frame-src 'self' blob:/);
        expect(vercel).toMatch(/frame-src 'self' blob:/);
        expect(html).not.toMatch(/(?:frame-src|child-src)[^;]*about:blank/);
        expect(vercel).not.toMatch(/(?:frame-src|child-src)[^;]*about:blank/);
    });
});
