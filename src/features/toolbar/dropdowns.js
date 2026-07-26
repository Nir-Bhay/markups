/**
 * Toolbar button group definitions (dropdowns / actions)
 * @module features/toolbar/dropdowns
 */

import { CALLOUT_TYPES, CODE_LANGUAGES } from './constants.js';
import { prefs } from './preferences.js';
import {
  resolveEditor,
  wrapSelection,
  wrapSelectionHtml,
  prefixLine,
  insertText,
  getSelection,
  transformSelection,
  insertLink,
  insertImage,
  getDateFormatted,
  generateLorem,
  escHtml,
} from './utils.js';

export const TOOLBAR_GROUPS = [
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
