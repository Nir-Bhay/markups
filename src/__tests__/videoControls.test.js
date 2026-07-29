import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    applyVideoPresentation,
    parseVideoAttributesFromMarkdown,
    updateVideoAttributesInMarkdown,
    VideoControlsController
} from '../features/video-controls/index.js';

describe('video preview controls', () => {
    it('parses video layout attributes from bare and markdown links', () => {
        const attrs = parseVideoAttributesFromMarkdown([
            'https://example.com/demo.mp4 {video width=50% align=right}',
            '[clip](https://example.com/clip.webm) {width=75% align=left}'
        ].join('\n'));

        expect(attrs.get('https://example.com/demo.mp4')).toEqual({ width: '50%', align: 'right' });
        expect(attrs.get('https://example.com/clip.webm')).toEqual({ width: '75%', align: 'left' });
    });

    it('updates existing or missing Markdown video attributes', () => {
        expect(updateVideoAttributesInMarkdown(
            'https://example.com/demo.mp4\n',
            'https://example.com/demo.mp4',
            { width: '50%', align: 'right' }
        )).toBe('https://example.com/demo.mp4 {video width=50% align=right}\n');

        expect(updateVideoAttributesInMarkdown(
            '[demo](https://example.com/demo.mp4) {video width=25% align=left}',
            'https://example.com/demo.mp4',
            { width: '100%', align: 'center' }
        )).toBe('[demo](https://example.com/demo.mp4)');
    });

    it('applies width and alignment presentation to preview videos', () => {
        const el = document.createElement('div');
        el.className = 'preview-video';

        applyVideoPresentation(el, { width: '50%', align: 'right' });

        expect(el.dataset.videoWidth).toBe('50%');
        expect(el.dataset.videoAlign).toBe('right');
        expect(el.style.width).toBe('50%');
        expect(el.classList.contains('preview-video--align-right')).toBe(true);
    });

    it('persists toolbar changes back into Markdown', () => {
        document.body.innerHTML = '<article id="output"><div class="preview-video" data-video-url="https://example.com/demo.mp4"><video src="https://example.com/demo.mp4"></video></div></article>';
        let markdown = 'https://example.com/demo.mp4\n';
        const onMarkdownChange = vi.fn((next) => { markdown = next; });
        const controller = new VideoControlsController({
            output: '#output',
            getMarkdown: () => markdown,
            onMarkdownChange
        });

        controller.initialize();
        document.querySelector('.preview-video').click();
        document.querySelector('[data-video-width="50%"]').click();
        document.querySelector('[data-video-align="right"]').click();

        expect(onMarkdownChange).toHaveBeenLastCalledWith('https://example.com/demo.mp4 {video width=50% align=right}\n');
        controller.dispose();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });
});
