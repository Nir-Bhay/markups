/**
 * Minimal YAML-frontmatter parser for `---` blocks.
 * Supports only what the sidebar needs: scalar `title`/`category` and
 * `tags` as a `[a, b]` list, `- item` list, or comma string. Anything else
 * is ignored — never throws, never evals.
 * @module utils/frontmatter
 */

/**
 * @typedef {Object} Frontmatter
 * @property {string|null} title
 * @property {string|null} category
 * @property {string[]} tags
 */

/**
 * Parse leading `---` frontmatter from markdown.
 * @param {string} markdown
 * @returns {{ data: Frontmatter, body: string, hasFrontmatter: boolean }}
 */
export function parseFrontmatter(markdown) {
    const empty = { title: null, category: null, tags: [] };
    if (typeof markdown !== 'string') return { data: empty, body: '', hasFrontmatter: false };
    const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(markdown);
    if (!match) return { data: { ...empty }, body: markdown, hasFrontmatter: false };

    const data = { title: null, category: null, tags: [] };
    const lines = match[1].split('\n');
    let listKey = null;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const itemMatch = /^-\s+(.+)$/.exec(line);
        if (itemMatch && listKey === 'tags') {
            data.tags.push(stripQuotes(itemMatch[1].trim()));
            continue;
        }
        listKey = null;
        const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
        if (!kv) continue;
        const key = kv[1].toLowerCase();
        const value = stripQuotes(kv[2].trim());
        if (key === 'title' && value) data.title = value;
        else if (key === 'category' && value) data.category = value;
        else if (key === 'tags') {
            if (value.startsWith('[') && value.endsWith(']')) {
                data.tags = value.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
            } else if (value) {
                data.tags = value.split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
            } else {
                listKey = 'tags';
            }
        }
    }
    return { data, body: markdown.slice(match[0].length), hasFrontmatter: true };
}

function stripQuotes(value) {
    if (value.length >= 2) {
        const first = value[0];
        const last = value[value.length - 1];
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
            return value.slice(1, -1);
        }
    }
    return value;
}

/**
 * Derive note-field sync from frontmatter. Only returns fields that are set —
 * never blanks a title/tags/category the user set elsewhere.
 * @param {{ title?: string, tags?: string[], category?: string|null }} note
 * @param {string} markdown
 * @returns {{ title?: string, tags?: string[], category?: string|null }}
 */
export function frontmatterSyncForNote(note, markdown) {
    const { data, hasFrontmatter } = parseFrontmatter(markdown);
    if (!hasFrontmatter) return {};
    const sync = {};
    if (data.title && (!note.title || note.title === 'Untitled')) sync.title = data.title;
    if (data.tags.length > 0 && (!note.tags || note.tags.length === 0)) sync.tags = data.tags;
    if (data.category && !note.category) sync.category = data.category;
    return sync;
}
