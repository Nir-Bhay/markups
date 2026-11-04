/**
 * Split Divider Manager
 * Handles resizable panes between editor and preview
 * @module features/divider
 */

import { editorService } from '../../core/editor/index.js';
import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { modesManager } from '../modes/index.js';

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
        this.isSplitMode = true;
        this.lastLeftRatio = 0.5;
        this._viewModeUnsubscribe = null;

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

        const savedRatio = Number.parseFloat(this.leftPane.style.width);
        if (this.leftPane.style.width.endsWith('%') && Number.isFinite(savedRatio)) {
            this.lastLeftRatio = Math.max(0.1, Math.min(0.9, savedRatio / 100));
        }
        this.isSplitMode = this.container.classList.contains('mode-split')
            || document.body.classList.contains('view-split');
        this._viewModeUnsubscribe?.();
        this._viewModeUnsubscribe = eventBus.on(EVENTS.VIEW_MODE_CHANGED, ({ mode }) => {
            this.isSplitMode = mode === 'split';
            if (this.isSplitMode) {
                this._applyRatio(this.lastLeftRatio);
            } else {
                this._clearPaneSizing();
            }
        });

        this._setupEventListeners();
        if (this.isSplitMode) this._applyRatio(this.lastLeftRatio);
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
        if (!this.isSplitMode) return;
        this.isDragging = true;
        this.divider.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    _getAvailableWidth() {
        if (!this.container || !this.divider) return 0;
        const containerRect = this.container.getBoundingClientRect();
        const leftRect = this.leftPane.getBoundingClientRect();
        const rightRect = this.rightPane.getBoundingClientRect();
        const leftInset = Math.max(0, leftRect.left - containerRect.left);
        const rightInset = Math.max(0, containerRect.right - rightRect.right);
        const aiPanel = document.getElementById('ai-writer-panel');
        const aiWidth = aiPanel && getComputedStyle(aiPanel).position !== 'fixed'
            && getComputedStyle(aiPanel).display !== 'none'
            ? aiPanel.offsetWidth
            : 0;
        return Math.max(0, containerRect.width - leftInset - rightInset
            - this.divider.getBoundingClientRect().width - aiWidth);
    }

    _setPaneWidths(leftWidth, rightWidth) {
        for (const [pane, width] of [[this.leftPane, leftWidth], [this.rightPane, rightWidth]]) {
            const safeWidth = Math.max(0, width);
            // A flex item with `flex: 1` uses a zero basis and ignores width.
            // A fixed basis makes the pane follow the divider while dragging.
            pane.style.flex = `0 0 ${safeWidth}px`;
            pane.style.width = `${safeWidth}px`;
        }
    }

    _clearPaneSizing() {
        for (const pane of [this.leftPane, this.rightPane]) {
            if (!pane) continue;
            pane.style.flex = '';
            pane.style.width = '';
        }
    }

    _applyRatio(ratio) {
        if (!this.container || !this.leftPane || !this.rightPane) return;
        const availableWidth = this._getAvailableWidth();
        if (availableWidth <= 0) return;
        const minWidth = Math.min(availableWidth / 2, Math.max(100, availableWidth * 0.1));
        const desiredLeft = availableWidth * Math.max(0.1, Math.min(0.9, ratio));
        const leftWidth = Math.max(minWidth, Math.min(desiredLeft, availableWidth - minWidth));
        this._setPaneWidths(leftWidth, availableWidth - leftWidth);
        this.lastLeftRatio = leftWidth / availableWidth;
        editorService.layout();
    }

    /**
     * Handle mouse move during drag
     * @param {MouseEvent} e
     * @private
     */
    _onMouseMove(e) {
        if (!this.isDragging || !this.isSplitMode) return;

        const leftRect = this.leftPane.getBoundingClientRect();
        const offsetX = e.clientX - leftRect.left;
        const availableWidth = this._getAvailableWidth();
        if (availableWidth <= 0) return;

        // Prevent overlap or out-of-bounds
        const minWidth = Math.min(availableWidth / 2, Math.max(100, availableWidth * 0.1));
        const maxWidth = availableWidth - minWidth;
        const leftWidth = Math.max(minWidth, Math.min(offsetX, maxWidth));

        this._setPaneWidths(leftWidth, availableWidth - leftWidth);
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
            modesManager.setSplitRatio(this.lastLeftRatio * 100, { apply: false, persist: true });
            // Phase 5: DIVIDER_CHANGED emit removed — zero listeners in the
            // tree; the channel key stays documented in eventBus.js.
        }
    }

    /**
     * Handle window resize
     * @private
     */
    _onResize() {
        if (!this.container || !this.isSplitMode) return;
        this._applyRatio(this.lastLeftRatio);
    }

    /**
     * Reset to 50/50 split
     */
    reset() {
        if (!this.container || !this.isSplitMode) return;

        this.lastLeftRatio = 0.5;
        this._applyRatio(this.lastLeftRatio);
        modesManager.setSplitRatio(50, { apply: false, persist: true });
        // Phase 5: DIVIDER_CHANGED emit removed (zero listeners).
    }

    /**
     * Set split ratio
     * @param {number} ratio - Left pane ratio (0-1)
     */
    setRatio(ratio) {
        if (!this.container || ratio < 0 || ratio > 1) return;

        this.lastLeftRatio = ratio;
        this._applyRatio(ratio);
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
        this._viewModeUnsubscribe?.();
        this._viewModeUnsubscribe = null;
        this._clearPaneSizing();
        DividerManager.instance = null;
    }
}

export const dividerManager = new DividerManager();
export { DividerManager };
export default dividerManager;
