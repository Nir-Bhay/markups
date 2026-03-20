/**
 * Tests for database.js — Dexie.js schema and basic operations
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';

// We need a fresh DB per test to avoid state leakage
let db;

function createTestDb() {
    const testDb = new Dexie('markups_db_test_' + Date.now());
    testDb.version(1).stores({
        notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId',
        note_versions: '++id, noteId, createdAt',
        settings: 'key'
    });
    return testDb;
}

describe('Dexie Database Schema', () => {
    beforeEach(() => {
        db = createTestDb();
    });

    afterEach(async () => {
        await db.delete();
    });

    it('should open the database successfully', async () => {
        await db.open();
        expect(db.isOpen()).toBe(true);
    });

    it('should have notes, note_versions, and settings tables', async () => {
        await db.open();
        expect(db.tables.map(t => t.name).sort()).toEqual(['note_versions', 'notes', 'settings']);
    });

    it('should create a note with auto-increment ID', async () => {
        const id = await db.notes.add({
            title: 'Test Note',
            content: '# Hello',
            tags: [],
            category: null,
            favorite: false,
            legacyId: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        expect(id).toBeGreaterThan(0);

        const note = await db.notes.get(id);
        expect(note.title).toBe('Test Note');
        expect(note.content).toBe('# Hello');
    });

    it('should query notes by tag using multiEntry index', async () => {
        await db.notes.bulkAdd([
            { title: 'A', content: '', tags: ['javascript', 'react'], category: null, favorite: false, legacyId: null, createdAt: 1, updatedAt: 1 },
            { title: 'B', content: '', tags: ['python'], category: null, favorite: false, legacyId: null, createdAt: 2, updatedAt: 2 },
            { title: 'C', content: '', tags: ['javascript'], category: null, favorite: false, legacyId: null, createdAt: 3, updatedAt: 3 }
        ]);

        const jsNotes = await db.notes.where('tags').equals('javascript').toArray();
        expect(jsNotes).toHaveLength(2);
        expect(jsNotes.map(n => n.title).sort()).toEqual(['A', 'C']);
    });

    it('should query notes by category', async () => {
        await db.notes.bulkAdd([
            { title: 'A', content: '', tags: [], category: 'work', favorite: false, legacyId: null, createdAt: 1, updatedAt: 1 },
            { title: 'B', content: '', tags: [], category: 'personal', favorite: false, legacyId: null, createdAt: 2, updatedAt: 2 }
        ]);

        const workNotes = await db.notes.where('category').equals('work').toArray();
        expect(workNotes).toHaveLength(1);
        expect(workNotes[0].title).toBe('A');
    });

    it('should store and retrieve settings', async () => {
        await db.settings.put({ key: 'theme', value: 'dark', updatedAt: Date.now() });
        const setting = await db.settings.get('theme');
        expect(setting.value).toBe('dark');
    });

    it('should update a note', async () => {
        const id = await db.notes.add({
            title: 'Original', content: 'old', tags: [], category: null,
            favorite: false, legacyId: null, createdAt: Date.now(), updatedAt: Date.now()
        });

        await db.notes.update(id, { title: 'Updated', updatedAt: Date.now() });
        const note = await db.notes.get(id);
        expect(note.title).toBe('Updated');
        expect(note.content).toBe('old'); // unchanged field preserved
    });

    it('should delete a note', async () => {
        const id = await db.notes.add({
            title: 'ToDelete', content: '', tags: [], category: null,
            favorite: false, legacyId: null, createdAt: Date.now(), updatedAt: Date.now()
        });

        await db.notes.delete(id);
        const note = await db.notes.get(id);
        expect(note).toBeUndefined();
    });
});
