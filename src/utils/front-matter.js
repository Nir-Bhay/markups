/**
 * Front Matter Utilities
 * Parse a leading YAML-style front matter block (--- ... ---) from markdown.
 * Minimal key/value + list parsing — no external YAML dependency.
 * @module utils/front-matter
 */

/**
 * Extract a leading front matter block from markdown text.
 * The block must start on line 1 with a `---` fence and close with a
 * `---` (or `...`) fence. Handles CRLF line endings.
 * @param {string} markdown - Raw markdown
 * @returns {{ frontMatter: Object<string, string|string[]>, body: string, lineCount: number }|null}
 *   null when no valid block is present. `lineCount` is the number of source
 *   lines the block occupied (including both fences).
 */
export function parseFrontMatter(markdown) {
    if (typeof markdown !== 'string') return null;

    const normalized = markdown.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    if (lines.length < 2) return null;
    if (lines[0].trim() !== '---') return null;

    let closeIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === '---' || trimmed === '...') {
            closeIndex = i;
            break;
        }
    }
    if (closeIndex === -1) return null;

    const frontMatter = {};
    let currentKey = null;

    for (let i = 1; i < closeIndex; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed === '') continue;

        if (line.startsWith('  ') || line.startsWith('\t')) {
            // Continuation / list item for the previous key
            if (currentKey && trimmed.startsWith('-')) {
                const existing = frontMatter[currentKey];
                const value = trimmed.replace(/^-\s*/, '').trim();
                if (Array.isArray(existing)) {
                    existing.push(value);
                } else if (typeof existing === 'string' && existing !== '') {
                    frontMatter[currentKey] = [existing, value];
                } else {
                    frontMatter[currentKey] = [value];
                }
            }
            continue;
        }

        const separator = trimmed.indexOf(':');
        if (separator <= 0) continue;

        const key = trimmed.slice(0, separator).trim();
        const value = trimmed.slice(separator + 1).trim();
        if (!key) continue;
        currentKey = key;
        frontMatter[key] = value.replace(/^["']|["']$/g, '');
    }

    const body = lines.slice(closeIndex + 1).join('\n');
    return {
        frontMatter,
        body,
        lineCount: closeIndex + 1
    };
}

/**
 * Build an HTML metadata card for the parsed front matter.
 * Values are escaped; output is safe to inject (no raw HTML from the document).
 * @param {Object<string, string|string[]>} frontMatter
 * @returns {string} HTML string ('' when there are no keys)
 */
export function renderFrontMatterCard(frontMatter) {
    if (!frontMatter || typeof frontMatter !== 'object') return '';
    const keys = Object.keys(frontMatter);
    if (keys.length === 0) return '';

    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const rows = keys.map((key) => {
        const value = frontMatter[key];
        const display = Array.isArray(value)
            ? value.map((item) => escapeHtml(item)).join(', ')
            : escapeHtml(value);
        return `<tr><td class="fm-key">${escapeHtml(key)}</td><td class="fm-value">${display}</td></tr>`;
    }).join('');

    return `<div class="front-matter-card"><table><tbody>${rows}</tbody></table></div>`;
}

/**
 * Strip a leading front matter block from markdown, keeping line numbers
 * stable by replacing the block with blank lines.
 * @param {string} markdown - Raw markdown
 * @returns {string} Markdown with the block blanked out (unchanged when absent)
 */
export function blankFrontMatterLines(markdown) {
    if (typeof markdown !== 'string') return markdown;
    const parsed = parseFrontMatter(markdown);
    if (!parsed) return markdown;
    const normalized = markdown.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    return lines
        .map((line, index) => (index < parsed.lineCount ? '' : line))
        .join('\n');
}

export default {
    parseFrontMatter,
    renderFrontMatterCard,
    blankFrontMatterLines
};
