/**
 * Emoji shortcode support (Issue #45).
 *
 * Renders GitHub-style shortcodes (`:smile:`) as emoji in the Markdown preview.
 * Uses `gemoji` (GitHub's own emoji data) so names and aliases match GitHub's
 * markdown exactly (`:smile:` -> 😄, `:+1:` -> 👍, `:rocket:` -> 🚀).
 *
 * Unknown shortcodes (`:not-a-real-name:`) are left as literal text so they do
 * not clobber real content such as times (`12:30`) or CSS pseudo-classes.
 * @module utils/emoji-shortcodes
 */

import { gemoji } from 'gemoji';

/**
 * Map of GitHub emoji shortcode (without colons, including aliases like `+1`)
 * -> the Unicode emoji character.
 */
const emojiMap = {};
for (const entry of gemoji) {
    if (!entry || !Array.isArray(entry.names)) continue;
    for (const name of entry.names) {
        const key = String(name || '').trim();
        if (key && entry.emoji && !Object.prototype.hasOwnProperty.call(emojiMap, key)) {
            emojiMap[key] = entry.emoji;
        }
    }
}

/**
 * Build an accessible emoji span with `role="img"` and `aria-label` so screen
 * readers announce the shortcode name (e.g. "smile") instead of the unicode
 * codepoint. Falls back to the raw character when the name is unknown.
 *
 * @param {{ name: string, emoji: string }} token
 * @returns {string} HTML safe to pass through DOMPurify
 */
function renderAccessibleEmoji(token) {
    const emoji = String(token?.emoji ?? '');
    const name = String(token?.name ?? '').trim();
    if (!name) return emoji;
    // Sanitize the label defensively (DOMPurify also runs on rendered HTML,
    // but we keep the renderer output safe even when sanitizer config changes).
    const safeName = name.replace(/[&<>"']/g, (c) => (
        c === '&' ? '&amp;' :
        c === '<' ? '&lt;' :
        c === '>' ? '&gt;' :
        c === '"' ? '&quot;' :
        '&#39;'
    ));
    return `<span role="img" aria-label="${safeName}">${emoji}</span>`;
}

/**
 * Options for the `marked-emoji` extension.
 * Renderer returns an accessible HTML span so screen readers announce the
 * shortcode name (e.g. "smile") instead of the raw codepoint.
 */
export const emojiMarkedOptions = {
    emojis: emojiMap,
    renderer: renderAccessibleEmoji
};

export default emojiMarkedOptions;
