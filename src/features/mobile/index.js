/**
 * Mobile UI Manager
 * Handles mobile-specific UI: view switcher, drawer with tab management,
 * toolbar overflow, swipe gestures.
 * @module features/mobile
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';

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
        this.currentView = 'editor';
        this._swipeState = null;
        this._boundOutsideClick = null;

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
                const desktopNewTab = document.getElementById('new-tab-button');
                if (desktopNewTab) desktopNewTab.click();
            });
        }

        // Theme toggle button — delegates to the desktop dark-mode toggle
        const themeBtn = document.getElementById('mobile-theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const desktopThemeBtn = document.getElementById('dark-mode-toggle');
                if (desktopThemeBtn) desktopThemeBtn.click();
                // Sync icon state after toggle
                this._syncMobileThemeIcon();
            });
            // Initial sync
            this._syncMobileThemeIcon();
        }
    }

    _syncMobileThemeIcon() {
        const mobileBtn = document.getElementById('mobile-theme-btn');
        const desktopBtn = document.getElementById('dark-mode-toggle');
        if (!mobileBtn || !desktopBtn) return;

        const isDark = document.body.classList.contains('dark-mode') ||
                       document.documentElement.getAttribute('data-theme') === 'dark';

        const mobileSun = mobileBtn.querySelector('.icon-sun');
        const mobileMoon = mobileBtn.querySelector('.icon-moon');
        if (mobileSun) mobileSun.style.display = isDark ? 'none' : 'block';
        if (mobileMoon) mobileMoon.style.display = isDark ? 'block' : 'none';
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.drawer?.classList.contains('active')) {
                    this.closeDrawer();
                    e.preventDefault();
                } else if (this.overflowSheet?.classList.contains('active')) {
                    this.overflowSheet.classList.remove('active');
                    e.preventDefault();
                }
            }
        });
    }

    _setupDrawerActions() {
        if (!this.drawer) return;

        // New document
        const newBtn = document.getElementById('mobile-new-btn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                document.getElementById('new-tab-button')?.click();
                this.closeDrawer();
                // Re-render doc list after short delay
                setTimeout(() => this.renderDocsList(), 100);
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
                    setTimeout(() => this.renderDocsList(), 50);
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
        overflowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = this.overflowSheet.classList.toggle('active');
            overflowBtn.setAttribute('aria-expanded', String(isOpen));
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.overflowSheet &&
                !this.overflowSheet.contains(e.target) &&
                e.target !== overflowBtn) {
                this.overflowSheet.classList.remove('active');
                overflowBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Wire overflow items to toolbar buttons
        const actionMap = {
            'strikethrough': '#toolbar-strikethrough',
            'table': '#toolbar-table',
            'hr': '#toolbar-hr',
            'quote': '#toolbar-quote',
            'task': '#toolbar-task',
            'ol': '#toolbar-ol',
            'emoji': '#toolbar-emoji',
            'codeblock': '#toolbar-code'
        };

        this.overflowSheet.querySelectorAll('.toolbar-overflow-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const selector = actionMap[action];
                if (selector) {
                    // .click() works on hidden elements — no need to show them
                    const btn = document.querySelector(selector);
                    if (btn) btn.click();
                }
                this.overflowSheet.classList.remove('active');
                overflowBtn.setAttribute('aria-expanded', 'false');
            });
        });
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

        window.addEventListener('resize', () => {
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
        });
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
        MobileUIManager.instance = null;
    }
}

export const mobileUIManager = new MobileUIManager();
export { MobileUIManager };
export default mobileUIManager;
