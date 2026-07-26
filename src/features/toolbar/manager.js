/**
 * ToolbarManager — orchestration, rendering, popover UIs
 * @module features/toolbar/manager
 */

import {
  COLORS,
  HIGHLIGHT_COLORS,
  EMOJI_SETS,
  SPECIAL_CHARS,
  TABLE_MAX,
} from './constants.js';
import { TOOLBAR_GROUPS } from './dropdowns.js';
import { prefs } from './preferences.js';
import { popover } from './popovers.js';
import { injectToolbarStyles } from './styles.js';
import {
  resolveEditor,
  wrapSelectionHtml,
  insertText,
  getSelection,
  insertTable,
} from './utils.js';

export class ToolbarManager {
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
        this._boundKeydown = (e) => {
            const btn = this._findButtonByShortcut(e);
            if (btn) {
                e.preventDefault();
                btn.action();
            }
        };
        document.addEventListener('keydown', this._boundKeydown);
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
        if (typeof this._popover.dispose === 'function') {
            this._popover.dispose();
        }
        if (this._boundKeydown) {
            document.removeEventListener('keydown', this._boundKeydown);
            this._boundKeydown = null;
        }
        if (this.container) this.container.innerHTML = '';
        this.groups = [];
        this.initialized = false;

        const styles = document.getElementById('tb-enhanced-styles');
        if (styles) styles.remove();

        ToolbarManager.instance = null;
        console.log('[Toolbar v2] ✓ Disposed');
    }
}
