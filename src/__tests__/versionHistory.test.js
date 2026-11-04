import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    it('does not report a restore when the note write fails', async () => {
        const note = await noteStorage.createNote({ title: 'S', content: 'new' });
        const vid = await recordVersion(note.id, 'old', { force: true });
        const updateSpy = vi.spyOn(noteStorage, 'updateNote').mockResolvedValueOnce(null);

        try {
            expect(await restoreVersion(note.id, vid, { noteStorage })).toBeNull();
            expect((await noteStorage.getNote(note.id)).content).toBe('new');
        } finally {
            updateSpy.mockRestore();
            await noteStorage.deleteNote(note.id);
        }
    });

    it('never restores a snapshot into another note', async () => {
        const a = await noteStorage.createNote({ title: 'A', content: 'a' });
        const b = await noteStorage.createNote({ title: 'B', content: 'b' });
        const versionId = await recordVersion(a.id, 'a old', { force: true });
        expect(await restoreVersion(b.id, versionId, { noteStorage })).toBeNull();
        expect((await noteStorage.getNote(b.id)).content).toBe('b');
        expect(await listVersions(b.id)).toEqual([]);
    });

    it('backs up unsaved current text before restoration and keeps it if the write fails', async () => {
        const note = await noteStorage.createNote({ title: 'Backup', content: 'saved' });
        const versionId = await recordVersion(note.id, 'old', { force: true });
        const update = vi.spyOn(noteStorage, 'updateNote').mockResolvedValueOnce(null);
        try {
            expect(await restoreVersion(note.id, versionId, {
                noteStorage, currentContent: 'unsaved text'
            })).toBeNull();
            expect((await listVersions(note.id))[0].content).toBe('unsaved text');
            expect((await noteStorage.getNote(note.id)).content).toBe('saved');
        } finally { update.mockRestore(); }
    });

    it('blocks restoration when its recovery snapshot cannot be persisted', async () => {
        const note = await noteStorage.createNote({ title: 'Backup', content: 'saved' });
        const versionId = await recordVersion(note.id, 'old', { force: true });
        const add = vi.spyOn(db.note_versions, 'add').mockRejectedValueOnce(new Error('quota'));
        const update = vi.spyOn(noteStorage, 'updateNote');
        try {
            expect(await restoreVersion(note.id, versionId, {
                noteStorage, currentContent: 'unsaved text'
            })).toBeNull();
            expect(update).not.toHaveBeenCalled();
            expect((await noteStorage.getNote(note.id)).content).toBe('saved');
        } finally { add.mockRestore(); update.mockRestore(); }
    });

    it('rechecks a stale editor guard after asynchronous note reads', async () => {
        const note = await noteStorage.createNote({ title: 'A', content: 'saved' });
        const versionId = await recordVersion(note.id, 'old', { force: true });
        let stillCurrent = true;
        const get = vi.spyOn(noteStorage, 'getNote').mockImplementationOnce(async () => {
            stillCurrent = false;
            return note;
        });
        const update = vi.spyOn(noteStorage, 'updateNote');
        try {
            expect(await restoreVersion(note.id, versionId, {
                noteStorage, currentContent: 'new edit', canRestore: () => stillCurrent
            })).toBeNull();
            expect(update).not.toHaveBeenCalled();
        } finally { get.mockRestore(); update.mockRestore(); }
    });

    it('serializes concurrent duplicate snapshot writes and orders equal timestamps by ID', async () => {
        const note = await noteStorage.createNote({ title: 'Concurrent', content: 'saved' });
        await Promise.all([
            recordVersion(note.id, 'same', { force: true }),
            recordVersion(note.id, 'same', { force: true })
        ]);
        expect(await listVersions(note.id)).toHaveLength(1);
        await recordVersion(note.id, 'newer', { force: true });
        expect((await listVersions(note.id))[0].content).toBe('newer');
    });
});
