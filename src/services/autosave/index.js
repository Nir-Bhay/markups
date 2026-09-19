/**
 * AutosaveManager — Debounced auto-save with IndexedDB persistence
 * Ensures no data loss by saving editor content automatically
 * @module services/autosave
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { noteStorage } from '../../core/storage/noteStorage.js';
import { APP_CONFIG } from '../../config/app.config.js';

/**
 * @typedef {'idle'|'unsaved'|'saving'|'saved'|'error'} SaveStatus
 */

/**
 * AutosaveManager class
 * Handles debounced auto-saving of editor content to IndexedDB
 */
class AutosaveManager {
    static instance = null;

    constructor() {
        if (AutosaveManager.instance) {
            return AutosaveManager.instance;
        }

        /** @type {number|null} Active debounce timer */
        this._debounceTimer = null;

        /** @type {number} Debounce interval in ms */
        this._interval = APP_CONFIG.AUTOSAVE_INTERVAL_MS || 1500;

        /** @type {boolean} Whether auto-save is enabled */
        this._enabled = true;

        /** @type {SaveStatus} Current save status */
        this._status = 'idle';

        /** @type {number|null} Timestamp of last successful save */
        this._lastSavedAt = null;

        /** @type {string|null} Currently active note ID */
        this._activeNoteId = null;

        /** @type {string|null} Pending content to save */
        this._pendingContent = null;

        /** @type {Map<string, string>} Pending content per note id (stale-write guard) */
        this._pendingByNote = new Map();

        /** @type {Map<string, string>} Last successfully saved content per note id */
        this._lastSavedContentByNote = new Map();

        /** @type {boolean} */
        this._initialized = false;

        /** @type {Function[]} Bound event handlers for cleanup */
        this._boundHandlers = {};

        AutosaveManager.instance = this;
    }

    /**
     * Initialize the autosave manager
     * @param {Object} [options]
     * @param {number} [options.interval] - Auto-save debounce interval in ms
     * @param {boolean} [options.enabled] - Whether auto-save is enabled
     */
    initialize(options = {}) {
        if (this._initialized) return;

        if (options.interval !== undefined) {
            this.setInterval(options.interval);
        }
        if (options.enabled !== undefined) {
            this._enabled = options.enabled;
        }

        // Listen for content changes
        eventBus.on(EVENTS.CONTENT_CHANGED, ({ content }) => {
            this._onContentChanged(content);
        });

        // Listen for active tab changes — stash pending under the old note,
        // flush it, then restore the new note's pending (no cross-note bleed).
        eventBus.on(EVENTS.TAB_ACTIVATED, ({ tab }) => {
            void this._switchActiveNote(tab?.id ?? null);
        });

        // Save on visibility change (tab/window losing focus)
        this._boundHandlers.visibilityChange = this._onVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this._boundHandlers.visibilityChange);

        // Save on window blur
        this._boundHandlers.windowBlur = this._onWindowBlur.bind(this);
        window.addEventListener('blur', this._boundHandlers.windowBlur);

        // Save before closing
        this._boundHandlers.beforeUnload = this._onBeforeUnload.bind(this);
        window.addEventListener('beforeunload', this._boundHandlers.beforeUnload);

        this._initialized = true;
        console.log(`AutosaveManager: Initialized (interval: ${this._interval}ms, enabled: ${this._enabled})`);
    }

    /**
     * Handle content changes — start debounce timer
     * @param {string} content
     * @private
     */
    _onContentChanged(content) {
        if (!this._enabled) return;

        this._pendingContent = content;
        if (this._activeNoteId !== null && this._activeNoteId !== undefined) {
            this._pendingByNote.set(String(this._activeNoteId), content);
        }
        this._setStatus('unsaved');

        // Clear existing timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        // Start new timer
        this._debounceTimer = setTimeout(() => {
            this._performSave();
        }, this._interval);
    }

    /**
     * Handle visibility change — save when tab loses focus
     * @private
     */
    _onVisibilityChange() {
        if (document.hidden && this._pendingContent !== null) {
            this._performSave();
        }
    }

    /**
     * Handle window blur — save when window loses focus
     * @private
     */
    _onWindowBlur() {
        if (this._pendingContent !== null) {
            this._performSave();
        }
    }

    /**
     * Handle before unload — last-chance save
     * @private
     */
    _onBeforeUnload() {
        if (this._pendingContent !== null && this._activeNoteId !== null) {
            // IndexedDB cannot flush synchronously — stage to localStorage for
            // recovery on next boot, then attempt the async write best-effort.
            try {
                localStorage.setItem(
                    `markups_autosave_staging_${String(this._activeNoteId)}`,
                    this._pendingContent
                );
            } catch (_e) { /* storage full/blocked — async save is last resort */ }
            this._performSave();
        }
    }

    /**
     * Switch active note without letting stale content bleed across notes.
     * Flushes the old note's pending write, then restores the new note's.
     * @param {string|number|null} noteId
     * @private
     */
    async _switchActiveNote(noteId) {
        const prevId = this._activeNoteId;
        const prevPending = this._pendingContent;
        if (prevId !== null && prevId !== undefined && prevPending !== null) {
            this._pendingByNote.set(String(prevId), prevPending);
            await this._performSaveFor(prevId, prevPending);
        }
        this._activeNoteId = noteId ?? null;
        const restored = this._activeNoteId === null
            ? null
            : (this._pendingByNote.get(String(this._activeNoteId)) ?? null);
        this._pendingContent = restored;
        if (restored !== null) {
            this._setStatus('unsaved');
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._performSave(), this._interval);
        }
    }

    /**
     * Core save for an explicit note id + content (tab-switch safe).
     * @param {string|number} noteId
     * @param {string} content
     * @returns {Promise<boolean>}
     * @private
     */
    async _performSaveFor(noteId, content) {
        const numericId = typeof noteId === 'number' ? noteId : parseInt(noteId, 10);
        if (isNaN(numericId)) return false;
        // Hash guard: skip write when content already saved for this note.
        if (this._lastSavedContentByNote.get(String(noteId)) === content) {
            if (String(this._activeNoteId) === String(noteId)) this._pendingContent = null;
            this._pendingByNote.delete(String(noteId));
            return true;
        }
        this._setStatus('saving');
        eventBus.emit(EVENTS.DOCUMENT_SAVING, { noteId });
        try {
            await noteStorage.updateNote(numericId, { content });
            this._lastSavedContentByNote.set(String(noteId), content);
            this._pendingByNote.delete(String(noteId));
            if (String(this._activeNoteId) === String(noteId)) this._pendingContent = null;
            try {
                localStorage.removeItem(`markups_autosave_staging_${String(noteId)}`);
            } catch (_e) { /* ignore */ }
            // Best-effort version snapshot (throttled inside; never breaks saves).
            try {
                const { recordVersion } = await import('../../core/storage/versionHistory.js');
                void recordVersion(numericId, content);
            } catch (_e) { /* ignore */ }
            this._lastSavedAt = Date.now();
            this._setStatus('saved');
            eventBus.emit(EVENTS.DOCUMENT_SAVED, { noteId, savedAt: this._lastSavedAt });
            return true;
        } catch (error) {
            console.error('AutosaveManager: Save failed:', error);
            this._pendingByNote.set(String(noteId), content);
            if (String(this._activeNoteId) === String(noteId)) this._pendingContent = content;
            this._setStatus('error');
            eventBus.emit(EVENTS.ERROR, {
                message: 'Auto-save failed. Your changes may not be saved.',
                type: 'autosave'
            });
            return false;
        }
    }

    /**
     * Perform the actual save operation
     * @returns {Promise<boolean>}
     * @private
     */
    async _performSave() {
        if (this._pendingContent === null) return false;

        // Phase 2.1: no target note → no write AND no saved signal. Previously
        // this fell through and reported `saved` without writing (silent loss).
        // _pendingContent is kept so a later setActiveNote can still flush it.
        if (!this._activeNoteId) return false;

        const content = this._pendingContent;
        this._pendingContent = null;

        // Clear any pending timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        // Phase 2.1: unresolvable id → same no-write, no-saved-signal rule.
        // Re-queue content so it is not silently dropped. Reset the status
        // set above — otherwise the indicator hangs on "Saving…".
        const numericId = typeof this._activeNoteId === 'number'
            ? this._activeNoteId
            : parseInt(this._activeNoteId, 10);
        if (isNaN(numericId)) {
            this._pendingContent = content;
            if (this._activeNoteId !== null) {
                this._pendingByNote.set(String(this._activeNoteId), content);
            }
            this._setStatus('unsaved');
            return false;
        }

        return this._performSaveFor(this._activeNoteId, content);
    }

    /**
     * Manual save (e.g., Ctrl+S)
     * @returns {Promise<boolean>}
     */
    async save() {
        return this._performSave();
    }

    /**
     * Set the debounce interval
     * @param {number} ms - Interval in milliseconds (clamped to min/max)
     */
    setInterval(ms) {
        const min = APP_CONFIG.AUTOSAVE_MIN_INTERVAL_MS || 500;
        const max = APP_CONFIG.AUTOSAVE_MAX_INTERVAL_MS || 10000;
        this._interval = Math.max(min, Math.min(max, ms));
    }

    /**
     * Enable or disable auto-save
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled && this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
    }

    /**
     * Get current save status
     * @returns {{ status: SaveStatus, lastSavedAt: number|null, lastSavedFormatted: string }}
     */
    getStatus() {
        return {
            status: this._status,
            lastSavedAt: this._lastSavedAt,
            lastSavedFormatted: this._lastSavedAt
                ? new Date(this._lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : null
        };
    }

    /**
     * Update status and emit event
     * @param {SaveStatus} status
     * @private
     */
    _setStatus(status) {
        this._status = status;
        eventBus.emit(EVENTS.AUTOSAVE_STATUS_CHANGED, {
            status: this._status,
            lastSavedAt: this._lastSavedAt
        });
    }

    /**
     * Set the active note ID
     * @param {string|number|null} noteId
     */
    setActiveNote(noteId) {
        if (noteId === this._activeNoteId) return;
        // Synchronous path (tests + direct callers): stash + restore now,
        // flush of the old note happens on the next save cycle.
        if (this._pendingContent !== null && this._activeNoteId !== null) {
            this._pendingByNote.set(String(this._activeNoteId), this._pendingContent);
        }
        this._activeNoteId = noteId;
        this._pendingContent = noteId === null
            ? null
            : (this._pendingByNote.get(String(noteId)) ?? null);
    }

    /**
     * Clean up all event listeners
     */
    dispose() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        if (this._boundHandlers.visibilityChange) {
            document.removeEventListener('visibilitychange', this._boundHandlers.visibilityChange);
        }
        if (this._boundHandlers.windowBlur) {
            window.removeEventListener('blur', this._boundHandlers.windowBlur);
        }
        if (this._boundHandlers.beforeUnload) {
            window.removeEventListener('beforeunload', this._boundHandlers.beforeUnload);
        }

        this._initialized = false;
        console.log('AutosaveManager: Disposed.');
    }
}

// Singleton instance
export const autosaveManager = new AutosaveManager();

export { AutosaveManager };

export default autosaveManager;
