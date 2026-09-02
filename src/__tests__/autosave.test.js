// Tests for services/autosave/index.js — status, active-note, dispose.
import { describe, it, expect, beforeEach } from 'vitest';
import { AutosaveManager } from '../services/autosave/index.js';

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
});
