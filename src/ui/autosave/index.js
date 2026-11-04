/**
 * Autosave Indicator
 * Shows save status to user
 * @module ui/autosave
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';

/**
 * AutosaveIndicator class
 * Displays autosave status
 */
class AutosaveIndicator {
    static instance = null;

    constructor() {
        if (AutosaveIndicator.instance) {
            return AutosaveIndicator.instance;
        }

        this.element = null;
        this.timeout = null;

        AutosaveIndicator.instance = this;
    }

    /**
     * Initialize autosave indicator
     * @param {HTMLElement|string} element - Indicator element
     */
    initialize(element) {
        this.element = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!this.element) {
            // Create element if not exists
            this.element = document.createElement('span');
            this.element.id = 'autosave-indicator';
            this.element.className = 'autosave-indicator';

            // Try to find a place to insert
            const header = document.querySelector('header') || document.body;
            header.appendChild(this.element);
        }

        // Subscribe to save events
        eventBus.on(EVENTS.DOCUMENT_SAVING, () => this.showSaving());
        eventBus.on(EVENTS.DOCUMENT_SAVED, () => this.showSaved());
        this.unsubscribeStatus = eventBus.on(EVENTS.AUTOSAVE_STATUS_CHANGED, ({ status }) => {
            if (!this.element) return;
            this.element.dataset.state = status;
            if (status === 'error') this.showError('Save failed. Keep this tab open and export your work.');
            else if (status === 'saved') this.showSaved();
            else if (status === 'saving') this.showSaving();
            else if (status === 'unsaved') {
                this.element.textContent = 'Unsaved changes';
                this.element.className = 'status-unsaved';
            }
        });
    }

    /**
     * Show saving state
     */
    showSaving() {
        if (!this.element) return;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.element.textContent = '💾 Saving...';
        this.element.dataset.state = 'saving';
        this.element.classList.add('saving');
        this.element.classList.remove('saved');
    }

    /**
     * Show saved state
     */
    showSaved() {
        if (!this.element) return;

        this.element.textContent = 'All changes saved';
        this.element.dataset.state = 'saved';
        this.element.classList.remove('saving');
        this.element.classList.add('saved');

        // Keep the last confirmed state visible in the persistent status bar.
    }

    /**
     * Show error state
     * @param {string} message
     */
    showError(message = 'Save failed') {
        if (!this.element) return;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.element.textContent = `⚠ ${message}`;
        this.element.dataset.state = 'error';
        this.element.classList.remove('saving', 'saved');
        this.element.classList.add('error');

        // An error must remain visible until a later save succeeds.
    }

    /**
     * Clear indicator
     */
    clear() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.element) {
            this.element.textContent = '';
            this.element.classList.remove('saving', 'saved', 'error');
        }
    }

    /**
     * Dispose indicator
     */
    dispose() {
        this.unsubscribeStatus?.();
        this.clear();
        AutosaveIndicator.instance = null;
    }
}

export const autosaveIndicator = new AutosaveIndicator();
export { AutosaveIndicator };
export default autosaveIndicator;
