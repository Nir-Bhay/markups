/**
 * Toolbar editor helpers and utilities
 * @module features/toolbar/utils
 */

import { editorService } from '../../core/editor/index.js';

export function uid() {
    return 'tb_' + Math.random().toString(36).slice(2, 9);
}

export function escHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

export function resolveEditor() {
    const fallbackEditor = typeof window !== 'undefined' ? window.editor : null;
    return editorService.getEditor() || fallbackEditor || null;
}

export function getDateFormatted(format = 'iso') {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    switch (format) {
        case 'iso':
            return now.toISOString().slice(0, 10);
        case 'long':
            return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        case 'short':
            return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
        case 'time':
            return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        case 'datetime':
            return `${now.toISOString().slice(0, 10)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        case 'unix':
            return String(Math.floor(now.getTime() / 1000));
        default:
            return now.toISOString().slice(0, 10);
    }
}

export function generateLorem(type = 'paragraph') {
    const sentences = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
        'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
        'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
        'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.',
        'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.',
        'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.',
    ];
    switch (type) {
        case 'sentence': return sentences[0];
        case 'paragraph': return sentences.slice(0, 5).join(' ');
        case 'short': return sentences.slice(0, 3).join(' ');
        case 'long': return sentences.join(' ') + ' ' + sentences.slice(0, 5).join(' ');
        default: return sentences.slice(0, 5).join(' ');
    }
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 3 ── EDITOR HELPERS (Wrap, Prefix, Insert, Transform)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Wrap selection with prefix and suffix
 */
export function wrapSelection(prefix, suffix) {
    const editor = resolveEditor();
    if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);

    const fullRange = {
        startLineNumber: selection.startLineNumber,
        startColumn: Math.max(1, selection.startColumn - prefix.length),
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn + suffix.length
    };

    const extendedText = editor.getModel().getValueInRange(fullRange);
    const isWrapped = extendedText.startsWith(prefix) && extendedText.endsWith(suffix);

    if (isWrapped && selectedText) {
        editor.executeEdits('toolbar', [{
            range: fullRange,
            text: selectedText
        }]);
    } else {
        editor.executeEdits('toolbar', [{
            range: selection,
            text: `${prefix}${selectedText || 'text'}${suffix}`
        }]);

        if (!selectedText) {
            const newPos = {
                lineNumber: selection.startLineNumber,
                column: selection.startColumn + prefix.length
            };
            editor.setSelection({
                startLineNumber: newPos.lineNumber,
                startColumn: newPos.column,
                endLineNumber: newPos.lineNumber,
                endColumn: newPos.column + 4
            });
        }
    }
    editor.focus();
}

/**
 * Wrap selection with HTML tag
 */
export function wrapSelectionHtml(tag, attrs = '') {
    const attrStr = attrs ? ' ' + attrs : '';
    wrapSelection(`<${tag}${attrStr}>`, `</${tag}>`);
}

/**
 * Add prefix to current line(s), toggle-aware
 */
export function prefixLine(prefix) {
    const editor = resolveEditor();
    if (!editor) return;

    const selection = editor.getSelection();
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    const edits = [];
    let allHavePrefix = true;

    // Check if all selected lines already have the prefix
    for (let i = startLine; i <= endLine; i++) {
        const _content = editor.getModel().getLineContent(i);
        if (!_content.startsWith(prefix)) {
            allHavePrefix = false;
            break;
        }
    }

    for (let i = startLine; i <= endLine; i++) {
        const _content = editor.getModel().getLineContent(i);
        if (allHavePrefix) {
            // Remove prefix
            edits.push({
                range: {
                    startLineNumber: i,
                    startColumn: 1,
                    endLineNumber: i,
                    endColumn: prefix.length + 1
                },
                text: ''
            });
        } else {
            // Add prefix
            edits.push({
                range: {
                    startLineNumber: i,
                    startColumn: 1,
                    endLineNumber: i,
                    endColumn: 1
                },
                text: prefix
            });
        }
    }

    editor.executeEdits('toolbar', edits);
    editor.focus();
}

/**
 * Insert text at cursor
 */
export function insertText(text) {
    const editor = resolveEditor();
    if (!editor) return;

    const selection = editor.getSelection();
    editor.executeEdits('toolbar', [{
        range: selection,
        text
    }]);
    editor.focus();
}

/**
 * Replace entire selection with text
 */
export function replaceSelection(text) {
    const editor = resolveEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    editor.executeEdits('toolbar', [{
        range: selection,
        text: text
    }]);
    editor.focus();
}

/**
 * Get current selection text
 */
export function getSelection() {
    const editor = resolveEditor();
    if (!editor) return '';
    const selection = editor.getSelection();
    if (!selection) return '';
    return editor.getModel().getValueInRange(selection) || '';
}

/**
 * Transform selected text
 */
export function transformSelection(transformFn) {
    const editor = resolveEditor();
    if (!editor) return;

    const selection = editor.getSelection();
    const text = editor.getModel().getValueInRange(selection);
    if (!text) return;

    editor.executeEdits('toolbar', [{
        range: selection,
        text: transformFn(text)
    }]);
    editor.focus();
}

/**
 * Insert link with smart detection
 */
export function insertLink() {
    const sel = getSelection();
    const urlPattern = /^https?:\/\//;
    if (urlPattern.test(sel)) {
        replaceSelection(`[link text](${sel})`);
    } else {
        const linkText = sel || 'link text';
        replaceSelection(`[${linkText}](url)`);
    }
}

/**
 * Insert image
 */
export function insertImage() {
    const sel = getSelection();
    const altText = sel || 'alt text';
    replaceSelection(`![${altText}](image-url)`);
}

/**
 * Insert table with specified dimensions
 */
export function insertTable(rows = 3, cols = 3) {
    const header = '| ' + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
    const separator = '|' + Array.from({ length: cols }, () => '----------|').join('');
    const bodyRows = Array.from({ length: rows - 1 }, (_, r) =>
        '| ' + Array.from({ length: cols }, (_, c) => `Cell ${r * cols + c + 1}   `).join(' | ') + ' |'
    );
    insertText('\n' + [header, separator, ...bodyRows].join('\n') + '\n');
}
