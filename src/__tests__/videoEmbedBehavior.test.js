import { describe, it, expect } from 'vitest';
import { shouldEmbedVideo, processPreviewVideos } from '../utils/video-embed.js';

describe('video embed behavior modes', () => {
    it('smart mode keeps labeled direct video links as links, but embeds labeled hosted videos', () => {
        const direct = document.createElement('a');
        direct.href = 'https://example.com/demo.mp4';
        direct.textContent = 'watch product demo';
        expect(shouldEmbedVideo(direct, 'smart')).toBe(false);

        const hosted = document.createElement('a');
        hosted.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        hosted.textContent = 'youtube.com';
        expect(shouldEmbedVideo(hosted, 'smart')).toBe(true);
    });

    it('smart mode embeds bare labeled YouTube links', () => {
        const el = document.createElement('a');
        el.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        el.textContent = 'youtube.com';
        expect(shouldEmbedVideo(el, 'smart')).toBe(true);
    });

    it('always-embed ignores labels', () => {
        const el = document.createElement('a');
        el.href = 'https://example.com/demo.mp4';
        el.textContent = 'watch product demo';
        expect(shouldEmbedVideo(el, 'always-embed')).toBe(true);
    });

    it('always-link never embeds', () => {
        const el = document.createElement('a');
        el.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        el.textContent = 'youtube.com';
        expect(shouldEmbedVideo(el, 'always-link')).toBe(false);
    });

    it('processPreviewVideos respects behavior=always-link', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">youtube.com</a></p>';

        processPreviewVideos(container, 'always-link');

        expect(container.querySelector('iframe')).toBeNull();
        expect(container.querySelector('a')?.textContent).toBe('youtube.com');
    });

    it('processPreviewVideos embeds with behavior=always-embed', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://example.com/demo.mp4">watch product demo</a></p>';

        processPreviewVideos(container, 'always-embed');

        expect(container.querySelector('video')?.getAttribute('src')).toBe('https://example.com/demo.mp4');
    });
});
