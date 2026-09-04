/**
 * Shared HTML sanitization helpers.
 *
 * DOMPurify remains the primary sanitizer in browsers. The fallback pass keeps
 * Markups' preview policy intact in lightweight DOM environments and adds
 * defense-in-depth for the project-specific forbidden tags/attributes.
 * @module utils/sanitize
 */

import DOMPurify from 'dompurify';

export const PREVIEW_SANITIZE_CONFIG = {
    USE_PROFILES: { html: true },
    // Markdown preview extensions. Mermaid iframes are created later through DOM,
    // not accepted from user-authored Markdown HTML.
    ADD_TAGS: ['math', 'mrow', 'mo', 'mi', 'mn', 'msup', 'mfrac', 'semantics', 'annotation'],
    // NOTE: 'video' and 'source' intentionally NOT allowed. Raw <video>/<source> in
    // author markdown would bypass the URL validation in video-embed.js. Video embeds
    // are created exclusively via the DOM-based helpers which validate against
    // VIDEO_EXT_RE / YOUTUBE_RE / VIMEO_RE / GITHUB_ASSET_RE.
    ADD_ATTR: ['target', 'class', 'id', 'aria-label', 'aria-hidden', 'controls', 'preload', 'playsinline', 'controlslist', 'rel'],
    FORBID_TAGS: ['iframe', 'script', 'object', 'embed', 'form', 'video', 'source'],
    FORBID_ATTR: ['style', 'srcdoc'],
    ALLOW_DATA_ATTR: false
};

/**
 * Merge DOMPurify-style config arrays without losing defaults.
 * @param {Object} overrides
 * @returns {Object}
 */
function buildConfig(overrides = {}) {
    return {
        ...PREVIEW_SANITIZE_CONFIG,
        ...overrides,
        ADD_TAGS: [...new Set([...(PREVIEW_SANITIZE_CONFIG.ADD_TAGS || []), ...(overrides.ADD_TAGS || [])])],
        ADD_ATTR: [...new Set([...(PREVIEW_SANITIZE_CONFIG.ADD_ATTR || []), ...(overrides.ADD_ATTR || [])])],
        FORBID_TAGS: [...new Set([...(PREVIEW_SANITIZE_CONFIG.FORBID_TAGS || []), ...(overrides.FORBID_TAGS || [])])],
        FORBID_ATTR: [...new Set([...(PREVIEW_SANITIZE_CONFIG.FORBID_ATTR || []), ...(overrides.FORBID_ATTR || [])])]
    };
}

/**
 * In-page anchors (#heading) stay in the preview. Everything else (http/https,
 * mailto, relative URLs, etc.) should open in a new tab so the editor is not left.
 * @param {string} href
 * @returns {boolean}
 */
export function shouldOpenPreviewLinkInNewTab(href) {
    const value = String(href || '').trim();
    if (!value) return false;
    if (value.startsWith('#')) return false;
    // Decode HTML entities (e.g. java&#x09;script:, javascript&colon;) before the
    // scheme test so entity-encoded javascript:/vbscript:/data: URLs are still blocked.
    // Browsers resolve named entities like &colon; &sol; &tab; inside URLs, so we must
    // decode the ones that can split a scheme from its colon.
    const named = {
        amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
        colon: ':', sol: '/', tab: '\t', newline: '\n', nl: '\n',
        space: ' ', nbsp: ' '
    };
    const decoded = value
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
        .replace(/&([a-z]+);/gi, (m, name) => named[name.toLowerCase()] ?? m);
    if (/^(javascript|vbscript|data):/i.test(decoded.replace(/[\u0000-\u001F\u007F\s]+/g, ''))) {
        return false;
    }
    return true;
}

/**
 * Force safe new-tab behavior on external preview anchors.
 * @param {Element} node
 */
export function applyPreviewLinkTarget(node) {
    if (!node || node.tagName !== 'A') return;
    const href = node.getAttribute('href') || '';
    if (shouldOpenPreviewLinkInNewTab(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
    } else if (href.startsWith('#')) {
        // Keep TOC / heading permalinks on the same page
        node.removeAttribute('target');
    } else if (node.hasAttribute('target')) {
        node.setAttribute('rel', 'noopener noreferrer');
    }
}

/**
 * Apply new-tab policy to all anchors under a preview root (post-render safety net).
 * @param {ParentNode|null|undefined} root
 */
export function ensurePreviewLinksOpenInNewTab(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('a[href]').forEach((anchor) => applyPreviewLinkTarget(anchor));
}

/**
 * Minimal fallback sanitizer for environments where DOMPurify is unsupported or
 * a DOM shim returns unsafe input unchanged. This preserves project-specific
 * invariants; it is intentionally narrower than DOMPurify.
 * @param {string} html
 * @param {Object} config
 * @returns {string}
 */
export function fallbackSanitizeHtml(html, config = PREVIEW_SANITIZE_CONFIG) {
    const forbiddenTags = config.FORBID_TAGS || [];
    const forbiddenTagGroup = forbiddenTags.join('|');

    if (!forbiddenTagGroup) return String(html || '');

    if (typeof document === 'undefined') {
        return String(html || '')
            .replace(new RegExp(`<(${forbiddenTagGroup})\\b[\\s\\S]*?<\\/\\1>`, 'gi'), '')
            .replace(new RegExp(`<\\/?(?:${forbiddenTagGroup})\\b[^>]*>`, 'gi'), '')
            .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/\s+(?:style|srcdoc|data-[\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    }

    const template = document.createElement('template');
    template.innerHTML = String(html || '');

    template.content.querySelectorAll(forbiddenTags.join(',')).forEach((node) => node.remove());

    template.content.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = String(attr.value || '').trim();
            const normalizedValue = value.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase();

            if (
                name.startsWith('on') ||
                name === 'style' ||
                name === 'srcdoc' ||
                name.startsWith('data-') ||
                ((name === 'href' || name === 'xlink:href') && /^(javascript|vbscript|data):/.test(normalizedValue)) ||
                (name === 'src' && /^(javascript|vbscript):/.test(normalizedValue))
            ) {
                node.removeAttribute(attr.name);
            }
        });

        applyPreviewLinkTarget(node);
    });

    return template.innerHTML;
}

/**
 * Sanitize Markdown preview HTML with DOMPurify plus a project-policy fallback pass.
 * @param {string} html
 * @param {Object} overrides
 * @returns {string}
 */
export function sanitizePreviewHtml(html, overrides = {}) {
    const config = buildConfig(overrides);
    const sanitized = DOMPurify.isSupported === false
        ? String(html || '')
        : DOMPurify.sanitize(String(html || ''), config);

    return fallbackSanitizeHtml(sanitized, config);
}

/**
 * Minimal HTML content / attribute escaper.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escape characters that would break inline markdown image alt text.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeMarkdownAlt(str) {
    return String(str || '')
        .replace(/[\\\[\]()]/g, '\\$&')
        .replace(/[\u0000-\u001F\u007F]/g, '');
}

export default {
    PREVIEW_SANITIZE_CONFIG,
    shouldOpenPreviewLinkInNewTab,
    applyPreviewLinkTarget,
    ensurePreviewLinksOpenInNewTab,
    fallbackSanitizeHtml,
    sanitizePreviewHtml,
    escapeHtml,
    sanitizeMarkdownAlt
};
