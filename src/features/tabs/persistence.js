/**
 * Connect the legacy modular tab model to durable IndexedDB note rows.
 * @module features/tabs/persistence
 */

import { eventBus, EVENTS, Subscriptions } from '../../utils/eventBus.js';
import { createStableNoteId, isStableNoteId } from '../../core/storage/noteIdentity.js';

export class TabPersistenceManager {
    constructor() {
        this.tabsManager = null;
        this.noteStorage = null;
        this.autosaveManager = null;
        this.fileTreeStorage = null;
        this.rootFolderId = 'root';
        this.subscriptions = null;
        this.inFlight = new Map();
        this.initialized = false;
    }

    initialize({ tabsManager, noteStorage, autosaveManager, fileTreeStorage, rootFolderId = 'root' } = {}) {
        if (this.initialized) return;
        this.tabsManager = tabsManager;
        this.noteStorage = noteStorage;
        this.autosaveManager = autosaveManager;
        this.fileTreeStorage = fileTreeStorage || null;
        this.rootFolderId = rootFolderId;
        this.subscriptions = new Subscriptions();
        this.subscriptions.on(EVENTS.TAB_CREATED, ({ tab }) => {
            void this.ensureTabNote(tab);
        });
        this.subscriptions.on(EVENTS.TAB_RENAMED, ({ tab }) => {
            void this._syncRenamedTab(tab);
        });
        this.initialized = true;
    }

    async hydrateOpenTabs(tabs = this.tabsManager?.getAllTabs?.() || []) {
        const results = await Promise.all(tabs.map((tab) => this.ensureTabNote(tab)));
        const active = this.tabsManager?.getActiveTab?.();
        if (active?.stableId) {
            this.autosaveManager?.setActiveNote(active.stableId);
            // A content change can arrive while a new note row is being
            // created. Flush the buffered edit once the row is available.
            await this.autosaveManager?.save();
        }
        return results;
    }

    ensureTabNote(tab) {
        if (!this.initialized || !tab?.id || !this.noteStorage) return Promise.resolve(null);
        const key = String(tab.id);
        const existing = this.inFlight.get(key);
        if (existing) return existing;

        const pending = this._ensureTabNote(tab)
            .catch((error) => {
                console.error('Tab persistence failed:', error);
                eventBus.emit(EVENTS.ERROR, {
                    message: 'This document could not be saved to local note storage. Keep the tab open and retry.',
                    type: 'storage',
                    op: 'persist-tab'
                });
                return null;
            })
            .finally(() => {
                if (this.inFlight.get(key) === pending) this.inFlight.delete(key);
            });
        this.inFlight.set(key, pending);
        return pending;
    }

    async _ensureTabNote(tab) {
        if (!isStableNoteId(tab.stableId)) tab.stableId = createStableNoteId();
        const requestedStableId = tab.stableId;

        let note = await this.noteStorage.ensureTabNote({
            tabId: tab.id,
            stableId: tab.stableId,
            title: tab.name,
            content: tab.content,
            createdAt: tab.createdAt,
            updatedAt: tab.updatedAt
        });
        if (!note) return null;

        // A deleted row must stay in Trash. Do not silently make a new live
        // copy with the same identity when a stale tab is still open.
        if (note.deletedAt != null) {
            eventBus.emit(EVENTS.ERROR, {
                message: 'This document is in Trash. Restore it before saving it from this editor.',
                type: 'storage',
                op: 'persist-trashed-tab'
            });
            return null;
        }

        if (this.fileTreeStorage) {
            await this.fileTreeStorage.ensureRoot();
            let fileNode = await this.fileTreeStorage.getFileNodeByNoteId(note.id);
            if (!fileNode) {
                fileNode = await this.fileTreeStorage.createNode({
                    id: tab.id,
                    type: 'file',
                    name: note.title || tab.name || 'Untitled',
                    parentId: tab.parentFolderId || this.rootFolderId,
                    noteId: note.id
                });
            }
            if (!fileNode) throw new Error('The file tree could not create a link for this note');
        }

        if (requestedStableId !== note.stableId) {
            this.autosaveManager?.rebindActiveNote(requestedStableId, note.stableId);
        }

        const tabTime = Number(tab.updatedAt) || 0;
        const noteTime = Number(note.updatedAt) || 0;
        const restoreNote = noteTime > tabTime;

        if (!restoreNote && (note.title !== tab.name || note.content !== tab.content)) {
            note = await this.noteStorage.updateNote(note.id, {
                title: tab.name || 'Untitled',
                content: typeof tab.content === 'string' ? tab.content : ''
            });
            if (!note) throw new Error('IndexedDB did not confirm the tab content update');
        }

        this.tabsManager?.syncTabNote?.(tab.id, note, { restoreContent: restoreNote });

        if (this.tabsManager?.getActiveTab?.()?.id === tab.id) {
            this.autosaveManager?.setActiveNote(note.stableId);
            await this.autosaveManager?.save();
        }
        return note;
    }

    async _syncRenamedTab(tab) {
        if (!tab?.id || !this.noteStorage) return;
        const note = await this.ensureTabNote(tab);
        if (!note || note.deletedAt != null) return;
        const updated = await this.noteStorage.updateNote(note.id, { title: tab.name || 'Untitled' });
        if (!updated || !this.fileTreeStorage) return;
        const fileNode = await this.fileTreeStorage.getFileNodeByNoteId(updated.id);
        if (fileNode && fileNode.deletedAt == null) {
            await this.fileTreeStorage.renameNode(fileNode.id, updated.title);
        }
    }

    dispose() {
        this.subscriptions?.dispose();
        this.subscriptions = null;
        this.inFlight.clear();
        this.tabsManager = null;
        this.noteStorage = null;
        this.autosaveManager = null;
        this.fileTreeStorage = null;
        this.initialized = false;
    }
}

export const tabPersistenceManager = new TabPersistenceManager();
