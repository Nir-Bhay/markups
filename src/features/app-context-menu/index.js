/**
 * App Context Menu
 * Provides a consistent custom right-click experience across editor, preview,
 * and app chrome. Specialized menus like explorer/file-tree and image-resize
 * remain owned by their own features; this layer defers to them instead of
 * replacing them.
 *
 * @module features/app-context-menu
 */

import { copyToClipboard, readFromClipboard } from '../../utils/clipboard.js';
import { insertText } from '../toolbar/index.js';
import { editorService } from '../../core/editor/index.js';

const EDITOR_MENU = 'editor';
const PREVIEW_MENU = 'preview';
const APP_MENU = 'app';

const ICONS = {
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    paste: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
    moveUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
    moveDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    sort: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>',
    trim: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    format: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M4 12h10"/><path d="M4 17h14"/></svg>',
    image: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    save: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    block: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
    toc: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    theme: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    help: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>'
};

class AppContextMenuManager {
    static instance = null;

    constructor() {
        if (AppContextMenuManager.instance) {
            return AppContextMenuManager.instance;
        }

        this.initialized = false;
        this.menu = null;
        this._boundClick = null;
        this._boundKeydown = null;
        this._boundScroll = null;
        this._boundResize = null;
        this._boundContextMenu = null;
        this._originTarget = null;
        this._focusIndex = -1;

        AppContextMenuManager.instance = this;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.menu = document.createElement('div');
        this.menu.className = 'app-context-menu';
        this.menu.setAttribute('role', 'menu');
        this.menu.setAttribute('aria-hidden', 'true');
        this.menu.hidden = true;
        document.body.appendChild(this.menu);

        this._boundClick = (event) => this._handleDocumentClick(event);
        this._boundKeydown = (event) => this._handleDocumentKeydown(event);
        this._boundScroll = () => this.close();
        this._boundResize = () => this.close();
        this._boundContextMenu = (event) => this._handleContextMenu(event);

        document.addEventListener('click', this._boundClick, true);
        document.addEventListener('keydown', this._boundKeydown, true);
        window.addEventListener('scroll', this._boundScroll, true);
        window.addEventListener('resize', this._boundResize);
        document.addEventListener('contextmenu', this._boundContextMenu);
    }

    dispose() {
        this.close();
        document.removeEventListener('click', this._boundClick, true);
        document.removeEventListener('keydown', this._boundKeydown, true);
        window.removeEventListener('scroll', this._boundScroll, true);
        window.removeEventListener('resize', this._boundResize);
        document.removeEventListener('contextmenu', this._boundContextMenu);

        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }

        this.initialized = false;
        AppContextMenuManager.instance = null;
    }

    _handleDocumentClick(event) {
        if (!this.menu || !this.menu.classList.contains('visible')) return;
        if (this.menu.contains(event.target)) return;
        this.close();
    }

    _handleDocumentKeydown(event) {
        if (!this.menu || !this.menu.classList.contains('visible')) return;

        const items = Array.from(this.menu.querySelectorAll('.app-context-item'));
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
            return;
        }

        if (!items.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this._focusIndex = (this._focusIndex + 1) % items.length;
            items[this._focusIndex].focus();
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this._focusIndex = this._focusIndex <= 0 ? items.length - 1 : this._focusIndex - 1;
            items[this._focusIndex].focus();
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const active = items[this._focusIndex] || items[0];
            active?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        }
    }

    _handleContextMenu(event) {
        const target = event.target;

        // Let explorer, image resize, or other specialized handlers own their areas.
        if (target.closest('.explorer-node-row') || target.closest('#explorer-tree')) {
            return;
        }
        if (target.closest('img[data-loaded]')) {
            return;
        }
        if (target.closest('.ir-context-menu') || target.closest('.ir-overlay') || target.closest('.ir-dialog-backdrop')) {
            return;
        }

        const editorEl = document.querySelector('#editor');
        const previewEl = document.querySelector('#output');
        const menuType = this._resolveMenuType(target, { editorEl, previewEl });

        event.preventDefault();
        event.stopPropagation();
        this._originTarget = target;
        this.open(menuType, event.clientX, event.clientY);
    }

    _resolveMenuType(target, { editorEl, previewEl }) {
        if (editorEl && editorEl.contains(target)) {
            return EDITOR_MENU;
        }
        if (previewEl && previewEl.contains(target)) {
            return PREVIEW_MENU;
        }
        return APP_MENU;
    }

    open(type, x, y) {
        if (!this.menu) return;

        this.menu.innerHTML = '';
        this.menu.className = 'app-context-menu visible';
        this.menu.setAttribute('aria-hidden', 'false');
        this.menu.dataset.menuType = type;
        this._focusIndex = -1;

        const items = this._buildMenu(type);
        items.forEach(item => this.menu.appendChild(item));

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;

        this.menu.hidden = false;
        requestAnimationFrame(() => {
            this._clampMenu();
            const firstItem = this.menu.querySelector('.app-context-item');
            if (firstItem) {
                this._focusIndex = 0;
                firstItem.focus();
            }
        });
    }

    close() {
        if (!this.menu) return;
        this.menu.className = 'app-context-menu';
        this.menu.setAttribute('aria-hidden', 'true');
        this.menu.innerHTML = '';
        this.menu.hidden = true;
        delete this.menu.dataset.menuType;
        this._originTarget = null;
        this._focusIndex = -1;
    }

    _buildMenu(type) {
        if (type === EDITOR_MENU) return this._buildEditorMenu();
        if (type === PREVIEW_MENU) return this._buildPreviewMenu();
        return this._buildAppMenu();
    }

    _buildEditorMenu() {
        return [
            this._item(ICONS.copy, 'Copy', 'Ctrl+C', () => this._editorCopy()),
            this._item(ICONS.paste, 'Paste', 'Ctrl+V', () => this._editorPaste()),
            this._separator(),
            this._item(ICONS.moveUp, 'Move Line Up', 'Alt+↑', () => this._triggerEditorCommand('editor.action.moveLinesUpAction')),
            this._item(ICONS.moveDown, 'Move Line Down', 'Alt+↓', () => this._triggerEditorCommand('editor.action.moveLinesDownAction')),
            this._item(ICONS.sort, 'Sort Lines', '', () => this._triggerEditorCommand('editor.action.sortLines')),
            this._item(ICONS.trim, 'Trim Trailing Whitespace', '', () => this._triggerEditorCommand('editor.action.trimTrailingWhitespace')),
            this._separator(),
            this._item(ICONS.format, 'Format Document', 'Shift+Alt+F', () => this._triggerEditorCommand('editor.action.formatDocument')),
            this._item(ICONS.image, 'Insert Image', 'Ctrl+Shift+I', () => this._clickToolbarButton('toolbar-image')),
            this._item(ICONS.link, 'Insert Link', 'Ctrl+K', () => this._clickToolbarButton('toolbar-link')),
            this._item(ICONS.save, 'Save', 'Ctrl+S', () => this._clickToolbarButton('export-btn')),
        ];
    }

    _buildPreviewMenu() {
        const originTarget = this._originTarget;
        const clickedBlock = originTarget?.closest?.(
            'p, h1, h2, h3, h4, h5, h6, pre, blockquote, ul, ol, li, table, details, summary, hr'
        );

        return [
            this._item(ICONS.copy, 'Copy Selection', 'Ctrl+C', () => this._previewCopySelection()),
            this._item(ICONS.block, 'Copy Block Text', '', () => this._copyPreviewBlock(clickedBlock)),
            this._separator(),
            this._item(ICONS.image, 'Insert Image', '', () => this._clickToolbarButton('toolbar-image')),
            this._item(ICONS.link, 'Insert Link', '', () => this._clickToolbarButton('toolbar-link')),
            this._item(ICONS.toc, 'Toggle Table of Contents', '', () => this._clickToolbarButton('toc-toggle-btn')),
            this._item(ICONS.search, 'Find in Document', 'Ctrl+F', () => this._clickToolbarButton('search-btn')),
            this._separator(),
            this._item(ICONS.theme, 'Toggle Theme', '', () => this._clickToolbarButton('dark-mode-toggle')),
            this._item(ICONS.help, 'Help & Shortcuts', 'Ctrl+H', () => this._clickToolbarButton('help-button')),
        ];
    }

    _buildAppMenu() {
        return [
            this._item(ICONS.copy, 'Copy Selection', 'Ctrl+C', () => document.execCommand('copy')),
            this._separator(),
            this._item(ICONS.theme, 'Toggle Theme', '', () => this._clickToolbarButton('dark-mode-toggle')),
            this._item(ICONS.help, 'Help & Shortcuts', 'Ctrl+H', () => this._clickToolbarButton('help-button')),
        ];
    }

    _editorCopy() {
        try {
            document.execCommand('copy');
        } catch {
            // ignore unsupported environments
        }
    }

    async _editorPaste() {
        const text = await readFromClipboard();
        if (typeof text === 'string' && text) {
            insertText(text);
        }
    }

    _previewCopySelection() {
        try {
            document.execCommand('copy');
        } catch {
            // ignore unsupported environments
        }
    }

    _copyPreviewBlock(block) {
        const root = document.querySelector('#output');
        const target = block && root?.contains(block) ? block : root;
        const text = (target?.innerText || target?.textContent || '').trim();
        if (!text) return;
        copyToClipboard(text);
    }

    _triggerEditorCommand(commandId) {
        const editor = editorService.getEditor?.();
        if (!editor || typeof editor.trigger !== 'function') return;
        try {
            editor.trigger('app-context-menu', commandId, null);
        } catch {
            // ignore unsupported commands
        }
    }

    _clickToolbarButton(id) {
        const button = document.getElementById(id);
        button?.click();
    }

    _item(iconHtml, label, shortcut, action) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'app-context-item';
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '-1');

        const iconEl = document.createElement('span');
        iconEl.className = 'app-context-icon';
        iconEl.innerHTML = iconHtml;
        iconEl.setAttribute('aria-hidden', 'true');

        const labelEl = document.createElement('span');
        labelEl.className = 'app-context-label';
        labelEl.textContent = label;

        item.appendChild(iconEl);
        item.appendChild(labelEl);

        if (shortcut) {
            const shortcutEl = document.createElement('span');
            shortcutEl.className = 'app-context-shortcut';
            shortcutEl.textContent = shortcut;
            item.appendChild(shortcutEl);
        }

        item.addEventListener('mousedown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            action?.();
            this.close();
        });

        return item;
    }

    _separator() {
        const sep = document.createElement('div');
        sep.className = 'app-context-sep';
        sep.setAttribute('role', 'separator');
        return sep;
    }

    _clampMenu() {
        if (!this.menu) return;
        const rect = this.menu.getBoundingClientRect();
        let left = rect.left;
        let top = rect.top;

        if (rect.right > window.innerWidth) {
            left = window.innerWidth - rect.width - 8;
        }
        if (rect.bottom > window.innerHeight) {
            top = window.innerHeight - rect.height - 8;
        }

        this.menu.style.left = `${Math.max(4, left)}px`;
        this.menu.style.top = `${Math.max(4, top)}px`;
    }
}

export const appContextMenuManager = new AppContextMenuManager();
export default appContextMenuManager;
