/**
 * Data Migration — localStorage → IndexedDB
 * One-time migration that safely moves all note data to IndexedDB
 * @module core/storage/migration
 */

import { noteStorage } from './noteStorage.js';
import { NAMESPACE } from './keys.js';
import { fileTreeStorage } from './fileTreeStorage.js';

const MIGRATION_FLAG_KEY = 'markups_migrated';
const MIGRATION_VERSION = 'v1';

/**
 * Check if migration has already been completed
 * @returns {boolean}
 */
export function isMigrationComplete() {
    try {
        return localStorage.getItem(MIGRATION_FLAG_KEY) === MIGRATION_VERSION;
    } catch {
        return false;
    }
}

/**
 * Get all document data from localStorage (both legacy Storehouse and modular StorageService formats)
 * @returns {Array<Object>} Array of document objects
 * @private
 */
function _readLegacyDocuments() {
    const documents = [];

    try {
        // Format 1: Modular StorageService — stored as `{namespace}.{key}` with `{ value, expiresAt }` wrapper
        const namespacedDocsKey = `${NAMESPACE}.docs`;
        const namespacedTabsKey = `${NAMESPACE}.tabs`;

        // Try reading docs (array of document objects)
        const docsRaw = localStorage.getItem(namespacedDocsKey);
        if (docsRaw) {
            try {
                const parsed = JSON.parse(docsRaw);
                const docs = parsed.value || parsed; // Handle wrapped or direct format
                if (Array.isArray(docs)) {
                    docs.forEach(doc => documents.push(doc));
                }
            } catch (e) {
                console.warn('Migration: Failed to parse docs key:', e);
            }
        }

        // Try reading tabs (array of tab objects: {id, name, content, createdAt, updatedAt})
        const tabsRaw = localStorage.getItem(namespacedTabsKey);
        if (tabsRaw) {
            try {
                const parsed = JSON.parse(tabsRaw);
                const tabs = parsed.value || parsed;
                if (Array.isArray(tabs)) {
                    tabs.forEach(tab => {
                        // Dedup by stable id only — name+content heuristics merged
                        // distinct tabs that happened to share content.
                        const alreadyExists = documents.some(d => d.id === tab.id);
                        if (!alreadyExists) {
                            documents.push(tab);
                        }
                    });
                }
            } catch (e) {
                console.warn('Migration: Failed to parse tabs key:', e);
            }
        }

        // Format 2: Direct Storehouse.js — may use different key patterns
        // Storehouse uses `{namespace}.{key}` by default
        // Scan for any other namespaced keys that look like note data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(NAMESPACE + '.') && !key.includes('settings') && !key.includes('mode')) {
                // Skip keys we've already processed
                if (key === namespacedDocsKey || key === namespacedTabsKey) continue;
                // Skip known non-document keys
                if (key.includes('scroll_bar') || key.includes('dark_mode') ||
                    key.includes('theme') || key.includes('view_mode') ||
                    key.includes('font_size') || key.includes('word_wrap') ||
                    key.includes('line_numbers') || key.includes('sidebar') ||
                    key.includes('toc_') || key.includes('lint_') ||
                    key.includes('typewriter') || key.includes('focus_mode') ||
                    key.includes('active_tab') || key.includes('last_state') ||
                    key.includes('writing_goals') || key.includes('last_export') ||
                    key.includes('recent_templates')) continue;

                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        const data = parsed.value || parsed;
                        // If it looks like a document/tab, add it
                        if (data && typeof data === 'object' && data.content !== undefined) {
                            const alreadyExists = documents.some(d => d.id === data.id);
                            if (!alreadyExists) {
                                documents.push(data);
                            }
                        }
                    }
                } catch {
                    // Not a valid document, skip
                }
            }
        }
    } catch (error) {
        console.error('Migration: Error reading localStorage:', error);
    }

    return documents;
}

/**
 * Transform a legacy document object to the new Note schema
 * @param {Object} doc - Legacy document/tab object
 * @returns {import('./database.js').Note}
 * @private
 */
function _transformToNote(doc) {
    return {
        title: doc.name || doc.title || 'Untitled',
        content: doc.content || '',
        tags: doc.tags || [],
        category: doc.category || null,
        favorite: doc.favorite || false,
        legacyId: doc.id || null,
        createdAt: doc.createdAt || Date.now(),
        updatedAt: doc.updatedAt || Date.now()
    };
}

/**
 * True when any namespaced legacy keys exist (docs, tabs, or siblings).
 * Used to tell a genuine first run (safe to mark complete) apart from
 * present-but-unparseable legacy data (must stay retryable).
 * @returns {boolean}
 */
function _hasAnyLegacyKeys() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(NAMESPACE + '.')) return true;
        }
    } catch { /* ignore */ }
    return false;
}

/**
 * Best-effort JSON backup of the transformed notes before the bulk write.
 * Stored under a versioned key so a failed migration never destroys the only
 * copy. Never throws — backup failure must not block migration.
 * @param {Array<Object>} notes
 * @returns {boolean} True when the backup was persisted
 */
function _writeMigrationBackup(notes) {
    try {
        localStorage.setItem(
            'markups_migration_backup_v1',
            JSON.stringify({ exportedAt: Date.now(), count: notes.length, notes })
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * List legacy keys eligible for post-migration cleanup (docs/tabs only —
 * settings and UI prefs are never touched).
 * @returns {string[]}
 */
export function getLegacyKeysForCleanup() {
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(NAMESPACE + '.docs') || key.startsWith(NAMESPACE + '.tabs'))) {
                keys.push(key);
            }
        }
    } catch { /* ignore */ }
    return keys;
}

/**
 * Run the migration from localStorage to IndexedDB
 * @returns {Promise<{ success: boolean, notesCount: number, skipped: boolean, backup?: boolean, skippedDuplicates?: number, error?: string }>}
 */
export async function runMigration() {
    // Skip if already migrated
    if (isMigrationComplete()) {
        console.log('Migration: Already completed (v1). Skipping.');
        return { success: true, notesCount: 0, skipped: true };
    }

    console.log('Migration: Starting localStorage → IndexedDB migration...');

    try {
        // Step 1: Read all legacy documents
        const legacyDocs = _readLegacyDocuments();

        if (legacyDocs.length === 0) {
            // Genuine first run (no legacy keys at all) → safe to mark complete.
            // Present-but-unparseable legacy data stays retryable so a later
            // app version can still import it.
            if (!_hasAnyLegacyKeys()) {
                console.log('Migration: No legacy data found. Marking as complete.');
                localStorage.setItem(MIGRATION_FLAG_KEY, MIGRATION_VERSION);
                return { success: true, notesCount: 0, skipped: false };
            }
            console.warn('Migration: Legacy keys present but nothing parseable. Staying retryable.');
            return { success: true, notesCount: 0, skipped: false, retryable: true };
        }

        console.log(`Migration: Found ${legacyDocs.length} documents to migrate.`);

        // Step 2: Transform to new schema (dedup by legacy id; report the rest
        // for manual review instead of silently merging distinct tabs).
        const seen = new Set();
        const notes = [];
        let skippedDuplicates = 0;
        for (const doc of legacyDocs) {
            const note = _transformToNote(doc);
            const key = note.legacyId ?? `${note.title}\n${note.content}`;
            if (seen.has(key)) {
                skippedDuplicates++;
                continue;
            }
            seen.add(key);
            notes.push(note);
        }

        // Step 2b: Backup before the bulk write (best effort, never throws).
        const backup = _writeMigrationBackup(notes);

        // Step 3: Bulk write to IndexedDB
        const result = await noteStorage.bulkCreateNotes(notes);

        if (!result.success) {
            throw new Error('Bulk write to IndexedDB failed');
        }

        // Step 4: Verify count matches
        const dbCount = await noteStorage.getNotesCount();
        if (dbCount < notes.length) {
            console.warn(`Migration: Count mismatch — expected ${notes.length}, got ${dbCount}. Proceeding anyway.`);
        }

        // Step 5: Set migration flag
        localStorage.setItem(MIGRATION_FLAG_KEY, MIGRATION_VERSION);

        console.log(`Migration: Successfully migrated ${result.count} notes to IndexedDB.`);
        return { success: true, notesCount: result.count, skipped: false, backup, skippedDuplicates };

    } catch (error) {
        console.error('Migration: Failed!', error);

        // Don't set flag — migration can retry on next app load
        return {
            success: false,
            notesCount: 0,
            skipped: false,
            error: error.message || 'Unknown migration error'
        };
    }
}

/**
 * Get migration status info (for settings/debug display)
 * @returns {{ migrated: boolean, version: string|null }}
 */
export function getMigrationStatus() {
    try {
        const flag = localStorage.getItem(MIGRATION_FLAG_KEY);
        return {
            migrated: flag === MIGRATION_VERSION,
            version: flag
        };
    } catch {
        return { migrated: false, version: null };
    }
}

/**
 * Clear legacy localStorage data (manual cleanup after migration)
 * Only call this after verifying IndexedDB data is intact — pass
 * `{ verified: true }` explicitly, otherwise the call is refused so an
 * unverified cleanup can never destroy the only copy.
 * @param {{ verified?: boolean }} [options]
 * @returns {boolean} Success status
 */
export function clearLegacyData({ verified = false } = {}) {
    if (!verified) {
        console.warn('Migration: clearLegacyData refused without { verified: true }.');
        return false;
    }
    try {
        const keysToRemove = getLegacyKeysForCleanup();

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Migration: Cleared ${keysToRemove.length} legacy keys from localStorage.`);
        return true;
    } catch (error) {
        console.error('Migration: Failed to clear legacy data:', error);
        return false;
    }
}

/**
 * Ensure an IndexedDB file tree exists for current notes.
 * Safe to run multiple times.
 * @returns {Promise<{ success: boolean, nodesCreated: number }>}
 */
export async function ensureFileTreeFromNotes() {
    try {
        const notes = await noteStorage.getAllNotes();
        await fileTreeStorage.initTree(notes);
        const nodes = await fileTreeStorage.getTree();
        return { success: true, nodesCreated: nodes.length };
    } catch (error) {
        console.error('Migration: Failed to initialize file tree:', error);
        return { success: false, nodesCreated: 0 };
    }
}

export default runMigration;
