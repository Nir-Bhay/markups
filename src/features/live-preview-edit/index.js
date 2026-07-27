/**
 * Live Preview Edit POC
 * Lets users edit rendered preview content and syncs best-effort Markdown back
 * to the Monaco source editor. This intentionally stays behind an explicit
 * toggle because HTML→Markdown round-tripping is lossy for complex blocks.
 * @module features/live-preview-edit
 */

import { debounce } from '../../utils/debounce.js';

const NON_EDITABLE_SELECTOR = [
    'button',
    'iframe',
    'video',
    'audio',
    '.preview-video',
    '.code-block-header',
    '.code-copy-btn',
    '[data-live-edit-ignore]'
].join(',');

const EDITABLE_BLOCK_SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote', 'ul', 'ol',
    'table', 'hr', 'details', '.preview-video'
].join(',');

const BLOCK_TAGS = new Set([
    'ARTICLE', 'SECTION', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TR',
    'HR', 'DETAILS', 'SUMMARY'
]);

function collapseWhitespace(value) {
    return String(value || '').replace(/[\t\n\r ]+/g, ' ');
}

function escapePipes(value) {
    return String(value || '').replace(/\|/g, '\\|');
}

function trimBlankLines(value) {
    return String(value || '').replace(/\n{3,}/g, '\n\n').trim();
}

function textContent(node) {
    return collapseWhitespace(node.textContent || '').trim();
}

function serializeChildren(node, context = {}) {
    return Array.from(node.childNodes)
        .map((child) => serializeNode(child, context))
        .join('');
}

function serializeInlineChildren(node, context = {}) {
    return serializeChildren(node, { ...context, inline: true }).replace(/\n{2,}/g, ' ').trim();
}

function getCodeLanguage(code) {
    const match = code?.className?.match(/language-([\w#+-]+)/i);
    return match ? match[1].toLowerCase() : '';
}

function serializeList(listNode, ordered = false, depth = 0) {
    const items = Array.from(listNode.children).filter((child) => child.tagName === 'LI');
    return items.map((li, index) => {
        const nestedLists = Array.from(li.children).filter((child) => child.tagName === 'UL' || child.tagName === 'OL');
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul,ol').forEach((nested) => nested.remove());
        const body = serializeInlineChildren(clone).replace(/^\s+|\s+$/g, '') || textContent(clone);
        const marker = ordered ? `${index + 1}.` : '-';
        const indent = '  '.repeat(depth);
        const nested = nestedLists
            .map((nestedList) => serializeList(nestedList, nestedList.tagName === 'OL', depth + 1).trimEnd())
            .filter(Boolean)
            .join('\n');
        return `${indent}${marker} ${body}${nested ? `\n${nested}` : ''}`;
    }).join('\n') + '\n\n';
}

function serializeTable(table) {
    const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
        Array.from(row.children).map((cell) => escapePipes(textContent(cell)))
    ).filter((cells) => cells.length > 0);

    if (rows.length === 0) return '';

    const [head, ...body] = rows;
    const separator = head.map(() => '---');
    return [head, separator, ...body]
        .map((cells) => `| ${cells.join(' | ')} |`)
        .join('\n') + '\n\n';
}

function serializePreviewVideo(node) {
    const video = node.querySelector('video[src]');
    if (video) return `${video.getAttribute('src')}\n\n`;

    const iframe = node.querySelector('iframe[src]');
    if (!iframe) return '';

    const src = iframe.getAttribute('src') || '';
    const youtube = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^/?#]+)/i);
    if (youtube) return `https://youtu.be/${decodeURIComponent(youtube[1])}\n\n`;

    const vimeo = src.match(/player\.vimeo\.com\/video\/([^/?#]+)/i);
    if (vimeo) return `https://vimeo.com/${decodeURIComponent(vimeo[1])}\n\n`;

    return `${src}\n\n`;
}

function serializeNode(node, context = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
        const rawText = node.textContent || '';
        if (!context.inline && rawText.trim() === '') return '';
        return context.preserveWhitespace ? rawText : collapseWhitespace(rawText);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName;

    if (node.matches?.('.code-block-header,.code-copy-btn')) return '';
    if (node.matches?.('.preview-video')) return serializePreviewVideo(node);

    switch (tag) {
        case 'BR':
            return context.inline ? '  \n' : '\n';
        case 'STRONG':
        case 'B':
            return `**${serializeInlineChildren(node, context)}**`;
        case 'EM':
        case 'I':
            return `*${serializeInlineChildren(node, context)}*`;
        case 'S':
        case 'DEL':
            return `~~${serializeInlineChildren(node, context)}~~`;
        case 'CODE': {
            if (node.parentElement?.tagName === 'PRE') return node.textContent || '';
            return `\`${(node.textContent || '').replace(/`/g, '\\`')}\``;
        }
        case 'A': {
            const href = node.getAttribute('href') || '';
            const label = serializeInlineChildren(node, context) || href;
            if (!href || label === href) return href;
            return `[${label}](${href})`;
        }
        case 'IMG': {
            const src = node.getAttribute('src') || '';
            const alt = node.getAttribute('alt') || '';
            return src ? `![${alt}](${src})` : '';
        }
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6': {
            const level = Number(tag.slice(1));
            return `${'#'.repeat(level)} ${serializeInlineChildren(node)}\n\n`;
        }
        case 'P': {
            const inline = serializeInlineChildren(node);
            return inline ? `${inline}\n\n` : '';
        }
        case 'PRE': {
            const code = node.querySelector('code');
            const lang = getCodeLanguage(code);
            const body = (code ? code.textContent : node.textContent || '').replace(/\n+$/g, '');
            return `\`\`\`${lang}\n${body}\n\`\`\`\n\n`;
        }
        case 'BLOCKQUOTE': {
            const inner = trimBlankLines(serializeChildren(node));
            return inner.split('\n').map((line) => `> ${line}`.trimEnd()).join('\n') + '\n\n';
        }
        case 'UL':
            return serializeList(node, false);
        case 'OL':
            return serializeList(node, true);
        case 'TABLE':
            return serializeTable(node);
        case 'HR':
            return '---\n\n';
        case 'DETAILS': {
            const summary = node.querySelector(':scope > summary');
            const summaryText = summary ? serializeInlineChildren(summary) : 'Details';
            const clone = node.cloneNode(true);
            clone.querySelector(':scope > summary')?.remove();
            return `<details>\n<summary>${summaryText}</summary>\n\n${trimBlankLines(serializeChildren(clone))}\n</details>\n\n`;
        }
        default: {
            const content = serializeChildren(node, context);
            if (!content.trim()) return '';
            return BLOCK_TAGS.has(tag) && !context.inline ? `${trimBlankLines(content)}\n\n` : content;
        }
    }
}

/**
 * Convert editable preview DOM back to Markdown. Best-effort and intentionally
 * conservative: it covers common writing blocks and preserves raw text for the rest.
 * @param {HTMLElement} root
 * @returns {string}
 */
export function serializePreviewToMarkdown(root) {
    if (!root) return '';

    const clone = root.cloneNode(true);
    clone.querySelectorAll(NON_EDITABLE_SELECTOR).forEach((node) => {
        if (node.closest('.preview-video')) return;
        node.remove();
    });

    const rootIsSerializableBlock =
        clone.nodeType === Node.ELEMENT_NODE &&
        clone.matches?.(EDITABLE_BLOCK_SELECTOR) &&
        !['ARTICLE', 'SECTION'].includes(clone.tagName);

    const markdown = rootIsSerializableBlock
        ? serializeNode(clone)
        : serializeChildren(clone);

    return trimBlankLines(markdown) + '\n';
}

function isBlank(line) {
    return !String(line || '').trim();
}

function findMarkdownBlockRange(lines, lineIndex) {
    const maxIndex = Math.max(0, lines.length - 1);
    let index = Math.min(Math.max(0, lineIndex), maxIndex);

    while (index < lines.length && isBlank(lines[index])) index++;
    if (index >= lines.length) return { start: maxIndex, end: lines.length };

    const line = lines[index] || '';

    if (/^```/.test(line)) {
        let end = index + 1;
        while (end < lines.length && !/^```/.test(lines[end])) end++;
        return { start: index, end: Math.min(lines.length, end + 1) };
    }

    if (/^#{1,6}\s+/.test(line) || /^---+$/.test(line)) {
        return { start: index, end: index + 1 };
    }

    if (/^\|/.test(line)) {
        let end = index + 1;
        while (end < lines.length && /^\|/.test(lines[end])) end++;
        return { start: index, end };
    }

    if (/^>\s?/.test(line)) {
        let end = index + 1;
        while (end < lines.length && /^>\s?/.test(lines[end])) end++;
        return { start: index, end };
    }

    if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
        let end = index + 1;
        while (
            end < lines.length &&
            !isBlank(lines[end]) &&
            (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(lines[end]) || /^\s{2,}\S/.test(lines[end]))
        ) {
            end++;
        }
        return { start: index, end };
    }

    let start = index;
    while (start > 0 && !isBlank(lines[start - 1])) start--;
    let end = index + 1;
    while (end < lines.length && !isBlank(lines[end])) end++;
    return { start, end };
}

/**
 * Replace one Markdown source block using the source line stored on a preview block.
 * Falls back to whole-preview serialization when no reliable source line exists.
 * @param {string} sourceMarkdown
 * @param {number} sourceLine 1-based source line
 * @param {string} blockMarkdown serialized block Markdown
 * @returns {string}
 */
export function replaceMarkdownBlockAtLine(sourceMarkdown, sourceLine, blockMarkdown) {
    const lines = String(sourceMarkdown || '').split('\n');
    const index = Math.max(0, Number(sourceLine || 1) - 1);
    const { start, end } = findMarkdownBlockRange(lines, index);
    const replacement = trimBlankLines(blockMarkdown).split('\n');
    const nextLines = [
        ...lines.slice(0, start),
        ...replacement,
        ...lines.slice(end)
    ];

    return trimBlankLines(nextLines.join('\n')) + '\n';
}

export class LivePreviewEditController {
    constructor({
        output,
        toggle,
        markdownToggle,
        getSourceMarkdown,
        onMarkdownChange,
        onExit,
        showToast,
        debounceMs = 450
    } = {}) {
        this.output = typeof output === 'string' ? document.querySelector(output) : output;
        this.toggle = typeof toggle === 'string' ? document.querySelector(toggle) : toggle;
        this.markdownToggle = typeof markdownToggle === 'string' ? document.querySelector(markdownToggle) : markdownToggle;
        this.getSourceMarkdown = getSourceMarkdown;
        this.onMarkdownChange = onMarkdownChange;
        this.onExit = onExit;
        this.showToast = showToast;
        this.enabled = false;
        this._lastEditedBlock = null;
        this._handleInput = debounce(() => this._syncFromPreview(), debounceMs);
        this._rememberActiveBlock = () => {
            this._lastEditedBlock = this._getActiveBlock() || this._lastEditedBlock;
        };
        this._handleKeydown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this._syncFromPreview();
                this.showToast?.('Preview edits synced to Markdown', 'success', 1200);
            }
        };
    }

    initialize() {
        if (!this.output || !this.toggle) return;
        this.toggle.addEventListener('click', () => this.toggleEditing(true));
        this.markdownToggle?.addEventListener('click', () => this.toggleEditing(false));
        this.refresh(this.output);
    }

    toggleEditing(force) {
        const next = typeof force === 'boolean' ? force : !this.enabled;
        if (next === this.enabled) return;
        // When leaving edit mode, sync while `enabled` is still true so the
        // final DOM edits are not dropped by _syncFromPreview's safety guard.
        if (!next) {
            this._syncFromPreview();
        }

        this.enabled = next;
        this.refresh();
        this.showToast?.(
            this.enabled
                ? 'Live preview editing enabled — changes sync back to Markdown'
                : 'Live preview editing disabled',
            this.enabled ? 'info' : 'success',
            2200
        );

        if (!this.enabled) {
            this.onExit?.();
        }
    }

    refresh(output = this.output) {
        if (output) this.output = output;
        if (!this.output || !this.toggle) return;

        this.toggle.classList.toggle('active', this.enabled);
        this.toggle.setAttribute('aria-pressed', String(this.enabled));
        this.markdownToggle?.classList.toggle('active', !this.enabled);
        this.markdownToggle?.setAttribute('aria-pressed', String(!this.enabled));
        this.output.classList.toggle('preview-content--editable', this.enabled);
        this.output.setAttribute('contenteditable', this.enabled ? 'true' : 'false');
        this.output.setAttribute('spellcheck', 'true');

        this.output.removeEventListener('input', this._handleInput);
        this.output.removeEventListener('keydown', this._handleKeydown);
        this.output.removeEventListener('keyup', this._rememberActiveBlock);
        this.output.removeEventListener('pointerup', this._rememberActiveBlock);
        this.output.removeEventListener('focusin', this._rememberActiveBlock);

        if (this.enabled) {
            this.output.addEventListener('input', this._handleInput);
            this.output.addEventListener('keydown', this._handleKeydown);
            this.output.addEventListener('keyup', this._rememberActiveBlock);
            this.output.addEventListener('pointerup', this._rememberActiveBlock);
            this.output.addEventListener('focusin', this._rememberActiveBlock);
            this.output.querySelectorAll(NON_EDITABLE_SELECTOR).forEach((node) => {
                node.setAttribute('contenteditable', 'false');
            });
        }
    }

    _getActiveBlock() {
        const selection = typeof document !== 'undefined' ? document.getSelection?.() : null;
        const anchor = selection?.anchorNode;
        const element = anchor?.nodeType === Node.ELEMENT_NODE ? anchor : anchor?.parentElement;
        const block = element?.closest?.(EDITABLE_BLOCK_SELECTOR);
        return block && this.output?.contains(block) ? block : null;
    }

    _serializeEditedMarkdown() {
        const block = this._getActiveBlock() || this._lastEditedBlock;
        const sourceMarkdown = this.getSourceMarkdown?.();
        const sourceLine = block?.getAttribute?.('data-source-line');

        if (block && sourceMarkdown && sourceLine) {
            return replaceMarkdownBlockAtLine(sourceMarkdown, Number(sourceLine), serializePreviewToMarkdown(block));
        }

        return serializePreviewToMarkdown(this.output);
    }

    _syncFromPreview() {
        if (!this.enabled || !this.output || !this.onMarkdownChange) return;
        const markdown = this._serializeEditedMarkdown();
        this.onMarkdownChange(markdown);
    }

    dispose() {
        this.output?.removeEventListener('input', this._handleInput);
        this.output?.removeEventListener('keydown', this._handleKeydown);
        this.output?.removeEventListener('keyup', this._rememberActiveBlock);
        this.output?.removeEventListener('pointerup', this._rememberActiveBlock);
        this.output?.removeEventListener('focusin', this._rememberActiveBlock);
    }
}

export function initLivePreviewEdit(options) {
    const controller = new LivePreviewEditController(options);
    controller.initialize();
    return controller;
}

export default {
    serializePreviewToMarkdown,
    LivePreviewEditController,
    initLivePreviewEdit
};
