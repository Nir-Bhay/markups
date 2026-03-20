/**
 * Tests for noteStorage.js — abstraction layer CRUD operations
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
    });

    afterEach(async () => {
        await db.notes.clear();
    });

    describe('createNote', () => {
        it('should create a note and return it with an ID', async () => {
            const note = await storage.createNote({ title: 'Test', content: '# Hello' });
            expect(note).not.toBeNull();
            expect(note.id).toBeDefined();
            expect(note.title).toBe('Test');
            expect(note.content).toBe('# Hello');
            expect(note.tags).toEqual([]);
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
    });

    describe('deleteNote', () => {
        it('should delete a note', async () => {
            const note = await storage.createNote({ title: 'Delete Me' });
            const success = await storage.deleteNote(note.id);
            expect(success).toBe(true);

            const fetched = await storage.getNote(note.id);
            expect(fetched).toBeUndefined();
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
});
