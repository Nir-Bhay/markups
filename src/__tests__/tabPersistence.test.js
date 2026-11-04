import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../core/storage/database.js';
import { NoteStorageService } from '../core/storage/noteStorage.js';
import { TabPersistenceManager } from '../features/tabs/persistence.js';
import { eventBus } from '../utils/eventBus.js';

describe('TabPersistenceManager', () => {
    let noteStorage;
    let manager;
    let tabsManager;
    let autosaveManager;
    let activeTab;

    beforeEach(async () => {
        NoteStorageService.instance = null;
        noteStorage = new NoteStorageService();
        await db.notes.clear();
        activeTab = null;
        tabsManager = {
            getAllTabs: () => activeTab ? [activeTab] : [],
            getActiveTab: () => activeTab,
            syncTabNote: vi.fn((tabId, note, { restoreContent = false } = {}) => {
                if (activeTab?.id !== tabId) return false;
                activeTab.noteId = note.id;
                activeTab.stableId = note.stableId;
                if (restoreContent) {
                    activeTab.name = note.title;
                    activeTab.content = note.content;
                    activeTab.updatedAt = note.updatedAt;
                }
                return true;
            })
        };
        autosaveManager = {
            setActiveNote: vi.fn(),
            rebindActiveNote: vi.fn(),
            save: vi.fn().mockResolvedValue(true)
        };
        manager = new TabPersistenceManager();
        manager.initialize({ tabsManager, noteStorage, autosaveManager });
    });

    afterEach(async () => {
        manager.dispose();
        eventBus.clear();
        await db.notes.clear();
    });

    it('creates and reuses one stable IndexedDB note for a tab', async () => {
        activeTab = {
            id: 'tab-one', stableId: '44444444-4444-4444-8444-444444444444',
            name: 'Tab one', content: '# Saved', createdAt: 10, updatedAt: 20
        };

        const first = await manager.ensureTabNote(activeTab);
        const second = await manager.ensureTabNote(activeTab);

        expect(first).toMatchObject({ title: 'Tab one', content: '# Saved', stableId: activeTab.stableId });
        expect(second.id).toBe(first.id);
        expect(activeTab.noteId).toBe(first.id);
        expect(await noteStorage.getNotesCount()).toBe(1);
        expect(autosaveManager.setActiveNote).toHaveBeenCalledWith(first.stableId);
    });

    it('restores newer legacy-migrated note content and rebinds buffered identity', async () => {
        const existing = await noteStorage.createNote({
            title: 'Recovered title', content: '# Newer IndexedDB copy', legacyId: 'legacy-tab',
            createdAt: 10, updatedAt: 200
        });
        activeTab = {
            id: 'legacy-tab', stableId: '55555555-5555-4555-8555-555555555555',
            name: 'Old title', content: '# Older localStorage copy', createdAt: 10, updatedAt: 100
        };

        const result = await manager.ensureTabNote(activeTab);

        expect(result.id).toBe(existing.id);
        expect(activeTab).toMatchObject({
            noteId: existing.id,
            stableId: existing.stableId,
            name: 'Recovered title',
            content: '# Newer IndexedDB copy'
        });
        expect(tabsManager.syncTabNote).toHaveBeenCalledWith('legacy-tab', existing, { restoreContent: true });
        expect(autosaveManager.rebindActiveNote).toHaveBeenCalledWith(
            '55555555-5555-4555-8555-555555555555', existing.stableId
        );
    });

    it('keeps local tab edits when they are newer than the stored note', async () => {
        const existing = await noteStorage.createNote({
            title: 'Stored title', content: '# Older note', legacyId: 'local-newer-tab',
            createdAt: 10, updatedAt: 100
        });
        activeTab = {
            id: 'local-newer-tab', stableId: '66666666-6666-4666-8666-666666666666',
            name: 'Local title', content: '# Newer tab content', createdAt: 10, updatedAt: 200
        };

        const result = await manager.ensureTabNote(activeTab);
        const saved = await noteStorage.getNote(existing.id);

        expect(result.id).toBe(existing.id);
        expect(saved).toMatchObject({ title: 'Local title', content: '# Newer tab content' });
        expect(tabsManager.syncTabNote).toHaveBeenCalledWith('local-newer-tab', saved, { restoreContent: false });
    });

    it('does not recreate a note that is still in Trash', async () => {
        const deleted = await noteStorage.createNote({ title: 'Trashed', content: '# Keep deleted' });
        await noteStorage.deleteNote(deleted.id);
        activeTab = {
            id: 'trashed-tab', stableId: deleted.stableId,
            name: 'Trashed', content: '# Keep deleted', createdAt: deleted.createdAt, updatedAt: deleted.updatedAt
        };

        expect(await manager.ensureTabNote(activeTab)).toBeNull();
        expect(await noteStorage.getNotesCount()).toBe(0);
        expect(await noteStorage.getNote(deleted.id, { includeDeleted: true })).toMatchObject({ deletedAt: expect.any(Number) });
        expect(tabsManager.syncTabNote).not.toHaveBeenCalled();
    });
});
