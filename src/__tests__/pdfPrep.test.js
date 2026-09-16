import { describe, expect, it } from 'vitest';
import {
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
            <h1>Title</h1>
            <pre><button class="code-copy-btn">Copy</button><code>x = 1</code></pre>
            <button class="preview-video-edit-btn">Edit</button>
            <div contenteditable="true"><p>Hello</p></div>
            <img class="preview-image preview-image--selected" alt="a" />
        `;
        stripExportChrome(root);
        expect(root.querySelector('.code-copy-btn')).toBeNull();
        expect(root.querySelector('.preview-video-edit-btn')).toBeNull();
        expect(root.querySelector('[contenteditable]')).toBeNull();
        expect(root.querySelector('h1')?.textContent).toBe('Title');
        expect(root.querySelector('code')?.textContent).toBe('x = 1');
        expect(root.querySelector('img')?.classList.contains('preview-image--selected')).toBe(false);
    });
});
