import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    applyImagePresentation,
    parseImageAttributesFromMarkdown,
    updateImageAttributesInMarkdown
} from '../features/image-controls/index.js';

describe('image preview controls', () => {
    it('parses image layout attributes from markdown image links', () => {
        const attrs = parseImageAttributesFromMarkdown([
            '![alt](https://example.com/photo.png) {image width=75% align=left}'
        ].join('\n'));

        expect(attrs.get('https://example.com/photo.png')).toEqual({ width: '75%', align: 'left', alt: 'alt' });
    });

    it('updates existing or missing Markdown image attributes', () => {
        expect(updateImageAttributesInMarkdown(
            '![alt](https://example.com/photo.png)\n',
            'https://example.com/photo.png',
            { width: '50%', align: 'right' }
        )).toBe('![alt](https://example.com/photo.png) {image width=50% align=right}\n');

        expect(updateImageAttributesInMarkdown(
            '![alt](https://example.com/photo.png) {image width=25% align=left}',
            'https://example.com/photo.png',
            { width: '100%', align: 'center' }
        )).toBe('![alt](https://example.com/photo.png)');
    });

    it('applies width and alignment presentation to preview images', () => {
        const el = document.createElement('img');
        el.className = 'preview-image';
        el.src = 'https://example.com/photo.png';

        applyImagePresentation(el, { width: '50%', align: 'right' });

        expect(el.dataset.imageWidth).toBe('50%');
        expect(el.dataset.imageAlign).toBe('right');
        expect(el.style.width).toBe('50%');
        expect(el.classList.contains('preview-image--align-right')).toBe(true);
    });

    it('updates markdown attributes via the shared helper (layout UI is image-resize)', () => {
        expect(updateImageAttributesInMarkdown(
            '![alt](https://example.com/photo.png)\n',
            'https://example.com/photo.png',
            { width: '50%', align: 'right' }
        )).toBe('![alt](https://example.com/photo.png) {image width=50% align=right}\n');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });
});
