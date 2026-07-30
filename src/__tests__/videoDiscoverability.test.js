import { describe, it, expect, beforeEach } from 'vitest';
import {
    rewriteVideoLinkToBareUrl,
    isLabeledVideoLink,
    enhanceLabeledVideoLinks,
    normalizeInsertVideoUrl
} from '../features/video-discoverability/index.js';
import { processPreviewVideos } from '../utils/video-embed.js';

describe('video discoverability', () => {
    beforeEach(() => {
        try {
            sessionStorage.removeItem('com.markdownlivepreview.video_link_tip_shown');
        } catch {
            // ignore
        }
    });

    it('rewrites labeled markdown video links to bare URLs', () => {
        const url = 'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062';
        const md = `[github.com](${url}) {video width=25%}\n\nother`;
        expect(rewriteVideoLinkToBareUrl(md, url)).toBe(`${url}\n\nother`);
    });

    it('detects labeled GitHub video links that smart mode keeps as links', () => {
        const a = document.createElement('a');
        a.href = 'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062';
        a.textContent = 'github.com';
        expect(isLabeledVideoLink(a)).toBe(true);
    });

    it('adds Show as video chips and rewrites markdown on click', () => {
        const container = document.createElement('div');
        const url = 'https://example.com/demo.mp4';
        container.innerHTML = `<p><a href="${url}">watch demo</a></p>`;
        processPreviewVideos(container, 'smart');

        let nextMd = '';
        const result = enhanceLabeledVideoLinks(container, {
            getMarkdown: () => `[watch demo](${url})`,
            onMarkdownChange: (md) => {
                nextMd = md;
            }
        });

        expect(result.labeledCount).toBe(1);
        const chip = container.querySelector('.video-show-as-video-chip');
        expect(chip).toBeTruthy();
        chip.click();
        expect(nextMd).toBe(url);
    });

    it('still embeds bare URLs when mixed with a labeled video link (regression)', () => {
        const url = 'https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062';
        const container = document.createElement('div');
        container.innerHTML = `
            <p><a href="${url}">github.com</a></p>
            <p><a href="${url}">${url}</a></p>
        `;

        processPreviewVideos(container, 'smart');

        expect(container.querySelectorAll('video').length).toBe(1);
        expect(container.querySelector('a')?.textContent).toBe('github.com');

        enhanceLabeledVideoLinks(container, {
            getMarkdown: () => '',
            onMarkdownChange: () => {}
        });
        expect(container.querySelector('.video-show-as-video-chip')).toBeTruthy();
    });

    it('normalizes insert video URLs', () => {
        expect(normalizeInsertVideoUrl(' example.com/a.mp4 ')).toBe('https://example.com/a.mp4');
        expect(normalizeInsertVideoUrl('https://example.com/a.mp4')).toBe('https://example.com/a.mp4');
    });
});
