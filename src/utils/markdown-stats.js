/**
 * Small helpers for document titles and editor statistics.
 * Keep these independent of the Markdown renderer so the editor shell does not
 * import every rendering engine just to update its status bar or file title.
 */
export function deriveDocumentTitle(content = '', maxLength = 20) {
    const nl = content.indexOf('\n');
    const firstLine = nl === -1 ? content : content.slice(0, nl);
    if (firstLine && firstLine.startsWith('# ')) {
        return firstLine.substring(2).trim().substring(0, maxLength) || 'Untitled';
    }
    return 'Untitled';
}

export function extractMarkdownStats(markdown = '') {
    const words = markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*_~`]/g, '')
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);

    return {
        words: words.length,
        characters: markdown.length,
        charactersNoSpaces: markdown.replace(/\s/g, '').length,
        lines: markdown.split('\n').length,
        paragraphs: markdown.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length,
        readingTime: Math.ceil(words.length / 200)
    };
}
