/**
 * Dexie.js Database Setup
 * IndexedDB database for Markups note storage
 * @module core/storage/database
 */

import Dexie from 'dexie';

/**
 * @typedef {Object} Note
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} title - Note title
 * @property {string} content - Markdown content
 * @property {string[]} tags - Tags for organization
 * @property {string|null} category - Category/folder name
 * @property {boolean} favorite - Whether note is favorited
 * @property {number} createdAt - Unix timestamp (ms)
 * @property {number} updatedAt - Unix timestamp (ms)
 * @property {string|null} legacyId - Original ID from localStorage migration
 */

/**
 * @typedef {Object} NoteVersion
 * @property {number} [id] - Auto-incremented primary key
 * @property {number} noteId - Foreign key to notes table
 * @property {string} content - Snapshot of content at this version
 * @property {number} createdAt - Unix timestamp (ms)
 */

/**
 * @typedef {Object} Setting
 * @property {string} key - Setting key (primary key)
 * @property {*} value - Setting value
 * @property {number} updatedAt - Unix timestamp (ms)
 */

/**
 * MarkupsDatabase
 * Extends Dexie with typed table definitions
 */
class MarkupsDatabase extends Dexie {
    constructor() {
        super('markups_db');

        // Schema version 1
        this.version(1).stores({
            // notes: auto-increment id, indexed fields
            // ++id = auto-increment primary key
            // *tags = multiEntry index (each tag value is indexed individually)
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId',

            // note_versions: for version history (future use)
            note_versions: '++id, noteId, createdAt',

            // settings: key-value store
            settings: 'key'
        });

        /** @type {Dexie.Table<Note, number>} */
        this.notes = this.table('notes');

        /** @type {Dexie.Table<NoteVersion, number>} */
        this.note_versions = this.table('note_versions');

        /** @type {Dexie.Table<Setting, string>} */
        this.settings = this.table('settings');
    }
}

// Singleton database instance
export const db = new MarkupsDatabase();

export { MarkupsDatabase };

export default db;
