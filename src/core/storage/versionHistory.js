/**
 * Version history — throttled snapshots of note content into `note_versions`
 * with retention cap and restore. Best-effort: failures never break saves.
 * @module core/storage/versionHistory
 */

import { db } from './database.js';

export const VERSION_HISTORY_THROTTLE_MS = 5 * 60 * 1000;
export const VERSION_HISTORY_MAX_PER_NOTE = 50;

/** @type {Map<string, number>} Last snapshot timestamp per note */
const _lastSnapshotAt = new Map();

/**
 * Record a content snapshot for a note (throttled, retention-capped).
 * @param {number} noteId
 * @param {string} content
 * @param {{ throttleMs?: number, maxVersions?: number, force?: boolean }} [options]
 * @returns {Promise<number|null>} Version row id, or null when throttled/skipped
 */
export async function recordVersion(noteId, content, options = {}) {
    const throttleMs = options.throttleMs ?? VERSION_HISTORY_THROTTLE_MS;
    const maxVersions = options.maxVersions ?? VERSION_HISTORY_MAX_PER_NOTE;
    try {
        const numericId = typeof noteId === 'number' ? noteId : parseInt(noteId, 10);
        if (isNaN(numericId) || typeof content !== 'string') return null;
        const now = Date.now();
        if (!options.force) {
            const last = _lastSnapshotAt.get(String(numericId)) ?? 0;
            if (now - last < throttleMs) return null;
        }
        const latest = await db.note_versions
            .where('noteId').equals(numericId)
            .reverse().sortBy('createdAt');
        if (latest.length > 0 && latest[0].content === content) return null;
        const id = await db.note_versions.add({ noteId: numericId, content, createdAt: now });
        _lastSnapshotAt.set(String(numericId), now);
        // Retention: keep newest `maxVersions` rows.
        const all = await db.note_versions.where('noteId').equals(numericId).sortBy('createdAt');
        if (all.length > maxVersions) {
            const stale = all.slice(0, all.length - maxVersions).map(v => v.id);
            await db.note_versions.bulkDelete(stale);
        }
        return id;
    } catch {
        return null;
    }
}

/**
 * List snapshots for a note, newest first.
 * @param {number} noteId
 * @returns {Promise<Array<{ id: number, noteId: number, content: string, createdAt: number }>>}
 */
export async function listVersions(noteId) {
    try {
        const numericId = typeof noteId === 'number' ? noteId : parseInt(noteId, 10);
        if (isNaN(numericId)) return [];
        return await db.note_versions.where('noteId').equals(numericId).reverse().sortBy('createdAt');
    } catch {
        return [];
    }
}

/**
 * Restore a snapshot's content into its note. Returns the restored content.
 * @param {number} noteId
 * @param {number} versionId
 * @param {{ noteStorage }} deps - noteStorage to avoid a static import cycle
 * @returns {Promise<string|null>}
 */
export async function restoreVersion(noteId, versionId, { noteStorage }) {
    try {
        const version = await db.note_versions.get(versionId);
        if (!version || version.noteId !== Number(noteId)) return null;
        await noteStorage.updateNote(Number(noteId), { content: version.content });
        await recordVersion(Number(noteId), version.content, { force: true });
        return version.content;
    } catch {
        return null;
    }
}

/** Test-only: reset throttle state. */
export function _resetVersionThrottle() {
    _lastSnapshotAt.clear();
}
