import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../core/storage/database.js';
import {
    recordVersion,
    listVersions,
    restoreVersion,
    _resetVersionThrottle
} from '../core/storage/versionHistory.js';
import { noteStorage } from '../core/storage/noteStorage.js';

describe('core/storage/versionHistory', () => {
    beforeEach(async () => {
        _resetVersionThrottle();
        await db.note_versions.clear();
    });

    it('records and lists snapshots newest-first', async () => {
        const note = await noteStorage.createNote({ title: 'V', content: 'v1' });
        await recordVersion(note.id, 'v1', { force: true });
        await recordVersion(note.id, 'v2', { force: true });
        const versions = await listVersions(note.id);
        expect(versions).toHaveLength(2);
        expect(versions[0].content).toBe('v2');
        await noteStorage.deleteNote(note.id);
    });

    it('throttles rapid repeat snapshots', async () => {
        const note = await noteStorage.createNote({ title: 'T', content: 'a' });
        expect(await recordVersion(note.id, 'a')).not.toBeNull();
        expect(await recordVersion(note.id, 'b')).toBeNull();
        await noteStorage.deleteNote(note.id);
    });

    it('skips identical content and caps retention', async () => {
        const note = await noteStorage.createNote({ title: 'R', content: 'x' });
        await recordVersion(note.id, 'x', { force: true });
        expect(await recordVersion(note.id, 'x', { force: true })).toBeNull();
        for (let i = 0; i < 5; i++) {
            await recordVersion(note.id, `c${i}`, { force: true, maxVersions: 3 });
        }
        expect((await listVersions(note.id)).length).toBeLessThanOrEqual(3);
        await noteStorage.deleteNote(note.id);
    });

    it('restores a snapshot into the note', async () => {
        const note = await noteStorage.createNote({ title: 'S', content: 'new' });
        const vid = await recordVersion(note.id, 'old', { force: true });
        const restored = await restoreVersion(note.id, vid, { noteStorage });
        expect(restored).toBe('old');
        expect((await noteStorage.getNote(note.id)).content).toBe('old');
        await noteStorage.deleteNote(note.id);
    });
});
