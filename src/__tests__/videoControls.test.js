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
            'https://example.com/demo.mp4 {video width=50% align=right date=2026-07-29}',
            '[clip](https://example.com/clip.webm) {width=75% align=left}'
        ].join('\n'));

        expect(attrs.get('https://example.com/demo.mp4')).toEqual({ width: '50%', align: 'right', date: '2026-07-29' });
        expect(attrs.get('https://example.com/clip.webm')).toEqual({ width: '75%', align: 'left' });
    });

    it('parses and persists quoted video captions', () => {
        const attrs = parseVideoAttributesFromMarkdown(
            'https://example.com/demo.mp4 {video caption="Opening scene" date=2026-07-29}'
        );
        expect(attrs.get('https://example.com/demo.mp4')).toMatchObject({
            caption: 'Opening scene',
            date: '2026-07-29'
        });

        expect(updateVideoAttributesInMarkdown(
            'https://example.com/demo.mp4\n',
            'https://example.com/demo.mp4',
            { caption: 'Opening scene' }
        )).toBe('https://example.com/demo.mp4 {video caption="Opening scene"}\n');
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
        document.querySelector('[data-video-action="flip-h"]').click();

        expect(onMarkdownChange).toHaveBeenLastCalledWith('https://example.com/demo.mp4 {video width=50% flip=h}\n');
        controller.dispose();
    });

    it('persists video date from the toolbar date input', () => {
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
        const dateInput = document.querySelector('.video-controls-date');
        dateInput.value = '2026-07-29';
        dateInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

        expect(onMarkdownChange).toHaveBeenLastCalledWith('https://example.com/demo.mp4 {video date=2026-07-29}\n');
        controller.dispose();
    });

    it('unlocks hosted embeds for playback from the toolbar Play action', () => {
        document.body.innerHTML = `
            <article id="output">
                <div class="preview-video preview-video--embed" data-video-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                    <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>
                </div>
            </article>
        `;
        const controller = new VideoControlsController({
            output: '#output',
            getMarkdown: () => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ\n',
            onMarkdownChange: vi.fn()
        });

        controller.initialize();
        const video = document.querySelector('.preview-video');
        expect(video.querySelector('.preview-video-hitbox')).toBeTruthy();

        video.querySelector('.preview-video-hitbox').click();
        expect(document.querySelector('.video-controls-popover')?.classList.contains('hidden')).toBe(false);

        document.querySelector('[data-video-action="play"]').click();
        expect(video.classList.contains('preview-video--playing')).toBe(true);
        expect(video.querySelector('.preview-video-hitbox')?.hidden).toBe(true);
        expect(video.querySelector('.preview-video-edit-btn')?.hidden).toBe(false);

        controller.dispose();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });
});
