/**
 * Import dialog: file picker + shared-link receive + URL import in one place.
 * Shared entry for the production (`main.js`) and modular (`app.js`) boots —
 * only one of them runs per page load, and binding is idempotent.
 * @module features/import/dialog
 */

import { decodeHashToDoc, extractShareHash } from '../../services/share/linkShare.js';
import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { createFocusTrap } from '../../utils/dom.js';

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

function toast(message, type = 'info') {
    try {
        eventBus.emit(EVENTS.TOAST_SHOW, { message, type });
    } catch {
        /* ignore toast failures in tests */
    }
}

function setStatus(text, isError = false) {
    const el = document.getElementById('import-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('share-status-error', Boolean(isError));
}

function getModal() {
    return document.getElementById('import-modal');
}

let lastTrigger = null;
let importFocusTrap = null;

export function openImportDialog(triggerEl = null) {
    lastTrigger = triggerEl instanceof Element ? triggerEl : document.activeElement;
    setStatus('');
    const modal = getModal();
    modal?.classList.add('active');
    document.getElementById('import-modal-overlay')?.classList.add('active');
    importFocusTrap?.deactivate();
    if (modal) {
        importFocusTrap = createFocusTrap(modal, { onEscape: () => closeImportDialog() });
        importFocusTrap.activate();
    }
}

export function closeImportDialog() {
    importFocusTrap?.deactivate();
    importFocusTrap = null;
    getModal()?.classList.remove('active');
    document.getElementById('import-modal-overlay')?.classList.remove('active');
    if (lastTrigger && document.contains(lastTrigger)) {
        lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
}

export function isHttpUrl(value) {
    try {
        const parsed = new URL(String(value ?? '').trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Fetch remote text with http(s)-only + 5 MB guards. Throws with a
 * user-readable message on any failure.
 */
export async function fetchUrlText(url, { fetchFn = fetch, maxBytes = IMPORT_MAX_BYTES } = {}) {
    const value = String(url ?? '').trim();
    if (!isHttpUrl(value)) throw new Error('Only http(s) URLs can be imported.');
    const response = await fetchFn(value);
    if (!response || !response.ok) throw new Error('Could not fetch that URL.');
    const contentLength = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new Error(`Remote content is too large (${(contentLength / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`);
    }
    const text = await response.text();
    if (new Blob([text]).size > maxBytes) {
        throw new Error('Remote content exceeds the 5 MB limit.');
    }
    return text;
}

async function handleSharedLinkSubmit(handlers) {
    const input = document.getElementById('import-link-input');
    const raw = input?.value?.trim() ?? '';
    if (!raw) {
        setStatus('Paste a Markups share link or public paste URL first.', true);
        return;
    }
    // 1) Markups share link (#s=…) — fully offline decode.
    const hash = extractShareHash(raw);
    if (hash) {
        setStatus('Decoding shared link…');
        try {
            const doc = await decodeHashToDoc(hash);
            if (!doc || typeof doc.markdown !== 'string') throw new Error('bad payload');
            closeImportDialog();
            handlers.onSharedLink?.({ markdown: doc.markdown, title: doc.title || 'shared document' });
            return;
        } catch {
            setStatus('That share link could not be decoded. It may be truncated.', true);
            return;
        }
    }
    // 2) Anything else must be an http(s) URL (e.g. a public paste link).
    if (!isHttpUrl(raw)) {
        setStatus('That does not look like a Markups share link or an http(s) URL.', true);
        return;
    }
    setStatus('Fetching public link…');
    try {
        const text = await fetchUrlText(raw);
        closeImportDialog();
        handlers.onUrlText?.({ url: raw, text });
    } catch (error) {
        setStatus(error?.message || 'Could not fetch that URL.', true);
    }
}

async function handleUrlSubmit(handlers) {
    const input = document.getElementById('import-url-input');
    const raw = input?.value?.trim() ?? '';
    if (!raw) {
        setStatus('Enter an http(s) URL to import.', true);
        return;
    }
    setStatus('Fetching URL…');
    try {
        const text = await fetchUrlText(raw);
        closeImportDialog();
        handlers.onUrlText?.({ url: raw, text });
    } catch (error) {
        setStatus(error?.message || 'Failed to import from URL.', true);
        toast(error?.message || 'Failed to import from URL', 'error');
    }
}

/**
 * Bind the import dialog once. Safe to call from both boot paths.
 */
export function initializeImportDialog(handlers = {}) {
    const modal = getModal();
    if (!modal || modal.dataset.bound === 'true') return;
    modal.dataset.bound = 'true';

    document.getElementById('import-choose-file-btn')?.addEventListener('click', () => {
        handlers.onFilePick?.();
    });
    document.getElementById('import-open-link-btn')?.addEventListener('click', () => handleSharedLinkSubmit(handlers));
    document.getElementById('import-fetch-url-btn')?.addEventListener('click', () => handleUrlSubmit(handlers));
    document.getElementById('import-modal-close')?.addEventListener('click', closeImportDialog);
    document.getElementById('import-cancel-btn')?.addEventListener('click', closeImportDialog);
    document.getElementById('import-modal-overlay')?.addEventListener('click', closeImportDialog);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && getModal()?.classList.contains('active')) {
            e.preventDefault();
            closeImportDialog();
        }
    });
}

export default {
    openImportDialog,
    closeImportDialog,
    initializeImportDialog,
    fetchUrlText,
    isHttpUrl
};
