/**
 * Share dialog wiring (URL link + file share + opt-in paste fallback).
 * @module services/share/ui
 */

import { eventBus, EVENTS } from '../../utils/eventBus.js';
import { copyToClipboard } from '../../utils/clipboard.js';
import { createFocusTrap } from '../../utils/dom.js';
import {
    buildShareUrl,
    readIncomingShare
} from './linkShare.js';
import { shareFileOrDownload, shareLinkViaNative } from './fileShare.js';
import { uploadLargeDocAsLink } from './pasteFallback.js';
import { buildQrSvg, downloadQrPng, qrFits } from './qr.js';

function toast(message, type = 'info') {
    try {
        eventBus.emit(EVENTS.TOAST_SHOW, { message, type });
    } catch {
        /* ignore toast failures in tests */
    }
}

function setStatus(text, isError = false) {
    const el = document.getElementById('share-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('share-status-error', Boolean(isError));
}

function getModal() {
    return document.getElementById('share-modal');
}

let lastTrigger = null;
let shareFocusTrap = null;

export function openShareModal(triggerEl = null) {
    lastTrigger = triggerEl instanceof Element ? triggerEl : document.activeElement;
    const modal = getModal();
    modal?.classList.add('active');
    document.getElementById('share-modal-overlay')?.classList.add('active');
    shareFocusTrap?.deactivate();
    if (modal) {
        shareFocusTrap = createFocusTrap(modal, { onEscape: () => closeShareModal() });
        shareFocusTrap.activate();
    }
    refreshShareLink();
}

export function closeShareModal() {
    shareFocusTrap?.deactivate();
    shareFocusTrap = null;
    getModal()?.classList.remove('active');
    document.getElementById('share-modal-overlay')?.classList.remove('active');
    if (lastTrigger && document.contains(lastTrigger)) {
        lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
}

function renderQr(containerId, downloadBtnId, hintId, url) {
    const container = document.getElementById(containerId);
    const downloadBtn = downloadBtnId ? document.getElementById(downloadBtnId) : null;
    const hint = hintId ? document.getElementById(hintId) : null;
    if (!container) return '';
    if (!url || !qrFits(url)) {
        container.innerHTML = '';
        container.hidden = true;
        if (downloadBtn) downloadBtn.disabled = true;
        if (hint) {
            hint.hidden = false;
            hint.textContent = !url
                ? ''
                : 'Too long for QR — copy the link or share the .md file.';
        }
        return '';
    }
    try {
        const svg = buildQrSvg(url);
        container.innerHTML = svg;
        container.hidden = false;
        if (downloadBtn) downloadBtn.disabled = false;
        if (hint) hint.hidden = true;
        return svg;
    } catch {
        container.innerHTML = '';
        container.hidden = true;
        if (downloadBtn) downloadBtn.disabled = true;
        return '';
    }
}

export async function refreshShareLink() {
    const output = document.getElementById('share-link-output');
    const copyBtn = document.getElementById('share-copy-link-btn');
    const nativeBtn = document.getElementById('share-native-link-btn');
    if (!output) return;
    const markdown = shareManager.getMarkdown();
    const title = shareManager.getTitle();
    output.value = 'Generating link…';
    setStatus('');
    try {
        const result = await buildShareUrl(markdown, title, window.location.href);
        if (result.tooLarge) {
            output.value = '';
            output.placeholder = 'Link too large — use file share below.';
            if (copyBtn) copyBtn.disabled = true;
            if (nativeBtn) nativeBtn.disabled = true;
            renderQr('share-qr', 'share-qr-download-btn', 'share-qr-hint', '');
            updateLinkMeter(0);
            setStatus(result.reason, true);
            return;
        }
        output.value = result.url;
        if (copyBtn) copyBtn.disabled = false;
        if (nativeBtn) nativeBtn.disabled = false;
        currentLinkQrSvg = renderQr('share-qr', 'share-qr-download-btn', 'share-qr-hint', result.url);
        updateLinkMeter(result.url.length);
        setStatus(`Link ready (${result.url.length} chars). Anyone opening it sees the same doc on this site.`);
    } catch {
        output.value = '';
        setStatus('Could not generate a link in this browser. Use file share instead.', true);
    }
}

function updateLinkMeter(length) {
    const meter = document.getElementById('share-link-meter');
    if (!meter) return;
    meter.textContent = length > 0 ? `${length} / 8000 chars` : '';
}

let currentLinkQrSvg = '';
let currentPasteQrSvg = '';

async function handleQrDownload(kind) {
    const svg = kind === 'paste' ? currentPasteQrSvg : currentLinkQrSvg;
    if (!svg) return;
    try {
        await downloadQrPng(svg, kind === 'paste' ? 'markups-paste-qr.png' : 'markups-share-qr.png');
        toast('QR code downloaded', 'success');
    } catch {
        setStatus('Could not download the QR image in this browser.', true);
    }
}

async function handleCopyLink() {
    const output = document.getElementById('share-link-output');
    const url = output?.value?.trim();
    if (!url) return;
    const ok = await copyToClipboard(url);
    try { output.select(); } catch { /* ignore */ }
    setStatus(ok ? 'Link copied. Paste it anywhere to share.' : 'Copy failed — select the link manually.', !ok);
    toast(ok ? 'Share link copied' : 'Link copy failed', ok ? 'success' : 'error');
}

async function handleNativeLink() {
    const url = document.getElementById('share-link-output')?.value?.trim();
    if (!url) return;
    const result = await shareLinkViaNative({ url, title: shareManager.getTitle() || 'Markups document' });
    if (result.method === 'web-share') {
        setStatus('Shared through the system share sheet.');
        return;
    }
    if (result.method === 'cancelled') {
        setStatus('Share cancelled.');
        return;
    }
    await handleCopyLink();
}

async function handleDownloadOrNativeFile() {
    const markdown = shareManager.getMarkdown();
    const filename = `${shareManager.getTitle() || 'document'}.md`;
    setStatus('Preparing file…');
    const result = await shareFileOrDownload({ content: markdown, filename, title: shareManager.getTitle() });
    if (result.method === 'web-share') {
        setStatus('Shared through the system share sheet.');
        toast('Document shared', 'success');
    } else if (result.method === 'download') {
        setStatus('Downloaded. Send the .md file anywhere; the receiver can Upload it back.');
        toast('Markdown downloaded', 'success');
    } else {
        setStatus('Share cancelled.');
    }
}

async function handlePasteUpload(event) {
    event?.preventDefault?.();
    const confirmBox = document.getElementById('share-public-confirm');
    if (!confirmBox?.checked) {
        setStatus('Please confirm the public-link warning before uploading.', true);
        return;
    }
    const button = document.getElementById('share-upload-btn');
    const markdown = shareManager.getMarkdown();
    if (button) button.disabled = true;
    setStatus('Uploading to a free public paste (large docs only)…');
    try {
        const result = await uploadLargeDocAsLink(markdown, { filename: `${shareManager.getTitle() || 'document'}.md` });
        const output = document.getElementById('share-paste-output');
        if (output) {
            output.value = result.url;
            try { output.select(); } catch { /* ignore */ }
        }
        currentPasteQrSvg = renderQr('share-paste-qr', 'share-paste-qr-download-btn', '', result.url);
        await copyToClipboard(result.url);
        setStatus(`Public link ready via ${result.provider}. It may expire; do not upload sensitive docs. Link copied.`);
        toast('Public paste link ready', 'success');
    } catch (error) {
        setStatus(error?.message || 'Upload failed. Use file share instead.', true);
        toast('Paste upload failed — use file share', 'error');
    } finally {
        if (button) button.disabled = false;
    }
}

/**
 * If the URL contains `#s=...`, decode and hand the doc to the app.
 */
export async function handleIncomingShare() {
    if (!window.location.hash.includes('s=')) return false;
    try {
        const incoming = await readIncomingShare(window.location.hash);
        if (!incoming || !incoming.markdown) return false;
        const label = incoming.title ? `"${incoming.title}"` : 'a shared document';
        const accept = window.confirm(`Open ${label} in a new tab? Your current document stays open.`);
        if (!accept) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return true;
        }
        await shareManager.onIncomingDoc?.(incoming);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        toast('Shared document opened in a new tab', 'success');
        return true;
    } catch (error) {
        toast(error?.message || 'Could not open that share link.', 'error');
        return false;
    }
}

export const shareManager = {
    _getMarkdown: () => '',
    _getTitle: () => 'document',
    _bound: false,
    onIncomingDoc: null,

    initialize({ getMarkdown, getTitle, onIncomingDoc } = {}) {
        if (getMarkdown) this._getMarkdown = getMarkdown;
        if (getTitle) this._getTitle = getTitle;
        if (onIncomingDoc) this.onIncomingDoc = onIncomingDoc;
        if (this._bound) return;
        this._bound = true;

        document.getElementById('share-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            openShareModal(e.currentTarget);
        });
        document.getElementById('mobile-share-nav-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            openShareModal(e.currentTarget);
        });
        document.getElementById('mobile-share-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            openShareModal(e.currentTarget);
        });
        document.getElementById('share-modal-close')?.addEventListener('click', closeShareModal);
        document.getElementById('share-cancel-btn')?.addEventListener('click', closeShareModal);
        document.getElementById('share-modal-overlay')?.addEventListener('click', closeShareModal);
        document.getElementById('share-copy-link-btn')?.addEventListener('click', handleCopyLink);
        document.getElementById('share-native-link-btn')?.addEventListener('click', handleNativeLink);
        document.getElementById('share-download-file-btn')?.addEventListener('click', handleDownloadOrNativeFile);
        document.getElementById('share-qr-download-btn')?.addEventListener('click', () => handleQrDownload('link'));
        document.getElementById('share-paste-qr-download-btn')?.addEventListener('click', () => handleQrDownload('paste'));
        document.getElementById('share-upload-btn')?.addEventListener('click', handlePasteUpload);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && getModal()?.classList.contains('active')) {
                e.preventDefault();
                closeShareModal();
            }
        });
    },

    getMarkdown() {
        try {
            return this._getMarkdown() ?? '';
        } catch {
            return '';
        }
    },

    getTitle() {
        try {
            const raw = String(this._getTitle() ?? 'document').replace(/[\\/:*?"<>|]+/g, '-').trim();
            return raw || 'document';
        } catch {
            return 'document';
        }
    }
};

export default shareManager;
