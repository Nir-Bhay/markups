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
 * Options for the `marked-emoji` extension.
 * Renderer returns the raw Unicode emoji character (emitted as plain text).
 */
export const emojiMarkedOptions = {
    emojis: emojiMap,
    renderer: (token) => token.emoji
};

export default emojiMarkedOptions;
