/**
 * Dexie.js Database Setup
 * IndexedDB database for Markups note storage
 * @module core/storage/database
 */

import Dexie from 'dexie';
import { createStableNoteId, isStableNoteId } from './noteIdentity.js';

/**
 * @typedef {Object} Note
 * @property {number} [id] - Auto-incremented primary key
 * @property {string} stableId - Immutable UUID for portable identity; numeric id remains the local key
 * @property {string} title - Note title
 * @property {string} content - Markdown content
 * @property {string[]} tags - Tags for organization
 * @property {string|null} category - Category/folder name
 * @property {boolean} favorite - Whether note is favorited
 * @property {number} createdAt - Unix timestamp (ms)
 * @property {number} updatedAt - Unix timestamp (ms)
 * @property {string|null} legacyId - Original ID from localStorage migration
 * @property {number|null} deletedAt - Soft-delete timestamp; null while active
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
 * @typedef {Object} FileNode
 * @property {string} id - Node ID
 * @property {'folder'|'file'} type - Node type
 * @property {string} name - Node name
 * @property {string|null} parentId - Parent node ID (null for root)
 * @property {number|null} [noteId] - Linked note ID for file nodes
 * @property {number} order - Sort order under same parent
 * @property {number} createdAt - Unix timestamp (ms)
 * @property {number} updatedAt - Unix timestamp (ms)
 * @property {number|null} deletedAt - Soft-delete timestamp; null while active
 */

/**
 * MarkupsDatabase
 * Extends Dexie with typed table definitions
 */
class MarkupsDatabase extends Dexie {
    constructor(name = 'markups_db') {
        super(name);

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

        // Schema version 2: add virtual file tree nodes
        this.version(2).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId',
            note_versions: '++id, noteId, createdAt',
            settings: 'key',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt'
        });

        // Additive only: legacy note/image data remains available for recovery.
        this.version(3).stores({
            media: 'id, createdAt',
            cloud_links: '[accountId+noteId], accountId, noteId, documentId'
        });

        // Stable identity is additive: preserve numeric note IDs because tree
        // nodes, local history and autosave all continue to reference them.
        this.version(4).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, stableId'
        }).upgrade(async (transaction) => {
            await transaction.table('notes').toCollection().modify((note) => {
                if (typeof note.stableId !== 'string' || !note.stableId) {
                    note.stableId = createStableNoteId();
                }
            });
        });

        // Recoverable Trash. Keep note IDs and all related history/cloud links
        // intact; deletedAt indexes let storage APIs distinguish active rows.
        this.version(5).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, stableId, deletedAt',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt, deletedAt'
        }).upgrade(async (transaction) => {
            await transaction.table('notes').toCollection().modify((note) => {
                if (note.deletedAt === undefined) note.deletedAt = null;
            });
            await transaction.table('file_nodes').toCollection().modify((node) => {
                if (node.deletedAt === undefined) node.deletedAt = null;
            });
        });

        // Repair any duplicate or malformed UUIDs before creating the unique
        // index in the next version. IndexedDB creates indexes before running
        // an upgrade callback, so these must be two schema versions.
        this.version(6).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, stableId, deletedAt',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt, deletedAt'
        }).upgrade(async (transaction) => {
            const table = transaction.table('notes');
            const rows = await table.toArray();
            const seen = new Set();
            for (const note of rows) {
                let stableId = isStableNoteId(note.stableId) && !seen.has(note.stableId)
                    ? note.stableId
                    : createStableNoteId();
                while (seen.has(stableId)) stableId = createStableNoteId();
                seen.add(stableId);
                if (note.stableId !== stableId) {
                    await table.update(note.id, { stableId });
                }
            }
        });

        // Every persisted note has a valid unique UUID after v6's repair pass.
        // Keep the numeric primary key used by history/tree/cloud-link rows.
        this.version(7).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, &stableId, deletedAt',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt, deletedAt'
        });

        /** @type {Dexie.Table<Note, number>} */
        this.notes = this.table('notes');

        /** @type {Dexie.Table<NoteVersion, number>} */
        this.note_versions = this.table('note_versions');

        /** @type {Dexie.Table<Setting, string>} */
        this.settings = this.table('settings');

        /** @type {Dexie.Table<FileNode, string>} */
        this.file_nodes = this.table('file_nodes');
        this.media = this.table('media');
        this.cloud_links = this.table('cloud_links');
    }
}

// Singleton database instance
export const db = new MarkupsDatabase();

export { MarkupsDatabase };

export default db;
