/**
 * Typewriter Mode Manager
 * Centers the cursor line in the viewport while typing
 * @module features/typewriter
 */

import { eventBus, EVENTS, Subscriptions } from '../../utils/eventBus.js';
import { editorService } from '../../core/editor/index.js';

/**
 * TypewriterManager class
 * Manages typewriter mode state and behavior
 */
class TypewriterManager {
    static instance = null;

    constructor() {
        if (TypewriterManager.instance) {
        return TypewriterManager.instance;
        }

        this.isEnabled = false;
        this.button = null;
        this.cursorListener = null;
        this.initialized = false;

        TypewriterManager.instance = this;
    }

    /**
     * Initialize typewriter mode
     * @param {HTMLElement|string} button - Typewriter toggle button
     */
    initialize(button) {
        if (this.initialized) return;
        this.button = typeof button === 'string'
        ? document.querySelector(button)
        : button;

        if (this.button) {
        this.button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
        });
        }

        // Subscribe to events
        this.subscriptions = this.subscriptions || new Subscriptions();
        this.subscriptions.on(EVENTS.TYPEWRITER_MODE_TOGGLE, () => this.toggle());
        if (this.button) {
            this.button.setAttribute('aria-pressed', 'false');
            this.button.dataset.tooltipDescription = 'Keeps the active line centered while you write.';
        }
        this.initialized = true;
    }

    /**
     * Toggle typewriter mode
     */
    toggle() {
        if (this.isEnabled) {
        this.disable();
        } else {
        this.enable();
        }
    }

    /**
     * Enable typewriter mode
     */
    enable() {
        this.isEnabled = true;

        const editor = editorService.getEditor();
        if (editor) {
        // Set up cursor position listener
        this.cursorListener = editor.onDidChangeCursorPosition((e) => {
        if (this.isEnabled) {
        editor.revealLineInCenter(e.position.lineNumber);
        }
        });

        // Center current line immediately
        const position = editor.getPosition();
        if (position) {
        editor.revealLineInCenter(position.lineNumber);
        }
        }

        if (this.button) {
        this.button.classList.add('active');
        this.button.setAttribute('aria-pressed', 'true');
        this.button.setAttribute('aria-label', 'Exit Typewriter Mode');
        this.button.title = 'Exit Typewriter Mode';
        }

        eventBus.emit(EVENTS.TYPEWRITER_MODE_CHANGED, { enabled: true });
        eventBus.emit(EVENTS.TOAST_SHOW, {
        message: 'Typewriter Mode Enabled',
        type: 'success',
        duration: 1500
        });
    }

    /**
     * Disable typewriter mode
     */
    disable() {
        this.isEnabled = false;

        if (this.cursorListener) {
        this.cursorListener.dispose();
        this.cursorListener = null;
        }

        if (this.button) {
        this.button.classList.remove('active');
        this.button.setAttribute('aria-pressed', 'false');
        this.button.setAttribute('aria-label', 'Typewriter Mode');
        this.button.title = 'Typewriter Mode';
        }

        eventBus.emit(EVENTS.TYPEWRITER_MODE_CHANGED, { enabled: false });
        eventBus.emit(EVENTS.TOAST_SHOW, {
        message: 'Typewriter Mode Disabled',
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

    /**
     * Dispose manager
     */
    dispose() {
        if (this.cursorListener) {
        this.cursorListener.dispose();
        }
        if (this.subscriptions) this.subscriptions.dispose();
        this.isEnabled = false;
        this.initialized = false;
        TypewriterManager.instance = null;
    }
}

export const typewriterManager = new TypewriterManager();
export { TypewriterManager };
export default typewriterManager;
