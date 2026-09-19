/**
 * Focus Mode Manager
 * Handles focus mode for distraction-free writing
 * @module features/focus
 */

import { eventBus, EVENTS, Subscriptions } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';
import { APP_CONFIG } from '../../config/app.config.js';

/**
 * FocusManager class
 * Manages focus mode state and behavior
 */
class FocusManager {
    static instance = null;

    constructor() {
        if (FocusManager.instance) {
            return FocusManager.instance;
        }

        this.isEnabled = false;
        this.button = null;
        this.dock = null;
        this.zoom = APP_CONFIG.DEFAULT_FONT_SIZE;
        this.previousActiveElement = null;
        this.initialized = false;
        this.escHandler = null;

        FocusManager.instance = this;
    }

    /**
     * Initialize focus mode
     * @param {HTMLElement|string} button - Focus toggle button
     */
    initialize(button) {
        if (this.initialized) return;
        this.button = typeof button === 'string'
            ? document.querySelector(button)
            : button;
        this.dock = document.getElementById('focus-dock');

        if (this.button) {
            this.button.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
            this.button.setAttribute('aria-pressed', 'false');
            this.button.dataset.tooltipDescription = 'Hide distractions and focus on the editor only.';
        }

        this._bindDock();

        // ESC key handler
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.isEnabled) {
                this.disable();
            }
        };

        document.addEventListener('keydown', this.escHandler);

        // Subscribe to events — track subscriptions so dispose() can detach (memory leak fix)
        this.subscriptions = this.subscriptions || new Subscriptions();
        this.subscriptions.on(EVENTS.FOCUS_MODE_TOGGLE, () => this.toggle());
        this.initialized = true;
    }

    _bindDock() {
        if (!this.dock || this.dock.dataset.bound === 'true') return;
        this.dock.dataset.bound = 'true';
        this.dock.querySelector('#focus-zoom-out')?.addEventListener('click', () => this.setZoom(this.zoom - 1));
        this.dock.querySelector('#focus-zoom-in')?.addEventListener('click', () => this.setZoom(this.zoom + 1));
        this.dock.querySelector('#focus-zoom-reset')?.addEventListener('click', () => this.setZoom(APP_CONFIG.DEFAULT_FONT_SIZE));
        this.dock.querySelector('#focus-exit')?.addEventListener('click', () => this.disable());
    }

    /**
     * Toggle focus mode
     */
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Enable focus mode
     */
    enable() {
        this.previousActiveElement = document.activeElement;
        this.isEnabled = true;
        document.body.classList.add('focus-mode');

        if (this.button) {
            this.button.classList.add('active');
            this.button.setAttribute('aria-pressed', 'true');
            this.button.setAttribute('aria-label', 'Exit Focus Mode');
            this.button.title = 'Exit Focus Mode';
        }
        if (this.dock) {
            this.dock.hidden = false;
            this._updateZoomLabel();
        }

        editorService.focus();
        eventBus.emit(EVENTS.FOCUS_MODE_CHANGED, { enabled: true });
        eventBus.emit(EVENTS.TOAST_SHOW, {
            message: 'Focus Mode Enabled (Press ESC to exit)',
            type: 'success'
        });
    }

    /**
     * Disable focus mode
     */
    disable() {
        this.isEnabled = false;
        document.body.classList.remove('focus-mode');

        if (this.button) {
            this.button.classList.remove('active');
            this.button.setAttribute('aria-pressed', 'false');
            this.button.setAttribute('aria-label', 'Focus Mode');
            this.button.title = 'Focus Mode';
        }
        if (this.dock) {
            this.dock.hidden = true;
        }
        if (this.zoom !== APP_CONFIG.DEFAULT_FONT_SIZE) {
            this.setZoom(APP_CONFIG.DEFAULT_FONT_SIZE);
        }

        const restoreTarget = this.previousActiveElement;
        this.previousActiveElement = null;
        if (restoreTarget && typeof restoreTarget.focus === 'function' && document.contains(restoreTarget)) {
            restoreTarget.focus({ preventScroll: true });
        } else {
            editorService.focus();
        }
        eventBus.emit(EVENTS.FOCUS_MODE_CHANGED, { enabled: false });
        eventBus.emit(EVENTS.TOAST_SHOW, {
            message: 'Focus Mode Disabled',
            type: 'info',
            duration: 1500
        });
    }

    /**
     * Get current state
     * @returns {boolean}
     */
    getState() {
        return this.isEnabled;
    }

    setZoom(value) {
        const min = APP_CONFIG.MIN_FONT_SIZE;
        const max = APP_CONFIG.MAX_FONT_SIZE;
        this.zoom = Math.min(max, Math.max(min, Number(value) || APP_CONFIG.DEFAULT_FONT_SIZE));
        const editor = editorService.getEditor();
        editor?.updateOptions?.({ fontSize: this.zoom });
        editor?.layout?.();
        this._updateZoomLabel();
        return this.zoom;
    }

    _updateZoomLabel() {
        const reset = this.dock?.querySelector('#focus-zoom-reset');
        if (reset) {
            reset.textContent = `${Math.round((this.zoom / APP_CONFIG.DEFAULT_FONT_SIZE) * 100)}%`;
        }
        this.dock?.querySelector('#focus-zoom-out')?.toggleAttribute('disabled', this.zoom <= APP_CONFIG.MIN_FONT_SIZE);
        this.dock?.querySelector('#focus-zoom-in')?.toggleAttribute('disabled', this.zoom >= APP_CONFIG.MAX_FONT_SIZE);
    }

    /**
     * Dispose manager
     */
    dispose() {
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        if (this.subscriptions) {
            this.subscriptions.dispose();
        }
        this.isEnabled = false;
        document.body.classList.remove('focus-mode');
        if (this.dock) this.dock.hidden = true;
        this.initialized = false;
        FocusManager.instance = null;
    }
}

export const focusManager = new FocusManager();
export { FocusManager };
export default focusManager;
