import { describe, it, expect } from 'vitest';
import {
    ImageControlsController,
    parseImageAttributesFromMarkdown
} from '../features/image-controls/index.js';

describe('image controls preview preparation', () => {
    it('marks real preview images so the toolbar can attach', () => {
        document.body.innerHTML = `
            <article id="output">
                <p><img src="https://example.com/photo.png" alt="photo"></p>
            </article>
        `;

        const controller = new ImageControlsController({
            output: '#output',
            getMarkdown: () => '![photo](https://example.com/photo.png)',
            onMarkdownChange: () => {}
        });
        controller.initialize();

        const img = document.querySelector('img');
        expect(img.classList.contains('preview-image')).toBe(true);
        expect(img.dataset.imageUrl).toBe('https://example.com/photo.png');
        // Layout popover removed — editing uses image-resize ir-toolbar only.
        expect(document.querySelector('.image-controls-popover')).toBeNull();
        controller.dispose();
    });

    it('parses image layout attributes from markdown', () => {
        const attrs = parseImageAttributesFromMarkdown(
            '![photo](https://example.com/photo.png) {image width=50% align=right}'
        );
        expect(attrs.get('https://example.com/photo.png')).toMatchObject({
            width: '50%',
            align: 'right',
            alt: 'photo'
        });
    });
});
