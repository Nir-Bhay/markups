/**
 * BacklinksPanel — collapsible right sidebar + toolbar button for backlinks.
 * @module features/backlinks/panel
 */

export class BacklinksPanel {
    /**
     * @param {import('./index.js').BacklinksManager} manager
     */
    constructor(manager) {
        this.manager = manager;
        this.panel = null;
        this.button = null;
        this.contentEl = null;
        this._visible = false;
    }

    /** Create DOM elements and bind events. */
    initialize() {
        this._createButton();
        this._createSidebar();
        this._bindEvents();
        this.render(this.manager.config.activeDocId);
    }

    _createButton() {
        const tocBtn = document.getElementById('toc-button');
        if (!tocBtn || !tocBtn.parentNode) return;

        this.button = document.createElement('button');
        this.button.className = 'toolbar-btn';
        this.button.id = 'backlinks-button';
        this.button.title = 'Backlinks';
        this.button.setAttribute('aria-label', 'Toggle Backlinks');
        this.button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

        tocBtn.parentNode.insertBefore(this.button, tocBtn.nextSibling);
    }

    _createSidebar() {
        const previewPane = document.getElementById('preview');
        if (!previewPane) return;

        this.panel = document.createElement('aside');
        this.panel.className = 'toc-sidebar backlinks-sidebar hidden';
        this.panel.id = 'backlinks-sidebar';
        this.panel.innerHTML = `
            <div class="toc-header">
                <div class="toc-section-title">BACKLINKS</div>
                <button class="toc-close-btn" title="Hide backlinks" aria-label="Hide backlinks">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
                    </svg>
                </button>
            </div>
            <nav id="backlinks-content">
                <div class="backlinks-empty">No backlinks yet</div>
            </nav>
        `;

        previewPane.appendChild(this.panel);
        this.contentEl = this.panel.querySelector('#backlinks-content');
    }

    _bindEvents() {
        this.button?.addEventListener('click', () => this.toggle());
        this.panel?.querySelector('.toc-close-btn')?.addEventListener('click', () => this.hide());
    }

    toggle() {
        if (this._visible) this.hide();
        else this.show();
    }

    show() {
        this._visible = true;
        this.panel?.classList.remove('hidden');
        this.button?.classList.add('active');
        this.render(this.manager.config.activeDocId);
    }

    hide() {
        this._visible = false;
        this.panel?.classList.add('hidden');
        this.button?.classList.remove('active');
    }

    /**
     * Render backlinks for a document.
     * @param {string} docId
     */
    render(docId) {
        if (!this.contentEl || !docId) return;
        const backlinks = this.manager.getBacklinksFor(docId);

        if (backlinks.length === 0) {
            this.contentEl.innerHTML = '<div class="backlinks-empty">No backlinks yet</div>';
            return;
        }

        this.contentEl.innerHTML = backlinks.map(b => `
            <div class="backlinks-item" data-doc-id="${this._escapeHtml(b.id)}">
                <span class="backlinks-title">${this._escapeHtml(b.title)}</span>
                ${b.count > 1 ? `<span class="backlinks-count">${b.count}</span>` : ''}
            </div>
        `).join('');

        this.contentEl.querySelectorAll('.backlinks-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.docId;
                if (id) this.manager.config.onSwitchTab(id);
            });
        });
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /** Clean up DOM references. */
    dispose() {
        this.panel?.remove();
        this.button?.remove();
        this.panel = null;
        this.button = null;
        this.contentEl = null;
    }
}
