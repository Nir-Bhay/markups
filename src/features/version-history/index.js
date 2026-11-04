/**
 * Note-scoped version history backed by IndexedDB.
 * Old unassigned localStorage history stays untouched and can be exported.
 */
import { showToast } from '../../ui/toast/index.js';
import { createFocusTrap } from '../../utils/dom.js';
import { NAMESPACE, STORAGE_KEYS } from '../../core/storage/keys.js';
import { noteStorage } from '../../core/storage/noteStorage.js';
import { recordVersion, listVersions, restoreVersion } from '../../core/storage/versionHistory.js';
import { downloadFile } from '../../utils/file.js';

const VERSION_SAVE_INTERVAL = 60000;
let state = null;

function activeNoteId(current = state) {
    try {
        const id = Number(current?.getActiveNoteId());
        return Number.isSafeInteger(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
}

function legacyHistory() {
    const result = {};
    for (const key of [NAMESPACE + '.' + STORAGE_KEYS.VERSION_HISTORY, 'version_history']) {
        try {
            const raw = localStorage.getItem(key);
            if (raw !== null) result[key] = raw;
        } catch { /* Storage may be blocked; do not mutate legacy keys. */ }
    }
    return result;
}

/** Export raw unassigned history; assigning it to the current note is unsafe. */
export function exportLegacyVersionHistory() {
    const history = legacyHistory();
    if (!Object.keys(history).length) return false;
    downloadFile(JSON.stringify({ format: 'markups-unassigned-history-v1', history }, null, 2),
        'markups-unassigned-history.json', 'application/json');
    return true;
}

function closeModal(current) {
    current.modal.style.display = 'none';
    current.overlay.style.display = 'none';
    current.focusTrap?.deactivate();
    current.focusTrap = null;
    current.renderToken++;
}

export function stopVersionHistoryPolling() {
    if (!state) return;
    clearInterval(state.interval);
    closeModal(state);
    state.bindings.forEach(([target, event, callback]) => target.removeEventListener(event, callback));
    state = null;
}

async function renderVersionList(current) {
    const noteId = activeNoteId(current);
    const token = ++current.renderToken;
    let versions = [];
    let loadFailed = false;
    try {
        if (noteId !== null) versions = await listVersions(noteId, { throwOnError: true });
    } catch {
        loadFailed = true;
    }
    if (state !== current || token !== current.renderToken || activeNoteId(current) !== noteId) return;
    const list = document.getElementById('version-list');
    if (!list) return;
    list.replaceChildren();
    const message = document.createElement('p');
    message.className = 'empty-state';
    message.textContent = noteId === null
        ? 'Select a saved document to view its history.'
        : 'History belongs to this document only. Current text is backed up before restoring.';
    list.appendChild(message);
    if (Object.keys(legacyHistory()).length) {
        const recover = document.createElement('button');
        recover.type = 'button';
        recover.textContent = 'Export older unassigned history';
        recover.addEventListener('click', exportLegacyVersionHistory);
        list.appendChild(recover);
    }
    if (!versions.length) {
        if (noteId !== null) message.textContent = loadFailed
            ? 'History could not be loaded. Your open document was kept.'
            : 'No saved versions for this document yet.';
        return;
    }
    for (const version of versions) {
        const row = document.createElement('div');
        row.className = 'version-item';
        const info = document.createElement('div');
        info.className = 'version-info';
        const date = document.createElement('span');
        date.className = 'version-date';
        date.textContent = new Date(version.createdAt).toLocaleString();
        const meta = document.createElement('span');
        meta.className = 'version-meta';
        meta.textContent = version.content.split(/\s+/).filter(Boolean).length + ' words';
        info.append(date, meta);
        const restore = document.createElement('button');
        restore.type = 'button';
        restore.className = 'version-restore-btn';
        restore.textContent = 'Restore';
        restore.addEventListener('click', async () => {
            if (activeNoteId(current) !== noteId || state !== current) {
                showToast('Document changed. Open history again for the selected document.', 'warning');
                await renderVersionList(current);
                return;
            }
            if (!confirm('Restore this version? Your current text will be saved as a recovery version first.')) return;
            const content = current.editor.getValue();
            const canRestore = () => state === current && activeNoteId(current) === noteId &&
                current.editor.getValue() === content;
            restore.disabled = true;
            const restored = await restoreVersion(noteId, version.id, {
                noteStorage, currentContent: content, canRestore
            });
            if (restored === null) {
                if (state === current) {
                    restore.disabled = false;
                    showToast('Restore failed or the document changed. Your open text was kept.', 'error');
                }
                return;
            }
            if (!canRestore()) {
                // A captured note write can finish after a tab/edit changes. Never set another editor.
                if (state === current) showToast('Version saved to its original document. Current editor was kept.', 'info');
                return;
            }
            current.editor.setValue(restored);
            try {
                await current.onRestored?.({ noteId, content: restored });
            } catch {
                showToast('Version restored. The document view could not refresh.', 'warning');
                return;
            }
            if (state !== current || activeNoteId(current) !== noteId) return;
            showToast('Version restored; previous text is available in history.', 'success');
            closeModal(current);
        });
        row.append(info, restore);
        list.appendChild(row);
    }
}

/** getActiveNoteId must resolve the actual local IndexedDB note ID dynamically. */
export function initVersionHistory(options = {}) {
    stopVersionHistoryPolling();
    const modal = document.getElementById('version-history-modal');
    const overlay = document.getElementById('version-history-overlay');
    if (!modal || !overlay || !options.editorInstance) return stopVersionHistoryPolling;
    const current = {
        editor: options.editorInstance,
        getActiveNoteId: options.getActiveNoteId || (() => null),
        onRestored: options.onRestored,
        defaultContent: options.defaultContent || '',
        hasEdited: Boolean(options.hasEdited),
        modal, overlay, bindings: [], interval: null, focusTrap: null, renderToken: 0
    };
    state = current;
    function bind(target, event, callback) {
        if (!target) return;
        target.addEventListener(event, callback);
        current.bindings.push([target, event, callback]);
    }
    const close = () => closeModal(current);
    const open = () => {
        modal.style.display = 'block';
        overlay.style.display = 'block';
        void renderVersionList(current);
        current.focusTrap?.deactivate();
        current.focusTrap = createFocusTrap(modal, { onEscape: close });
        current.focusTrap.activate();
    };
    modal.querySelectorAll('.close-modal').forEach(button => bind(button, 'click', close));
    bind(overlay, 'click', close);
    bind(document.getElementById('version-history-btn'), 'click', open);
    bind(document, 'keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'v') {
            event.preventDefault();
            open();
        }
    });
    current.interval = setInterval(() => {
        if (current.hasEdited && state === current) void snapshot(current, false);
    }, VERSION_SAVE_INTERVAL);
    return stopVersionHistoryPolling;
}

async function snapshot(current, force) {
    const noteId = activeNoteId(current);
    if (noteId === null || state !== current) return null;
    const content = current.editor.getValue();
    if (current.defaultContent && content === current.defaultContent) return null;
    return recordVersion(noteId, content, { force, throttleMs: VERSION_SAVE_INTERVAL, maxVersions: 20 });
}

export function setHasEdited(value) {
    if (state) state.hasEdited = Boolean(value);
}

export async function saveVersion() {
    return state ? snapshot(state, true) : null;
}

export default { initVersionHistory, setHasEdited, saveVersion, stopVersionHistoryPolling };
