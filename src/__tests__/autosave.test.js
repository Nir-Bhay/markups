// Tests for services/autosave/index.js — status, active-note, dispose.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutosaveManager } from '../services/autosave/index.js';
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

    it('tab switch stashes pending per note instead of bleeding across notes', async () => {
        manager.setActiveNote(1);
        manager._onContentChanged('note-1 work');
        manager.setActiveNote(2);
        expect(manager._pendingByNote.get('1')).toBe('note-1 work');
        expect(manager._pendingContent).toBeNull();
        manager._onContentChanged('note-2 work');
        expect(manager._pendingByNote.get('2')).toBe('note-2 work');
    });
});
