/**
 * Tests for backlinks + wikilinks feature.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseWikilinks, findUnlinkedMentions, renameWikilinkTargets } from '../features/backlinks/parser.js';
import { BacklinksManager } from '../features/backlinks/index.js';

describe('features/backlinks — parser', () => {
    it('extracts [[Title]] correctly', () => {
        const links = parseWikilinks('See [[Another Note]] for details.');
        expect(links).toHaveLength(1);
        expect(links[0]).toEqual({ target: 'Another Note', display: 'Another Note', raw: '[[Another Note]]' });
    });

    it('handles [[Title|Display]] correctly', () => {
        const links = parseWikilinks('Check out [[My Note|this note]] now.');
        expect(links).toHaveLength(1);
        expect(links[0]).toEqual({ target: 'My Note', display: 'this note', raw: '[[My Note|this note]]' });
    });

    it('ignores escaped \\[\\[', () => {
        const links = parseWikilinks('Literal \\[[[Not a link]] and real [[Real Link]]');
        expect(links).toHaveLength(1);
        expect(links[0].target).toBe('Real Link');
    });

    it('returns empty array for no links', () => {
        expect(parseWikilinks('No links here.')).toEqual([]);
    });

    it('handles multiple links', () => {
        const links = parseWikilinks('[[A]] and [[B|B Display]] and [[C]]');
        expect(links).toHaveLength(3);
        expect(links.map(l => l.target)).toEqual(['A', 'B', 'C']);
    });
});

describe('features/backlinks — BacklinksManager', () => {
    let manager;

    const createMockStorage = (notes) => ({
        getAllNotes: async () => notes
    });

    const createDoc = (id, title, content) => ({
        id: String(id),
        title,
        content: content || '',
        noteId: id
    });

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        if (manager) manager.dispose();
    });

    it('builds index from getAllNotes()', async () => {
        const notes = [
            { id: 1, title: 'Alpha', content: 'Link to [[Beta]] here.' },
            { id: 2, title: 'Beta', content: 'Link to [[Alpha]] and [[Gamma]].' },
            { id: 3, title: 'Gamma', content: 'No links.' }
        ];
        const docs = [createDoc(1, 'Alpha', 'Link to [[Beta]] here.'), createDoc(2, 'Beta', '')];

        manager = new BacklinksManager({
            noteStorage: createMockStorage(notes),
            documents: docs,
            activeDocId: '2',
            onSwitchTab: () => {},
            onRefresh: () => {}
        });
        await manager.scanAll();

        const betaBacklinks = manager.getBacklinksFor('2');
        expect(betaBacklinks).toHaveLength(1);
        expect(betaBacklinks[0].id).toBe('1');
        expect(betaBacklinks[0].title).toBe('Alpha');
    });

    it('getBacklinksFor returns correct docs with counts', async () => {
        const notes = [
            { id: 1, title: 'A', content: '[[Target]] and [[Target]]' },
            { id: 2, title: 'B', content: '[[Target]]' },
            { id: 3, title: 'Target', content: '' }
        ];
        const docs = [createDoc(1, 'A', ''), createDoc(2, 'B', ''), createDoc(3, 'Target', '')];

        manager = new BacklinksManager({
            noteStorage: createMockStorage(notes),
            documents: docs,
            activeDocId: '3',
            onSwitchTab: () => {},
            onRefresh: () => {}
        });
        await manager.scanAll();

        const backlinks = manager.getBacklinksFor('3');
        expect(backlinks).toHaveLength(2);
        const a = backlinks.find(b => b.id === '1');
        expect(a.count).toBe(2);
        const b = backlinks.find(b => b.id === '2');
        expect(b.count).toBe(1);
    });
});

describe('features/backlinks — unlinked mentions and rename', () => {
    it('finds plain-text title mentions without links', () => {
        const notes = [
            { id: 1, title: 'Atlas', content: 'No links.' },
            { id: 2, title: 'Guide', content: 'Read the Atlas chapter first.' }
        ];
        const mentions = findUnlinkedMentions(notes);
        expect(mentions).toHaveLength(1);
        expect(mentions[0]).toMatchObject({ targetId: '1', sourceId: '2' });
    });

    it('skips already-linked titles, code spans, and self mentions', () => {
        const notes = [
            { id: 1, title: 'Atlas', content: '' },
            { id: 2, title: 'Guide', content: 'See [[Atlas]] and `Atlas` code. Atlas again.' }
        ];
        const mentions = findUnlinkedMentions(notes);
        expect(mentions).toHaveLength(0);
    });

    it('rewrites link targets on rename, keeping display text', () => {
        const { content, replaced } = renameWikilinkTargets(
            'See [[Old]] and [[Old|click]] but not [[Other]].', 'Old', 'New'
        );
        expect(replaced).toBe(2);
        expect(content).toBe('See [[New]] and [[New|click]] but not [[Other]].');
    });
});
