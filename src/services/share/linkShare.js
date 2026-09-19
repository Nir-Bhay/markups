/**
 * Client-only URL share (no server, free).
 * Encodes { title, markdown } into location.hash as `#s=<mode><base64url>`.
 * mode `g` = gzip bytes, mode `u` = plain utf8 bytes (fallback).
 * @module services/share/linkShare
 */

export const SHARE_HASH_KEY = 's=';
export const MAX_SHARE_URL_CHARS = 8000;
export const MAX_SHARE_DOC_BYTES = 100 * 1024;
export const MAX_INFLATE_BYTES = 512 * 1024;

function textToBytes(text) {
    return new TextEncoder().encode(String(text ?? ''));
}

function bytesToText(bytes) {
    return new TextDecoder().decode(bytes);
}

export function base64UrlEncode(bytes) {
    const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < input.length; i += chunk) {
        binary += String.fromCharCode.apply(null, input.subarray(i, i + chunk));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(input) {
    const normalized = String(input ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

async function gzipBytes(bytes) {
    if (typeof globalThis.CompressionStream === 'undefined') throw new Error('gzip unavailable');
    const stream = new globalThis.CompressionStream('gzip');
    const response = new globalThis.Response(
        new Blob([bytes]).stream().pipeThrough(stream)
    );
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

function assertInflateBudget(byteLength, maxBytes = MAX_INFLATE_BYTES) {
    if (byteLength > maxBytes) {
        throw new Error(`Shared document is too large to open safely (${(byteLength / 1024).toFixed(0)} KB).`);
    }
}

async function gunzipBytes(bytes, maxBytes = MAX_INFLATE_BYTES) {
    if (typeof globalThis.DecompressionStream === 'undefined') throw new Error('gunzip unavailable');
    const stream = new globalThis.DecompressionStream('gzip');
    let total = 0;
    const limiter = new globalThis.TransformStream({
        transform(chunk, controller) {
            total += chunk.byteLength;
            assertInflateBudget(total, maxBytes);
            controller.enqueue(chunk);
        }
    });
    const response = new globalThis.Response(
        new Blob([bytes]).stream().pipeThrough(stream).pipeThrough(limiter)
    );
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

export function buildPayload(markdown, title = '') {
    return JSON.stringify({
        v: 1,
        t: String(title ?? '').slice(0, 200),
        md: String(markdown ?? '')
    });
}

export function parsePayload(text) {
    if (typeof text !== 'string' || !text) return null;
    try {
        const data = JSON.parse(text);
        if (!data || typeof data.md !== 'string') return null;
        return {
            markdown: data.md,
            title: typeof data.t === 'string' ? data.t : ''
        };
    } catch {
        return null;
    }
}

/**
 * Encode markdown into a share hash value (without leading `#`).
 */
export async function encodeDocToHash(markdown, title = '') {
    const payload = buildPayload(markdown, title);
    const raw = textToBytes(payload);
    try {
        const gzipped = await gzipBytes(raw);
        return `s=g${base64UrlEncode(gzipped)}`;
    } catch {
        return `s=u${base64UrlEncode(raw)}`;
    }
}

/**
 * Decode a share hash value (`s=...` with or without leading `#`) back to doc.
 */
export async function decodeHashToDoc(hashValue) {
    const normalized = String(hashValue ?? '').trim().replace(/^#/, '');
    if (!normalized.startsWith(SHARE_HASH_KEY)) return null;
    const body = normalized.slice(SHARE_HASH_KEY.length);
    const mode = body.charAt(0);
    const data = body.slice(1);
    if (!data) return null;
    try {
        const bytes = base64UrlDecode(data);
        if (mode === 'g') {
            const inflated = await gunzipBytes(bytes);
            return parsePayload(bytesToText(inflated));
        }
        if (mode === 'u') {
            assertInflateBudget(bytes.byteLength);
            return parsePayload(bytesToText(bytes));
        }
        return null;
    } catch (error) {
        if (/too large to open safely/i.test(String(error?.message || ''))) throw error;
        return null;
    }
}

/**
 * Build a full shareable URL for the current location.
 */
export async function buildShareUrl(markdown, title = '', baseUrl = '') {
    const docBytes = textToBytes(String(markdown ?? '')).length;
    if (docBytes > MAX_SHARE_DOC_BYTES) {
        return {
            url: '',
            tooLarge: true,
            reason: `Document is ${(docBytes / 1024).toFixed(1)} KB; link share supports up to ${MAX_SHARE_DOC_BYTES / 1024} KB. Use file share instead.`
        };
    }
    const hash = await encodeDocToHash(markdown, title);
    const base = String(baseUrl || '').split('#')[0] || 'http://localhost/';
    const url = `${base}#${hash}`;
    if (url.length > MAX_SHARE_URL_CHARS) {
        return {
            url: '',
            tooLarge: true,
            reason: `Encoded link is ${url.length} chars; browsers stay reliable under ${MAX_SHARE_URL_CHARS}. Use file share instead.`
        };
    }
    return { url, tooLarge: false, reason: '' };
}

/**
 * Pull a normalized `s=...` share hash out of pasted input.
 * Accepts a full URL (`https://…#s=…`), a bare hash (`#s=…`) or `s=…`.
 * Returns null when no share payload is present.
 */
export function extractShareHash(input) {
    const text = String(input ?? '').trim();
    if (!text) return null;
    const hashIndex = text.indexOf('#');
    const candidate = hashIndex >= 0 ? text.slice(hashIndex + 1) : text;
    const normalized = candidate.replace(/^#/, '');
    if (!normalized.startsWith(SHARE_HASH_KEY)) return null;
    if (normalized.length <= SHARE_HASH_KEY.length + 1) return null;
    return normalized;
}

/**
 * Read an incoming shared doc from a location.hash value.
 */
export async function readIncomingShare(locationHash) {
    const hash = String(locationHash ?? '').trim();
    if (!hash.startsWith('#')) return null;
    return decodeHashToDoc(hash.slice(1));
}
