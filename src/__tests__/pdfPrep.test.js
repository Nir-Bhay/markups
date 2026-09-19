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
    stripExportChrome
} from '../services/export/pdfPrep.js';

describe('pdfPrep helpers', () => {
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
        expect(html).toMatch(/frame-src[^"]*about:blank/);
        expect(vercel).toMatch(/frame-src[^"]*about:blank/);
    });
});
