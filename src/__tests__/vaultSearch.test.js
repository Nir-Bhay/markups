import { describe, it, expect } from 'vitest';
import { searchVaultNotes, searchVaultStorage } from '../features/search/vault.js';

const NOTES = [
    { id: 1, title: 'Atlas Guide', content: 'Some body text here.', tags: [] },
    { id: 2, title: 'Random', content: 'Mentions atlas deep inside content.', tags: [] },
    { id: 3, title: 'Cooking', content: 'Unrelated.', tags: ['atlas'] }
];

describe('features/search/vault', () => {
    it('ranks title above tags above content', () => {
        const hits = searchVaultNotes(NOTES, 'atlas');
        expect(hits.map(h => h.id)).toEqual([1, 3, 2]);
    });

    it('returns empty for blank queries and caps limit', () => {
        expect(searchVaultNotes(NOTES, '')).toEqual([]);
        expect(searchVaultNotes(NOTES, 'atlas', { limit: 1 })).toHaveLength(1);
    });

    it('wires through noteStorage.searchNotes', async () => {
        const storage = { searchNotes: async () => NOTES };
        expect((await searchVaultStorage(storage, 'atlas')).length).toBe(3);
        expect(await searchVaultStorage(null, 'atlas')).toEqual([]);
    });
});
