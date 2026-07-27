import { describe, it, expect } from 'vitest';
import {
    normalizeVideoUrl,
    isDirectVideoUrl,
    isGitHubVideoAttachment,
    parseHostedVideo,
    processPreviewVideos,
    stripVideoAttributeBlocks
} from '../utils/video-embed.js';

describe('video embed helpers', () => {
    it('normalizes URLs copied from prose with trailing punctuation', () => {
        expect(normalizeVideoUrl(' https://github.com/user-attachments/assets/abc123, '))
            .toBe('https://github.com/user-attachments/assets/abc123');
        expect(normalizeVideoUrl('<https://example.com/demo.mp4>.'))
            .toBe('https://example.com/demo.mp4');
    });

    it('detects direct, GitHub attachment, YouTube, and Vimeo URLs', () => {
        expect(isDirectVideoUrl('https://example.com/demo.mp4')).toBe(true);
        expect(isGitHubVideoAttachment('https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062,')).toBe(true);
        expect(parseHostedVideo('https://youtu.be/dQw4w9WgXcQ')).toEqual({ type: 'youtube', id: 'dQw4w9WgXcQ' });
        expect(parseHostedVideo('https://vimeo.com/123456')).toEqual({ type: 'vimeo', id: '123456' });
    });

    it('strips video layout attributes before Markdown parsing', () => {
        const markdown = [
            'https://example.com/demo.mp4 {video width=50% align=right}',
            '[clip](https://example.com/clip.webm) {width=75% align=left}',
            'regular text {width=50%}'
        ].join('\n');

        expect(stripVideoAttributeBlocks(markdown)).toBe([
            'https://example.com/demo.mp4',
            '[clip](https://example.com/clip.webm)',
            'regular text {width=50%}'
        ].join('\n'));
    });

    it('embeds bare video links as playable previews', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://example.com/demo.mp4">https://example.com/demo.mp4</a></p>';

        processPreviewVideos(container);

        const video = container.querySelector('video');
        expect(video).toBeTruthy();
        expect(video.getAttribute('src')).toBe('https://example.com/demo.mp4');
        expect(video.controls).toBe(true);
    });

    it('embeds the exact GitHub attachment URL from issue #40 even with trailing comma', () => {
        const issueUrl = 'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062,';
        const container = document.createElement('div');
        container.innerHTML = `<p><a href="${issueUrl}">${issueUrl}</a></p>`;

        processPreviewVideos(container);

        const video = container.querySelector('video');
        expect(video).toBeTruthy();
        expect(video.getAttribute('src')).toBe('https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062');
    });

    it('converts image-syntax videos into playable previews without nesting block players in paragraphs', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p data-source-line="7"><img src="https://example.com/demo.webm" alt="Demo clip"></p>';

        processPreviewVideos(container);

        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('p')).toBeNull();
        expect(container.querySelector('.preview-video')?.getAttribute('data-source-line')).toBe('7');
        expect(container.querySelector('video')?.getAttribute('src')).toBe('https://example.com/demo.webm');
    });

    it('keeps intentionally labeled video links as links', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://example.com/demo.mp4">watch product demo</a></p>';

        processPreviewVideos(container);

        expect(container.querySelector('video')).toBeNull();
        expect(container.querySelector('a')?.textContent).toBe('watch product demo');
    });

    it('embeds hosted video links with privacy-friendly iframes', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">https://www.youtube.com/watch?v=dQw4w9WgXcQ</a></p>';

        processPreviewVideos(container);

        const iframe = container.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(iframe.getAttribute('loading')).toBe('lazy');
    });
});
