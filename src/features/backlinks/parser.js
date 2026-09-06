/**
 * Wikilink parser for Obsidian-style `[[Title]]` and `[[Title|Display]]` syntax.
 * @module features/backlinks/parser
 */

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Extract all wikilinks from markdown text.
 * @param {string} text
 * @returns {{ target: string; display: string; raw: string }[]}
 */
export function parseWikilinks(text) {
    const links = [];
    if (typeof text !== 'string') return links;

    let match;
    while ((match = WIKILINK_RE.exec(text)) !== null) {
        const startIndex = match.index;
        // Skip escaped `\[[` sequences
        if (startIndex > 0 && text[startIndex - 1] === '\\') {
            continue;
        }
        const target = match[1].trim();
        const display = (match[2] || target).trim();
        links.push({ target, display, raw: match[0] });
    }
    return links;
}
