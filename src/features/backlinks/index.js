/**
 * BacklinksManager — in-memory index of `[[wikilinks]]` relationships.
 * @module features/backlinks/index
 */

import { parseWikilinks } from './parser.js';
import { debounce } from '../../utils/debounce.js';

export class BacklinksManager {
    /**
     * @param {Object} config
     * @param {import('../../core/storage/noteStorage.js').NoteStorageService} config.noteStorage
     * @param {Array<{id: string; title: string; content: string; noteId: number}>} config.documents
     * @param {string} config.activeDocId
     * @param {(id: string) => void} config.onSwitchTab
     * @param {(id: string) => void} config.onRefresh
     * @param {any} config.editor
     */
    constructor(config = {}) {
        this.config = {
            noteStorage: config.noteStorage || null,
            documents: config.documents || [],
            activeDocId: config.activeDocId || null,
            onSwitchTab: config.onSwitchTab || (() => {}),
            onRefresh: config.onRefresh || (() => {}),
            editor: config.editor || null
        };

        /** @type {Map<string, Map<string, number>>} targetId -> sourceId -> count */
        this.index = new Map();
        /** @type {Map<string, string>} lowercase title -> docId */
        this.titleToId = new Map();
        this._disposed = false;
        this._boundChange = null;
    }

    /** Build full index from all notes in noteStorage. */
    async scanAll() {
        if (this._disposed || !this.config.noteStorage) return;
        this.index.clear();
        this.titleToId.clear();

        const notes = await this.config.noteStorage.getAllNotes();

        // Build title -> id map from both IndexedDB notes and in-memory docs
        for (const note of notes) {
            const title = (note.title || '').toLowerCase();
            if (title && note.id != null) {
                this.titleToId.set(title, String(note.id));
            }
        }
        for (const doc of this.config.documents) {
            const title = (doc.title || '').toLowerCase();
            if (title) {
                this.titleToId.set(title, doc.id);
            }
        }

        // Scan each note for wikilinks
        for (const note of notes) {
            const content = note.content || '';
            const links = parseWikilinks(content);
            for (const link of links) {
                const targetId = this.titleToId.get(link.target.toLowerCase());
                if (!targetId) continue;

                if (!this.index.has(targetId)) {
                    this.index.set(targetId, new Map());
                }
                const sourceId = String(note.id);
                const current = this.index.get(targetId).get(sourceId) || 0;
                this.index.get(targetId).set(sourceId, current + 1);
            }
        }
    }

    /**
     * Get backlinks for a document.
     * @param {string} docId
     * @returns {{id: string; title: string; count: number}[]}
     */
    getBacklinksFor(docId) {
        const result = [];
        const sources = this.index.get(String(docId));
        if (!sources) return result;

        for (const [sourceId, count] of sources) {
            const doc = this.config.documents.find(d => d.id === sourceId);
            const title = doc?.title || `Note ${sourceId}`;
            result.push({ id: sourceId, title, count });
        }
        return result;
    }

    /** Refresh index and notify panel to re-render. */
    refresh = debounce(async () => {
        await this.scanAll();
        this.config.onRefresh(this.config.activeDocId);
    }, 500);

    /** Start listening for editor content changes. */
    initialize() {
        this.scanAll();
        if (this.config.editor) {
            this._boundChange = () => this.refresh();
            this.config.editor.onDidChangeModelContent(this._boundChange);
        }
    }

    /** Release listeners and clear state. */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;

        if (this._boundChange && this.config.editor) {
            this.config.editor.offDidChangeModelContent?.(this._boundChange);
            this._boundChange = null;
        }
        this.refresh.cancel();
        this.index.clear();
        this.titleToId.clear();
    }
}
