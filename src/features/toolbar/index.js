/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║          Enhanced Toolbar Feature Module v2.0                     ║
 * ║   Advanced markdown formatting toolbar with dropdowns,            ║
 * ║   custom options, popovers, and user preferences                  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * @module features/toolbar
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';

/* ═══════════════════════════════════════════════════════════════════
   SECTION 1 ── CONSTANTS & CONFIG
   ═══════════════════════════════════════════════════════════════════ */

const TOOLBAR_STORAGE_KEY = 'markups_toolbar_prefs';

const COLORS = [
    { label: 'Red', hex: '#ef4444' },
    { label: 'Orange', hex: '#f97316' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Yellow', hex: '#eab308' },
    { label: 'Lime', hex: '#84cc16' },
    { label: 'Green', hex: '#22c55e' },
    { label: 'Teal', hex: '#14b8a6' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Blue', hex: '#3b82f6' },
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Purple', hex: '#a855f7' },
    { label: 'Pink', hex: '#ec4899' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Gray', hex: '#6b7280' },
    { label: 'White', hex: '#ffffff' },
    { label: 'Black', hex: '#000000' },
];

const HIGHLIGHT_COLORS = [
    { label: 'Yellow', hex: '#fef08a' },
    { label: 'Green', hex: '#bbf7d0' },
    { label: 'Blue', hex: '#bfdbfe' },
    { label: 'Purple', hex: '#e9d5ff' },
    { label: 'Pink', hex: '#fbcfe8' },
    { label: 'Orange', hex: '#fed7aa' },
    { label: 'Red', hex: '#fecaca' },
    { label: 'Cyan', hex: '#a5f3fc' },
];

const EMOJI_SETS = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😛', '🤔', '🤫', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😷', '🤒', '🤕'],
    'Hands': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪', '🦾', '🖕'],
    'Objects': ['⭐', '🔥', '💯', '❤️', '💔', '💡', '📌', '📎', '✏️', '📝', '📁', '📂', '🔒', '🔓', '🔑', '🔔', '📢', '💬', '💭', '🏷️', '📊', '📈', '📉', '⚡', '🎯', '🚀', '✅', '❌', '⚠️', 'ℹ️', '❓', '❗'],
    'Arrows': ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '🔄', '🔃', '🔀', '🔁', '🔂', '▶️', '◀️', '🔼', '🔽', '⏩', '⏪', '⏫', '⏬'],
};

export const CALLOUT_TYPES = [
    { type: 'note', icon: 'N', label: 'Note', color: '#3b82f6' },
    { type: 'tip', icon: 'T', label: 'Tip', color: '#22c55e' },
    { type: 'important', icon: '!', label: 'Important', color: '#a855f7' },
    { type: 'warning', icon: '!', label: 'Warning', color: '#f59e0b' },
    { type: 'caution', icon: '!', label: 'Caution', color: '#ef4444' },
    { type: 'info', icon: 'i', label: 'Info', color: '#06b6d4' },
    { type: 'success', icon: '✓', label: 'Success', color: '#22c55e' },
    { type: 'question', icon: '?', label: 'Question', color: '#6366f1' },
    { type: 'quote', icon: '"', label: 'Quote', color: '#6b7280' },
    { type: 'bug', icon: 'B', label: 'Bug', color: '#ef4444' },
    { type: 'example', icon: 'E', label: 'Example', color: '#14b8a6' },
];

const CODE_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css',
    'scss', 'sql', 'bash', 'shell', 'powershell', 'json', 'yaml',
    'xml', 'markdown', 'dockerfile', 'graphql', 'lua', 'r', 'dart',
    'plaintext',
];

const SPECIAL_CHARS = [
    { ch: '©', name: 'Copyright' },
    { ch: '®', name: 'Registered' },
    { ch: '™', name: 'Trademark' },
    { ch: '°', name: 'Degree' },
    { ch: '±', name: 'Plus-minus' },
    { ch: '×', name: 'Multiply' },
    { ch: '÷', name: 'Divide' },
    { ch: '≠', name: 'Not equal' },
    { ch: '≈', name: 'Approx' },
    { ch: '≤', name: 'Less-equal' },
    { ch: '≥', name: 'Greater-equal' },
    { ch: '∞', name: 'Infinity' },
    { ch: '√', name: 'Sqrt' },
    { ch: 'π', name: 'Pi' },
    { ch: 'Δ', name: 'Delta' },
    { ch: 'Σ', name: 'Sigma' },
    { ch: '→', name: 'Arrow right' },
    { ch: '←', name: 'Arrow left' },
    { ch: '↑', name: 'Arrow up' },
    { ch: '↓', name: 'Arrow down' },
    { ch: '⇒', name: 'Double arrow' },
    { ch: '•', name: 'Bullet' },
    { ch: '…', name: 'Ellipsis' },
    { ch: '—', name: 'Em dash' },
    { ch: '–', name: 'En dash' },
    { ch: '¶', name: 'Paragraph' },
    { ch: '§', name: 'Section' },
    { ch: '†', name: 'Dagger' },
    { ch: '‡', name: 'Double dagger' },
    { ch: '★', name: 'Star' },
    { ch: '☆', name: 'Star outline' },
    { ch: '♠', name: 'Spade' },
    { ch: '♥', name: 'Heart' },
    { ch: '♦', name: 'Diamond' },
    { ch: '♣', name: 'Club' },
    { ch: '✓', name: 'Check' },
    { ch: '✗', name: 'Cross' },
];

const TABLE_MAX = 10;

/* ═══════════════════════════════════════════════════════════════════
   SECTION 2 ── UTILITY HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function uid() {
    return 'tb_' + Math.random().toString(36).slice(2, 9);
}

function escHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

function resolveEditor() {
    const fallbackEditor = typeof window !== 'undefined' ? window.editor : null;
    return editorService.getEditor() || fallbackEditor || null;
}

function getDateFormatted(format = 'iso') {
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

function generateLorem(type = 'paragraph') {
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
function wrapSelection(prefix, suffix) {
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
function wrapSelectionHtml(tag, attrs = '') {
    const attrStr = attrs ? ' ' + attrs : '';
    wrapSelection(`<${tag}${attrStr}>`, `</${tag}>`);
}

/**
 * Add prefix to current line(s), toggle-aware
 */
function prefixLine(prefix) {
    const editor = resolveEditor();
    if (!editor) return;

    const selection = editor.getSelection();
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    const edits = [];
    let allHavePrefix = true;

    // Check if all selected lines already have the prefix
    for (let i = startLine; i <= endLine; i++) {
        const content = editor.getModel().getLineContent(i);
        if (!content.startsWith(prefix)) {
            allHavePrefix = false;
            break;
        }
    }

    for (let i = startLine; i <= endLine; i++) {
        const content = editor.getModel().getLineContent(i);
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
function insertText(text) {
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
function replaceSelection(text) {
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
function getSelection() {
    const editor = resolveEditor();
    if (!editor) return '';
    const selection = editor.getSelection();
    if (!selection) return '';
    return editor.getModel().getValueInRange(selection) || '';
}

/**
 * Transform selected text
 */
function transformSelection(transformFn) {
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
function insertLink() {
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
function insertImage() {
    const sel = getSelection();
    const altText = sel || 'alt text';
    replaceSelection(`![${altText}](image-url)`);
}

/**
 * Insert table with specified dimensions
 */
function insertTable(rows = 3, cols = 3) {
    const header = '| ' + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
    const separator = '|' + Array.from({ length: cols }, () => '----------|').join('');
    const bodyRows = Array.from({ length: rows - 1 }, (_, r) =>
        '| ' + Array.from({ length: cols }, (_, c) => `Cell ${r * cols + c + 1}   `).join(' | ') + ' |'
    );
    insertText('\n' + [header, separator, ...bodyRows].join('\n') + '\n');
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 4 ── USER PREFERENCES MANAGER
   ═══════════════════════════════════════════════════════════════════ */

class ToolbarPreferences {
    constructor() {
        this._prefs = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(TOOLBAR_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    _save() {
        try {
            localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(this._prefs));
        } catch { /* ignore */ }
    }

    get(key, fallback = null) {
        return this._prefs[key] !== undefined ? this._prefs[key] : fallback;
    }

    set(key, value) {
        this._prefs[key] = value;
        this._save();
    }

    get recentColors() { return this.get('recentColors', []); }
    addRecentColor(hex) {
        let arr = this.recentColors.filter(c => c !== hex);
        arr.unshift(hex);
        if (arr.length > 8) arr = arr.slice(0, 8);
        this.set('recentColors', arr);
    }

    get recentEmojis() { return this.get('recentEmojis', []); }
    addRecentEmoji(emoji) {
        let arr = this.recentEmojis.filter(e => e !== emoji);
        arr.unshift(emoji);
        if (arr.length > 16) arr = arr.slice(0, 16);
        this.set('recentEmojis', arr);
    }

    get recentLanguages() { return this.get('recentLangs', []); }
    addRecentLanguage(lang) {
        let arr = this.recentLanguages.filter(l => l !== lang);
        arr.unshift(lang);
        if (arr.length > 5) arr = arr.slice(0, 5);
        this.set('recentLangs', arr);
    }

    get customSnippets() { return this.get('snippets', []); }
    saveSnippets(snippets) { this.set('snippets', snippets); }

    get hiddenButtons() { return this.get('hiddenButtons', []); }
    toggleButtonVisibility(id) {
        let arr = this.hiddenButtons;
        if (arr.includes(id)) {
            arr = arr.filter(x => x !== id);
        } else {
            arr.push(id);
        }
        this.set('hiddenButtons', arr);
    }
}

const prefs = new ToolbarPreferences();

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5 ── POPOVER / DROPDOWN SYSTEM
   ═══════════════════════════════════════════════════════════════════ */

class PopoverManager {
    constructor() {
        this._active = null;
        this._onOutsideClick = (e) => {
            if (this._active && !this._active.el.contains(e.target) &&
                !this._active.trigger?.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('mousedown', this._onOutsideClick);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._active) this.close();
        });
    }

    open(triggerEl, contentEl, options = {}) {
        this.close();

        const wrapper = document.createElement('div');
        wrapper.className = 'tb-popover';

        // Position
        const rect = triggerEl.getBoundingClientRect();
        const pos = options.position || 'below';

        wrapper.style.cssText = `
      position: fixed;
      z-index: 15000;
      ${pos === 'below' ? `top: ${rect.bottom + 4}px;` : `bottom: ${window.innerHeight - rect.top + 4}px;`}
      left: ${rect.left}px;
    `;

        wrapper.appendChild(contentEl);
        document.body.appendChild(wrapper);

        // Adjust if off-screen
        requestAnimationFrame(() => {
            const wRect = wrapper.getBoundingClientRect();
            if (wRect.right > window.innerWidth - 8) {
                wrapper.style.left = `${window.innerWidth - wRect.width - 8}px`;
            }
            if (wRect.left < 8) {
                wrapper.style.left = '8px';
            }
            if (pos === 'below' && wRect.bottom > window.innerHeight - 8) {
                wrapper.style.top = '';
                wrapper.style.bottom = `${window.innerHeight - rect.top + 4}px`;
            }
        });

        this._active = { el: wrapper, trigger: triggerEl };
    }

    close() {
        if (this._active) {
            this._active.el.remove();
            this._active = null;
        }
    }

    get isOpen() { return !!this._active; }
}

const popover = new PopoverManager();

/* ═══════════════════════════════════════════════════════════════════
   SECTION 6 ── ENHANCED TOOLBAR BUTTONS DEFINITION
   ═══════════════════════════════════════════════════════════════════ */

const TOOLBAR_GROUPS = [
    /* ── Group: Undo/Redo ── */
    {
        id: 'history-group',
        buttons: [
            {
                id: 'undo',
                icon: '↶',
                title: 'Undo',
                shortcut: 'Ctrl+Z',
                action: () => {
                    const editor = resolveEditor();
                    if (editor) editor.trigger('toolbar', 'undo');
                }
            },
            {
                id: 'redo',
                icon: '↷',
                title: 'Redo',
                shortcut: 'Ctrl+Y',
                action: () => {
                    const editor = resolveEditor();
                    if (editor) editor.trigger('toolbar', 'redo');
                }
            },
        ]
    },
    { id: 'divider-0', type: 'divider' },

    /* ── Group: Text Format ── */
    {
        id: 'format-group',
        buttons: [
            {
                id: 'bold',
                icon: '<strong>B</strong>',
                title: 'Bold',
                shortcut: 'Ctrl+B',
                action: () => wrapSelection('**', '**')
            },
            {
                id: 'italic',
                icon: '<em>I</em>',
                title: 'Italic',
                shortcut: 'Ctrl+I',
                action: () => wrapSelection('*', '*')
            },
            {
                id: 'underline',
                icon: '<u>U</u>',
                title: 'Underline',
                shortcut: 'Ctrl+U',
                action: () => wrapSelectionHtml('u')
            },
            {
                id: 'strikethrough',
                icon: '<s>S</s>',
                title: 'Strikethrough',
                shortcut: 'Ctrl+Shift+S',
                action: () => wrapSelection('~~', '~~')
            },
            {
                id: 'mark',
                icon: '<mark style="padding:0 2px;border-radius:2px;">H</mark>',
                title: 'Highlight',
                action: () => wrapSelectionHtml('mark')
            },
            {
                id: 'superscript',
                icon: 'X<sup style="font-size:9px">2</sup>',
                title: 'Superscript',
                action: () => wrapSelectionHtml('sup')
            },
            {
                id: 'subscript',
                icon: 'X<sub style="font-size:9px">2</sub>',
                title: 'Subscript',
                action: () => wrapSelectionHtml('sub')
            },
            {
                id: 'kbd',
                icon: '<kbd style="font-size:10px;padding:1px 4px;border:1px solid rgba(255,255,255,0.2);border-radius:3px;">K</kbd>',
                title: 'Keyboard Key',
                action: () => wrapSelectionHtml('kbd')
            },
        ]
    },
    { id: 'divider-1', type: 'divider' },

    /* ── Group: Headings (dropdown) ── */
    {
        id: 'heading-dropdown',
        type: 'dropdown',
        icon: 'H',
        title: 'Headings',
        items: [
            { id: 'h1', label: 'Heading 1', icon: '<strong style="font-size:16px">H1</strong>', action: () => prefixLine('# ') },
            { id: 'h2', label: 'Heading 2', icon: '<strong style="font-size:14px">H2</strong>', action: () => prefixLine('## ') },
            { id: 'h3', label: 'Heading 3', icon: '<strong style="font-size:13px">H3</strong>', action: () => prefixLine('### ') },
            { id: 'h4', label: 'Heading 4', icon: '<strong style="font-size:12px">H4</strong>', action: () => prefixLine('#### ') },
            { id: 'h5', label: 'Heading 5', icon: '<strong style="font-size:11px">H5</strong>', action: () => prefixLine('##### ') },
            { id: 'h6', label: 'Heading 6', icon: '<strong style="font-size:10px">H6</strong>', action: () => prefixLine('###### ') },
        ]
    },
    { id: 'divider-2', type: 'divider' },

    /* ── Group: Lists ── */
    {
        id: 'list-group',
        buttons: [
            { id: 'ul', icon: '•', title: 'Bullet List', action: () => prefixLine('- ') },
            { id: 'ol', icon: '1.', title: 'Numbered List', action: () => prefixLine('1. ') },
            { id: 'task', icon: '☐', title: 'Task List', action: () => prefixLine('- [ ] ') },
        ]
    },
    { id: 'divider-3', type: 'divider' },

    /* ── Group: Code (dropdown) ── */
    {
        id: 'code-dropdown',
        type: 'dropdown',
        icon: '&lt;/&gt;',
        title: 'Code',
        buildItems: () => {
            const items = [
                { id: 'inline-code', label: 'Inline Code', icon: '`…`', shortcut: 'Ctrl+`', action: () => wrapSelection('`', '`') },
                { id: 'code-block-plain', label: 'Code Block', icon: '```', action: () => wrapSelection('```\n', '\n```') },
                { type: 'separator' },
                { type: 'label', label: 'Language Block:' },
            ];
            // Recent languages first
            const recent = prefs.recentLanguages;
            if (recent.length > 0) {
                recent.forEach(lang => {
                    items.push({
                        id: `code-${lang}`,
                        label: lang,
                        icon: '★',
                        action: () => {
                            wrapSelection(`\`\`\`${lang}\n`, '\n```');
                            prefs.addRecentLanguage(lang);
                        }
                    });
                });
                items.push({ type: 'separator' });
            }
            // All languages
            CODE_LANGUAGES.filter(l => !recent.includes(l)).forEach(lang => {
                items.push({
                    id: `code-${lang}`,
                    label: lang,
                    icon: '○',
                    action: () => {
                        wrapSelection(`\`\`\`${lang}\n`, '\n```');
                        prefs.addRecentLanguage(lang);
                    }
                });
            });
            return items;
        }
    },
    { id: 'divider-4', type: 'divider' },

    /* ── Group: Block Elements ── */
    {
        id: 'block-group',
        buttons: [
            { id: 'quote', icon: '"', title: 'Blockquote', action: () => prefixLine('> ') },
            { id: 'hr', icon: '—', title: 'Horizontal Rule', action: () => insertText('\n---\n') },
        ]
    },

    /* ── Callout/Admonition dropdown ── */
    {
        id: 'callout-dropdown',
        type: 'dropdown',
        icon: '📢',
        title: 'Callouts',
        items: CALLOUT_TYPES.map(c => ({
            id: `callout-${c.type}`,
            label: c.label,
            icon: c.icon,
            colorDot: c.color,
            action: () => {
                const sel = getSelection() || 'Content here';
                insertText(`\n> [!${c.type.toUpperCase()}]\n> ${sel}\n`);
            }
        }))
    },
    { id: 'divider-5', type: 'divider' },

    /* ── Group: Insert ── */
    {
        id: 'insert-dropdown',
        type: 'dropdown',
        icon: '➕',
        title: 'Insert',
        items: [
            { id: 'insert-link', label: 'Link', icon: '🔗', shortcut: 'Ctrl+K', action: insertLink },
            { id: 'insert-image', label: 'Image', icon: '🖼️', action: insertImage },
            { id: 'insert-table', label: 'Table…', icon: '📊', action: null, custom: 'table-picker' },
            { type: 'separator' },
            {
                id: 'insert-footnote', label: 'Footnote', icon: '📝', action: () => {
                    const id = 'fn-' + Date.now().toString(36).slice(-4);
                    insertText(`[^${id}]\n\n[^${id}]: Footnote text`);
                }
            },
            { id: 'insert-abbr', label: 'Abbreviation', icon: '🔤', action: () => insertText('\n*[ABBR]: Full Text\n') },
            { id: 'insert-deflist', label: 'Definition List', icon: '📖', action: () => insertText('\nTerm\n: Definition\n') },
            {
                id: 'insert-details',
                label: 'Collapsible',
                icon: '▸',
                action: () => {
                    const sel = getSelection() || 'Hidden content';
                    insertText(`\n<details>\n<summary>Click to expand</summary>\n\n${sel}\n\n</details>\n`);
                }
            },
            { type: 'separator' },
            { id: 'insert-math-inline', label: 'Math (inline)', icon: 'Σ', action: () => wrapSelection('$', '$') },
            { id: 'insert-math-block', label: 'Math (block)', icon: '∫', action: () => wrapSelection('\n$$\n', '\n$$\n') },
            { id: 'insert-mermaid', label: 'Mermaid Diagram', icon: '📈', action: () => insertText('\n```mermaid\ngraph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;\n```\n') },
            { type: 'separator' },
            { id: 'insert-toc', label: 'Table of Contents', icon: '📑', action: () => insertText('\n[[toc]]\n') },
            { id: 'insert-anchor', label: 'Anchor / ID', icon: '⚓', action: () => insertText('<a id="section-name"></a>') },
            { id: 'insert-comment', label: 'HTML Comment', icon: '💬', action: () => wrapSelection('<!-- ', ' -->') },
            { id: 'insert-br', label: 'Line Break', icon: '↵', action: () => insertText('<br>\n') },
    ]
    },
    { id: 'divider-6', type: 'divider' },

    /* ── Color picker (custom popover) ── */
    {
        id: 'text-color',
        type: 'color-picker',
        icon: '<span style="border-bottom:2px solid #ef4444;padding-bottom:1px;">A</span>',
        title: 'Text Color',
        mode: 'text'
    },
    {
        id: 'bg-color',
        type: 'color-picker',
        icon: '<span style="background:#fef08a;color:#000;padding:0 3px;border-radius:2px;">A</span>',
        title: 'Highlight Color',
        mode: 'highlight'
    },
    { id: 'divider-7', type: 'divider' },

    /* ── Emoji picker (custom popover) ── */
    {
        id: 'emoji-picker',
        type: 'emoji-picker',
        icon: '😊',
        title: 'Emoji'
    },

    /* ── Special Characters (custom popover) ── */
    {
        id: 'special-chars',
        type: 'special-chars',
        icon: '©',
        title: 'Special Characters'
    },
    { id: 'divider-8', type: 'divider' },

    /* ── Transform dropdown ── */
    {
        id: 'transform-dropdown',
        type: 'dropdown',
        icon: 'Aa',
        title: 'Transform Text',
        items: [
            { id: 'upper', label: 'UPPERCASE', icon: 'A', action: () => transformSelection(t => t.toUpperCase()) },
            { id: 'lower', label: 'lowercase', icon: 'a', action: () => transformSelection(t => t.toLowerCase()) },
            {
                id: 'titlecase', label: 'Title Case', icon: 'Tt', action: () => transformSelection(t =>
                    t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                )
            },
            {
                id: 'sentencecase', label: 'Sentence case', icon: 'Aa', action: () => transformSelection(t =>
                    t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
                )
            },
            { type: 'separator' },
            {
                id: 'sort-asc', label: 'Sort Lines A→Z', icon: '↑', action: () => transformSelection(t =>
                    t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')
                )
            },
            {
                id: 'sort-desc', label: 'Sort Lines Z→A', icon: '↓', action: () => transformSelection(t =>
                    t.split('\n').sort((a, b) => b.localeCompare(a)).join('\n')
                )
            },
            {
                id: 'reverse-lines', label: 'Reverse Lines', icon: '⇅', action: () => transformSelection(t =>
                    t.split('\n').reverse().join('\n')
                )
            },
            {
                id: 'unique-lines', label: 'Unique Lines', icon: '◎', action: () => transformSelection(t =>
                    [...new Set(t.split('\n'))].join('\n')
                )
            },
            {
                id: 'trim-lines', label: 'Trim Lines', icon: '⌧', action: () => transformSelection(t =>
                    t.split('\n').map(l => l.trim()).join('\n')
                )
            },
            { type: 'separator' },
            {
                id: 'remove-formatting', label: 'Remove Markdown', icon: '✕', action: () => transformSelection(t =>
                    t.replace(/[*_~`#>]/g, '').replace(/$$([^$$]+)\]\([^)]+\)/g, '\$1').replace(/!$$[^$$]*\]\([^)]+\)/g, '').trim()
                )
            },
            { id: 'encode-uri', label: 'URL Encode', icon: '%', action: () => transformSelection(t => encodeURIComponent(t)) },
            {
                id: 'decode-uri', label: 'URL Decode', icon: '🔓', action: () => transformSelection(t => {
                    try { return decodeURIComponent(t); } catch { return t; }
                })
            },
            { id: 'escape-html', label: 'Escape HTML', icon: '&lt;', action: () => transformSelection(t => escHtml(t)) },
        ]
    },
    { id: 'divider-9', type: 'divider' },

    /* ── Date/Time ── */
    {
        id: 'datetime-dropdown',
        type: 'dropdown',
        icon: '📅',
        title: 'Date / Time',
        items: [
            { id: 'date-iso', label: 'ISO Date (2024-01-15)', icon: '📅', action: () => insertText(getDateFormatted('iso')) },
            { id: 'date-long', label: 'Long Date (January 15, 2024)', icon: '📅', action: () => insertText(getDateFormatted('long')) },
            { id: 'date-short', label: 'Short Date (01/15/2024)', icon: '📅', action: () => insertText(getDateFormatted('short')) },
            { id: 'time-now', label: 'Current Time', icon: '🕐', action: () => insertText(getDateFormatted('time')) },
            { id: 'datetime-now', label: 'Date & Time', icon: '📅', action: () => insertText(getDateFormatted('datetime')) },
            { id: 'unix-ts', label: 'Unix Timestamp', icon: '⏱️', action: () => insertText(getDateFormatted('unix')) },
        ]
    },

    /* ── Lorem Ipsum ── */
    {
        id: 'lorem-dropdown',
        type: 'dropdown',
        icon: '📝',
        title: 'Lorem Ipsum',
        items: [
            { id: 'lorem-sentence', label: 'Sentence', icon: '•', action: () => insertText(generateLorem('sentence')) },
            { id: 'lorem-short', label: 'Short', icon: '▪', action: () => insertText(generateLorem('short')) },
            { id: 'lorem-paragraph', label: 'Paragraph', icon: '¶', action: () => insertText(generateLorem('paragraph')) },
            { id: 'lorem-long', label: 'Long', icon: '▣', action: () => insertText(generateLorem('long')) },
        ]
    },
    { id: 'divider-10', type: 'divider' },

    /* ── Snippets ── */
    {
        id: 'snippets',
        type: 'snippets',
        icon: '⚡',
        title: 'Snippets'
    },

    /* ── Indent/Outdent ── */
    {
        id: 'indent-group',
        buttons: [
            {
                id: 'indent',
                icon: '→',
                title: 'Indent',
                shortcut: 'Tab',
                action: () => prefixLine('  ')
            },
            {
                id: 'outdent',
                icon: '←',
                title: 'Outdent',
                shortcut: 'Shift+Tab',
                action: () => {
                    const editor = resolveEditor();
                    if (!editor) return;
                    const sel = editor.getSelection();
                    for (let i = sel.startLineNumber; i <= sel.endLineNumber; i++) {
                        const line = editor.getModel().getLineContent(i);
                        if (line.startsWith('  ')) {
                            editor.executeEdits('toolbar', [{
                                range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: 3 },
                                text: ''
                            }]);
                        } else if (line.startsWith('\t')) {
                            editor.executeEdits('toolbar', [{
                                range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: 2 },
                                text: ''
                            }]);
                        }
                    }
                    editor.focus();
                }
            },
        ]
    },
    { id: 'divider-11', type: 'divider' },

    /* ── Word Count / Settings ── */
    {
        id: 'word-count',
        type: 'word-count',
        icon: '🔢',
        title: 'Word Count'
    },
    {
        id: 'toolbar-settings',
        type: 'settings',
        icon: '⚙️',
        title: 'Toolbar Settings'
    },
];

/* ═══════════════════════════════════════════════════════════════════
   SECTION 7 ── STYLES
   ═══════════════════════════════════════════════════════════════════ */

function injectToolbarStyles() {
    if (document.getElementById('tb-enhanced-styles')) return;

    const s = document.createElement('style');
    s.id = 'tb-enhanced-styles';
    s.textContent = `
    /* ── Toolbar Container ── */
    .tb-toolbar {
      display: flex;
      align-items: center;
      gap: 1px;
      padding: 4px 8px;
      background: var(--bg-secondary, #1e293b);
      border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
      flex-wrap: wrap;
      min-height: 36px;
      user-select: none;
    }

    /* ── Buttons ── */
    .tb-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 28px;
      padding: 0 6px;
      background: transparent;
      border: none;
      border-radius: 5px;
      color: var(--text-secondary, #94a3b8);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.12s, color 0.12s, transform 0.08s;
      position: relative;
      line-height: 1;
    }

    .tb-btn:hover {
      background: rgba(99, 102, 241, 0.12);
      color: var(--text-primary, #f1f5f9);
    }

    .tb-btn:active {
      transform: scale(0.92);
    }

    .tb-btn.active {
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
    }

    .tb-btn[data-has-dropdown]::after {
      content: '▾';
      font-size: 8px;
      margin-left: 2px;
      opacity: 0.5;
    }

    /* ── Tooltip ── */
    .tb-btn[data-tooltip]:hover::before {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      color: #e2e8f0;
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 11px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 15002;
      border: 1px solid rgba(255,255,255,0.06);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* ── Divider ── */
    .tb-divider {
      width: 1px;
      height: 20px;
      background: var(--border-color, rgba(255,255,255,0.08));
      margin: 0 4px;
      flex-shrink: 0;
    }

    /* ── Popover Panel ── */
    .tb-popover {
      animation: tb-pop-in 0.15s ease;
    }

    @keyframes tb-pop-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .tb-panel {
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
      padding: 6px;
      min-width: 160px;
      max-height: 380px;
      overflow-y: auto;
    }

    .tb-panel::-webkit-scrollbar { width: 5px; }
    .tb-panel::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    /* ── Dropdown Items ── */
    .tb-dd-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 12px;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background 0.1s;
      font-family: inherit;
    }

    .tb-dd-item:hover {
      background: rgba(99, 102, 241, 0.15);
    }

    .tb-dd-item .tb-dd-icon {
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      font-size: 13px;
    }

    .tb-dd-item .tb-dd-shortcut {
      margin-left: auto;
      color: #64748b;
      font-size: 10px;
      font-family: monospace;
    }

    .tb-dd-sep {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 4px 8px;
    }

    .tb-dd-label {
      padding: 4px 10px;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    /* ── Color Picker Panel ── */
    .tb-color-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      padding: 8px;
    }

    .tb-color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.1s, border-color 0.1s;
    }

    .tb-color-swatch:hover {
      transform: scale(1.2);
      border-color: rgba(255,255,255,0.5);
    }

    .tb-color-section-label {
      padding: 6px 8px 2px;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tb-custom-color-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
    }

    .tb-custom-color-row input[type="color"] {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: none;
      padding: 0;
    }

    .tb-custom-color-row input[type="text"] {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 12px;
      font-family: monospace;
      outline: none;
    }

    .tb-custom-color-row input[type="text"]:focus {
      border-color: #6366f1;
    }

    .tb-custom-color-row button {
      padding: 4px 10px;
      border-radius: 5px;
      border: none;
      background: #6366f1;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }

    /* ── Emoji Panel ── */
    .tb-emoji-tabs {
      display: flex;
      gap: 2px;
      padding: 4px 6px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      overflow-x: auto;
    }

    .tb-emoji-tab {
      padding: 4px 8px;
      border-radius: 5px;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.1s;
    }

    .tb-emoji-tab:hover { background: rgba(255,255,255,0.06); }
    .tb-emoji-tab.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }

    .tb-emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
      padding: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .tb-emoji-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 5px;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.1s, transform 0.1s;
    }

    .tb-emoji-btn:hover {
      background: rgba(99,102,241,0.15);
      transform: scale(1.15);
    }

    .tb-emoji-search {
      width: 100%;
      padding: 6px 10px;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      background: transparent;
      color: #e2e8f0;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
    }

    .tb-emoji-search::placeholder { color: #475569; }

    /* ── Special Chars Panel ── */
    .tb-chars-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 2px;
      padding: 6px;
    }

    .tb-char-btn {
      width: 36px;
      height: 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.1s;
      color: #e2e8f0;
      gap: 1px;
    }

    .tb-char-btn:hover { background: rgba(99,102,241,0.15); }
    .tb-char-btn .char { font-size: 16px; }
    .tb-char-btn .name { font-size: 7px; color: #64748b; overflow: hidden; text-overflow: ellipsis; max-width: 34px; }

    /* ── Table Picker Grid ── */
    .tb-table-picker {
      padding: 8px;
    }

    .tb-table-grid {
      display: grid;
      grid-template-columns: repeat(${TABLE_MAX}, 1fr);
      gap: 2px;
    }

    .tb-table-cell {
      width: 18px;
      height: 18px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.08s, border-color 0.08s;
    }

    .tb-table-cell.active {
      background: rgba(99, 102, 241, 0.4);
      border-color: #6366f1;
    }

    .tb-table-label {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      padding-top: 6px;
      font-family: monospace;
    }

    /* ── Snippet Panel ── */
    .tb-snippet-panel {
      min-width: 240px;
    }

    .tb-snippet-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 12px;
      transition: background 0.1s;
    }

    .tb-snippet-item:hover { background: rgba(99,102,241,0.15); }

    .tb-snippet-item .snippet-name { flex: 1; }
    .tb-snippet-item .snippet-del {
      opacity: 0;
      color: #ef4444;
      cursor: pointer;
      padding: 2px;
      transition: opacity 0.1s;
    }
    .tb-snippet-item:hover .snippet-del { opacity: 0.7; }
    .tb-snippet-item .snippet-del:hover { opacity: 1; }

    .tb-snippet-add-row {
      display: flex;
      gap: 4px;
      padding: 6px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .tb-snippet-add-row input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
      font-size: 11px;
      outline: none;
    }

    .tb-snippet-add-row input:focus { border-color: #6366f1; }

    .tb-snippet-add-row button {
      padding: 4px 10px;
      border-radius: 5px;
      border: none;
      background: #6366f1;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
    }

    /* ── Word Count Badge ── */
    .tb-wc-panel {
      padding: 12px 16px;
      min-width: 180px;
    }

    .tb-wc-panel table { width: 100%; border-collapse: collapse; }
    .tb-wc-panel td {
      padding: 3px 0;
      font-size: 12px;
      color: #94a3b8;
    }
    .tb-wc-panel td:first-child { font-weight: 600; color: #cbd5e1; }
    .tb-wc-panel td:last-child { text-align: right; color: #e2e8f0; font-family: monospace; }

    /* ── Settings Panel ── */
    .tb-settings-panel {
      min-width: 220px;
      max-height: 350px;
      overflow-y: auto;
    }

    .tb-settings-panel .tb-setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      color: #e2e8f0;
      cursor: pointer;
      transition: background 0.1s;
    }

    .tb-settings-panel .tb-setting-item:hover {
      background: rgba(255,255,255,0.04);
    }

    .tb-settings-panel .tb-setting-check {
      width: 16px;
      text-align: center;
      color: #22c55e;
    }

    .tb-settings-panel .tb-setting-label { flex: 1; }

    /* ── Group wrapper ── */
    .tb-group {
      display: inline-flex;
      align-items: center;
      gap: 1px;
    }
  `;
    document.head.appendChild(s);
}


class ToolbarManager {
    static instance = null;

    constructor() {
        if (ToolbarManager.instance) {
            return ToolbarManager.instance;
        }

        this.groups = [...TOOLBAR_GROUPS];
        this.container = null;
        this.visible = true;
        this.initialized = false;
        this._popover = popover;
        this._prefs = prefs;

        ToolbarManager.instance = this;
    }

    /* ─────────────────────────────────────────────────────────────────
       8a. INITIALIZATION
       ───────────────────────────────────────────────────────────────── */

    /**
     * Initialize toolbar
     * @param {HTMLElement|string} container - Toolbar container
     */
    initialize(container, options = {}) {
        if (this.initialized) return;

        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.warn('[Toolbar v2] Container not found');
            return;
        }

        injectToolbarStyles();
        this._setupKeyboardShortcuts();
        if (options.render !== false) {
            this.render();
        }

        this.initialized = true;
        console.log('[Toolbar v2] ✓ Initialized');
    }

    /* ─────────────────────────────────────────────────────────────────
       8b. KEYBOARD SHORTCUTS
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const btn = this._findButtonByShortcut(e);
            if (btn) {
                e.preventDefault();
                btn.action();
            }
        });
    }

    /** @private */
    _findButtonByShortcut(e) {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();

        // Search through all groups → buttons and dropdown items
        for (const group of this.groups) {
            if (group.buttons) {
                for (const btn of group.buttons) {
                    if (this._matchShortcut(btn.shortcut, ctrl, shift, key)) return btn;
                }
            }
            if (group.items) {
                for (const item of group.items) {
                    if (item.shortcut && this._matchShortcut(item.shortcut, ctrl, shift, key)) return item;
                }
            }
            if (group.buildItems) {
                const items = group.buildItems();
                for (const item of items) {
                    if (item.shortcut && this._matchShortcut(item.shortcut, ctrl, shift, key)) return item;
                }
            }
        }
        return null;
    }

    /** @private */
    _matchShortcut(shortcut, ctrl, shift, key) {
        if (!shortcut) return false;
        const parts = shortcut.toLowerCase().split('+');
        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const shortcutKey = parts[parts.length - 1];
        return ctrl === needsCtrl && shift === needsShift && key === shortcutKey;
    }

    /* ─────────────────────────────────────────────────────────────────
       8c. MAIN RENDER
       ───────────────────────────────────────────────────────────────── */

    render() {
        if (!this.container) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'tb-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Formatting toolbar');

        const hidden = this._prefs.hiddenButtons;

        for (const group of this.groups) {
            // Skip hidden groups
            if (hidden.includes(group.id)) continue;

            if (group.type === 'divider') {
                toolbar.appendChild(this._renderDivider());
                continue;
            }

            // Simple button group
            if (group.buttons) {
                const wrapper = document.createElement('div');
                wrapper.className = 'tb-group';
                for (const btn of group.buttons) {
                    if (hidden.includes(btn.id)) continue;
                    wrapper.appendChild(this._renderButton(btn));
                }
                toolbar.appendChild(wrapper);
                continue;
            }

            // Dropdown
            if (group.type === 'dropdown') {
                toolbar.appendChild(this._renderDropdownButton(group));
                continue;
            }

            // Color Picker
            if (group.type === 'color-picker') {
                toolbar.appendChild(this._renderColorPickerButton(group));
                continue;
            }

            // Emoji Picker
            if (group.type === 'emoji-picker') {
                toolbar.appendChild(this._renderEmojiPickerButton(group));
                continue;
            }

            // Special Characters
            if (group.type === 'special-chars') {
                toolbar.appendChild(this._renderSpecialCharsButton(group));
                continue;
            }

            // Snippets
            if (group.type === 'snippets') {
                toolbar.appendChild(this._renderSnippetsButton(group));
                continue;
            }

            // Word Count
            if (group.type === 'word-count') {
                toolbar.appendChild(this._renderWordCountButton(group));
                continue;
            }

            // Settings
            if (group.type === 'settings') {
                toolbar.appendChild(this._renderSettingsButton(group));
                continue;
            }
        }

        this.container.innerHTML = '';
        this.container.appendChild(toolbar);
    }

    /* ─────────────────────────────────────────────────────────────────
       8d. RENDER SIMPLE BUTTON
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderButton(btn) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = btn.icon;
        el.dataset.id = btn.id;

        const tooltipText = btn.title + (btn.shortcut ? ` (${btn.shortcut})` : '');
        el.setAttribute('data-tooltip', tooltipText);
        el.setAttribute('aria-label', btn.title);

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.action) btn.action();
        });

        return el;
    }

    /** @private */
    _renderDivider() {
        const el = document.createElement('div');
        el.className = 'tb-divider';
        return el;
    }

    /* ─────────────────────────────────────────────────────────────────
       8e. RENDER DROPDOWN BUTTON
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderDropdownButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');
        el.setAttribute('aria-label', group.title);

        el.addEventListener('click', (e) => {
            e.stopPropagation();

            // Get items (static or dynamic)
            const items = group.buildItems ? group.buildItems() : (group.items || []);

            const panel = document.createElement('div');
            panel.className = 'tb-panel';

            items.forEach(item => {
                if (item.type === 'separator') {
                    const sep = document.createElement('div');
                    sep.className = 'tb-dd-sep';
                    panel.appendChild(sep);
                    return;
                }

                if (item.type === 'label') {
                    const lbl = document.createElement('div');
                    lbl.className = 'tb-dd-label';
                    lbl.textContent = item.label;
                    panel.appendChild(lbl);
                    return;
                }

                // Table picker special item
                if (item.custom === 'table-picker') {
                    const itemEl = document.createElement('button');
                    itemEl.className = 'tb-dd-item';
                    itemEl.innerHTML = `<span class="tb-dd-icon">${item.icon}</span><span>${item.label}</span>`;
                    itemEl.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        this._popover.close();
                        this._openTablePicker(el);
                    });
                    panel.appendChild(itemEl);
                    return;
                }

                const itemEl = document.createElement('button');
                itemEl.className = 'tb-dd-item';

                let iconHtml = `<span class="tb-dd-icon">${item.icon || ''}</span>`;
                if (item.colorDot) {
                    iconHtml = `<span class="tb-dd-icon" style="display:inline-flex;align-items:center;gap:4px;">
            ${item.icon}
            <span style="width:8px;height:8px;border-radius:50%;background:${item.colorDot};display:inline-block;"></span>
          </span>`;
                }

                itemEl.innerHTML = `
          ${iconHtml}
          <span>${item.label}</span>
          ${item.shortcut ? `<span class="tb-dd-shortcut">${item.shortcut}</span>` : ''}
        `;

                itemEl.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this._popover.close();
                    if (item.action) item.action();
                });

                panel.appendChild(itemEl);
            });

            this._popover.open(el, panel);
        });

        return el;
    }

    /* ─────────────────────────────────────────────────────────────────
       8f. TABLE PICKER POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _openTablePicker(triggerEl) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel tb-table-picker';

        const label = document.createElement('div');
        label.className = 'tb-table-label';
        label.textContent = 'Select size';

        const grid = document.createElement('div');
        grid.className = 'tb-table-grid';

        let selectedRows = 0;
        let selectedCols = 0;

        for (let r = 1; r <= TABLE_MAX; r++) {
            for (let c = 1; c <= TABLE_MAX; c++) {
                const cell = document.createElement('div');
                cell.className = 'tb-table-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('mouseenter', () => {
                    selectedRows = r;
                    selectedCols = c;
                    label.textContent = `${c} × ${r} table`;
                    // Highlight active cells
                    grid.querySelectorAll('.tb-table-cell').forEach(ce => {
                        const cr = parseInt(ce.dataset.row);
                        const cc = parseInt(ce.dataset.col);
                        ce.classList.toggle('active', cr <= r && cc <= c);
                    });
                });

                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._popover.close();
                    insertTable(selectedRows, selectedCols);
                });

                grid.appendChild(cell);
            }
        }

        panel.appendChild(grid);
        panel.appendChild(label);

        this._popover.open(triggerEl, panel);
    }

    /* ─────────────────────────────────────────────────────────────────
       8g. COLOR PICKER POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderColorPickerButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openColorPicker(el, group.mode);
        });

        return el;
    }

    /** @private */
    _openColorPicker(triggerEl, mode) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel';
        panel.style.width = '240px';

        // Recent colors
        const recent = this._prefs.recentColors;
        if (recent.length > 0) {
            const recentLabel = document.createElement('div');
            recentLabel.className = 'tb-color-section-label';
            recentLabel.textContent = 'Recent';
            panel.appendChild(recentLabel);

            const recentGrid = document.createElement('div');
            recentGrid.className = 'tb-color-grid';
            recent.forEach(hex => {
                const swatch = this._createColorSwatch(hex, mode);
                recentGrid.appendChild(swatch);
            });
            panel.appendChild(recentGrid);
        }

        // Palette
        const palette = mode === 'highlight' ? HIGHLIGHT_COLORS : COLORS;
        const paletteLabel = document.createElement('div');
        paletteLabel.className = 'tb-color-section-label';
        paletteLabel.textContent = mode === 'highlight' ? 'Highlight Colors' : 'Text Colors';
        panel.appendChild(paletteLabel);

        const colorGrid = document.createElement('div');
        colorGrid.className = 'tb-color-grid';
        palette.forEach(c => {
            const swatch = this._createColorSwatch(c.hex, mode);
            swatch.title = c.label;
            colorGrid.appendChild(swatch);
        });
        panel.appendChild(colorGrid);

        // Custom color input row
        const customRow = document.createElement('div');
        customRow.className = 'tb-custom-color-row';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#6366f1';

        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.value = '#6366f1';
        hexInput.placeholder = '#hex';
        hexInput.maxLength = 7;

        colorInput.addEventListener('input', () => {
            hexInput.value = colorInput.value;
        });

        hexInput.addEventListener('input', () => {
            if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
                colorInput.value = hexInput.value;
            }
        });

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._applyColor(hexInput.value, mode);
            this._popover.close();
        });

        customRow.appendChild(colorInput);
        customRow.appendChild(hexInput);
        customRow.appendChild(applyBtn);
        panel.appendChild(customRow);

        // Remove color option
        const removeBtn = document.createElement('button');
        removeBtn.className = 'tb-dd-item';
        removeBtn.innerHTML = '<span class="tb-dd-icon">✕</span><span>Remove Color</span>';
        removeBtn.style.marginTop = '4px';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._popover.close();
            if (mode === 'highlight') {
                // Remove highlight wrapping
                const sel = getSelection();
                if (sel) {
                    transformSelection(t => t);
                }
            }
        });
        panel.appendChild(removeBtn);

        this._popover.open(triggerEl, panel);
    }

    /** @private */
    _createColorSwatch(hex, mode) {
        const swatch = document.createElement('div');
        swatch.className = 'tb-color-swatch';
        swatch.style.background = hex;

        if (hex === '#ffffff' || hex === '#000000') {
            swatch.style.border = '1px solid rgba(255,255,255,0.2)';
        }

        swatch.addEventListener('click', (e) => {
            e.stopPropagation();
            this._applyColor(hex, mode);
            this._popover.close();
        });

        return swatch;
    }

    /** @private */
    _applyColor(hex, mode) {
        this._prefs.addRecentColor(hex);

        if (mode === 'text') {
            wrapSelectionHtml('span', `style="color:${hex}"`);
        } else {
            wrapSelectionHtml('mark', `style="background:${hex};padding:0 2px;border-radius:2px;"`);
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       8h. EMOJI PICKER POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderEmojiPickerButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openEmojiPicker(el);
        });

        return el;
    }

    /** @private */
    _openEmojiPicker(triggerEl) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel';
        panel.style.width = '290px';

        // Search input
        const search = document.createElement('input');
        search.className = 'tb-emoji-search';
        search.placeholder = '🔍 Search emoji…';
        panel.appendChild(search);

        // Tabs
        const tabBar = document.createElement('div');
        tabBar.className = 'tb-emoji-tabs';

        const categories = Object.keys(EMOJI_SETS);
        const allCategories = ['Recent', ...categories];

        const grid = document.createElement('div');
        grid.className = 'tb-emoji-grid';

        const renderEmojis = (emojis) => {
            grid.innerHTML = '';
            emojis.forEach(emoji => {
                const btn = document.createElement('button');
                btn.className = 'tb-emoji-btn';
                btn.textContent = emoji;
                btn.title = emoji;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    insertText(emoji);
                    this._prefs.addRecentEmoji(emoji);
                    this._popover.close();
                });
                grid.appendChild(btn);
            });

            if (emojis.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#64748b;font-size:12px;padding:16px;">No emoji found</div>';
            }
        };

        const setActiveTab = (tabName) => {
            tabBar.querySelectorAll('.tb-emoji-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tabName);
            });

            if (tabName === 'Recent') {
                renderEmojis(this._prefs.recentEmojis);
            } else {
                renderEmojis(EMOJI_SETS[tabName] || []);
            }
        };

        allCategories.forEach(cat => {
            const tab = document.createElement('button');
            tab.className = 'tb-emoji-tab';
            tab.textContent = cat;
            tab.dataset.tab = cat;
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                search.value = '';
                setActiveTab(cat);
            });
            tabBar.appendChild(tab);
        });

        panel.appendChild(tabBar);
        panel.appendChild(grid);

        // Search handler
        search.addEventListener('input', () => {
            const q = search.value.toLowerCase().trim();
            if (!q) {
                // Show current tab
                const activeTab = tabBar.querySelector('.tb-emoji-tab.active');
                setActiveTab(activeTab ? activeTab.dataset.tab : 'Smileys');
                return;
            }
            // Search all emojis
            const allEmojis = Object.values(EMOJI_SETS).flat();
            // Simple contains search (limited since emojis don't have text names in this set)
            renderEmojis(allEmojis.slice(0, 48));
        });

        // Start with Recent or first category
        const startTab = this._prefs.recentEmojis.length > 0 ? 'Recent' : categories[0];
        setActiveTab(startTab);

        this._popover.open(triggerEl, panel);

        // Focus search
        requestAnimationFrame(() => search.focus());
    }

    /* ─────────────────────────────────────────────────────────────────
       8i. SPECIAL CHARACTERS POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderSpecialCharsButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openSpecialChars(el);
        });

        return el;
    }

    /** @private */
    _openSpecialChars(triggerEl) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel';
        panel.style.width = '256px';

        const grid = document.createElement('div');
        grid.className = 'tb-chars-grid';

        SPECIAL_CHARS.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'tb-char-btn';
            btn.title = ch.name;
            btn.innerHTML = `<span class="char">${ch.ch}</span><span class="name">${ch.name}</span>`;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                insertText(ch.ch);
                this._popover.close();
            });
            grid.appendChild(btn);
        });

        panel.appendChild(grid);
        this._popover.open(triggerEl, panel);
    }

    /* ─────────────────────────────────────────────────────────────────
       8j. SNIPPETS POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderSnippetsButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openSnippets(el);
        });

        return el;
    }

    /** @private */
    _openSnippets(triggerEl) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel tb-snippet-panel';

        const snippets = this._prefs.customSnippets;

        const renderList = () => {
            list.innerHTML = '';

            if (snippets.length === 0) {
                list.innerHTML = '<div style="padding:12px;text-align:center;color:#64748b;font-size:12px;">No snippets yet. Select text and save it as a snippet below.</div>';
                return;
            }

            snippets.forEach((snippet, idx) => {
                const item = document.createElement('div');
                item.className = 'tb-snippet-item';

                const icon = document.createElement('span');
                icon.textContent = '⚡';
                icon.style.cssText = 'width:20px;text-align:center;flex-shrink:0;';

                const name = document.createElement('span');
                name.className = 'snippet-name';
                name.textContent = snippet.name;
                name.title = snippet.content.substring(0, 100);

                const del = document.createElement('span');
                del.className = 'snippet-del';
                del.textContent = '✕';
                del.addEventListener('click', (e) => {
                    e.stopPropagation();
                    snippets.splice(idx, 1);
                    this._prefs.saveSnippets(snippets);
                    renderList();
                });

                item.appendChild(icon);
                item.appendChild(name);
                item.appendChild(del);

                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    insertText(snippet.content);
                    this._popover.close();
                });

                list.appendChild(item);
            });
        };

        const list = document.createElement('div');
        renderList();
        panel.appendChild(list);

        // Add snippet row
        const addRow = document.createElement('div');
        addRow.className = 'tb-snippet-add-row';

        const nameInput = document.createElement('input');
        nameInput.placeholder = 'Snippet name…';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '+ Save';

        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = nameInput.value.trim();
            const content = getSelection();

            if (!name) {
                nameInput.style.borderColor = '#ef4444';
                nameInput.placeholder = 'Enter a name!';
                setTimeout(() => {
                    nameInput.style.borderColor = '';
                    nameInput.placeholder = 'Snippet name…';
                }, 1500);
                return;
            }

            if (!content) {
                nameInput.value = '';
                nameInput.placeholder = 'Select text first!';
                nameInput.style.borderColor = '#ef4444';
                setTimeout(() => {
                    nameInput.style.borderColor = '';
                    nameInput.placeholder = 'Snippet name…';
                }, 1500);
                return;
            }

            snippets.push({ name, content, created: Date.now() });
            this._prefs.saveSnippets(snippets);
            nameInput.value = '';
            renderList();
        });

        addRow.appendChild(nameInput);
        addRow.appendChild(saveBtn);
        panel.appendChild(addRow);

        this._popover.open(triggerEl, panel);
    }

    /* ─────────────────────────────────────────────────────────────────
       8k. WORD COUNT POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderWordCountButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openWordCount(el);
        });

        return el;
    }

    /** @private */
    _openWordCount(triggerEl) {
        const editor = resolveEditor();
        if (!editor) return;

        const content = editor.getValue();
        const selection = getSelection();

        // Count stats
        const countStats = (text) => {
            const chars = text.length;
            const charsNoSpace = text.replace(/\s/g, '').length;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const lines = text.split('\n').length;
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
            const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
            const readTime = Math.max(1, Math.ceil(words / 200));
            return { chars, charsNoSpace, words, lines, paragraphs, sentences, readTime };
        };

        const docStats = countStats(content);
        const selStats = selection ? countStats(selection) : null;

        const panel = document.createElement('div');
        panel.className = 'tb-panel tb-wc-panel';

        let html = `
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600;">
        Document
      </div>
      <table>
        <tr><td>Words</td><td>${docStats.words.toLocaleString()}</td></tr>
        <tr><td>Characters</td><td>${docStats.chars.toLocaleString()}</td></tr>
        <tr><td>No Spaces</td><td>${docStats.charsNoSpace.toLocaleString()}</td></tr>
        <tr><td>Lines</td><td>${docStats.lines.toLocaleString()}</td></tr>
        <tr><td>Paragraphs</td><td>${docStats.paragraphs.toLocaleString()}</td></tr>
        <tr><td>Sentences</td><td>${docStats.sentences.toLocaleString()}</td></tr>
        <tr><td>Read Time</td><td>~${docStats.readTime} min</td></tr>
      </table>
    `;

        if (selStats) {
            html += `
        <div style="height:1px;background:rgba(255,255,255,0.06);margin:10px 0;"></div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600;">
          Selection
        </div>
        <table>
          <tr><td>Words</td><td>${selStats.words.toLocaleString()}</td></tr>
          <tr><td>Characters</td><td>${selStats.chars.toLocaleString()}</td></tr>
          <tr><td>Lines</td><td>${selStats.lines.toLocaleString()}</td></tr>
        </table>
      `;
        }

        panel.innerHTML = html;
        this._popover.open(triggerEl, panel);
    }

    /* ─────────────────────────────────────────────────────────────────
       8l. SETTINGS POPOVER
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _renderSettingsButton(group) {
        const el = document.createElement('button');
        el.className = 'tb-btn';
        el.innerHTML = group.icon;
        el.dataset.id = group.id;
        el.setAttribute('data-tooltip', group.title);
        el.setAttribute('data-has-dropdown', 'true');

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openSettings(el);
        });

        return el;
    }

    /** @private */
    _openSettings(triggerEl) {
        const panel = document.createElement('div');
        panel.className = 'tb-panel tb-settings-panel';

        const titleEl = document.createElement('div');
        titleEl.className = 'tb-dd-label';
        titleEl.textContent = 'Show / Hide Tools';
        panel.appendChild(titleEl);

        const hidden = this._prefs.hiddenButtons;

        // Collect all toggle-able items
        const toggleItems = [];

        this.groups.forEach(group => {
            if (group.type === 'divider') return;

            if (group.buttons) {
                group.buttons.forEach(btn => {
                    toggleItems.push({ id: btn.id, label: btn.title, icon: btn.icon });
                });
            } else {
                toggleItems.push({ id: group.id, label: group.title, icon: group.icon });
            }
        });

        toggleItems.forEach(item => {
            const isVisible = !hidden.includes(item.id);

            const row = document.createElement('div');
            row.className = 'tb-setting-item';

            const check = document.createElement('span');
            check.className = 'tb-setting-check';
            check.textContent = isVisible ? '✓' : '';
            check.style.color = isVisible ? '#22c55e' : '#64748b';

            const label = document.createElement('span');
            label.className = 'tb-setting-label';
            label.textContent = item.label;

            row.appendChild(check);
            row.appendChild(label);

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                this._prefs.toggleButtonVisibility(item.id);
                const nowVisible = !this._prefs.hiddenButtons.includes(item.id);
                check.textContent = nowVisible ? '✓' : '';
                check.style.color = nowVisible ? '#22c55e' : '#64748b';
                // Re-render toolbar
                this.render();
                // Re-open settings
                requestAnimationFrame(() => {
                    const newBtn = this.container.querySelector(`[data-id="toolbar-settings"]`);
                    if (newBtn) {
                        this._openSettings(newBtn);
                    }
                });
            });

            panel.appendChild(row);
        });

        // Reset button
        const sep = document.createElement('div');
        sep.className = 'tb-dd-sep';
        panel.appendChild(sep);

        const resetItem = document.createElement('button');
        resetItem.className = 'tb-dd-item';
        resetItem.innerHTML = '<span class="tb-dd-icon">↺</span><span>Reset to Default</span>';
        resetItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this._prefs.set('hiddenButtons', []);
            this._popover.close();
            this.render();
        });
        panel.appendChild(resetItem);

        this._popover.open(triggerEl, panel);
    }

    /* ─────────────────────────────────────────────────────────────────
       8m. PUBLIC API
       ───────────────────────────────────────────────────────────────── */

    /**
     * Add custom button to toolbar
     * @param {Object} button - Button definition
     * @param {number} position - Insert position (-1 for end)
     */
    addButton(button, position = -1) {
        const group = {
            id: button.id + '-group',
            buttons: [button]
        };
        if (position === -1) {
            this.groups.push(group);
        } else {
            this.groups.splice(position, 0, group);
        }
        if (this.initialized) this.render();
    }

    /**
     * Add a custom dropdown to toolbar
     * @param {Object} dropdown - Dropdown definition { id, icon, title, items }
     * @param {number} position - Insert position
     */
    addDropdown(dropdown, position = -1) {
        const group = { ...dropdown, type: 'dropdown' };
        if (position === -1) {
            this.groups.push(group);
        } else {
            this.groups.splice(position, 0, group);
        }
        if (this.initialized) this.render();
    }

    /**
     * Remove a button or group by ID
     * @param {string} id - Button or group ID
     */
    removeButton(id) {
        this.groups = this.groups.filter(g => {
            if (g.id === id) return false;
            if (g.buttons) {
                g.buttons = g.buttons.filter(b => b.id !== id);
                return g.buttons.length > 0;
            }
            return true;
        });
        if (this.initialized) this.render();
    }

    /** Show toolbar */
    show() {
        this.visible = true;
        if (this.container) this.container.style.display = '';
    }

    /** Hide toolbar */
    hide() {
        this.visible = false;
        if (this.container) this.container.style.display = 'none';
    }

    /**
     * Toggle toolbar visibility
     * @returns {boolean} New visibility
     */
    toggle() {
        this.visible ? this.hide() : this.show();
        return this.visible;
    }

    /**
     * Get all registered button IDs
     * @returns {string[]} Array of button IDs
     */
    getButtonIds() {
        const ids = [];
        this.groups.forEach(g => {
            if (g.buttons) g.buttons.forEach(b => ids.push(b.id));
            else if (g.id && g.type !== 'divider') ids.push(g.id);
        });
        return ids;
    }

    /**
     * Execute a toolbar action by button ID
     * @param {string} id - Button ID
     */
    executeAction(id) {
        for (const group of this.groups) {
            if (group.buttons) {
                const btn = group.buttons.find(b => b.id === id);
                if (btn && btn.action) { btn.action(); return; }
            }
            if (group.items) {
                const item = group.items.find(i => i.id === id);
                if (item && item.action) { item.action(); return; }
            }
        }
        console.warn(`[Toolbar v2] Action not found: ${id}`);
    }

    /**
     * Dispose toolbar completely
     */
    dispose() {
        this._popover.close();
        if (this.container) this.container.innerHTML = '';
        this.groups = [];
        this.initialized = false;

        const styles = document.getElementById('tb-enhanced-styles');
        if (styles) styles.remove();

        ToolbarManager.instance = null;
        console.log('[Toolbar v2] ✓ Disposed');
    }
}

/* ═══════════════════════════════════════════════════════════════════
   SECTION 9 ── SINGLETON & EXPORTS
   ═══════════════════════════════════════════════════════════════════ */

// Create singleton instance
export const toolbarManager = new ToolbarManager();

// Export utility functions
export {
    wrapSelection,
    wrapSelectionHtml,
    prefixLine,
    insertText,
    replaceSelection,
    getSelection,
    transformSelection,
    insertLink,
    insertImage,
    insertTable,
};

// Export class for testing
export { ToolbarManager };

export default toolbarManager;

