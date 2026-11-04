import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TabsManager } from '../features/tabs/index.js';
import { storageService } from '../core/storage/index.js';
import { STORAGE_KEYS } from '../core/storage/keys.js';
import { editorService } from '../core/editor/index.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';
import { isStableNoteId } from '../core/storage/noteIdentity.js';
import { db } from '../core/storage/database.js';

describe('TabsManager persistence identity', () => {
    let manager;
    let originalEditor;

    beforeEach(() => {
        TabsManager.instance = null;
        storageService.remove(STORAGE_KEYS.TABS);
        storageService.remove(STORAGE_KEYS.ACTIVE_TAB);
        manager = new TabsManager();
        originalEditor = editorService.editor;
        editorService.editor = { setValue: vi.fn() };
    });

    afterEach(() => {
        manager.dispose();
        editorService.editor = originalEditor;
        storageService.remove(STORAGE_KEYS.TABS);
        storageService.remove(STORAGE_KEYS.ACTIVE_TAB);
        vi.restoreAllMocks();
        eventBus.clear(EVENTS.TAB_ACTIVATED);
    });

    it('assigns a stable UUID and emits tab activation before replacing editor content', () => {
        let activationSeen = false;
        const off = eventBus.on(EVENTS.TAB_ACTIVATED, ({ tab }) => {
            activationSeen = true;
            expect(isStableNoteId(tab.stableId)).toBe(true);
        });
        const setValue = vi.spyOn(editorService.editor, 'setValue').mockImplementation(() => {
            expect(activationSeen).toBe(true);
        });

        const tab = manager.createTab('One', '# one');
        off();

        expect(tab.stableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(setValue).toHaveBeenCalledWith('# one');
    });

    it('backfills missing stable IDs when loading older tab state', () => {
        storageService.set(STORAGE_KEYS.TABS, [
            { id: 'old-a', name: 'A', content: 'a' },
            { id: 'old-b', name: 'B', content: 'b' }
        ]);

        manager._loadTabs();

        expect(manager.hadStoredTabs).toBe(true);
        expect(manager.tabs.every((tab) => isStableNoteId(tab.stableId))).toBe(true);
        expect(new Set(manager.tabs.map((tab) => tab.stableId)).size).toBe(2);
    });

    it('keeps recovery metadata older than the durable note instead of overwriting its content', async () => {
        const put = vi.spyOn(db.settings, 'put').mockResolvedValue('modular-open-tabs');
        const tab = manager.createTab('Draft', '# Important text');
        manager._saveTabs();
        const backup = put.mock.calls.at(-1)[0].value;
        expect(backup[0]).toMatchObject({ id: tab.id, stableId: tab.stableId, content: '', updatedAt: 1 });
        storageService.remove(STORAGE_KEYS.TABS);
        manager._loadTabs(backup);
        expect(manager.hadStoredTabs).toBe(true);
        expect(manager.tabs[0].updatedAt).toBe(1);
    });
});
