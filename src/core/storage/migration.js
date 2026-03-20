/**
 * Data Migration — localStorage → IndexedDB
 * One-time migration that safely moves all note data to IndexedDB
 * @module core/storage/migration
 */

import { noteStorage } from './noteStorage.js';
import { NAMESPACE } from './keys.js';

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
                        // Avoid duplicates — check if this tab's ID is already in documents
                        const alreadyExists = documents.some(d =>
                            d.id === tab.id || (d.name === tab.name && d.content === tab.content)
                        );
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
 * Run the migration from localStorage to IndexedDB
 * @returns {Promise<{ success: boolean, notesCount: number, skipped: boolean, error?: string }>}
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
            console.log('Migration: No legacy data found. Marking as complete.');
            localStorage.setItem(MIGRATION_FLAG_KEY, MIGRATION_VERSION);
            return { success: true, notesCount: 0, skipped: false };
        }

        console.log(`Migration: Found ${legacyDocs.length} documents to migrate.`);

        // Step 2: Transform to new schema
        const notes = legacyDocs.map(_transformToNote);

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
        return { success: true, notesCount: result.count, skipped: false };

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
 * Only call this after verifying IndexedDB data is intact
 * @returns {boolean} Success status
 */
export function clearLegacyData() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(NAMESPACE + '.docs')) {
                keysToRemove.push(key);
            }
            if (key && key.startsWith(NAMESPACE + '.tabs')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Migration: Cleared ${keysToRemove.length} legacy keys from localStorage.`);
        return true;
    } catch (error) {
        console.error('Migration: Failed to clear legacy data:', error);
        return false;
    }
}

export default runMigration;
