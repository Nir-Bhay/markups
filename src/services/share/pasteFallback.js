/**
 * Opt-in free paste fallback for docs too large for URL share.
 * No key, no account. Explicit upload only — never automatic.
 * Order: paste.rs (simple PUT) then 0x0.st (multipart POST).
 * @module services/share/pasteFallback
 */

export const PASTE_MAX_BYTES = 5 * 1024 * 1024;
export const PASTE_TIMEOUT_MS = 15000;

export function classifyPasteError(error) {
    const name = error?.name || '';
    const msg = String(error?.message || error || '');
    if (name === 'AbortError' || /abort/i.test(msg)) {
        return 'Paste upload timed out. Use file share instead.';
    }
    if (name === 'TypeError' || /failed to fetch|networkerror|cors/i.test(msg)) {
        return 'Paste hosts blocked this browser (CORS). Use file share instead — no server needed.';
    }
    return msg || 'Upload failed. Use file share instead.';
}

function withTimeout(signal, ms) {
    if (signal) return { signal, cleanup: () => {} };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return { signal: controller.signal, cleanup: () => clearTimeout(timer) };
}

async function putToPasteRs(markdown, { signal, fetchFn }) {
    const response = await fetchFn('https://paste.rs/', {
        method: 'PUT',
        headers: { 'Content-Type': 'text/markdown;charset=utf-8' },
        body: String(markdown ?? ''),
        signal
    });
    if (!response.ok) throw new Error(`paste.rs failed: ${response.status}`);
    const url = (await response.text()).trim();
    if (!/^https?:\/\//.test(url)) throw new Error('paste.rs returned an unexpected response');
    return { url, provider: 'paste.rs' };
}

async function postToZeroX(markdown, { filename, signal, fetchFn }) {
    const form = new globalThis.FormData();
    const blob = new Blob([String(markdown ?? '')], { type: 'text/markdown;charset=utf-8' });
    form.append('file', blob, filename || 'document.md');
    const response = await fetchFn('https://0x0.st', {
        method: 'POST',
        body: form,
        signal
    });
    if (!response.ok) throw new Error(`0x0.st failed: ${response.status}`);
    const url = (await response.text()).trim().split(/\s+/)[0];
    if (!/^https?:\/\//.test(url)) throw new Error('0x0.st returned an unexpected response');
    return { url, provider: '0x0.st' };
}

/**
 * Upload markdown text and return a public URL.
 * Caller must show a public-link warning before invoking.
 */
export async function uploadLargeDocAsLink(markdown, options = {}) {
    const {
        filename = 'document.md',
        signal = null,
        timeoutMs = PASTE_TIMEOUT_MS,
        fetchFn = fetch
    } = options;
    const text = String(markdown ?? '');
    const byteLength = new TextEncoder().encode(text).length;
    if (!text.trim()) throw new Error('Nothing to upload yet.');
    if (byteLength > PASTE_MAX_BYTES) {
        throw new Error(`Document is ${(byteLength / 1024 / 1024).toFixed(1)} MB; paste fallback supports up to 5 MB.`);
    }

    const timed = withTimeout(signal, timeoutMs);
    try {
        try {
            return await putToPasteRs(text, { signal: timed.signal, fetchFn });
        } catch (firstError) {
            try {
                return await postToZeroX(text, { filename, signal: timed.signal, fetchFn });
            } catch (secondError) {
                throw new Error(classifyPasteError(secondError || firstError));
            }
        }
    } finally {
        timed.cleanup();
    }
}
