/**
 * Escape user-controlled strings for safe insertion into innerHTML templates.
 *
 * Covers both element-content contexts (`<span>${escape(s)}</span>`) and
 * attribute contexts (`<input value="${escape(s)}">`). Escapes the full set of
 * characters that have HTML-special meaning: `& < > " '` plus the additional
 * defense-in-depth characters `/`, `` ` ``, and `=` (Laravel-style; harmless in
 * element content, important in attribute-context escape-from-context attacks).
 *
 * Returns '' for null/undefined; coerces non-strings via String().
 *
 * Note: this is for UI panel rendering only (e.g. settings labels, search input
 * echoes, stored template/snippet names). For markdown output, the rendering
 * pipeline goes through DOMPurify — do NOT use this helper there.
 *
 * @param {*} str - The string to escape. Coerced to String.
 * @returns {string} HTML-safe representation.
 */
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

const HTML_ESCAPE_RE = /[&<>"'`=\/]/g;

export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

// CommonJS interop for files that mix require() and import().
// Default export allows `const { escapeHtml } = require('../utils/escape-html.js')`.
export default { escapeHtml };