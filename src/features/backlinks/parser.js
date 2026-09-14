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
/**
 * Extract all wikilinks from markdown text.
 * @param {string} text
 * @returns {{ target: string; display: string; raw: string }[]}
 */
export function parseWikilinks(text) {
    const links = [];
    if (typeof text !== 'string') return links;

    let match;
    WIKILINK_RE.lastIndex = 0;
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
    WIKILINK_RE.lastIndex = 0;
    return links;
}

/**
 * Find unlinked mentions: note titles appearing as plain text in another
 * note's body without a `[[wikilink]]`. Only the body outside frontmatter
 * and fenced code blocks is scanned.
 * @param {Array<{ id: number|string, title: string, content: string }>} notes
 * @returns {Array<{ targetId: string, targetTitle: string, sourceId: string, snippet: string }>}
 */
export function findUnlinkedMentions(notes) {
    const results = [];
    if (!Array.isArray(notes)) return results;
    const targets = notes
        .filter(n => n.title && n.title !== 'Untitled')
        .map(n => ({ id: String(n.id), title: n.title }));
    for (const source of notes) {
        const body = stripUnlinkableRegions(String(source.content || ''));
        const linked = new Set(parseWikilinks(String(source.content || '')).map(l => l.target.toLowerCase()));
        for (const target of targets) {
            if (String(source.id) === target.id) continue;
            if (linked.has(target.title.toLowerCase())) continue;
            const idx = body.toLowerCase().indexOf(target.title.toLowerCase());
            if (idx === -1) continue;
            results.push({
                targetId: target.id,
                targetTitle: target.title,
                sourceId: String(source.id),
                snippet: body.slice(Math.max(0, idx - 40), idx + target.title.length + 40).trim()
            });
        }
    }
    return results;
}

function stripUnlinkableRegions(text) {
    return String(text || '')
        .replace(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ');
}

/**
 * Rewrite wikilink targets after a note rename. Handles `[[old]]` and
 * `[[old|display]]`; display text and unrelated links are untouched.
 * @param {string} content
 * @param {string} oldTitle
 * @param {string} newTitle
 * @returns {{ content: string, replaced: number }}
 */
export function renameWikilinkTargets(content, oldTitle, newTitle) {
    if (typeof content !== 'string' || !oldTitle) return { content, replaced: 0 };
    let replaced = 0;
    const out = content.replace(WIKILINK_RE, (raw, target, display) => {
        if (target.trim().toLowerCase() !== oldTitle.trim().toLowerCase()) return raw;
        replaced++;
        return display !== undefined ? `[[${newTitle}|${display}]]` : `[[${newTitle}]]`;
    });
    // Reset the shared regex state (global flag keeps lastIndex).
    WIKILINK_RE.lastIndex = 0;
    return { content: out, replaced };
}
