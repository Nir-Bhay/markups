/**
 * Tests for migration.js — localStorage → IndexedDB migration
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { NAMESPACE } from '../core/storage/keys.js';

// Create fresh DB + storage per test to avoid singleton issues
let db;
let noteStorage;

async function setupFreshDb() {
    const testDb = new Dexie('markups_db_migration_test_' + Date.now());
    testDb.version(2).stores({
        notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId',
        note_versions: '++id, noteId, createdAt',
        settings: 'key',
        file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt'
    });
    return testDb;
}

describe('Data Migration', () => {
    beforeEach(async () => {
        localStorage.clear();
        db = await setupFreshDb();
    });

    afterEach(async () => {
        localStorage.clear();
        if (db) await db.delete();
    });

    describe('Migration flag logic', () => {
        it('should detect no migration when flag is absent', () => {
            const flag = localStorage.getItem('markups_migrated');
            expect(flag).toBeNull();
        });

        it('should detect migration when flag is set', () => {
            localStorage.setItem('markups_migrated', 'v1');
            expect(localStorage.getItem('markups_migrated')).toBe('v1');
        });
    });

    describe('Legacy data reading', () => {
        it('should read docs from namespaced localStorage (StorageService format)', () => {
            const docs = [
                { id: 'tab-1', name: 'Note One', content: '# First', createdAt: 1000, updatedAt: 2000 },
                { id: 'tab-2', name: 'Note Two', content: '# Second', createdAt: 1500, updatedAt: 2500 }
            ];
            localStorage.setItem(`${NAMESPACE}.docs`, JSON.stringify({ value: docs, expiresAt: null }));

            const raw = localStorage.getItem(`${NAMESPACE}.docs`);
            const parsed = JSON.parse(raw);
            expect(parsed.value).toHaveLength(2);
            expect(parsed.value[0].name).toBe('Note One');
        });

        it('should read tabs from namespaced localStorage', () => {
            const tabs = [
                { id: 'tab-abc', name: 'My Tab', content: 'hello', isDirty: false, createdAt: 1000, updatedAt: 1000 }
            ];
            localStorage.setItem(`${NAMESPACE}.tabs`, JSON.stringify({ value: tabs }));

            const raw = localStorage.getItem(`${NAMESPACE}.tabs`);
            const parsed = JSON.parse(raw);
            expect(parsed.value).toHaveLength(1);
            expect(parsed.value[0].name).toBe('My Tab');
        });
    });

    describe('Data transformation', () => {
        it('should transform legacy doc to Note schema', () => {
            const doc = { id: 'tab-1', name: 'Test', content: '# Hello', createdAt: 1000, updatedAt: 2000 };
            const note = {
                title: doc.name || doc.title || 'Untitled',
                content: doc.content || '',
                tags: doc.tags || [],
                category: doc.category || null,
                favorite: doc.favorite || false,
                legacyId: doc.id || null,
                createdAt: doc.createdAt || Date.now(),
                updatedAt: doc.updatedAt || Date.now()
            };

            expect(note.title).toBe('Test');
            expect(note.content).toBe('# Hello');
            expect(note.legacyId).toBe('tab-1');
            expect(note.tags).toEqual([]);
            expect(note.favorite).toBe(false);
        });
    });

    describe('IndexedDB write', () => {
        it('should bulk write notes to IndexedDB', async () => {
            const notes = [
                { title: 'Note 1', content: 'a', tags: [], category: null, favorite: false, legacyId: 'l1', createdAt: 1, updatedAt: 1 },
                { title: 'Note 2', content: 'b', tags: [], category: null, favorite: false, legacyId: 'l2', createdAt: 2, updatedAt: 2 }
            ];

            await db.transaction('rw', db.notes, async () => {
                await db.notes.bulkAdd(notes);
            });

            const count = await db.notes.count();
            expect(count).toBe(2);

            const all = await db.notes.toArray();
            expect(all[0].title).toBe('Note 1');
            expect(all[1].legacyId).toBe('l2');
        });
    });

    describe('file tree bootstrapping', () => {
        it('should support file_nodes table in migration schema', async () => {
            await db.file_nodes.put({
                id: 'root',
                type: 'folder',
                name: 'Workspace',
                parentId: null,
                order: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            const root = await db.file_nodes.get('root');
            expect(root).toBeDefined();
            expect(root.type).toBe('folder');
        });
    });

    describe('clearLegacyData', () => {
        it('should remove docs and tabs keys but preserve settings', () => {
            localStorage.setItem(`${NAMESPACE}.docs`, 'data');
            localStorage.setItem(`${NAMESPACE}.tabs`, 'data');
            localStorage.setItem(`${NAMESPACE}.theme_settings`, 'dark');

            // Manually clear docs/tabs keys
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith(`${NAMESPACE}.docs`) || key.startsWith(`${NAMESPACE}.tabs`))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            expect(localStorage.getItem(`${NAMESPACE}.docs`)).toBeNull();
            expect(localStorage.getItem(`${NAMESPACE}.tabs`)).toBeNull();
            expect(localStorage.getItem(`${NAMESPACE}.theme_settings`)).toBe('dark');
        });
    });

    // Phase 2.4: key-format proof — migrator reads literal `NAMESPACE.*` keys;
    // live mirror writes go through the MD5-hashing Storehouse shim and are
    // invisible to it. Locked as accepted behavior (shim path is self-consistent).
    describe('runMigration key-format proof', () => {
        it('migrates literal NAMESPACE.docs entries end-to-end', async () => {
            const { runMigration } = await import('../core/storage/migration.js');
            const { noteStorage } = await import('../core/storage/noteStorage.js');
            localStorage.removeItem('markups_migrated');
            localStorage.setItem(`${NAMESPACE}.docs`, JSON.stringify({
                value: [{ id: 'phase24-a', name: 'Phase24', content: '# Hi', createdAt: 1, updatedAt: 1 }]
            }));

            const result = await runMigration();

            expect(result.success).toBe(true);
            expect(result.notesCount).toBe(1);
            const found = await noteStorage.getNoteByLegacyId('phase24-a');
            expect(found?.title).toBe('Phase24');

            await noteStorage.deleteNote(found.id);
            localStorage.removeItem('markups_migrated');
            localStorage.removeItem(`${NAMESPACE}.docs`);
        });

        it('ignores MD5-hashed shim keys (accepted limitation)', async () => {
            const { runMigration } = await import('../core/storage/migration.js');
            const { default: Storehouse } = await import('../utils/storehouse-compat.js');
            localStorage.removeItem('markups_migrated');
            Storehouse.setItem('com.markdownlivepreview', 'docs',
                [{ id: 'phase24-shim', name: 'ShimDoc', content: '# Shim' }], new Date(2099, 1, 1));

            const result = await runMigration();

            expect(result.success).toBe(true);
            expect(result.notesCount).toBe(0);

            Storehouse.deleteItem('com.markdownlivepreview', 'docs');
            localStorage.removeItem('markups_migrated');
        });

        it('keeps distinct tabs with identical content (id-only dedup) and writes a backup', async () => {
            const { runMigration, clearLegacyData } = await import('../core/storage/migration.js');
            const { noteStorage } = await import('../core/storage/noteStorage.js');
            localStorage.removeItem('markups_migrated');
            localStorage.removeItem('markups_migration_backup_v1');
            localStorage.setItem(`${NAMESPACE}.docs`, JSON.stringify({
                value: [{ id: 'dup-a', name: 'Same', content: 'same body', createdAt: 1, updatedAt: 1 }]
            }));
            localStorage.setItem(`${NAMESPACE}.tabs`, JSON.stringify({
                value: [{ id: 'dup-b', name: 'Same', content: 'same body', createdAt: 1, updatedAt: 1 }]
            }));

            const result = await runMigration();

            expect(result.success).toBe(true);
            expect(result.notesCount).toBe(2);
            expect(result.skippedDuplicates).toBe(0);
            expect(result.backup).toBe(true);
            expect(JSON.parse(localStorage.getItem('markups_migration_backup_v1')).count).toBe(2);

            for (const legacyId of ['dup-a', 'dup-b']) {
                const found = await noteStorage.getNoteByLegacyId(legacyId);
                await noteStorage.deleteNote(found.id);
            }
            expect(clearLegacyData()).toBe(false);
            expect(clearLegacyData({ verified: true })).toBe(true);
            localStorage.removeItem('markups_migrated');
            localStorage.removeItem('markups_migration_backup_v1');
            localStorage.removeItem(`${NAMESPACE}.docs`);
            localStorage.removeItem(`${NAMESPACE}.tabs`);
        });

        it('stays retryable when legacy keys exist but nothing parses', async () => {
            const { runMigration } = await import('../core/storage/migration.js');
            localStorage.removeItem('markups_migrated');
            localStorage.setItem(`${NAMESPACE}.docs`, 'not-json{{{');

            const result = await runMigration();

            expect(result.notesCount).toBe(0);
            expect(localStorage.getItem('markups_migrated')).toBeNull();

            localStorage.removeItem(`${NAMESPACE}.docs`);
        });
    });
});
