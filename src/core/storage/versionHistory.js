/** Note-scoped local snapshots. Legacy unscoped history is never reassigned. */
import { db } from './database.js';

export const VERSION_HISTORY_THROTTLE_MS = 5 * 60 * 1000;
export const VERSION_HISTORY_MAX_PER_NOTE = 50;
const lastSnapshotAt = new Map();

function noteIdOf(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function writeSnapshot(noteId, content, options = {}) {
    const id = noteIdOf(noteId);
    if (id === null || typeof content !== 'string') throw new Error('Invalid snapshot');
    const now = Date.now();
    const throttleMs = options.throttleMs ?? VERSION_HISTORY_THROTTLE_MS;
    if (!options.force && lastSnapshotAt.has(id) && now - lastSnapshotAt.get(id) < throttleMs) {
        return { id: null, created: false };
    }
    const maxVersions = Math.max(1, Math.min(500, options.maxVersions ?? VERSION_HISTORY_MAX_PER_NOTE));
    const result = await db.transaction('rw', db.notes, db.note_versions, async () => {
        if (!await db.notes.get(id)) throw new Error('Document no longer exists');
        const versions = await db.note_versions.where('noteId').equals(id).toArray();
        versions.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
        if (versions[0]?.content === content) return { id: versions[0].id, created: false };
        const snapshotId = await db.note_versions.add({ noteId: id, content, createdAt: now });
        const stale = versions.slice(maxVersions - 1).map(version => version.id);
        if (stale.length) await db.note_versions.bulkDelete(stale);
        return { id: snapshotId, created: true };
    });
    if (result.created) lastSnapshotAt.set(id, now);
    return result;
}

/** Returns a new snapshot ID, or null for duplicate/throttle/storage failure. */
export async function recordVersion(noteId, content, options = {}) {
    try {
        const result = await writeSnapshot(noteId, content, options);
        return result.created ? result.id : null;
    } catch {
        return null;
    }
}

export async function listVersions(noteId, { throwOnError = false } = {}) {
    const id = noteIdOf(noteId);
    if (id === null) return [];
    try {
        const versions = await db.note_versions.where('noteId').equals(id).toArray();
        return versions.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    } catch (error) {
        if (throwOnError) throw error;
        return [];
    }
}

/**
 * Preserve the current (including unsaved) text before confirmed note restoration.
 * canRestore is checked after asynchronous reads/backups so a stale UI can abort.
 * Captured note IDs, rather than the current tab, always determine the write target.
 */
export async function restoreVersion(noteId, versionId, { noteStorage, currentContent, canRestore = () => true }) {
    const id = noteIdOf(noteId);
    const snapshotId = noteIdOf(versionId);
    if (id === null || snapshotId === null) return null;
    try {
        const version = await db.note_versions.get(snapshotId);
        if (!version || version.noteId !== id || !canRestore()) return null;
        const currentNote = await noteStorage.getNote(id);
        if (!currentNote || !canRestore()) return null;
        const backup = typeof currentContent === 'string' ? currentContent : currentNote.content;
        // Unlike recordVersion's best-effort API, a failed backup blocks restore.
        const savedBackup = await writeSnapshot(id, backup, { force: true });
        if (!savedBackup.id || !canRestore()) return null;
        const updatedNote = await noteStorage.updateNote(id, { content: version.content });
        if (!updatedNote || updatedNote.content !== version.content) return null;
        return version.content;
    } catch {
        return null;
    }
}

export function _resetVersionThrottle() {
    lastSnapshotAt.clear();
}
