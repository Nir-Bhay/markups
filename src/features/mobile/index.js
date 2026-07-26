/**
 * Mobile UI Manager
 * Handles mobile-specific UI: view switcher, drawer with tab management,
 * toolbar overflow, swipe gestures.
 * @module features/mobile
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import {
    toolbarManager,
    prefixLine,
    insertText,
    wrapSelection,
    wrapSelectionHtml,
    transformSelection,
    getSelection,
} from '../toolbar/index.js';

const getOverflowSelection = () => getSelection() || 'Content here';

const getDateFormatted = (format = 'iso') => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    switch (format) {
        case 'iso':
            return now.toISOString().slice(0, 10);
        case 'long':
            return now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        case 'short':
            return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
        case 'time':
            return now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });
        case 'datetime':
            return `${now.toISOString().slice(0, 10)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        case 'unix':
            return String(Math.floor(now.getTime() / 1000));
        default:
            return now.toISOString().slice(0, 10);
    }
};

const generateLorem = (type = 'paragraph') => {
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
        case 'sentence':
            return sentences[0];
        case 'short':
            return sentences.slice(0, 3).join(' ');
        case 'long':
            return `${sentences.join(' ')} ${sentences.slice(0, 5).join(' ')}`;
        case 'paragraph':
        default:
            return sentences.slice(0, 5).join(' ');
    }
};

const DIAGRAM_PRESETS = [
    {
        action: 'diagram-flowchart',
        icon: '🔷',
        label: 'Flowchart',
        content: '\n```mermaid\ngraph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Continue]\n    B -->|No| D[Stop]\n```\n',
    },
    {
        action: 'diagram-sequence',
        icon: '↔️',
        label: 'Sequence',
        content: '\n```mermaid\nsequenceDiagram\n    Alice->>Bob: Hello Bob\n    Bob-->>Alice: Hi Alice\n```\n',
    },
    {
        action: 'diagram-class',
        icon: '🧱',
        label: 'Class',
        content: '\n```mermaid\nclassDiagram\n    class Animal {\n        +name\n        +eat()\n    }\n    Animal <|-- Dog\n```\n',
    },
    {
        action: 'diagram-state',
        icon: '⚙️',
        label: 'State',
        content: '\n```mermaid\nstateDiagram-v2\n    [*] --> Idle\n    Idle --> Active\n    Active --> [*]\n```\n',
    },
    {
        action: 'diagram-mindmap',
        icon: '🧠',
        label: 'Mindmap',
        content: '\n```mermaid\nmindmap\n  root((Idea))\n    Branch 1\n    Branch 2\n```\n',
    },
    {
        action: 'diagram-gantt',
        icon: '📅',
        label: 'Gantt',
        content: '\n```mermaid\ngantt\n    title Project Timeline\n    dateFormat  YYYY-MM-DD\n    section Planning\n    Research :a1, 2026-01-01, 3d\n```\n',
    },
];

const outdentSelection = () => {
    const editor = typeof window !== 'undefined' ? window.editor : null;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) return;

    for (let lineNumber = selection.startLineNumber; lineNumber <= selection.endLineNumber; lineNumber += 1) {
        const line = model.getLineContent(lineNumber);
        if (line.startsWith('  ')) {
            editor.executeEdits('toolbar', [{
                range: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                    endLineNumber: lineNumber,
                    endColumn: 3,
                },
                text: '',
            }]);
        } else if (line.startsWith('\t')) {
            editor.executeEdits('toolbar', [{
                range: {
                    startLineNumber: lineNumber,
                    startColumn: 1,
                    endLineNumber: lineNumber,
                    endColumn: 2,
                },
                text: '',
            }]);
        }
    }

    editor.focus();
};

/**
 * MobileUIManager class
 * Clean mobile experience — no dead code, no non-existent DOM refs.
 */
class MobileUIManager {
    static instance = null;

    constructor() {
        if (MobileUIManager.instance) {
            return MobileUIManager.instance;
        }

        this.drawer = null;
        this.overlay = null;
        this.viewSwitcher = null;
        this.overflowSheet = null;
        this._overflowActionHandlers = {};
        this.currentView = 'editor';
        this._swipeState = null;
        this._boundOutsideClick = null;
        this._boundKeydown = null;
        this._boundOverflowOutsideClick = null;
        this._boundOverflowResize = null;
        this._boundBreakpointResize = null;
        this._docsListTimers = [];

        MobileUIManager.instance = this;
    }

    /**
     * Initialize mobile UI
     */
    initialize() {
        this.drawer = document.getElementById('mobile-nav-drawer');
        this.overlay = document.getElementById('mobile-nav-overlay');
        this.viewSwitcher = document.getElementById('mobile-view-switcher');
        this.overflowSheet = document.getElementById('toolbar-overflow-sheet');

        this._setupDrawer();
        this._setupViewSwitcher();
        this._setupToolbarOverflow();
        this._setupSwipeGestures();
        this._setupDrawerActions();
        this._setupResizeHandler();
        this._setupMobileHeaderButtons();

        // Set default mobile view
        if (this.isMobile()) {
            this.setView('editor');
        }
    }

    /* ============================
       MOBILE HEADER BUTTONS (+ new file, theme)
       ============================ */

    _setupMobileHeaderButtons() {
        // New File button — delegates to the desktop new-tab button
        const newFileBtn = document.getElementById('mobile-new-file-btn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                const explorerNewFile = document.getElementById('explorer-new-file-btn');
                if (explorerNewFile) {
                    explorerNewFile.click();
                    return;
                }
                if (typeof window.__markups_createFile === 'function') {
                    window.__markups_createFile();
                }
            });
        }

        // Import button — delegates to the desktop import button
        const importNavBtn = document.getElementById('mobile-import-nav-btn');
        if (importNavBtn) {
            importNavBtn.addEventListener('click', () => {
                const desktopImport = document.getElementById('import-button');
                if (desktopImport) desktopImport.click();
            });
        }

        // Export button — delegates to the desktop export button
        const exportNavBtn = document.getElementById('mobile-export-nav-btn');
        if (exportNavBtn) {
            exportNavBtn.addEventListener('click', () => {
                const desktopExport = document.getElementById('export-btn');
                if (desktopExport) desktopExport.click();
            });
        }

        // Theme toggle button — delegates to the desktop dark-mode toggle
        const themeBtn = document.getElementById('mobile-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const desktopThemeBtn = document.getElementById('dark-mode-toggle');
                if (desktopThemeBtn) desktopThemeBtn.click();
            });

            // Keep icon in sync via MutationObserver watching body class changes
            this._syncMobileThemeIcon();
            const observer = new MutationObserver(() => this._syncMobileThemeIcon());
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }

    _syncMobileThemeIcon() {
        const mobileBtn = document.getElementById('mobile-theme-btn');
        if (!mobileBtn) return;

        const isDark = document.body.classList.contains('dark-mode');
        const mobileSun = mobileBtn.querySelector('.icon-sun');
        const mobileMoon = mobileBtn.querySelector('.icon-moon');
        if (mobileSun) mobileSun.style.display = isDark ? 'none' : 'inline';
        if (mobileMoon) mobileMoon.style.display = isDark ? 'inline' : 'none';
    }

    /* ============================
       DRAWER
       ============================ */

    _setupDrawer() {
        if (!this.drawer) return;

        // Hamburger in header
        const menuBtn = document.getElementById('mobile-header-menu');
        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.addEventListener('click', () => this.toggleDrawer());
        }

        // Legacy footer menu toggle (still in HTML)
        const footerToggle = document.getElementById('mobile-menu-toggle');
        if (footerToggle) {
            footerToggle.addEventListener('click', () => this.toggleDrawer());
        }

        // Close button
        const closeBtn = document.getElementById('drawer-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDrawer());
        }

        // Overlay click closes drawer
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeDrawer());
        }

        // Escape key closes drawer and overflow sheet
        this._boundKeydown = (e) => {
            if (e.key === 'Escape') {
                if (this.drawer?.classList.contains('active')) {
                    this.closeDrawer();
                    e.preventDefault();
                } else if (this.overflowSheet?.classList.contains('active')) {
                    this.overflowSheet.classList.remove('active');
                    e.preventDefault();
                }
            }
        };
        document.addEventListener('keydown', this._boundKeydown);
    }

    _setupDrawerActions() {
        if (!this.drawer) return;

        // New document
        const newBtn = document.getElementById('mobile-new-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                const explorerNewFile = document.getElementById('explorer-new-file-btn');
                if (explorerNewFile) {
                    explorerNewFile.click();
                } else if (typeof window.__markups_createFile === 'function') {
                    window.__markups_createFile();
                }
                this.closeDrawer();
                // Re-render doc list after short delay
                const t = setTimeout(() => this.renderDocsList(), 100);
                this._docsListTimers.push(t);
            });
        }

        // Import file
        const importBtn = document.getElementById('mobile-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('import-button')?.click();
                this.closeDrawer();
            });
        }

        // Export
        const exportBtn = document.getElementById('mobile-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                document.getElementById('export-btn')?.click();
                this.closeDrawer();
            });
        }

        // Search
        const searchBtn = document.getElementById('mobile-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                document.getElementById('search-btn')?.click();
                this.closeDrawer();
            });
        }

        // Theme toggle
        const themeBtn = document.getElementById('mobile-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.getElementById('dark-mode-toggle')?.click();
                this.closeDrawer();
            });
        }

        // Settings
        const settingsBtn = document.getElementById('mobile-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                document.getElementById('settings-btn')?.click();
                this.closeDrawer();
            });
        }

        // Help
        const helpBtn = document.getElementById('mobile-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                document.getElementById('help-button')?.click();
                this.closeDrawer();
            });
        }
    }

    toggleDrawer() {
        if (this.drawer?.classList.contains('active')) {
            this.closeDrawer();
        } else {
            this.openDrawer();
        }
    }

    openDrawer() {
        if (!this.drawer) return;
        this.renderDocsList();
        this.drawer.classList.add('active');
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
        // Update aria-expanded
        const menuBtn = document.getElementById('mobile-header-menu');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    }

    closeDrawer() {
        if (!this.drawer) return;
        this.drawer.classList.remove('active');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
        // Update aria-expanded
        const menuBtn = document.getElementById('mobile-header-menu');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }

    /* ============================
       DOCUMENT LIST IN DRAWER
       ============================ */

    /**
     * Render the documents list in the mobile drawer.
     * Reads from the global `documents` and `activeDocId` in main.js.
     */
    renderDocsList() {
        const container = document.getElementById('mobile-docs-list');
        if (!container) return;

        // Access global tab data from main.js
        const docs = window.__markups_documents || [];
        const activeId = window.__markups_activeDocId || null;

        container.innerHTML = '';

        docs.forEach(doc => {
            const item = document.createElement('button');
            item.className = `mobile-doc-item${doc.id === activeId ? ' active' : ''}`;
            item.dataset.docId = doc.id;

            const title = (doc.title || 'Untitled') + '.md';

            item.innerHTML = `
                <svg class="doc-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14 4.5V14a2 2 0 01-2 2H4a2 2 0 01-2-2V2a2 2 0 012-2h5.5L14 4.5zm-3 0A1.5 1.5 0 019.5 3V1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V4.5h-2z" />
                </svg>
                <span class="doc-name">${this._escapeHtml(title)}</span>
                ${docs.length > 1 ? '<span class="doc-close" title="Close">×</span>' : ''}
            `;

            // Switch to this doc
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('doc-close')) return;
                if (typeof window.__markups_switchTab === 'function') {
                    window.__markups_switchTab(doc.id);
                }
                this.closeDrawer();
            });

            // Close doc
            const closeEl = item.querySelector('.doc-close');
            if (closeEl) {
                closeEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.__markups_closeTab === 'function') {
                        window.__markups_closeTab(doc.id);
                    }
                    const t = setTimeout(() => this.renderDocsList(), 50);
                    this._docsListTimers.push(t);
                });
            }

            container.appendChild(item);
        });
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /* ============================
       VIEW SWITCHER
       ============================ */

    _setupViewSwitcher() {
        if (!this.viewSwitcher) return;

        const btns = this.viewSwitcher.querySelectorAll('.mobile-view-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view) this.setView(view);
            });
        });

        // Floating edit button switches to editor
        const floatingEditBtn = document.getElementById('floating-edit-btn');
        if (floatingEditBtn) {
            floatingEditBtn.addEventListener('click', () => {
                if (this.isMobile()) {
                    this.setView('editor');
                }
            });
        }
    }

    /**
     * Set mobile view: 'editor' or 'preview'
     */
    setView(view) {
        if (view !== 'editor' && view !== 'preview') return;
        this.currentView = view;

        const editorPane = document.getElementById('edit');
        const previewPane = document.getElementById('preview');
        const divider = document.getElementById('split-divider');

        // Clear ALL inline styles that desktop setViewMode may have set
        // This ensures CSS classes have full control
        [editorPane, previewPane].forEach(el => {
            if (el) {
                el.style.display = '';
                el.style.width = '';
                el.style.flex = '';
            }
        });
        if (divider) divider.style.display = '';

        // Use the existing body class system that CSS already supports
        document.body.classList.remove('view-editor', 'view-split', 'view-preview');
        document.body.classList.add(view === 'editor' ? 'view-editor' : 'view-preview');

        // Update switcher active state
        if (this.viewSwitcher) {
            this.viewSwitcher.querySelectorAll('.mobile-view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
        }

        // Update desktop view buttons too (keeps them in sync)
        const btnCode = document.getElementById('view-code');
        const btnSplit = document.getElementById('view-split');
        const btnPreview = document.getElementById('view-preview');
        [btnCode, btnSplit, btnPreview].forEach(b => b?.classList.remove('active'));
        if (view === 'editor' && btnCode) btnCode.classList.add('active');
        if (view === 'preview' && btnPreview) btnPreview.classList.add('active');

        // Trigger Monaco relayout (two passes for reliability)
        setTimeout(() => {
            if (window.editor) window.editor.layout();
        }, 50);
        setTimeout(() => {
            if (window.editor) window.editor.layout();
        }, 200);

        eventBus.emit(EVENTS.VIEW_MODE_CHANGED, { mode: view === 'editor' ? 'code' : 'preview' });
    }

    /* ============================
       TOOLBAR OVERFLOW
       ============================ */

    _setupToolbarOverflow() {
        const overflowBtn = document.getElementById('toolbar-overflow-btn');
        if (!overflowBtn || !this.overflowSheet) return;

        overflowBtn.setAttribute('aria-expanded', 'false');
        this._renderToolbarOverflowMenu(overflowBtn);

        const setOverflowState = (isOpen) => {
            this.overflowSheet.classList.toggle('active', isOpen);
            overflowBtn.setAttribute('aria-expanded', String(isOpen));
            this.overflowSheet.setAttribute('aria-hidden', String(!isOpen));
            if (isOpen) {
                this._positionToolbarOverflow(overflowBtn);
            }
        };

        overflowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !this.overflowSheet.classList.contains('active');
            setOverflowState(isOpen);
        });

        // Close on outside click
        this._boundOverflowOutsideClick = (e) => {
            if (this.overflowSheet &&
                !this.overflowSheet.contains(e.target) &&
                e.target !== overflowBtn) {
                setOverflowState(false);
            }
        };
        document.addEventListener('click', this._boundOverflowOutsideClick);

        this.overflowSheet.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const handler = this._overflowActionHandlers[action];
            if (!handler) return;

            e.preventDefault();
            e.stopPropagation();
            setOverflowState(false);
            handler();
        });

        this._boundOverflowResize = () => {
            if (this.overflowSheet.classList.contains('active')) {
                this._positionToolbarOverflow(overflowBtn);
            }
        };
        window.addEventListener('resize', this._boundOverflowResize);
    }

    _positionToolbarOverflow(overflowBtn) {
        if (!this.overflowSheet) return;

        const rect = overflowBtn.getBoundingClientRect();
        this.overflowSheet.style.top = `${Math.round(rect.bottom + 8)}px`;
        this.overflowSheet.style.bottom = 'auto';

        if (this.isMobile()) {
            this.overflowSheet.style.left = '4px';
            this.overflowSheet.style.right = '4px';
        } else {
            this.overflowSheet.style.left = 'auto';
            this.overflowSheet.style.right = `${Math.max(8, Math.round(window.innerWidth - rect.right))}px`;
        }
    }

    _renderToolbarOverflowMenu(overflowBtn) {
        if (!this.overflowSheet) return;

        this.overflowSheet.innerHTML = '';
        this._overflowActionHandlers = {};

        const grid = document.createElement('div');
        grid.className = 'toolbar-overflow-grid';

        const addSection = (label) => {
            const section = document.createElement('div');
            section.className = 'toolbar-overflow-section';
            section.textContent = label;
            grid.appendChild(section);
        };

        const addItem = (action, icon, label, handler) => {
            this._overflowActionHandlers[action] = handler;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'toolbar-overflow-item';
            button.dataset.action = action;
            button.title = label;
            button.setAttribute('aria-label', label);
            button.innerHTML = `
                <span class="toolbar-overflow-icon">${icon}</span>
                <span>${label}</span>
            `;

            grid.appendChild(button);
        };

        addSection('Formatting');
        addItem('underline', '<u>U</u>', 'Underline', () => wrapSelectionHtml('u'));
        addItem('superscript', 'X²', 'Superscript', () => wrapSelectionHtml('sup'));
        addItem('subscript', 'X₂', 'Subscript', () => wrapSelectionHtml('sub'));
        addItem('kbd', 'K', 'Keyboard Key', () => wrapSelectionHtml('kbd'));
        addItem('h4', 'H4', 'Heading 4', () => prefixLine('#### '));
        addItem('h5', 'H5', 'Heading 5', () => prefixLine('##### '));
        addItem('h6', 'H6', 'Heading 6', () => prefixLine('###### '));
        addItem('indent', '→', 'Indent', () => prefixLine('  '));
        addItem('outdent', '←', 'Outdent', () => outdentSelection());

        addSection('Insert');
        addItem('footnote', '¹', 'Footnote', () => {
            const id = `fn-${Date.now().toString(36).slice(-4)}`;
            insertText(`[^${id}]\n\n[^${id}]: Footnote text`);
        });
        addItem('abbr', '🔤', 'Abbreviation', () => insertText('\n*[ABBR]: Full Text\n'));
        addItem('deflist', '📖', 'Definition List', () => insertText('\nTerm\n: Definition\n'));
        addItem('details', '▸', 'Collapsible', () => {
            const selection = getOverflowSelection();
            insertText(`\n<details>\n<summary>Click to expand</summary>\n\n${selection}\n\n</details>\n`);
        });
        addItem('math-inline', 'Σ', 'Math (inline)', () => wrapSelection('$', '$'));
        addItem('math-block', '∫', 'Math (block)', () => wrapSelection('\n$$\n', '\n$$\n'));
        addItem('anchor', '⚓', 'Anchor / ID', () => insertText('<a id="section-name"></a>'));
        addItem('comment', '💬', 'HTML Comment', () => wrapSelection('<!-- ', ' -->'));
        addItem('line-break', '↵', 'Line Break', () => insertText('<br>\n'));

        addSection('Diagrams');
        DIAGRAM_PRESETS.forEach(({ action, icon, label, content }) => {
            addItem(action, icon, label, () => insertText(content));
        });

        addSection('Transform');
        addItem('upper', 'A', 'UPPERCASE', () => transformSelection(t => t.toUpperCase()));
        addItem('lower', 'a', 'lowercase', () => transformSelection(t => t.toLowerCase()));
        addItem('titlecase', 'Tt', 'Title Case', () => transformSelection(t =>
            t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        ));
        addItem('sentencecase', 'Aa', 'Sentence case', () => transformSelection(t =>
            t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
        ));
        addItem('sort-asc', '↑', 'Sort Lines A→Z', () => transformSelection(t => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')));
        addItem('sort-desc', '↓', 'Sort Lines Z→A', () => transformSelection(t => t.split('\n').sort((a, b) => b.localeCompare(a)).join('\n')));
        addItem('reverse-lines', '⇅', 'Reverse Lines', () => transformSelection(t => t.split('\n').reverse().join('\n')));
        addItem('unique-lines', '◎', 'Unique Lines', () => transformSelection(t => [...new Set(t.split('\n'))].join('\n')));
        addItem('trim-lines', '⌧', 'Trim Lines', () => transformSelection(t => t.split('\n').map((line) => line.trim()).join('\n')));
        addItem('remove-formatting', '✕', 'Remove Markdown', () => transformSelection(t =>
            t
                .replace(/[*_~`#>]/g, '')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
                .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
                .trim()
        ));
        addItem('encode-uri', '%', 'URL Encode', () => transformSelection(t => encodeURIComponent(t)));
        addItem('decode-uri', '🔓', 'URL Decode', () => transformSelection(t => {
            try {
                return decodeURIComponent(t);
            } catch {
                return t;
            }
        }));
        addItem('escape-html', '&lt;', 'Escape HTML', () => transformSelection(t => {
            const span = document.createElement('span');
            span.textContent = t;
            return span.innerHTML;
        }));

        addSection('Date / Time');
        addItem('date-iso', '📅', 'ISO Date', () => insertText(getDateFormatted('iso')));
        addItem('date-long', '📅', 'Long Date', () => insertText(getDateFormatted('long')));
        addItem('date-short', '📅', 'Short Date', () => insertText(getDateFormatted('short')));
        addItem('time-now', '🕐', 'Current Time', () => insertText(getDateFormatted('time')));
        addItem('datetime-now', '📅', 'Date & Time', () => insertText(getDateFormatted('datetime')));
        addItem('unix-ts', '⏱️', 'Unix Timestamp', () => insertText(getDateFormatted('unix')));

        addSection('Lorem Ipsum');
        addItem('lorem-sentence', '•', 'Sentence', () => insertText(generateLorem('sentence')));
        addItem('lorem-short', '▪', 'Short', () => insertText(generateLorem('short')));
        addItem('lorem-paragraph', '¶', 'Paragraph', () => insertText(generateLorem('paragraph')));
        addItem('lorem-long', '▣', 'Long', () => insertText(generateLorem('long')));

        addSection('Panels');
        addItem('snippets', '⚡', 'Snippets', () => {
            toolbarManager._openSnippets(overflowBtn);
        });
        addItem('word-count', '🔢', 'Word Count', () => {
            toolbarManager._openWordCount(overflowBtn);
        });

        this.overflowSheet.appendChild(grid);
    }

    /* ============================
       SWIPE GESTURES
       ============================ */

    _setupSwipeGestures() {
        const container = document.getElementById('container');
        if (!container) return;

        let startX = 0;
        let startY = 0;
        let tracking = false;

        container.addEventListener('touchstart', (e) => {
            if (!this.isMobile()) return;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            tracking = true;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (!tracking || !this.isMobile()) return;
            tracking = false;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            // Require >60px horizontal, <40px vertical to count as swipe
            if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40) {
                if (deltaX < 0 && this.currentView === 'editor') {
                    // Swipe left → show preview
                    this.setView('preview');
                } else if (deltaX > 0 && this.currentView === 'preview') {
                    // Swipe right → show editor
                    this.setView('editor');
                }
            }
        }, { passive: true });
    }

    /* ============================
       RESIZE HANDLER
       ============================ */

    _setupResizeHandler() {
        let wasDesktop = !this.isMobile();

        this._boundBreakpointResize = () => {
            const isNowDesktop = !this.isMobile();

            // Crossing the breakpoint
            if (wasDesktop && !isNowDesktop) {
                // Entered mobile: set to editor view
                this.setView('editor');
            } else if (!wasDesktop && isNowDesktop) {
                // Entered desktop: restore split view
                document.body.classList.remove('view-editor', 'view-preview');
                document.body.classList.add('view-split');
                this.closeDrawer();
                if (this.overflowSheet) {
                    this.overflowSheet.classList.remove('active');
                }
            }

            wasDesktop = isNowDesktop;
        };
        window.addEventListener('resize', this._boundBreakpointResize);
    }

    /* ============================
       UTILITY
       ============================ */

    isMobile() {
        return window.innerWidth <= 768;
    }

    getView() {
        return this.currentView;
    }

    dispose() {
        this.closeDrawer();
        if (this.overflowSheet) {
            this.overflowSheet.classList.remove('active');
            this.overflowSheet.setAttribute('aria-hidden', 'true');
        }

        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown);
            this._boundKeydown = null;
        }
        if (this._boundOverflowOutsideClick) {
            document.removeEventListener('click', this._boundOverflowOutsideClick);
            this._boundOverflowOutsideClick = null;
        }
        if (this._boundOverflowResize) {
            window.removeEventListener('resize', this._boundOverflowResize);
            this._boundOverflowResize = null;
        }
        if (this._boundBreakpointResize) {
            window.removeEventListener('resize', this._boundBreakpointResize);
            this._boundBreakpointResize = null;
        }
        if (this._docsListTimers?.length) {
            this._docsListTimers.forEach((id) => clearTimeout(id));
            this._docsListTimers = [];
        }

        MobileUIManager.instance = null;
    }
}

export const mobileUIManager = new MobileUIManager();
export { MobileUIManager };
export default mobileUIManager;
