/** Maps rendered preview blocks to their Markdown source start lines. */

const SOURCE_BLOCK_SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'p', 'table', 'ul', 'ol',
    'blockquote', 'hr', 'details', '.mermaid', '.mermaid-diagram', '.mermaid-error',
    '.preview-video', '.markdown-alert'
].join(',');

const isBlank = (line) => !String(line || '').trim();
const isHeading = (line) => /^\s{0,3}#{1,6}\s+/.test(line);
const isFence = (line) => /^\s{0,3}(?:`{3,}|~{3,})/.test(line);
const isTable = (line) => /^\s*\|/.test(line);
const isHr = (line) => /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
const isList = (line) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
const isQuote = (line) => /^\s*>\s?/.test(line);
const isDetailsOpen = (line) => /^<details\b/i.test(line.trim());

/**
 * Return the start line and kind of each top-level Markdown block.
 * @param {string} markdown
 * @returns {{ line: number, type: string }[]}
 */
export function extractMarkdownBlockStarts(markdown) {
    const lines = String(markdown || '').split('\n');
    const blocks = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        if (isBlank(line)) {
            index++;
            continue;
        }

        if (isHeading(line)) {
            blocks.push({ line: index + 1, type: 'heading' });
            index++;
            continue;
        }

        if (isFence(line)) {
            blocks.push({ line: index + 1, type: 'code' });
            const fenceMatch = line.trimStart().match(/^(`{3,}|~{3,})/);
            const fence = fenceMatch?.[0] || '```';
            index++;
            while (index < lines.length) {
                const candidate = lines[index].trimStart();
                if (candidate.startsWith(fence) && new RegExp(`^${fence[0]}{${fence.length},}\\s*$`).test(candidate)) {
                    index++;
                    break;
                }
                index++;
            }
            continue;
        }

        if (isHr(line)) {
            blocks.push({ line: index + 1, type: 'hr' });
            index++;
            continue;
        }

        if (isTable(line)) {
            blocks.push({ line: index + 1, type: 'table' });
            while (index < lines.length && (isTable(lines[index]) || isBlank(lines[index]))) {
                if (isBlank(lines[index])) {
                    let next = index + 1;
                    while (next < lines.length && isBlank(lines[next])) next++;
                    if (next >= lines.length || !isTable(lines[next])) break;
                }
                index++;
            }
            continue;
        }

        if (isList(line)) {
            blocks.push({ line: index + 1, type: 'list' });
            while (index < lines.length) {
                if (isBlank(lines[index])) {
                    let next = index + 1;
                    while (next < lines.length && isBlank(lines[next])) next++;
                    if (next >= lines.length || (!isList(lines[next]) && !/^\s{2,}\S/.test(lines[next]))) break;
                    index = next;
                    continue;
                }
                if (isList(lines[index]) || /^\s{2,}\S/.test(lines[index])) {
                    index++;
                    continue;
                }
                break;
            }
            continue;
        }

        if (isQuote(line)) {
            blocks.push({ line: index + 1, type: 'quote' });
            while (index < lines.length && (isQuote(lines[index]) || isBlank(lines[index]))) {
                if (isBlank(lines[index])) {
                    let next = index + 1;
                    while (next < lines.length && isBlank(lines[next])) next++;
                    if (next >= lines.length || !isQuote(lines[next])) break;
                }
                index++;
            }
            continue;
        }

        if (isDetailsOpen(line)) {
            blocks.push({ line: index + 1, type: 'details' });
            while (index < lines.length && !/<\/details>/i.test(lines[index])) index++;
            if (index < lines.length) index++;
            continue;
        }

        blocks.push({ line: index + 1, type: 'paragraph' });
        index++;
        while (index < lines.length && !isBlank(lines[index])) {
            if (
                isHeading(lines[index]) || isFence(lines[index]) || isHr(lines[index]) ||
                isTable(lines[index]) || isList(lines[index]) || isQuote(lines[index]) ||
                isDetailsOpen(lines[index])
            ) break;
            index++;
        }
    }

    return blocks;
}

function renderedBlockType(element) {
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'pre' || element.matches?.('.mermaid, .mermaid-diagram, .mermaid-error')) return 'code';
    if (tag === 'table') return 'table';
    if (tag === 'ul' || tag === 'ol') return 'list';
    if (tag === 'blockquote' || element.classList?.contains('markdown-alert')) return 'quote';
    if (tag === 'hr') return 'hr';
    if (tag === 'details') return 'details';
    return 'paragraph';
}

/**
 * Assign stable source-line anchors to rendered top-level blocks.
 * @param {HTMLElement} root
 * @param {string} markdown
 */
export function annotateSourceLines(root, markdown) {
    if (!root || typeof markdown !== 'string' || !markdown) return;

    const sourceBlocks = extractMarkdownBlockStarts(markdown);
    const renderedBlocks = Array.from(root.querySelectorAll(SOURCE_BLOCK_SELECTOR))
        .filter((element) => !element.parentElement?.closest(SOURCE_BLOCK_SELECTOR));

    root.querySelectorAll('[data-source-line]').forEach((element) => {
        element.removeAttribute('data-source-line');
    });

    let sourceIndex = 0;
    for (const element of renderedBlocks) {
        const type = renderedBlockType(element);
        const match = sourceBlocks.findIndex((block, index) => index >= sourceIndex && block.type === type);
        if (match < 0) continue;

        element.setAttribute('data-source-line', String(sourceBlocks[match].line));
        sourceIndex = match + 1;
    }
}
