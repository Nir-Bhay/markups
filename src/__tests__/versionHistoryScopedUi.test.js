import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../core/storage/database.js';
import { noteStorage } from '../core/storage/noteStorage.js';
import { recordVersion, listVersions, _resetVersionThrottle } from '../core/storage/versionHistory.js';
import { storageService } from '../core/storage/index.js';
import { STORAGE_KEYS } from '../core/storage/keys.js';
import { initVersionHistory, saveVersion, stopVersionHistoryPolling } from '../features/version-history/index.js';
import { showToast } from '../ui/toast/index.js';
import { downloadFile } from '../utils/file.js';

vi.mock('../ui/toast/index.js', () => ({ showToast: vi.fn() }));
vi.mock('../utils/file.js', () => ({ downloadFile: vi.fn() }));

describe('note-scoped production history UI', () => {
    let activeId;
    let content;
    let editor;
    const flush = () => new Promise(resolve => setTimeout(resolve, 20));

    beforeEach(async () => {
        stopVersionHistoryPolling();
        vi.clearAllMocks();
        localStorage.clear();
        await db.note_versions.clear();
        await db.notes.clear();
        _resetVersionThrottle();
        document.body.innerHTML = '<button id="version-history-btn">History</button><div id="version-history-overlay"></div><div id="version-history-modal" style="display:none"><button class="close-modal">Close</button><div id="version-list"></div></div>';
        activeId = null;
        content = '';
        editor = { getValue: () => content, setValue: vi.fn(value => { content = value; }) };
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        stopVersionHistoryPolling();
        vi.restoreAllMocks();
    });

    function init() {
        return initVersionHistory({ editorInstance: editor, getActiveNoteId: () => activeId, hasEdited: true });
    }

    async function open() {
        document.getElementById('version-history-btn').click();
        await vi.waitFor(() => expect(document.querySelector('.version-restore-btn')).not.toBeNull());
    }

    it('writes snapshots to each note and lists/restores only the selected note', async () => {
        const a = await noteStorage.createNote({ title: 'A', content: 'A' });
        const b = await noteStorage.createNote({ title: 'B', content: 'B' });
        init();
        activeId = a.id; content = 'A old'; await saveVersion();
        activeId = b.id; content = 'B old'; await saveVersion();
        content = 'B unsaved';
        await open();
        expect(document.querySelectorAll('.version-restore-btn')).toHaveLength(1);
        document.querySelector('.version-restore-btn').click();
        await vi.waitFor(() => expect(editor.setValue).toHaveBeenCalledWith('B old'));
        expect((await listVersions(b.id)).map(v => v.content)).toContain('B unsaved');
        expect((await noteStorage.getNote(a.id)).content).toBe('A');
        expect((await noteStorage.getNote(b.id)).content).toBe('B old');
    });

    it('refuses a restore button captured from a different active tab', async () => {
        const a = await noteStorage.createNote({ title: 'A', content: 'A' });
        const b = await noteStorage.createNote({ title: 'B', content: 'B' });
        await recordVersion(a.id, 'A old', { force: true });
        activeId = a.id; content = 'A now'; init();
        await open();
        activeId = b.id; content = 'B now';
        document.querySelector('.version-restore-btn').click();
        await flush();
        expect(editor.setValue).not.toHaveBeenCalled();
        expect((await noteStorage.getNote(b.id)).content).toBe('B');
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Document changed'), 'warning');
    });

    it('does not overwrite the editor when a tab changes during an asynchronous restore', async () => {
        const a = await noteStorage.createNote({ title: 'A', content: 'A' });
        const b = await noteStorage.createNote({ title: 'B', content: 'B' });
        await recordVersion(a.id, 'A old', { force: true });
        activeId = a.id; content = 'A unsaved'; init();
        await open();
        let release;
        const pending = new Promise(resolve => { release = resolve; });
        const get = vi.spyOn(noteStorage, 'getNote').mockImplementationOnce(() => pending);
        document.querySelector('.version-restore-btn').click();
        await vi.waitFor(() => expect(get).toHaveBeenCalled());
        activeId = b.id; content = 'B unsaved';
        release(a);
        await flush();
        expect(editor.setValue).not.toHaveBeenCalled();
        expect(content).toBe('B unsaved');
        expect((await noteStorage.getNote(a.id)).content).toBe('A');
    });

    it('preserves and exports old unassigned history without assigning it to the current note', async () => {
        const legacy = '[{"content":"unassigned old note"}]';
        localStorage.setItem('version_history', legacy);
        storageService.set(STORAGE_KEYS.VERSION_HISTORY, [{ content: 'namespaced old note' }]);
        const note = await noteStorage.createNote({ title: 'A', content: 'A' });
        activeId = note.id; content = 'current note'; init();
        await saveVersion();
        await open();
        const exportButton = [...document.querySelectorAll('#version-list button')].find(b => /Export older/.test(b.textContent));
        exportButton.click();
        expect(localStorage.getItem('version_history')).toBe(legacy);
        expect(storageService.getArray(STORAGE_KEYS.VERSION_HISTORY)).toEqual([{ content: 'namespaced old note' }]);
        expect((await listVersions(note.id)).map(v => v.content)).toEqual(['current note']);
        const payload = JSON.parse(downloadFile.mock.calls[0][0]);
        expect(payload.history.version_history).toBe(legacy);
    });

    it('cleans up interval and bindings when reinitialized or disposed', async () => {
        const clear = vi.spyOn(globalThis, 'clearInterval');
        init(); init();
        expect(clear).toHaveBeenCalledTimes(1);
        stopVersionHistoryPolling();
        expect(clear).toHaveBeenCalledTimes(2);
        document.getElementById('version-history-btn').click();
        expect(document.getElementById('version-history-modal').style.display).toBe('none');
    });

    it('shows a history load error instead of claiming there are no snapshots', async () => {
        const note = await noteStorage.createNote({ title: 'A', content: 'A' });
        activeId = note.id; init();
        vi.spyOn(db.note_versions, 'where').mockImplementationOnce(() => { throw new Error('blocked'); });
        document.getElementById('version-history-btn').click();
        await vi.waitFor(() => expect(document.getElementById('version-list').textContent).toContain('could not be loaded'));
        expect(editor.setValue).not.toHaveBeenCalled();
    });

    it('does not report a successful UI restore when storage rejects the note update', async () => {
        const note = await noteStorage.createNote({ title: 'A', content: 'A' });
        await recordVersion(note.id, 'old', { force: true });
        activeId = note.id; content = 'unsaved'; init();
        await open();
        vi.spyOn(noteStorage, 'updateNote').mockResolvedValueOnce(null);
        document.querySelector('.version-restore-btn').click();
        await vi.waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Restore failed'), 'error'));
        expect(editor.setValue).not.toHaveBeenCalled();
        expect(showToast.mock.calls.some(call => call[1] === 'success')).toBe(false);
        expect((await listVersions(note.id)).some(version => version.content === 'unsaved')).toBe(true);
    });
});
