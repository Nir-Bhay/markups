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

    it('keeps labeled direct video links as links in smart mode, but embeds labeled hosted videos', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <p><a href="https://example.com/demo.mp4">watch product demo</a></p>
            <p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">youtube.com</a></p>
        `;

        processPreviewVideos(container, 'smart');

        expect(container.querySelector('video')).toBeNull();
        expect(container.querySelector('a')?.textContent).toBe('watch product demo');

        expect(container.querySelector('iframe')?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });

    it('forces embed/link with explicit behavior', () => {
        const embedContainer = document.createElement('div');
        embedContainer.innerHTML = '<p><a href="https://example.com/demo.mp4">watch product demo</a></p>';
        processPreviewVideos(embedContainer, 'always-embed');
        expect(embedContainer.querySelector('video')?.getAttribute('src')).toBe('https://example.com/demo.mp4');

        const linkContainer = document.createElement('div');
        linkContainer.innerHTML = '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">youtube.com</a></p>';
        processPreviewVideos(linkContainer, 'always-link');
        expect(linkContainer.querySelector('iframe')).toBeNull();
        expect(linkContainer.querySelector('a')?.textContent).toBe('youtube.com');
    });

    it('embeds hosted video links with privacy-friendly iframes', () => {
        const container = document.createElement('div');
        container.innerHTML = '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">https://www.youtube.com/watch?v=dQw4w9WgXcQ</a></p>';

        processPreviewVideos(container);

        const iframe = container.querySelector('iframe');
        expect(iframe).toBeTruthy();
        expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
        expect(iframe.getAttribute('loading')).toBe('lazy');
        expect(container.querySelector('.preview-video-hitbox')).toBeTruthy();
    });

    it('keeps GitHub picture-link images as images unless explicitly tagged mode=embed (Issue #40)', () => {
        const githubImage =
            'https://github.com/user-attachments/assets/bbbb-bbbb-bbbb-bbbb';

        // Image markdown with no {video} hint → stays an <img>, never "Open video"
        const plain = document.createElement('div');
        plain.innerHTML = `<p><img src="${githubImage}" alt="picture"></p>`;
        processPreviewVideos(plain);
        expect(plain.querySelector('video')).toBeNull();
        expect(plain.querySelector('img')?.getAttribute('src')).toBe(githubImage);

        // Explicit {video mode=embed} → embedded as a player
        const tagged = document.createElement('div');
        tagged.innerHTML = `<p><img src="${githubImage}" alt="clip"></p>`;
        const attrs = new Map([[githubImage, { mode: 'embed', width: '100%', align: 'center' }]]);
        processPreviewVideos(tagged, 'smart', attrs);
        expect(tagged.querySelector('img')).toBeNull();
        expect(tagged.querySelector('video')?.getAttribute('src')).toBe(githubImage);
    });

    it('still embeds bare GitHub asset links (autolink path) as videos (Issue #40 regression)', () => {
        const githubVideo =
            'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062';
        const container = document.createElement('div');
        container.innerHTML = `<p><a href="${githubVideo}">${githubVideo}</a></p>`;

        processPreviewVideos(container, 'smart');

        const video = container.querySelector('video');
        expect(video).toBeTruthy();
        expect(video.getAttribute('src')).toBe(githubVideo);
    });

    it('embeds labeled YouTube/Vimeo links even when link text is not the URL', () => {
        const container = document.createElement('div');
        container.innerHTML = `
            <p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">youtube.com</a></p>
            <p><a href="https://vimeo.com/123456">vimeo.com</a></p>
        `;

        processPreviewVideos(container);

        const youtubeIframe = container.querySelector('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]');
        expect(youtubeIframe).toBeTruthy();

        const vimeoIframe = container.querySelector('iframe[src*="player.vimeo.com/video/123456"]');
        expect(vimeoIframe).toBeTruthy();
    });

    it('reuses the SAME already-loaded <video> node on re-render (no reload/flicker)', () => {
        const demo = 'https://example.com/demo.mp4';

        // First render → fresh <video>.
        const first = document.createElement('div');
        first.innerHTML = `<p data-source-line="5"><a href="${demo}">${demo}</a></p>`;
        processPreviewVideos(first, 'smart', null, new Map());
        const original = first.querySelector('video');
        expect(original).toBeTruthy();
        expect(original.getAttribute('preload')).toBe('metadata');

        // Second render of the same source line with the original node in reuseVideos
        // → the SAME element object must be re-inserted, not a fresh one.
        const again = document.createElement('div');
        again.innerHTML = `<p data-source-line="5"><a href="${demo}">${demo}</a></p>`;
        const reuse = new Map();
        reuse.set('5', original);
        processPreviewVideos(again, 'smart', null, reuse);

        const reused = again.querySelector('video');
        expect(reused).toBeTruthy();
        expect(reused).toBe(original); // same DOM node object − no reload, no flicker
    });

    it('reuses the SAME already-loaded YouTube/Vimeo <iframe> node on re-render (no embed reload)', () => {
        // YouTube bare URL: first render creates a fresh <iframe>.
        const yt = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const first = document.createElement('div');
        first.innerHTML = `<p data-source-line="7"><a href="${yt}">${yt}</a></p>`;
        processPreviewVideos(first, 'smart', null, new Map());
        const originalYT = first.querySelector('iframe');
        expect(originalYT).toBeTruthy();
        expect(originalYT.getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');

        // Second render with the original iframe in reuseVideos keyed by source line.
        // The SAME DOM node must come back — provider embed must NOT be re-created.
        const again = document.createElement('div');
        again.innerHTML = `<p data-source-line="7"><a href="${yt}">${yt}</a></p>`;
        const reuse = new Map();
        reuse.set('7', originalYT);
        processPreviewVideos(again, 'smart', null, reuse);
        const reusedYT = again.querySelector('iframe');
        expect(reusedYT).toBeTruthy();
        expect(reusedYT).toBe(originalYT); // same DOM node → no reload, no flicker, no lost playback position

        // URL fallback key (when source-line doesn't match across renders) must also reuse.
        const urlFallback = new Map();
        urlFallback.set(yt, originalYT);
        const again2 = document.createElement('div');
        again2.innerHTML = `<p data-source-line="99"><a href="${yt}">${yt}</a></p>`;
        processPreviewVideos(again2, 'smart', null, urlFallback);
        expect(again2.querySelector('iframe')).toBe(originalYT);

        // Vimeo reuse (same contract).
        const vimeo = 'https://vimeo.com/76979871';
        const firstV = document.createElement('div');
        firstV.innerHTML = `<p data-source-line="11"><a href="${vimeo}">${vimeo}</a></p>`;
        processPreviewVideos(firstV, 'smart', null, new Map());
        const originalV = firstV.querySelector('iframe');
        expect(originalV).toBeTruthy();
        expect(originalV.getAttribute('src')).toContain('player.vimeo.com/video/76979871');

        const againV = document.createElement('div');
        againV.innerHTML = `<p data-source-line="11"><a href="${vimeo}">${vimeo}</a></p>`;
        const reuseV = new Map();
        reuseV.set('11', originalV);
        processPreviewVideos(againV, 'smart', null, reuseV);
        expect(againV.querySelector('iframe')).toBe(originalV);
    });

    it('leaves reused <iframe> src + sandbox + allow attrs untouched (provider stays loaded)', () => {
        // When we reuse an iframe we MUST NOT rewrite src/allow/sandbox, because any of
        // those attribute changes force the provider to reload the embed (and the user
        // loses playback position). Guard against a future refactor breaking this.
        const yt = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const first = document.createElement('div');
        first.innerHTML = `<p data-source-line="3"><a href="${yt}">${yt}</a></p>`;
        processPreviewVideos(first, 'smart', null, new Map());
        const original = first.querySelector('iframe');
        expect(original).toBeTruthy();

        // Tamper with attrs to simulate state set by the provider after load.
        original.setAttribute('src', original.getAttribute('src') + '?t=42');
        original.setAttribute('data-test-marker', 'preserved');

        const again = document.createElement('div');
        again.innerHTML = `<p data-source-line="3"><a href="${yt}">${yt}</a></p>`;
        const reuse = new Map();
        reuse.set('3', original);
        processPreviewVideos(again, 'smart', null, reuse);

        const reused = again.querySelector('iframe');
        expect(reused).toBe(original);
        expect(reused.getAttribute('src')).toContain('?t=42'); // not stripped
        expect(reused.getAttribute('data-test-marker')).toBe('preserved');
    });
});