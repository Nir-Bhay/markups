/**
 * Video UX discoverability (Issue #40)
 * Chips on labeled video links + helpers to rewrite them to bare URLs for Smart embed.
 * @module features/video-discoverability
 */

import {
    isEmbeddableVideoUrl,
    normalizeVideoUrl,
    shouldEmbedVideo
} from '../../utils/video-embed.js';

const TOAST_SESSION_KEY = 'com.markdownlivepreview.video_link_tip_shown';

/**
 * Escape a URL for use inside a RegExp.
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrite the first Markdown link (optional image syntax + optional {video attrs})
 * pointing at targetUrl into a bare URL so Smart mode embeds a player.
 * @param {string} markdown
 * @param {string} targetUrl
 * @returns {string}
 */
export function rewriteVideoLinkToBareUrl(markdown, targetUrl) {
    const url = normalizeVideoUrl(targetUrl);
    if (!url || !markdown) return markdown;

    const escaped = escapeRegExp(url);
    const patterns = [
        // [label](url) {video …} or [label](url)
        new RegExp(`!?\\[[^\\]]*\\]\\(\\s*${escaped}\\s*\\)(?:\\s*\\{[^}\\n]*\\})?`),
        // Autolink form <url> kept as-is (already bare-ish)
        new RegExp(`<\\s*${escaped}\\s*>`)
    ];

    for (const re of patterns) {
        if (re.test(markdown)) {
            return markdown.replace(re, url);
        }
    }

    // Fallback: href may differ only by trailing punctuation already stripped
    const loose = new RegExp(
        `!?\\[[^\\]]*\\]\\(\\s*(${escaped}[,.);:!?]*)\\s*\\)(?:\\s*\\{[^}\\n]*\\})?`
    );
    if (loose.test(markdown)) {
        return markdown.replace(loose, url);
    }

    return markdown;
}

/**
 * Whether this remaining preview anchor is a labeled video link that Smart mode
 * intentionally did not embed.
 * @param {HTMLAnchorElement} anchor
 * @returns {boolean}
 */
export function isLabeledVideoLink(anchor) {
    if (!anchor || anchor.tagName !== 'A') return false;
    if (anchor.closest('.preview-video, .video-link-actions')) return false;
    const href = normalizeVideoUrl(anchor.getAttribute('href') || '');
    if (!href || !isEmbeddableVideoUrl(href)) return false;
    // Hosted (YouTube/Vimeo) labeled links already embed in smart mode.
    // Chip is for links that remain after processPreviewVideos.
    return !shouldEmbedVideo(anchor, 'smart');
}

/**
 * Attach “Show as video” chips next to labeled embeddable video links.
 * @param {HTMLElement} container
 * @param {{
 *   getMarkdown?: () => string,
 *   onMarkdownChange?: (md: string) => void,
 *   showToast?: (msg: string, type?: string, ms?: number) => void,
 *   videoMode?: string
 * }} [options]
 * @returns {{ labeledCount: number }}
 */
export function enhanceLabeledVideoLinks(container, options = {}) {
    const {
        getMarkdown,
        onMarkdownChange,
        showToast,
        videoMode = 'smart'
    } = options;

    if (!container) return { labeledCount: 0 };

    // In always-link mode, converting to bare URL still won't embed — skip chips.
    if (videoMode === 'always-link') return { labeledCount: 0 };

    let labeledCount = 0;

    container.querySelectorAll('a[href]').forEach((anchor) => {
        if (anchor.dataset.videoChipBound === '1') return;
        if (!isLabeledVideoLink(anchor)) return;

        // always-embed should have replaced these already; if not, still offer chip.
        labeledCount += 1;
        anchor.dataset.videoChipBound = '1';

        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'video-show-as-video-chip';
        chip.dataset.liveEditIgnore = '1';
        chip.title = 'Bare URL = player. Labeled links stay as links. Click to embed this video.';
        chip.setAttribute('aria-label', 'Show as video');
        chip.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
            </svg>
            <span>Show as video</span>
        `;

        chip.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const href = normalizeVideoUrl(anchor.getAttribute('href') || '');
            const md = typeof getMarkdown === 'function' ? getMarkdown() : '';
            const next = rewriteVideoLinkToBareUrl(md, href);
            if (next === md) {
                showToast?.('Could not find that video link in the Markdown source', 'warning', 2200);
                return;
            }
            onMarkdownChange?.(next);
            showToast?.('Converted to video preview', 'success', 1800);
        });

        const wrap = document.createElement('span');
        wrap.className = 'video-link-actions';
        anchor.parentNode?.insertBefore(wrap, anchor);
        wrap.appendChild(anchor);
        wrap.appendChild(chip);
    });

    if (labeledCount > 0 && typeof showToast === 'function') {
        try {
            if (sessionStorage.getItem(TOAST_SESSION_KEY) !== '1') {
                sessionStorage.setItem(TOAST_SESSION_KEY, '1');
                showToast(
                    'This is a video link. Click Show as video to embed it in the preview.',
                    'info',
                    4000
                );
            }
        } catch {
            // private mode / blocked storage — skip one-time tip
        }
    }

    return { labeledCount };
}

/**
 * Normalize a pasted video URL for Insert Video toolbar.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeInsertVideoUrl(raw) {
    const url = normalizeVideoUrl(raw);
    if (!url) return '';
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
        return `https://${url}`;
    }
    return url;
}

export default {
    rewriteVideoLinkToBareUrl,
    isLabeledVideoLink,
    enhanceLabeledVideoLinks,
    normalizeInsertVideoUrl
};
