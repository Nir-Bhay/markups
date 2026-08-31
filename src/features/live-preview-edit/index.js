/**
 * Live Preview Edit POC
 * Lets users edit rendered preview content and syncs best-effort Markdown back
 * to the Monaco source editor. This intentionally stays behind an explicit
 * toggle because HTML→Markdown round-tripping is lossy for complex blocks.
 * @module features/live-preview-edit
 */

import { debounce } from '../../utils/debounce.js';
import { serializeVideoMarkdown } from '../video-controls/index.js';
import { formatImageAttributeBlock } from '../image-controls/index.js';

const NON_EDITABLE_SELECTOR = [
    'button',
    'iframe',
    'video',
    'audio',
    'img',
    '.preview-image',
    '.preview-video',
    '.preview-video-hitbox',
    '.preview-video-edit-btn',
    '.preview-video-date',
    '.preview-video-caption',
    '.preview-video-frame',
    '.code-block-header',
    '.code-copy-btn',
    '[data-live-edit-ignore]'
].join(',');

// UI chrome stripped before HTML→Markdown. Keep img / .preview-image /
// .preview-video so Document Mode round-trips media instead of deleting it.
const SERIALIZE_STRIP_SELECTOR = [
    'button',
    '.preview-video-hitbox',
    '.preview-video-edit-btn',
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

/**
 * Resolve the Markdown image URL that should be written back to source.
 * Preview rendering may replace markups-img: refs with data:/blob: URLs;
 * processPreviewImages stores the original markdown src on data-original-src.
 * @param {HTMLElement} node
 * @returns {string}
 */
function resolveMarkdownImageSrc(node) {
    const original = node.getAttribute('data-original-src') || node.dataset?.originalSrc || '';
    const imageUrl = node.getAttribute('data-image-url') || node.dataset?.imageUrl || '';
    const src = node.getAttribute('src') || '';

    const candidates = [original, imageUrl, src];
    for (const candidate of candidates) {
        if (!candidate) continue;
        if (candidate.startsWith('markups-img:')) return candidate;
        if (!candidate.startsWith('data:') && !candidate.startsWith('blob:')) {
            return candidate;
        }
    }

    // Never write data:/blob: back into Markdown — that breaks Document Mode
    // switches and can exceed storage quota.
    return '';
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
    return serializeVideoMarkdown(node);
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
            // Prefer the markdown source URL (often markups-img:…) over the
            // resolved data:/blob: preview src so Document Mode never rewrites
            // stable image refs into huge duplicated URLs.
            const src = resolveMarkdownImageSrc(node);
            const alt = node.getAttribute('alt') || '';
            if (!src) return '';
            const attrs = {
                mode: node.dataset?.imageMode,
                width: node.dataset?.imageWidth,
                align: node.dataset?.imageAlign
            };
            const block = formatImageAttributeBlock(attrs);
            return block ? `![${alt}](${src}) ${block}` : `![${alt}](${src})`;
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
    clone.querySelectorAll(SERIALIZE_STRIP_SELECTOR).forEach((node) => {
        // Video chrome lives inside .preview-video; serializePreviewVideo
        // reads attrs from the wrapper, so leave the whole widget intact.
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

/**
 * Guard against Document Mode sync poisoning Markdown with inline data:/blob:
 * media that used to be stable markups-img / remote URLs.
 */
function looksLikeBrokenMediaMarkdown(nextMarkdown, sourceMarkdown) {
    const next = String(nextMarkdown || '');
    const source = String(sourceMarkdown || '');
    const sourceRefs = (source.match(/markups-img:img_\w+/g) || []).length;
    const nextRefs = (next.match(/markups-img:img_\w+/g) || []).length;
    if (sourceRefs > 0 && nextRefs < sourceRefs) return true;

    const nextDataImages = (next.match(/!\[[^\]]*\]\(data:/g) || []).length;
    const sourceDataImages = (source.match(/!\[[^\]]*\]\(data:/g) || []).length;
    if (nextDataImages > sourceDataImages) return true;

    return false;
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
        this.initialized = false;
        this._dirty = false;
        this._lastEditedBlock = null;
        this._handleInput = debounce(() => this._syncFromPreview(), debounceMs);
        this._markDirty = () => {
            this._dirty = true;
            this._rememberActiveBlock();
            this._handleInput();
        };
        this._rememberActiveBlock = () => {
            this._lastEditedBlock = this._getActiveBlock() || this._lastEditedBlock;
        };
        this._handleKeydown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this._dirty = true;
                this.syncFromPreview();
                this.showToast?.('Preview edits synced to Markdown', 'success', 1200);
            }
        };
    }

    initialize() {
        if (!this.output || !this.toggle || this.initialized) return;
        this.initialized = true;
        this.toggle.addEventListener('click', () => this.toggleEditing(true));
        this.markdownToggle?.addEventListener('click', () => this.toggleEditing(false));
        this.refresh(this.output);
    }

    toggleEditing(force) {
        const next = typeof force === 'boolean' ? force : !this.enabled;
        if (next === this.enabled) return;
        // When leaving edit mode, flush any pending debounce and sync while
        // `enabled` is still true so final DOM edits are not dropped.
        if (!next) {
            this.syncFromPreview();
        }

        this.enabled = next;
        this._dirty = false;
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

        if (this.enabled) {
            this.output.setAttribute('role', 'textbox');
            this.output.setAttribute('aria-multiline', 'true');
            this.output.setAttribute('aria-label', 'Editable document preview');
        } else {
            this.output.removeAttribute('role');
            this.output.removeAttribute('aria-multiline');
            this.output.removeAttribute('aria-label');
        }

        this.output.removeEventListener('input', this._markDirty);
        this.output.removeEventListener('keydown', this._handleKeydown);
        this.output.removeEventListener('keyup', this._rememberActiveBlock);
        this.output.removeEventListener('pointerup', this._rememberActiveBlock);
        this.output.removeEventListener('focusin', this._rememberActiveBlock);

        if (this.enabled) {
            this.output.addEventListener('input', this._markDirty);
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

        // Large-doc guard: when we have no block anchor the fallback serializes
        // the ENTIRE preview DOM to Markdown. For 50MB+ documents doing that on
        // every keystroke can freeze the UI. In that case skip the full-preview
        // serialize (block-level edits above still apply) and treat the edit as
        // a no-op sync so we never block the main thread on a huge doc.
        if (sourceMarkdown && sourceMarkdown.length > 50 * 1024 * 1024) {
            if (!this._largeDocWarned) {
                this._largeDocWarned = true;
                this.showToast?.(
                    'Document is very large — full-preview sync disabled; per-block edits still apply',
                    'warning',
                    3000
                );
            }
            return sourceMarkdown; // idempotent no-op (matches source → skipped by _syncFromPreview)
        }

        return serializePreviewToMarkdown(this.output);
    }

    _syncFromPreview() {
        if (!this.enabled || !this.output || !this.onMarkdownChange || !this._dirty) return;
        const sourceMarkdown = this.getSourceMarkdown?.() || '';
        const markdown = this._serializeEditedMarkdown();
        if (!markdown || looksLikeBrokenMediaMarkdown(markdown, sourceMarkdown)) {
            this.showToast?.('Skipped unsafe Document Mode sync to protect images/videos', 'warning', 2200);
            this._dirty = false;
            return;
        }
        // Idempotency: if the serialize produced exactly the current source, the sync
        // is a no-op. Dropping it prevents redundant full-document writes — and, when
        // combined with a stale block reference, avoids doubling a paragraph on repeat
        // toggles / saves / view switches.
        if (markdown === sourceMarkdown) {
            this._dirty = false;
            return;
        }
        this.onMarkdownChange(markdown);
        this._dirty = false;
        // Drop the stale edited-block reference. After the re-render triggered by the
        // write above (or by a mode/tab switch), the old block may point at a detached
        // node whose data-source-line no longer maps to the same region — reusing it
        // later made replaceMarkdownBlockAtLine INSERT instead of replace, doubling the
        // block. Re-resolve from the live selection next edit instead.
        this._lastEditedBlock = null;
    }

    /**
     * Flush pending debounced edits and sync preview → Markdown immediately.
     * Used by mode toggles and tab switches so Document Mode state is never
     * saved half-written (which previously broke image URLs).
     */
    syncFromPreview() {
        this._handleInput?.cancel?.();
        this._syncFromPreview();
    }

    dispose() {
        this._handleInput?.cancel?.();
        this.output?.removeEventListener('input', this._markDirty);
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
