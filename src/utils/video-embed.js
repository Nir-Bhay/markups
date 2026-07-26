/**
 * Video embed helpers for Markdown preview (Issue #40)
 * Converts video links / image-syntax video URLs into playable players.
 * @module utils/video-embed
 */

const VIDEO_EXT_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:[?#].*)?$/i;
const GITHUB_ASSET_RE =
    /^https?:\/\/(?:github\.com\/user-attachments\/assets\/|objects\.githubusercontent\.com\/)[^\s]+/i;
const YOUTUBE_RE =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
const VIMEO_RE = /(?:vimeo\.com\/)(\d+)/i;

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isDirectVideoUrl(url) {
    if (!url) return false;
    try {
        const path = new URL(url, window.location.href).pathname;
        return VIDEO_EXT_RE.test(path);
    } catch {
        return VIDEO_EXT_RE.test(url);
    }
}

/**
 * GitHub issue/PR video attachments (no file extension in URL)
 * @param {string} url
 * @returns {boolean}
 */
export function isGitHubVideoAttachment(url) {
    return typeof url === 'string' && GITHUB_ASSET_RE.test(url.trim());
}

/**
 * @param {string} url
 * @returns {{ type: 'youtube'|'vimeo', id: string }|null}
 */
export function parseHostedVideo(url) {
    if (!url) return null;
    const yt = url.match(YOUTUBE_RE);
    if (yt) return { type: 'youtube', id: yt[1] };
    const vim = url.match(VIMEO_RE);
    if (vim) return { type: 'vimeo', id: vim[1] };
    return null;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isEmbeddableVideoUrl(url) {
    return (
        isDirectVideoUrl(url) ||
        isGitHubVideoAttachment(url) ||
        !!parseHostedVideo(url)
    );
}

/**
 * Build an HTML5 <video> element for direct / GitHub asset URLs
 * @param {string} url
 * @returns {HTMLElement}
 */
function createHtml5Video(url) {
    const wrap = document.createElement('div');
    wrap.className = 'preview-video';

    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.setAttribute('controlsList', 'nodownload');
    video.src = url;

    // If playback fails (e.g. wrong content-type), fall back to a link
    video.addEventListener('error', () => {
        if (wrap.dataset.fallback === '1') return;
        wrap.dataset.fallback = '1';
        wrap.replaceChildren();
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'preview-video-fallback';
        a.textContent = 'Open video';
        wrap.appendChild(a);
    }, { once: true });

    wrap.appendChild(video);
    return wrap;
}

/**
 * Build a privacy-friendly iframe for YouTube / Vimeo
 * Created via DOM (not innerHTML) so we never feed iframes through DOMPurify.
 * @param {{ type: string, id: string }} hosted
 * @returns {HTMLElement}
 */
function createHostedEmbed(hosted) {
    const wrap = document.createElement('div');
    wrap.className = 'preview-video preview-video--embed';

    const iframe = document.createElement('iframe');
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    );
    iframe.title = hosted.type === 'youtube' ? 'YouTube video' : 'Vimeo video';

    if (hosted.type === 'youtube') {
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(hosted.id)}`;
    } else {
        iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(hosted.id)}`;
    }

    wrap.appendChild(iframe);
    return wrap;
}

/**
 * Replace a single anchor (or img) with an embedded player when the URL is a video.
 * @param {HTMLAnchorElement|HTMLImageElement} el
 * @returns {boolean} whether replacement happened
 */
function tryReplaceWithVideo(el) {
    const url =
        el.tagName === 'IMG'
            ? el.getAttribute('src')
            : el.getAttribute('href');
    if (!url || !isEmbeddableVideoUrl(url)) return false;

    // Only replace "standalone" links (link text is empty, URL, or same as href)
    if (el.tagName === 'A') {
        const text = (el.textContent || '').trim();
        const href = el.getAttribute('href') || '';
        const isBare =
            !text ||
            text === href ||
            text === href.replace(/^https?:\/\//, '') ||
            /^https?:\/\//i.test(text);
        // Keep intentional labeled links like [watch docs](video.mp4) as links
        // unless the label looks like a URL / is empty
        if (!isBare && text.length > 0 && !isDirectVideoUrl(text) && !isGitHubVideoAttachment(text)) {
            return false;
        }
    }

    const hosted = parseHostedVideo(url);
    const player = hosted ? createHostedEmbed(hosted) : createHtml5Video(url);
    el.replaceWith(player);
    return true;
}

/**
 * Scan rendered preview and embed playable videos (Issue #40).
 * @param {HTMLElement} container - Usually #output
 */
export function processPreviewVideos(container) {
    if (!container) return;

    // Image markdown pointing at video files: ![](clip.mp4)
    container.querySelectorAll('img[src]').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (isDirectVideoUrl(src) || isGitHubVideoAttachment(src)) {
            tryReplaceWithVideo(img);
        }
    });

    // Autolinks / markdown links to videos
    container.querySelectorAll('a[href]').forEach((a) => {
        tryReplaceWithVideo(a);
    });
}

export default {
    isDirectVideoUrl,
    isGitHubVideoAttachment,
    parseHostedVideo,
    isEmbeddableVideoUrl,
    processPreviewVideos
};
