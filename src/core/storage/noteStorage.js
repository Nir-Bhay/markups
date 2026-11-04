/**
 * Note Storage Abstraction Layer
 * All note CRUD operations go through this module — components never import Dexie directly
 * @module core/storage/noteStorage
 */

import { db } from './database.js';
import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { ensureStableNoteIds } from './noteIdentity.js';

/** Bytes below which a pre-write quota warning is emitted. */
export const STORAGE_LOW_QUOTA_BYTES = 5 * 1024 * 1024;

/**
 * Typed storage failure. Callers can check `quotaExceeded` to tell a full
 * disk apart from a transient IndexedDB error. Read/write methods keep their
 * legacy return-value contract (no throw) but always record + broadcast the
 * failure so UI never mistakes an error for an empty vault.
 */
export class StorageError extends Error {
    constructor(message, { quotaExceeded = false, op = 'unknown', cause = null } = {}) {
        super(message);
        this.name = 'StorageError';
        this.quotaExceeded = quotaExceeded;
        this.op = op;
        if (cause) this.cause = cause;
    }
}

export function isQuotaError(error) {
    if (!error) return false;
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_FILE_NO_DEVICE_SPACE') return true;
    if (typeof error.message === 'string' && /quota|storage.*full|disk.*full/i.test(error.message)) return true;
    return false;
}

/**
 * NoteStorageService
 * Provides a clean API for note persistence via IndexedDB
 */
class NoteStorageService {
    static instance = null;

    constructor() {
        if (NoteStorageService.instance) {
            return NoteStorageService.instance;
        }
        /** @type {StorageError|null} Last failure, so UI can tell error apart from empty */
        this.lastError = null;
        NoteStorageService.instance = this;
    }

    /** @returns {StorageError|null} */
    getLastError() {
        return this.lastError;
    }

    clearLastError() {
        this.lastError = null;
    }

    /**
     * Record + broadcast a storage failure (quota-aware).
     * @private
     */
    _report(error, op) {
        const quotaExceeded = isQuotaError(error);
        const storageError = error instanceof StorageError
            ? error
            : new StorageError(`NoteStorage: ${op} failed: ${error?.message || error}`, {
                quotaExceeded, op, cause: error
            });
        this.lastError = storageError;
        console.error(`NoteStorage: Failed ${op}:`, error);
        try {
            eventBus.emit(EVENTS.ERROR, {
                message: quotaExceeded
                    ? 'Storage is full. Free space or export a backup — your notes were NOT deleted.'
                    : 'Note storage failed. Your notes were NOT deleted; retry in a moment.',
                type: 'storage',
                op,
                quotaExceeded
            });
        } catch (_e) { /* event bus unavailable in some tests */ }
        return storageError;
    }

    /**
     * Pre-write quota guard. Returns true when a write of `bytes` looks safe.
     * Emits a warning event when headroom is low.
     * @param {number} [bytes=0]
     * @returns {Promise<boolean>}
     */
    async checkQuotaBeforeWrite(bytes = 0) {
        try {
            const usage = await this.getStorageUsage();
            if (usage.available !== -1 && (usage.available - bytes) < STORAGE_LOW_QUOTA_BYTES) {
                try {
                    eventBus.emit(EVENTS.ERROR, {
                        message: 'Storage almost full. Export a backup soon to avoid losing edits.',
                        type: 'storage',
                        op: 'quota-warning',
                        quotaExceeded: false
                    });
                } catch (_e) { /* ignore */ }
                return false;
            }
            return true;
        } catch {
            return true;
        }
    }

    /**
     * Get all notes, sorted by updatedAt descending (newest first)
     * @returns {Promise<import('./database.js').Note[]>}
     */
    async getAllNotes() {
        try {
            const notes = await db.notes
                .orderBy('updatedAt')
                .reverse()
                .filter((note) => note.deletedAt == null)
                .toArray();
            this.clearLastError();
            return notes;
        } catch (error) {
            this._report(error, 'get all notes');
            return [];
        }
    }

    /**
     * Get a single note by ID
     * @param {number} id - Note ID
     * @returns {Promise<import('./database.js').Note|undefined>}
     */
    async getNote(id, { includeDeleted = false } = {}) {
        try {
            const note = await db.notes.get(id);
            this.clearLastError();
            return !includeDeleted && note?.deletedAt != null ? undefined : note;
        } catch (error) {
            this._report(error, `get note ${id}`);
            return undefined;
        }
    }

    /**
     * Get a note by its legacy ID (from localStorage migration)
     * @param {string} legacyId - Original localStorage document ID
     * @returns {Promise<import('./database.js').Note|undefined>}
     */
    async getNoteByLegacyId(legacyId) {
        try {
            return await db.notes
                .where('legacyId')
                .equals(legacyId)
                .filter((note) => note.deletedAt == null)
                .first();
        } catch (error) {
            this._report(error, `get note by legacyId ${legacyId}`);
            return undefined;
        }
    }

    /**
     * Find a note by its immutable UUID identity.
     * @param {string} stableId
     * @param {{includeDeleted?: boolean}} [options]
     * @returns {Promise<import('./database.js').Note|undefined>}
     */
    async getNoteByStableId(stableId, { includeDeleted = false } = {}) {
        try {
            const note = await db.notes.where('stableId').equals(stableId).first();
            this.clearLastError();
            return !includeDeleted && note?.deletedAt != null ? undefined : note;
        } catch (error) {
            this._report(error, 'get note by stableId');
            return undefined;
        }
    }

    /**
     * Resolve or create the durable note row associated with one legacy tab.
     * The transaction plus unique stableId index makes concurrent window
     * initialization idempotent.
     * @param {{tabId: string, stableId: string, title: string, content: string, createdAt?: number, updatedAt?: number}} tab
     * @returns {Promise<import('./database.js').Note|null>}
     */
    async ensureTabNote(tab) {
        try {
            const legacyId = String(tab.tabId);
            const stableId = String(tab.stableId);
            const note = await db.transaction('rw', db.notes, async () => {
                const byStableId = await db.notes.where('stableId').equals(stableId).first();
                const existing = byStableId || await db.notes.where('legacyId').equals(legacyId).first();
                if (existing) return existing;

                const now = Date.now();
                const data = ensureStableNoteIds([{
                    title: tab.title || 'Untitled',
                    content: typeof tab.content === 'string' ? tab.content : '',
                    tags: [],
                    category: null,
                    favorite: false,
                    legacyId,
                    stableId,
                    createdAt: tab.createdAt || now,
                    updatedAt: tab.updatedAt || now,
                    deletedAt: null
                }])[0];
                const id = await db.notes.add(data);
                return { ...data, id };
            });
            this.clearLastError();
            return note;
        } catch (error) {
            this._report(error, 'ensure tab note');
            return null;
        }
    }

    /**
     * Create a new note
     * @param {Object} noteData
     * @param {string} noteData.title - Note title
     * @param {string} [noteData.content=''] - Markdown content
     * @param {string[]} [noteData.tags=[]] - Tags
     * @param {string|null} [noteData.category=null] - Category
     * @param {boolean} [noteData.favorite=false] - Favorite status
     * @param {string|null} [noteData.legacyId=null] - Legacy ID from migration
     * @returns {Promise<import('./database.js').Note|null>} Created note with ID, or null on failure
     */
    async createNote(noteData) {
        try {
            const now = Date.now();
            const note = ensureStableNoteIds([{
                title: noteData.title || 'Untitled',
                content: noteData.content || '',
                tags: noteData.tags || [],
                category: noteData.category || null,
                favorite: noteData.favorite || false,
                legacyId: noteData.legacyId || null,
                stableId: noteData.stableId,
                createdAt: noteData.createdAt || now,
                updatedAt: noteData.updatedAt || now,
                deletedAt: null
            }])[0];

            const id = await db.notes.add(note);
            this.clearLastError();
            return { ...note, id };
        } catch (error) {
            this._report(error, 'create note');
            return null;
        }
    }

    /**
     * Update an existing note (partial update)
     * @param {number} id - Note ID
     * @param {Partial<import('./database.js').Note>} changes - Fields to update
     * @returns {Promise<import('./database.js').Note|null>} Updated note, or null on failure
     */
    async updateNote(id, changes) {
        try {
            // Always bump updatedAt
            const update = {
                ...changes,
                updatedAt: Date.now()
            };

            // Remove id from changes to prevent overwrite
            delete update.id;
            // Stable identity is assigned at creation and cannot be changed by updates.
            delete update.stableId;
            // Trash state is controlled by deleteNote/restoreNote.
            delete update.deletedAt;

            const current = await db.notes.get(id);
            if (!current || current.deletedAt != null) return null;

            await db.notes.update(id, update);
            this.clearLastError();
            return await this.getNote(id);
        } catch (error) {
            this._report(error, `update note ${id}`);
            return null;
        }
    }

    /** Update an active note using its immutable UUID identity. */
    async updateNoteByStableId(stableId, changes) {
        const note = await this.getNoteByStableId(stableId);
        if (!note) return null;
        return this.updateNote(note.id, changes);
    }

    /**
     * Delete a note by ID
     * @param {number} id - Note ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteNote(id) {
        try {
            const deletedAt = Date.now();
            await db.transaction('rw', db.notes, db.file_nodes, async () => {
                const note = await db.notes.get(id);
                if (!note) return;
                await db.notes.update(id, { deletedAt });
                await db.file_nodes.where('noteId').equals(id).modify({ deletedAt, updatedAt: deletedAt });
            });
            this.clearLastError();
            return true;
        } catch (error) {
            this._report(error, `delete note ${id}`);
            return false;
        }
    }

    /** List soft-deleted notes while preserving their version and cloud-link rows. */
    async getDeletedNotes() {
        try {
            const notes = await db.notes.filter((note) => note.deletedAt != null).toArray();
            notes.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
            this.clearLastError();
            return notes;
        } catch (error) {
            this._report(error, 'get deleted notes');
            return [];
        }
    }

    /** Restore a standalone note. File-tree restore should use fileTreeStorage instead. */
    async restoreNote(id) {
        try {
            const note = await db.notes.get(id);
            if (!note || note.deletedAt == null) return false;
            await db.notes.update(id, { deletedAt: null, updatedAt: Date.now() });
            this.clearLastError();
            return true;
        } catch (error) {
            this._report(error, `restore note ${id}`);
            return false;
        }
    }

    /**
     * Search notes by query (searches title and content)
     * @param {string} query - Search query
     * @returns {Promise<import('./database.js').Note[]>}
     */
    async searchNotes(query) {
        try {
            if (!query || query.trim().length === 0) {
                return this.getAllNotes();
            }

            const lowerQuery = query.toLowerCase().trim();

            // Use Dexie filter for flexible search across title + content
            const results = await db.notes
                .filter(note => {
                    if (note.deletedAt != null) return false;
                    const titleMatch = note.title.toLowerCase().includes(lowerQuery);
                    const contentMatch = note.content.toLowerCase().includes(lowerQuery);
                    return titleMatch || contentMatch;
                })
                .toArray();
            this.clearLastError();
            return results;
        } catch (error) {
            this._report(error, 'search notes');
            return [];
        }
    }

    /**
     * Get notes filtered by tag
     * @param {string} tag - Tag to filter by
     * @returns {Promise<import('./database.js').Note[]>}
     */
    async getNotesByTag(tag) {
        try {
            return await db.notes
                .where('tags')
                .equals(tag)
                .filter((note) => note.deletedAt == null)
                .toArray();
        } catch (error) {
            this._report(error, `get notes by tag "${tag}"`);
            return [];
        }
    }

    /**
     * Get notes filtered by category
     * @param {string} category - Category to filter by
     * @returns {Promise<import('./database.js').Note[]>}
     */
    async getNotesByCategory(category) {
        try {
            return await db.notes
                .where('category')
                .equals(category)
                .filter((note) => note.deletedAt == null)
                .toArray();
        } catch (error) {
            this._report(error, `get notes by category "${category}"`);
            return [];
        }
    }

    /**
     * Get favorited notes
     * @returns {Promise<import('./database.js').Note[]>}
     */
    async getFavoriteNotes() {
        try {
            return await db.notes
                .filter((note) => note.favorite === true && note.deletedAt == null)
                .toArray();
        } catch (error) {
            this._report(error, 'get favorite notes');
            return [];
        }
    }

    /**
     * Get the total count of notes
     * @returns {Promise<number>}
     */
    async getNotesCount() {
        try {
            return await db.notes.filter((note) => note.deletedAt == null).count();
        } catch (error) {
            this._report(error, 'count notes');
            return 0;
        }
    }

    /**
     * Get storage usage information
     * @returns {Promise<{ used: number, available: number, usedFormatted: string, availableFormatted: string }>}
     */
    async getStorageUsage() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const used = estimate.usage || 0;
                const available = (estimate.quota || 0) - used;

                return {
                    used,
                    available,
                    usedFormatted: this._formatBytes(used),
                    availableFormatted: this._formatBytes(available)
                };
            }

            // Fallback: estimate from note content sizes
            // Include Trash: it still occupies local storage until the user
            // chooses an explicit lifecycle action in a future purge feature.
            const notes = await db.notes.toArray();
            const used = notes.reduce((sum, note) => {
                return sum + (note.content?.length || 0) + (note.title?.length || 0);
            }, 0) * 2; // Approximate UTF-16 encoding

            return {
                used,
                available: -1, // Unknown
                usedFormatted: this._formatBytes(used),
                availableFormatted: 'Unknown'
            };
        } catch (error) {
            this._report(error, 'get storage usage');
            return {
                used: 0,
                available: -1,
                usedFormatted: '0 Bytes',
                availableFormatted: 'Unknown'
            };
        }
    }

    /**
     * Bulk create notes (used for migration)
     * @param {Array<Object>} notesData - Array of note data objects
     * @returns {Promise<{ success: boolean, count: number }>}
     */
    async bulkCreateNotes(notesData) {
        try {
            const now = Date.now();
            const notes = ensureStableNoteIds(notesData.map(data => ({
                title: data.title || 'Untitled',
                content: data.content || '',
                tags: data.tags || [],
                category: data.category || null,
                favorite: data.favorite || false,
                legacyId: data.legacyId || null,
                stableId: data.stableId,
                createdAt: data.createdAt || now,
                updatedAt: data.updatedAt || now,
                deletedAt: null
            })));

            // Use Dexie transaction for atomicity
            await db.transaction('rw', db.notes, async () => {
                await db.notes.bulkAdd(notes);
            });

            this.clearLastError();
            return { success: true, count: notes.length };
        } catch (error) {
            this._report(error, 'bulk create notes');
            return { success: false, count: 0 };
        }
    }

    /**
     * Clear all notes (dangerous — used for testing/reset)
     * @returns {Promise<boolean>}
     */
    async clearAllNotes() {
        try {
            await db.notes.clear();
            this.clearLastError();
            return true;
        } catch (error) {
            this._report(error, 'clear all notes');
            return false;
        }
    }

    /**
     * Format bytes to human-readable string
     * @param {number} bytes
     * @returns {string}
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        if (bytes < 0) return 'Unknown';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Singleton instance
export const noteStorage = new NoteStorageService();

export { NoteStorageService };

export default noteStorage;
