/**
 * Tests for database.js — Dexie.js schema and basic operations
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { MarkupsDatabase } from '../core/storage/database.js';

// We need a fresh DB per test to avoid state leakage
let db;

function createTestDb() {
    const testDb = new Dexie('markups_db_test_' + Date.now());
    testDb.version(2).stores({
        notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId',
        note_versions: '++id, noteId, createdAt',
        settings: 'key',
        file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt'
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

    it('should have notes, note_versions, settings and file_nodes tables', async () => {
        await db.open();
        expect(db.tables.map(t => t.name).sort()).toEqual(['file_nodes', 'note_versions', 'notes', 'settings']);
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

describe('Stable note identity schema upgrade', () => {
    let legacyDb;
    let upgradedDb;
    let databaseName;

    afterEach(async () => {
        legacyDb?.close();
        upgradedDb?.close();
        if (databaseName) await Dexie.delete(databaseName);
    });

    it('adds unique UUIDs without changing v3 note or relation IDs', async () => {
        databaseName = `markups_db_uuid_upgrade_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        await Dexie.delete(databaseName);

        legacyDb = new Dexie(databaseName);
        const noteSchema = '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId';
        legacyDb.version(1).stores({
            notes: noteSchema,
            note_versions: '++id, noteId, createdAt',
            settings: 'key'
        });
        legacyDb.version(2).stores({
            notes: noteSchema,
            note_versions: '++id, noteId, createdAt',
            settings: 'key',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt'
        });
        legacyDb.version(3).stores({
            media: 'id, createdAt',
            cloud_links: '[accountId+noteId], accountId, noteId, documentId'
        });

        await legacyDb.open();
        const firstId = await legacyDb.notes.add({
            title: 'First', content: 'one', tags: [], category: null,
            favorite: false, legacyId: 'old-first', createdAt: 1, updatedAt: 1
        });
        const secondId = await legacyDb.notes.add({
            title: 'Second', content: 'two', tags: [], category: null,
            favorite: false, legacyId: 'old-second', createdAt: 2, updatedAt: 2
        });
        const versionId = await legacyDb.note_versions.add({ noteId: firstId, content: 'before', createdAt: 3 });
        await legacyDb.file_nodes.put({
            id: 'file-first', type: 'file', name: 'First', parentId: null,
            noteId: firstId, order: 0, createdAt: 1, updatedAt: 1
        });
        await legacyDb.cloud_links.put({
            accountId: 'account-a', noteId: secondId, documentId: 'remote-second', revision: 4
        });
        legacyDb.close();
        legacyDb = null;

        upgradedDb = new MarkupsDatabase(databaseName);
        await upgradedDb.open();

        const notes = await upgradedDb.notes.orderBy('id').toArray();
        expect(notes.map(note => note.id)).toEqual([firstId, secondId]);
        expect(notes.every(note => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(note.stableId))).toBe(true);
        expect(new Set(notes.map(note => note.stableId)).size).toBe(2);
        expect(await upgradedDb.note_versions.get(versionId)).toMatchObject({ noteId: firstId, content: 'before' });
        expect(await upgradedDb.file_nodes.get('file-first')).toMatchObject({ noteId: firstId });
        expect(await upgradedDb.cloud_links.get(['account-a', secondId])).toMatchObject({ documentId: 'remote-second', revision: 4 });
        expect(upgradedDb.notes.schema.indexes.some(index => index.name === 'stableId')).toBe(true);
        expect(upgradedDb.notes.schema.indexes.find(index => index.name === 'stableId').unique).toBe(true);
        expect(upgradedDb.notes.schema.indexes.find(index => index.name === 'stableId').unique).toBe(true);
        expect(notes.every(note => note.deletedAt === null)).toBe(true);
        expect((await upgradedDb.file_nodes.get('file-first')).deletedAt).toBeNull();
        expect(upgradedDb.notes.schema.indexes.some(index => index.name === 'deletedAt')).toBe(true);
        expect(upgradedDb.file_nodes.schema.indexes.some(index => index.name === 'deletedAt')).toBe(true);
        expect(notes.every(note => note.deletedAt === null)).toBe(true);
        expect((await upgradedDb.file_nodes.get('file-first')).deletedAt).toBeNull();
        expect(upgradedDb.notes.schema.indexes.some(index => index.name === 'deletedAt')).toBe(true);
        expect(upgradedDb.file_nodes.schema.indexes.some(index => index.name === 'deletedAt')).toBe(true);
    });

    it('repairs duplicate stable IDs before enforcing the unique index', async () => {
        databaseName = `markups_db_duplicate_uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        await Dexie.delete(databaseName);

        const duplicate = '11111111-1111-4111-8111-111111111111';
        legacyDb = new Dexie(databaseName);
        legacyDb.version(5).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, stableId, deletedAt',
            note_versions: '++id, noteId, createdAt',
            settings: 'key',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt, deletedAt',
            media: 'id, createdAt',
            cloud_links: '[accountId+noteId], accountId, noteId, documentId'
        });
        await legacyDb.open();
        const firstId = await legacyDb.notes.add({
            title: 'First', content: 'first', tags: [], category: null, favorite: false,
            legacyId: 'first', stableId: duplicate, createdAt: 1, updatedAt: 1, deletedAt: null
        });
        const secondId = await legacyDb.notes.add({
            title: 'Second', content: 'second', tags: [], category: null, favorite: false,
            legacyId: 'second', stableId: duplicate, createdAt: 2, updatedAt: 2, deletedAt: null
        });
        legacyDb.close();
        legacyDb = null;

        upgradedDb = new MarkupsDatabase(databaseName);
        await upgradedDb.open();
        const notes = await upgradedDb.notes.orderBy('id').toArray();
        expect(notes.map(note => note.id)).toEqual([firstId, secondId]);
        expect(new Set(notes.map(note => note.stableId)).size).toBe(2);
        expect(upgradedDb.notes.schema.indexes.find(index => index.name === 'stableId').unique).toBe(true);
    });

    it('repairs duplicate stable IDs before enforcing the unique index', async () => {
        databaseName = `markups_db_duplicate_uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        await Dexie.delete(databaseName);

        const duplicate = '11111111-1111-4111-8111-111111111111';
        legacyDb = new Dexie(databaseName);
        legacyDb.version(5).stores({
            notes: '++id, title, createdAt, updatedAt, *tags, favorite, category, legacyId, stableId, deletedAt',
            note_versions: '++id, noteId, createdAt',
            settings: 'key',
            file_nodes: 'id, type, parentId, noteId, [parentId+order], updatedAt, deletedAt',
            media: 'id, createdAt',
            cloud_links: '[accountId+noteId], accountId, noteId, documentId'
        });
        await legacyDb.open();
        const firstId = await legacyDb.notes.add({
            title: 'First', content: 'first', tags: [], category: null, favorite: false,
            legacyId: 'first', stableId: duplicate, createdAt: 1, updatedAt: 1, deletedAt: null
        });
        const secondId = await legacyDb.notes.add({
            title: 'Second', content: 'second', tags: [], category: null, favorite: false,
            legacyId: 'second', stableId: duplicate, createdAt: 2, updatedAt: 2, deletedAt: null
        });
        legacyDb.close();
        legacyDb = null;

        upgradedDb = new MarkupsDatabase(databaseName);
        await upgradedDb.open();
        const notes = await upgradedDb.notes.orderBy('id').toArray();
        expect(notes.map(note => note.id)).toEqual([firstId, secondId]);
        expect(new Set(notes.map(note => note.stableId)).size).toBe(2);
        expect(upgradedDb.notes.schema.indexes.find(index => index.name === 'stableId').unique).toBe(true);
    });
});
