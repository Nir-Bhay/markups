/**
 * Command Palette Registry
 * Defines all available commands for the command palette.
 * @module features/command-palette
 */

/**
 * @typedef {Object} Command
 * @property {string} id - Unique identifier
 * @property {string} label - Display label for fuzzy search
 * @property {string} group - Category group
 * @property {string} [shortcut] - Keyboard shortcut hint
 * @property {() => void} action - Executes when selected
 */

export const COMMANDS = [
    {
        id: 'export-pdf',
        label: 'Export as PDF',
        group: 'Export',
        shortcut: 'Ctrl+P',
        action: () => {
            const el = document.getElementById('export-pdf-button');
            if (el) el.click();
        }
    },
    {
        id: 'export-html',
        label: 'Export as HTML',
        group: 'Export',
        action: () => {
            const el = document.getElementById('export-html-button');
            if (el) el.click();
        }
    },
    {
        id: 'toggle-dark-mode',
        label: 'Toggle Dark Mode',
        group: 'Appearance',
        shortcut: 'Ctrl+D',
        action: () => {
            const checkbox = document.getElementById('dark-mode-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    },
    {
        id: 'open-settings',
        label: 'Open Settings',
        group: 'Navigation',
        shortcut: 'Ctrl+,',
        action: () => {
            const btn = document.getElementById('settings-btn');
            if (btn) btn.click();
        }
    },
    {
        id: 'new-tab',
        label: 'New Tab',
        group: 'Tabs',
        shortcut: 'Ctrl+T',
        action: () => {
            const el = document.getElementById('new-tab-button');
            if (el) el.click();
        }
    },
    {
        id: 'close-tab',
        label: 'Close Tab',
        group: 'Tabs',
        shortcut: 'Ctrl+W',
        action: () => {
            const el = document.getElementById('close-tab-button');
            if (el) el.click();
        }
    },
    {
        id: 'toggle-word-wrap',
        label: 'Toggle Word Wrap',
        group: 'Editor',
        shortcut: 'Ctrl+Alt+W',
        action: () => {
            const checkbox = document.getElementById('word-wrap-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    },
    {
        id: 'toggle-typewriter',
        label: 'Toggle Typewriter',
        group: 'Editor',
        shortcut: 'Ctrl+Alt+T',
        action: () => {
            const btn = document.getElementById('typewriter-button');
            if (btn) btn.click();
        }
    },
    {
        id: 'toggle-focus',
        label: 'Toggle Focus Mode',
        group: 'Editor',
        shortcut: 'Ctrl+Shift+F',
        action: () => {
            const btn = document.getElementById('focus-button');
            if (btn) btn.click();
        }
    },
    {
        id: 'toggle-fullscreen',
        label: 'Toggle Fullscreen',
        group: 'View',
        shortcut: 'F11',
        action: () => {
            const btn = document.getElementById('fullscreen-button');
            if (btn) btn.click();
        }
    },
    {
        id: 'toggle-minimap',
        label: 'Toggle Minimap',
        group: 'Editor',
        action: () => {
            const checkbox = document.getElementById('minimap-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    },
    {
        id: 'open-templates',
        label: 'Open Templates',
        group: 'Navigation',
        action: () => {
            const btn = document.getElementById('templates-button');
            if (btn) btn.click();
        }
    },
    {
        id: 'open-snippets',
        label: 'Open Snippets',
        group: 'Navigation',
        action: () => {
            const btn = document.getElementById('snippets-button');
            if (btn) btn.click();
        }
    },
    {
        id: 'open-search',
        label: 'Open Search',
        group: 'Navigation',
        shortcut: 'Ctrl+F',
        action: () => {
            const btn = document.getElementById('search-btn');
            if (btn) btn.click();
        }
    },
    {
        id: 'insert-date',
        label: 'Insert Date',
        group: 'Insert',
        shortcut: 'Ctrl+Alt+D',
        action: () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString();
            const editor = window.editor;
            if (editor) {
                const pos = editor.getPosition();
                editor.executeEdits('command-palette', [
                    {
                        range: {
                            startLineNumber: pos.lineNumber,
                            startColumn: pos.column,
                            endLineNumber: pos.lineNumber,
                            endColumn: pos.column
                        },
                        text: dateStr
                    }
                ]);
            }
        }
    },
    {
        id: 'download-markdown',
        label: 'Download Markdown',
        group: 'Export',
        shortcut: 'Ctrl+S',
        action: () => {
            if (typeof window.downloadMarkdown === 'function') {
                window.downloadMarkdown();
            }
        }
    },
    {
        id: 'print-document',
        label: 'Print Document',
        group: 'Export',
        shortcut: 'Ctrl+Shift+P',
        action: () => {
            if (typeof window.printDocument === 'function') {
                window.printDocument();
            }
        }
    }
];
