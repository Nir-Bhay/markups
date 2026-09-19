/**
 * Vault-wide search over note title, content, and tags.
 * Pure `searchVaultNotes` stays DOM-free for tests; `searchVaultStorage`
 * wires it to the existing `noteStorage.searchNotes` backend.
 * @module features/search/vault
 */

/**
 * @typedef {Object} VaultHit
 * @property {number|string} id
 * @property {string} title
 * @property {string} snippet
 * @property {number} score
 */

/**
 * Filter and rank notes for a query (case-insensitive substring).
 * Title matches outrank tag matches, which outrank content matches.
 * @param {Array<{ id: number|string, title: string, content: string, tags?: string[] }>} notes
 * @param {string} query
 * @param {{ limit?: number }} [options]
 * @returns {VaultHit[]}
 */
export function searchVaultNotes(notes, query, options = {}) {
    const limit = options.limit ?? 20;
    if (!Array.isArray(notes)) return [];
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    const hits = [];
    for (const note of notes) {
        const title = String(note.title || '');
        const content = String(note.content || '');
        const tags = Array.isArray(note.tags) ? note.tags : [];
        let score = 0;
        if (title.toLowerCase().includes(q)) score += 3;
        if (tags.some(t => String(t).toLowerCase().includes(q))) score += 2;
        const contentIdx = content.toLowerCase().indexOf(q);
        if (contentIdx !== -1) {
            score += 1;
            const start = Math.max(0, contentIdx - 40);
            const snippet = content.slice(start, contentIdx + q.length + 40).trim();
            hits.push({ id: note.id, title, snippet, score });
        } else if (score > 0) {
            hits.push({ id: note.id, title, snippet: content.slice(0, 80), score });
        }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Search the vault through IndexedDB (`noteStorage.searchNotes`), then rank.
 * @param {{ searchNotes: (q: string) => Promise<any[]> }} noteStorage
 * @param {string} query
 * @param {{ limit?: number }} [options]
 * @returns {Promise<VaultHit[]>}
 */
export async function searchVaultStorage(noteStorage, query, options = {}) {
    if (!noteStorage || typeof noteStorage.searchNotes !== 'function') return [];
    const notes = await noteStorage.searchNotes(query);
    return searchVaultNotes(notes, query, options);
}
