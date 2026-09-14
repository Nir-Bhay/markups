/**
 * TXT Export Service
 * Single canonical Markdown → plain-text converter (Phase 3.2).
 * Previously three divergent pipelines lived in main.js (quick export, modal
 * export, preview) — preview approved one rendering while download produced
 * another. All three call sites now share markdownToPlainText.
 * @module services/export/txt
 */

export const TXT_WARN_BYTES = 10 * 1024 * 1024; // 10 MB
export const TXT_PREVIEW_WARN_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Convert markdown to plain text.
 * Pure function — unit-tested. Wraps at 80 columns and prepends a header
 * block only when requested.
 * @param {string} content - Markdown source
 * @param {Object} [options]
 * @param {boolean} [options.wordWrap=true] - Wrap lines at 80 columns
 * @param {boolean} [options.includeFrontmatter=false] - Prepend header block
 * @param {string} [options.title='document'] - Title for the header block
 * @param {string} [options.dateStr=''] - Date string for the header block
 * @returns {string} Plain text
 */
export function markdownToPlainText(content, options = {}) {
    const {
        wordWrap = true,
        includeFrontmatter = false,
        title = 'document',
        dateStr = ''
    } = options;

    let plainText = content
        .replace(/^#{1,6}\s+(.+)/gm, (match, p1) => p1.toUpperCase())  // Convert headings to uppercase
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold
        .replace(/\*(.+?)\*/g, '$1')  // Remove italic
        .replace(/~~(.+?)~~/g, '$1')  // Remove strikethrough
        .replace(/`{3}(\w*)\n([\s\S]*?)`{3}/g, (match, lang, code) => `[CODE${lang ? `: ${lang}` : ''}]\n${code}\n[/CODE]`)  // Mark code blocks
        .replace(/`(.+?)`/g, '"$1"')  // Convert inline code to quotes
        // Phase 3.2: images BEFORE links — the link pattern would otherwise
        // consume `[alt](url)` inside `![alt](url)` and leave `!alt (url)`.
        .replace(/!\[(.+?)\]\(.+?\)/g, '[Image: $1]')  // Convert images to placeholder
        .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')  // Convert links to text (URL)
        .replace(/^[-*+]\s+/gm, '  • ')  // Convert bullets with indent
        .replace(/^\d+\.\s+/gm, '  ')  // Convert numbered lists
        .replace(/^>\s+/gm, '    ')  // Convert blockquotes to indent
        .replace(/^---+$/gm, '\n' + '─'.repeat(50) + '\n')  // Convert horizontal rules
        .replace(/\|(.+)\|/g, (match) => {
            // Convert table rows
            return match.replace(/\|/g, ' | ').replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '');
        })
        .trim();

    // Apply word wrap if enabled
    if (wordWrap) {
        const lines = plainText.split('\n');
        plainText = lines.map(line => {
            if (line.length <= 80) return line;
            const words = line.split(' ');
            let result = '';
            let currentLine = '';
            words.forEach(word => {
                if ((currentLine + ' ' + word).trim().length > 80) {
                    result += currentLine.trim() + '\n';
                    currentLine = word;
                } else {
                    currentLine += ' ' + word;
                }
            });
            result += currentLine.trim();
            return result;
        }).join('\n');
    }

    // Add frontmatter if enabled
    if (includeFrontmatter) {
        const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
        const frontmatter = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Document: ${title}
Date: ${dateStr}
Words: ${wordCount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
        plainText = frontmatter + plainText;
    }

    return plainText;
}

/**
 * TXTExporter class — download wrapper around the shared converter.
 */
class TxtExporter {
    static instance = null;

    constructor() {
        if (TxtExporter.instance) {
            return TxtExporter.instance;
        }

        TxtExporter.instance = this;
    }

    /**
     * Convert markdown to plain text (delegates to the shared converter).
     */
    convert(markdown, options = {}) {
        return markdownToPlainText(markdown, options);
    }
}

export const txtExporter = new TxtExporter();

export { TxtExporter };

export default txtExporter;
