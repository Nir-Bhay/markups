/**
 * Native file share + download fallback (no server, free).
 * Uses Web Share Level 2 files when available, else Blob download.
 * @module services/share/fileShare
 */

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function canNativeShareFiles(file) {
    try {
        if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
        if (typeof navigator.canShare === 'function') {
            return navigator.canShare(file ? { files: [file] } : {});
        }
        return true;
    } catch {
        return false;
    }
}

export function toShareFile({ content, filename = 'document.md', mimeType = 'text/markdown;charset=utf-8' }) {
    const safeName = String(filename || 'document.md').trim() || 'document.md';
    const blob = content instanceof Blob
        ? content
        : new Blob([String(content ?? '')], { type: mimeType });
    const name = safeName.includes('.') ? safeName : `${safeName}.md`;
    const type = blob.type || mimeType;
    try {
        return new globalThis.File([blob], name, { type });
    } catch {
        return { blob, name };
    }
}

/**
 * Share markdown as a file, falling back to download.
 */
export async function shareFileOrDownload({
    content,
    filename = 'document.md',
    mimeType = 'text/markdown;charset=utf-8',
    title = 'Markups document',
    text = ''
} = {}) {
    const file = toShareFile({ content, filename, mimeType });
    const isFile = typeof globalThis.File !== 'undefined' && file instanceof globalThis.File;

    if (isFile && canNativeShareFiles(file)) {
        try {
            await navigator.share({ files: [file], title, text });
            return { method: 'web-share' };
        } catch (error) {
            if (error && error.name === 'AbortError') return { method: 'cancelled' };
        }
    }

    const blob = isFile ? file : file.blob;
    downloadBlob(blob, isFile ? file.name : file.name);
    return { method: 'download' };
}

/**
 * Share a link through the native sheet, falling back to clipboard status.
 */
export async function shareLinkViaNative({ url, title = 'Markups link', text = '' } = {}) {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
            await navigator.share({ title, text: text || url, url });
            return { method: 'web-share' };
        } catch (error) {
            if (error && error.name === 'AbortError') return { method: 'cancelled' };
        }
    }
    return { method: 'unavailable' };
}
