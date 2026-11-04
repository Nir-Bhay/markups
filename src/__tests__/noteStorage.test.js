/**
 * Tests for noteStorage.js — abstraction layer CRUD operations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../core/storage/database.js';
import { NoteStorageService } from '../core/storage/noteStorage.js';

let storage;

describe('NoteStorageService', () => {
    beforeEach(async () => {
        // Reset singleton for clean tests
        NoteStorageService.instance = null;
        storage = new NoteStorageService();
        // Clear any existing data
        await db.notes.clear();
        await db.file_nodes.clear();
        await db.note_versions.clear();
        await db.cloud_links.clear();
    });

    afterEach(async () => {
        await db.notes.clear();
        await db.file_nodes.clear();
        await db.note_versions.clear();
        await db.cloud_links.clear();
    });

    describe('createNote', () => {
        it('should create a note and return it with an ID', async () => {
            const note = await storage.createNote({ title: 'Test', content: '# Hello' });
            expect(note).not.toBeNull();
            expect(note.id).toBeDefined();
            expect(note.title).toBe('Test');
            expect(note.content).toBe('# Hello');
            expect(note.tags).toEqual([]);
            expect(note.stableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            expect(note.createdAt).toBeGreaterThan(0);
        });

        it('should default title to Untitled', async () => {
            const note = await storage.createNote({});
            expect(note.title).toBe('Untitled');
        });

        it('should accept tags, category, and favorite', async () => {
            const note = await storage.createNote({
                title: 'Tagged',
                tags: ['js', 'test'],
                category: 'work',
                favorite: true
            });
            expect(note.tags).toEqual(['js', 'test']);
            expect(note.category).toBe('work');
            expect(note.favorite).toBe(true);
        });

        it('preserves a supplied valid stable UUID', async () => {
            const stableId = '22222222-2222-4222-8222-222222222222';
            const note = await storage.createNote({ title: 'Stable', stableId });
            expect(note.stableId).toBe(stableId);
            expect(await storage.getNoteByStableId(stableId)).toMatchObject({ id: note.id, title: 'Stable' });
        });
    });

    describe('tab identity persistence', () => {
        it('ensures the same durable note for repeated tab initialization', async () => {
            const tab = {
                tabId: 'tab-existing-1',
                stableId: '33333333-3333-4333-8333-333333333333',
                title: 'Local tab',
                content: '# Durable',
                createdAt: 10,
                updatedAt: 20
            };

            const first = await storage.ensureTabNote(tab);
            const second = await storage.ensureTabNote(tab);

            expect(first).toMatchObject({ title: 'Local tab', content: '# Durable', stableId: tab.stableId });
            expect(second.id).toBe(first.id);
            expect(await storage.getNotesCount()).toBe(1);
        });

        it('updates a note through its stable UUID without changing its identity', async () => {
            const note = await storage.createNote({ title: 'Before', content: 'old' });
            const updated = await storage.updateNoteByStableId(note.stableId, { content: 'new' });
            expect(updated).toMatchObject({ id: note.id, stableId: note.stableId, content: 'new' });
        });
    });

    describe('getNote', () => {
        it('should retrieve a note by ID', async () => {
            const created = await storage.createNote({ title: 'Fetch Me' });
            const fetched = await storage.getNote(created.id);
            expect(fetched.title).toBe('Fetch Me');
        });

        it('should return undefined for non-existent ID', async () => {
            const result = await storage.getNote(99999);
            expect(result).toBeUndefined();
        });
    });

    describe('getAllNotes', () => {
        it('should return all notes sorted by updatedAt descending', async () => {
            await storage.createNote({ title: 'Old', content: '', createdAt: 1000, updatedAt: 1000 });
            await storage.createNote({ title: 'New', content: '', createdAt: 3000, updatedAt: 3000 });
            await storage.createNote({ title: 'Mid', content: '', createdAt: 2000, updatedAt: 2000 });

            const notes = await storage.getAllNotes();
            expect(notes).toHaveLength(3);
            expect(notes[0].title).toBe('New');
            expect(notes[2].title).toBe('Old');
        });

        it('should return empty array when no notes exist', async () => {
            const notes = await storage.getAllNotes();
            expect(notes).toEqual([]);
        });
    });

    describe('updateNote', () => {
        it('should update specific fields and bump updatedAt', async () => {
            const note = await storage.createNote({ title: 'Before', content: 'original' });
            const originalUpdatedAt = note.updatedAt;

            // Small delay to ensure updatedAt changes
            await new Promise(r => setTimeout(r, 10));

            const updated = await storage.updateNote(note.id, { title: 'After' });
            expect(updated.title).toBe('After');
            expect(updated.content).toBe('original'); // unchanged
            expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
        });

        it('keeps stable note identity immutable', async () => {
            const note = await storage.createNote({ title: 'Identity' });
            const updated = await storage.updateNote(note.id, { stableId: '00000000-0000-4000-8000-000000000000' });
            expect(updated.stableId).toBe(note.stableId);
        });
    });

    describe('deleteNote', () => {
        it('moves a note to Trash and preserves linked history and cloud metadata', async () => {
            const note = await storage.createNote({ title: 'Delete Me' });
            await db.note_versions.add({ noteId: note.id, content: 'older copy', createdAt: Date.now() });
            await db.cloud_links.put({ accountId: 'test-account', noteId: note.id, documentId: 'remote-doc' });
            await db.file_nodes.put({
                id: 'trash-file', type: 'file', name: 'Delete Me', parentId: 'root', noteId: note.id,
                order: 0, createdAt: Date.now(), updatedAt: Date.now(), deletedAt: null
            });
            const success = await storage.deleteNote(note.id);
            expect(success).toBe(true);

            const fetched = await storage.getNote(note.id);
            expect(fetched).toBeUndefined();
            expect(await db.notes.get(note.id)).toMatchObject({ deletedAt: expect.any(Number) });
            expect(await storage.getDeletedNotes()).toHaveLength(1);
            expect(await db.note_versions.where('noteId').equals(note.id).count()).toBe(1);
            expect(await db.cloud_links.get(['test-account', note.id])).toMatchObject({ documentId: 'remote-doc' });
            expect(await db.file_nodes.get('trash-file')).toMatchObject({ deletedAt: expect.any(Number) });
        });

        it('does not return trashed notes in normal search, filters, lists, or count', async () => {
            const live = await storage.createNote({ title: 'Shared', tags: ['work'], category: 'team', favorite: true });
            const trashed = await storage.createNote({ title: 'Shared Trash', content: 'findme', tags: ['work'], category: 'team', favorite: true });
            await storage.deleteNote(trashed.id);

            expect((await storage.getAllNotes()).map((note) => note.id)).toEqual([live.id]);
            expect((await storage.searchNotes('findme'))).toEqual([]);
            expect(await storage.getNotesByTag('work')).toHaveLength(1);
            expect(await storage.getNotesByCategory('team')).toHaveLength(1);
            expect(await storage.getFavoriteNotes()).toHaveLength(1);
            expect(await storage.getNotesCount()).toBe(1);
        });

        it('restores a standalone trashed note without deleting its history', async () => {
            const note = await storage.createNote({ title: 'Restore Me', content: 'safe' });
            const versionId = await db.note_versions.add({ noteId: note.id, content: 'previous', createdAt: Date.now() });
            await storage.deleteNote(note.id);

            expect(await storage.restoreNote(note.id)).toBe(true);
            expect(await storage.getNote(note.id)).toMatchObject({ content: 'safe', deletedAt: null });
            expect(await db.note_versions.get(versionId)).toMatchObject({ noteId: note.id, content: 'previous' });
        });
    });

    describe('searchNotes', () => {
        beforeEach(async () => {
            await storage.createNote({ title: 'JavaScript Guide', content: 'Learn JS basics' });
            await storage.createNote({ title: 'Python Guide', content: 'Learn Python basics' });
            await storage.createNote({ title: 'Cooking', content: 'Make a javascript cake' });
        });

        it('should find notes matching title', async () => {
            const results = await storage.searchNotes('Python');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Python Guide');
        });

        it('should find notes matching content', async () => {
            const results = await storage.searchNotes('javascript');
            expect(results).toHaveLength(2); // title match + content match
        });

        it('should return all notes for empty query', async () => {
            const results = await storage.searchNotes('');
            expect(results).toHaveLength(3);
        });
    });

    describe('getNotesByTag', () => {
        it('should filter notes by tag', async () => {
            await storage.createNote({ title: 'A', tags: ['js', 'react'] });
            await storage.createNote({ title: 'B', tags: ['python'] });
            await storage.createNote({ title: 'C', tags: ['js'] });

            const jsNotes = await storage.getNotesByTag('js');
            expect(jsNotes).toHaveLength(2);
        });
    });

    describe('getNotesByCategory', () => {
        it('should filter notes by category', async () => {
            await storage.createNote({ title: 'A', category: 'work' });
            await storage.createNote({ title: 'B', category: 'personal' });

            const workNotes = await storage.getNotesByCategory('work');
            expect(workNotes).toHaveLength(1);
            expect(workNotes[0].title).toBe('A');
        });
    });

    describe('bulkCreateNotes', () => {
        it('should bulk insert multiple notes', async () => {
            const result = await storage.bulkCreateNotes([
                { title: 'Note 1', content: 'a' },
                { title: 'Note 2', content: 'b' },
                { title: 'Note 3', content: 'c' }
            ]);

            expect(result.success).toBe(true);
            expect(result.count).toBe(3);

            const all = await storage.getAllNotes();
            expect(all).toHaveLength(3);
            expect(new Set(all.map(note => note.stableId)).size).toBe(3);
        });
    });

    describe('getNotesCount', () => {
        it('should return correct count', async () => {
            await storage.createNote({ title: 'A' });
            await storage.createNote({ title: 'B' });

            const count = await storage.getNotesCount();
            expect(count).toBe(2);
        });
    });

    describe('error surfacing (no empty-vault on failure)', () => {
        it('records lastError with quota flag instead of silent null', async () => {
            const quota = new Error('Quota exceeded');
            quota.name = 'QuotaExceededError';
            const spy = vi.spyOn(db.notes, 'add').mockRejectedValueOnce(quota);
            try {
                const result = await storage.createNote({ title: 'Big' });
                expect(result).toBeNull();
                expect(storage.getLastError()).not.toBeNull();
                expect(storage.getLastError().quotaExceeded).toBe(true);
            } finally {
                spy.mockRestore();
            }
        });

        it('clears lastError after a successful write', async () => {
            storage.lastError = new Error('stale');
            await storage.createNote({ title: 'OK' });
            expect(storage.getLastError()).toBeNull();
        });
    });
});
