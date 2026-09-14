/**
 * Split Divider Manager
 * Handles resizable panes between editor and preview
 * @module features/divider
 */

import { editorService } from '../../core/editor/index.js';

/**
 * DividerManager class
 * Manages resizable split panes
 */
class DividerManager {
    static instance = null;

    constructor() {
        if (DividerManager.instance) {
            return DividerManager.instance;
        }

        this.divider = null;
        this.leftPane = null;
        this.rightPane = null;
        this.container = null;
        this.isDragging = false;
        this.lastLeftRatio = 0.5;

        // Bound handlers
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onResize = this._onResize.bind(this);

        DividerManager.instance = this;
    }

    /**
     * Initialize divider
     * @param {Object} options - Initialization options
     */
    initialize(options = {}) {
        const {
            divider = '#split-divider',
            leftPane = '#edit',
            rightPane = '#preview',
            container = '#container'
        } = options;

        this.divider = typeof divider === 'string'
            ? document.querySelector(divider)
            : divider;

        this.leftPane = typeof leftPane === 'string'
            ? document.querySelector(leftPane)
            : leftPane;

        this.rightPane = typeof rightPane === 'string'
            ? document.querySelector(rightPane)
            : rightPane;

        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.divider || !this.leftPane || !this.rightPane || !this.container) {
            console.warn('DividerManager: Missing required elements');
            return;
        }

        this._setupEventListeners();
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Hover effect
        this.divider.addEventListener('mouseenter', () => {
            this.divider.classList.add('hover');
        });

        this.divider.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
                this.divider.classList.remove('hover');
            }
        });

        // Start drag
        this.divider.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this._startDrag();
        });

        // Double-click to reset
        this.divider.addEventListener('dblclick', () => {
            this.reset();
        });

        // Document-level listeners
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);

        // Window resize
        window.addEventListener('resize', this._onResize);
    }

    /**
     * Start dragging
     * @private
     */
    _startDrag() {
        this.isDragging = true;
        this.divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    _getAvailableWidth() {
        if (!this.container || !this.divider) return 0;
        const totalWidth = this.container.getBoundingClientRect().width;
        const aiPanel = document.getElementById('ai-writer-panel');
        const aiWidth = aiPanel && getComputedStyle(aiPanel).position !== 'fixed'
            && getComputedStyle(aiPanel).display !== 'none'
            ? aiPanel.offsetWidth
            : 0;
        return Math.max(0, totalWidth - (this.divider.offsetWidth || 8) - aiWidth);
    }

    /**
     * Handle mouse move during drag
     * @param {MouseEvent} e
     * @private
     */
    _onMouseMove(e) {
        if (!this.isDragging) return;

        const containerRect = this.container.getBoundingClientRect();
        const offsetX = e.clientX - containerRect.left;
        const availableWidth = this._getAvailableWidth();

        // Prevent overlap or out-of-bounds
        const minWidth = 100;
        const maxWidth = availableWidth - minWidth;
        const leftWidth = Math.max(minWidth, Math.min(offsetX, maxWidth));

        this.leftPane.style.width = leftWidth + 'px';
        this.rightPane.style.width = (availableWidth - leftWidth) + 'px';
        this.lastLeftRatio = availableWidth > 0 ? leftWidth / availableWidth : 0.5;

        // Trigger editor layout update
        editorService.layout();
    }

    /**
     * Handle mouse up (end drag)
     * @private
     */
    _onMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.divider.classList.remove('active');
            this.divider.classList.remove('hover');
            document.body.style.cursor = 'default';
            document.body.style.userSelect = '';
            // Phase 5: DIVIDER_CHANGED emit removed — zero listeners in the
            // tree; the channel key stays documented in eventBus.js.
        }
    }

    /**
     * Handle window resize
     * @private
     */
    _onResize() {
        if (!this.container) return;

        const availableWidth = this._getAvailableWidth();

        const newLeft = availableWidth * this.lastLeftRatio;
        const newRight = availableWidth * (1 - this.lastLeftRatio);

        this.leftPane.style.width = newLeft + 'px';
        this.rightPane.style.width = newRight + 'px';

        // Trigger editor layout update
        editorService.layout();
    }

    /**
     * Reset to 50/50 split
     */
    reset() {
        if (!this.container) return;

        const halfWidth = this._getAvailableWidth() / 2;

        this.leftPane.style.width = halfWidth + 'px';
        this.rightPane.style.width = halfWidth + 'px';
        this.lastLeftRatio = 0.5;

        // Trigger editor layout update
        editorService.layout();
        // Phase 5: DIVIDER_CHANGED emit removed (zero listeners).
    }

    /**
     * Set split ratio
     * @param {number} ratio - Left pane ratio (0-1)
     */
    setRatio(ratio) {
        if (!this.container || ratio < 0 || ratio > 1) return;

        const availableWidth = this._getAvailableWidth();

        this.leftPane.style.width = (availableWidth * ratio) + 'px';
        this.rightPane.style.width = (availableWidth * (1 - ratio)) + 'px';
        this.lastLeftRatio = ratio;

        editorService.layout();
    }

    /**
     * Get current ratio
     * @returns {number}
     */
    getRatio() {
        return this.lastLeftRatio;
    }

    /**
     * Dispose manager
     */
    dispose() {
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('resize', this._onResize);
        DividerManager.instance = null;
    }
}

export const dividerManager = new DividerManager();
export { DividerManager };
export default dividerManager;
