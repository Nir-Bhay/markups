// Tests for services/autosave/index.js — status, active-note, dispose.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutosaveManager } from '../services/autosave/index.js';
import { noteStorage } from '../core/storage/noteStorage.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

describe('services/autosave', () => {
    let manager;

    beforeEach(() => {
        vi.resetModules();
        manager = new AutosaveManager();
    });

    it('starts in idle state', () => {
        const s = manager.getStatus();
        expect(s.status).toBe('idle');
        expect(s.lastSavedAt).toBeNull();
    });

    it('setActiveNote updates noteId', () => {
        manager.setActiveNote('note-42');
        expect(manager._activeNoteId).toBe('note-42');
    });

    it('dispose clears debounce timer', () => {
        manager._debounceTimer = 123;
        manager.dispose();
        expect(manager._debounceTimer).toBeNull();
    });

    // Phase 2.1: never report saved without writing.
    it('_performSave returns false and emits nothing without an active note', async () => {
        const onSaved = vi.fn();
        const off = eventBus.on(EVENTS.DOCUMENT_SAVED, onSaved);
        manager._pendingContent = 'unsaved work';
        const result = await manager._performSave();
        off();
        expect(result).toBe(false);
        expect(onSaved).not.toHaveBeenCalled();
        expect(manager.getStatus().status).not.toBe('saved');
    });

    it('_performSave returns false and re-queues on unresolvable note id', async () => {
        manager.setActiveNote('note-abc');
        manager._pendingContent = 'unsaved work';
        const result = await manager._performSave();
        expect(result).toBe(false);
        expect(manager._pendingContent).toBe('unsaved work');
    });

    it('unresolvable id resets a stuck saving status', async () => {
        manager.setActiveNote('note-abc');
        manager._pendingContent = 'unsaved work';
        await manager._performSave();
        expect(manager.getStatus().status).toBe('unsaved');
    });

    it('keeps pending content when storage does not confirm a write', async () => {
        const updateSpy = vi.spyOn(noteStorage, 'updateNote').mockResolvedValueOnce(null);
        const onSaved = vi.fn();
        const off = eventBus.on(EVENTS.DOCUMENT_SAVED, onSaved);

        manager.setActiveNote(42);
        manager._pendingContent = 'unsaved work';

        try {
            const result = await manager._performSave();

            expect(result).toBe(false);
            expect(manager._pendingContent).toBe('unsaved work');
            expect(manager._pendingByNote.get('42')).toBe('unsaved work');
            expect(manager.getStatus().status).toBe('error');
            expect(onSaved).not.toHaveBeenCalled();
        } finally {
            off();
            updateSpy.mockRestore();
        }
    });

    it('tab switch stashes pending per note instead of bleeding across notes', async () => {
        manager.setActiveNote(1);
        manager._onContentChanged('note-1 work');
        manager.setActiveNote(2);
        expect(manager._pendingByNote.get('1')).toBe('note-1 work');
        expect(manager._pendingContent).toBeNull();
        manager._onContentChanged('note-2 work');
        expect(manager._pendingByNote.get('2')).toBe('note-2 work');
    });

    it('autosaves tabs addressed by a stable UUID to their IndexedDB note', async () => {
        const note = await noteStorage.createNote({ title: 'UUID tab', content: 'before' });
        expect(note).not.toBeNull();
        manager.setActiveNote(note.stableId);
        manager._pendingContent = 'after';

        try {
            expect(await manager._performSave()).toBe(true);
            expect((await noteStorage.getNote(note.id)).content).toBe('after');
        } finally {
            await noteStorage.deleteNote(note.id);
        }
    });

    it('restores Saved for confirmed identical content but never borrows another note or failed write', async () => {
        const first = await noteStorage.createNote({ title: 'First', content: 'old' });
        const second = await noteStorage.createNote({ title: 'Second', content: 'old' });
        manager.setActiveNote(first.id);
        try {
            expect(await manager._performSaveFor(first.id, 'same content')).toBe(true);
            manager._setStatus('unsaved');
            expect(await manager._performSaveFor(first.id, 'same content')).toBe(true);
            expect(manager.getStatus().status).toBe('saved');

            manager.setActiveNote(second.id);
            const fail = vi.spyOn(noteStorage, 'updateNote').mockResolvedValue(null);
            try {
                expect(await manager._performSaveFor(second.id, 'same content')).toBe(false);
                expect(manager.getStatus().status).toBe('error');
                expect(manager._lastSavedContentByNote.has(String(second.id))).toBe(false);
                expect(await manager._performSaveFor(second.id, 'same content')).toBe(false);
                expect(manager.getStatus().status).toBe('error');
            } finally { fail.mockRestore(); }
            expect((await noteStorage.getNote(second.id)).content).toBe('old');
        } finally {
            await noteStorage.deleteNote(first.id);
            await noteStorage.deleteNote(second.id);
        }
    });
});
