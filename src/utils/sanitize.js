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
    ADD_TAGS: ['math', 'mrow', 'mo', 'mi', 'mn', 'msup', 'mfrac', 'semantics', 'annotation', 'video', 'source'],
    ADD_ATTR: ['target', 'class', 'id', 'aria-*', 'controls', 'preload', 'playsinline', 'controlslist'],
    FORBID_TAGS: ['iframe', 'script', 'object', 'embed', 'form'],
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

        if (node.tagName === 'A' && node.hasAttribute('target')) {
            node.setAttribute('rel', 'noopener noreferrer');
        }
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

export default {
    PREVIEW_SANITIZE_CONFIG,
    fallbackSanitizeHtml,
    sanitizePreviewHtml
};
