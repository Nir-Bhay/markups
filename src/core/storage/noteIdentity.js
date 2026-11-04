/**
 * Stable identity helpers for local notes.
 * Numeric IndexedDB ids remain the local primary key; stableId is an additive
 * identity for exports and future cross-device mappings, never a secret.
 */

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createStableNoteId() {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();

    const bytes = new Uint8Array(16);
    if (typeof cryptoApi?.getRandomValues === 'function') {
        cryptoApi.getRandomValues(bytes);
    } else {
        // Identity is not an authorization token. This fallback supports older
        // local-only browsers that lack Web Crypto while keeping the same UUID shape.
        for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Math.floor(Math.random() * 256);
        }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isStableNoteId(value) {
    return typeof value === 'string' && UUID_V4.test(value);
}

/**
 * Preserve valid unique IDs and fill missing/invalid/duplicate values.
 * Returns copies so backup payloads and IndexedDB inserts can use the same data.
 * @param {Array<Object>} notes
 * @returns {Array<Object>}
 */
export function ensureStableNoteIds(notes) {
    const seen = new Set();
    return notes.map((note) => {
        let stableId = isStableNoteId(note.stableId) && !seen.has(note.stableId)
            ? note.stableId
            : createStableNoteId();
        while (seen.has(stableId)) stableId = createStableNoteId();
        seen.add(stableId);
        return { ...note, stableId };
    });
}
