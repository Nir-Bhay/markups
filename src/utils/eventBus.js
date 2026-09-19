/**
 * EventBus - Central communication hub for decoupled feature communication
 * @module utils/eventBus
 */

class EventBus {
    constructor() {
        this.events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function to remove
     */
    off(event, callback) {
        this.events.get(event)?.delete(callback);
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to handlers
     */
    emit(event, data) {
        this.events.get(event)?.forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                console.error(`EventBus error in ${event}:`, err);
            }
        });
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Optional event name
     */
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Subscriptions - A disposable bucket for eventBus.on() handles.
 *
 *   const subs = new Subscriptions();
 *   subs.on(EVENTS.X, handler);  // returns unsubscribe
 *   subs.dispose();              // removes ALL handlers at once
 *
 * This eliminates the memory-leak class where feature dispose() methods
 * never called the unsubscribe function returned by eventBus.on(). All
 * features should now collect subscriptions into one of these and call
 * dispose() in their teardown path.
 */
export class Subscriptions {
    constructor() {
        this._unsubs = new Set();
    }

    /**
     * Subscribe to an event and remember the unsubscribe.
     * @param {string} event - Event name
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function (also stored for dispose)
     */
    on(event, handler) {
        const off = eventBus.on(event, handler);
        this._unsubs.add(off);
        return () => {
            off();
            this._unsubs.delete(off);
        };
    }

    /**
     * Add an already-created unsubscribe handle (for eventBus.once() etc).
     * @param {Function} off - Unsubscribe function
     */
    track(off) {
        this._unsubs.add(off);
        return () => {
            off();
            this._unsubs.delete(off);
        };
    }

    /**
     * Detach every tracked subscription. Idempotent — safe to call twice.
     */
    dispose() {
        this._unsubs.forEach((off) => {
            try { off(); } catch (_) { /* swallow — defensive */ }
        });
        this._unsubs.clear();
    }

    /** Number of live subscriptions — useful for leak checks in tests. */
    get size() {
        return this._unsubs.size;
    }
}

/**
 * Event constants for type-safe event handling
 */
export const EVENTS = {
    // App events
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    ERROR: 'app:error',

    // Editor events
    CONTENT_CHANGED: 'editor:content-changed',
    CURSOR_MOVED: 'editor:cursor-moved',
    EDITOR_SCROLLED: 'editor:scrolled',
    EDITOR_READY: 'editor:ready',
    SELECTION_CHANGED: 'editor:selection-changed',

    // Document events
    DOCUMENT_SAVING: 'doc:saving',
    DOCUMENT_SAVED: 'doc:saved',
    DOC_LOADED: 'doc:loaded',
    DOC_CREATED: 'doc:created',
    DOC_DELETED: 'doc:deleted',
    TAB_SWITCHED: 'doc:tab-switched',
    TAB_CLOSED: 'doc:tab-closed',
    TAB_ACTIVATED: 'doc:tab-activated',
    TAB_CREATED: 'doc:tab-created',
    TAB_RENAMED: 'doc:tab-renamed',

    // Autosave/persistence events
    AUTOSAVE_STATUS_CHANGED: 'autosave:status-changed',

    // Markdown events
    MARKDOWN_READY: 'markdown:ready',
    MARKDOWN_CONVERTED: 'markdown:converted',
    PREVIEW_UPDATED: 'markdown:preview-updated',
    TOC_UPDATED: 'toc:updated',
    TOC_NAVIGATED: 'toc:navigated',
    TOC_SHOWN: 'toc:shown',
    TOC_HIDDEN: 'toc:hidden',
    MERMAID_RENDERED: 'mermaid:rendered',

    // UI events
    THEME_CHANGED: 'ui:theme-changed',
    DARK_MODE_TOGGLED: 'ui:dark-mode-toggled',
    MODE_CHANGED: 'ui:mode-changed',
    VIEW_CHANGED: 'ui:view-changed',
    VIEW_MODE_CHANGED: 'ui:view-mode-changed',
    TOAST_SHOW: 'ui:toast-show',
    TOAST_SHOWN: 'ui:toast-shown',
    TOAST_DISMISSED: 'ui:toast-dismissed',
    MODAL_OPENED: 'ui:modal-opened',
    MODAL_CLOSED: 'ui:modal-closed',
    SHOW_PROMPT: 'ui:show-prompt',
    CONFIRM_REQUIRED: 'ui:confirm-required',

    // Feature events
    STATS_UPDATED: 'stats:updated',
    LINT_COMPLETE: 'lint:complete',
    LINT_COMPLETED: 'lint:complete',
    LINT_STARTED: 'lint:started',
    LINTER_ENABLED: 'lint:enabled',
    LINTER_DISABLED: 'lint:disabled',
    GOAL_UPDATED: 'goals:updated',
    GOAL_SET: 'goals:set',
    GOAL_COMPLETED: 'goals:completed',
    SHOW_GOAL_DIALOG: 'goals:show-dialog',
    GOAL_REACHED: 'goals:reached',
    SEARCH_PERFORMED: 'search:performed',
    SEARCH_COMPLETED: 'search:completed',
    SEARCH_MATCH_CHANGED: 'search:match-changed',
    REPLACE_ALL_COMPLETED: 'search:replace-all-completed',
    SEARCH_SHOWN: 'search:shown',
    SEARCH_HIDDEN: 'search:hidden',
    SNIPPET_INSERTED: 'snippet:inserted',
    SNIPPET_CREATED: 'snippet:created',
    SNIPPET_REMOVED: 'snippet:removed',
    SNIPPETS_SHOWN: 'snippet:shown',
    SNIPPETS_HIDDEN: 'snippet:hidden',
    SHOW_SNIPPET_DIALOG: 'snippet:show-dialog',
    TEMPLATE_LOADED: 'template:loaded',
    TEMPLATE_APPLIED: 'template:applied',
    TEMPLATE_CREATED: 'template:created',
    TEMPLATE_REMOVED: 'template:removed',
    TEMPLATES_SHOWN: 'template:shown',
    TEMPLATES_HIDDEN: 'template:hidden',

    // Mode events
    FOCUS_MODE_TOGGLE: 'mode:focus-toggle',
    FOCUS_MODE_CHANGED: 'mode:focus-changed',
    TYPEWRITER_MODE_TOGGLE: 'mode:typewriter-toggle',
    TYPEWRITER_MODE_CHANGED: 'mode:typewriter-changed',
    FULLSCREEN_TOGGLE: 'mode:fullscreen-toggle',
    FULLSCREEN_CHANGED: 'mode:fullscreen-changed',

    // Export events
    EXPORT_STARTED: 'export:started',
    EXPORT_COMPLETE: 'export:complete',
    EXPORT_COMPLETED: 'export:complete',
    EXPORT_FAILED: 'export:failed',
    EXPORT_ERROR: 'export:error',

    // Import events
    FILE_IMPORTED: 'import:file-imported',

    // Scroll sync
    SCROLL_SYNC_EDITOR: 'scroll:sync-editor',
    SCROLL_SYNC_PREVIEW: 'scroll:sync-preview',

    // Divider events
    DIVIDER_CHANGED: 'divider:changed',

    // Mobile events
    MOBILE_MENU_TOGGLED: 'mobile:menu-toggled',
    MOBILE_VIEW_CHANGED: 'mobile:view-changed',
    ORIENTATION_CHANGED: 'mobile:orientation-changed',

    // Keyboard shortcuts
    SHORTCUT_TRIGGERED: 'shortcut:triggered',

    // AI Writer events
    AI_PANEL_TOGGLED: 'ai:panel-toggled',
    AI_GENERATION_STARTED: 'ai:generation-started',
    AI_GENERATION_STREAMING: 'ai:generation-streaming',
    AI_GENERATION_USAGE: 'ai:generation-usage',
    AI_GENERATION_COMPLETE: 'ai:generation-complete',
    AI_GENERATION_ERROR: 'ai:generation-error',
    AI_GENERATION_CANCELLED: 'ai:generation-cancelled',
    AI_SETTINGS_CHANGED: 'ai:settings-changed',
    AI_RESULT_INSERTED: 'ai:result-inserted',
    AI_PANEL_REQUESTED: 'ai:panel-requested'
};

export default eventBus;