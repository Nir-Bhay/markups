/**
 * Share Link Utilities
 * Encode/decode a document into a URL fragment so documents can be shared
 * without any backend (resolves issue #41).
 *
 * Hash format:  #s=<version>.<base64url payload>
 *   version 1 -> payload is deflate-raw compressed JSON {t, c}
 *   version 0 -> payload is uncompressed base64url JSON {t, c} (fallback
 *                for browsers without CompressionStream)
 * @module utils/share-link
 */

/** URL length above which callers should warn the user. */
export const SHARE_LINK_MAX_URL_LENGTH = 30000;

const PREFIX = 's';

/**
 * Base64url-encode a Uint8Array without Buffer dependency.
 * @private
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64Url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Decode a base64url string to a Uint8Array.
 * @private
 * @param {string} str
 * @returns {Uint8Array}
 */
function base64UrlToBytes(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Wrap bytes in a ReadableStream (Blob.stream() is not available in all environments).
 * @private
 * @param {Uint8Array} bytes
 * @returns {ReadableStream}
 */
function bytesToStream(bytes) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        }
    });
}

/**
 * Compress bytes with deflate-raw via CompressionStream.
 * @private
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>|null} null when CompressionStream is unavailable
 */
async function deflate(bytes) {
    if (typeof CompressionStream === 'undefined') return null;
    const stream = bytesToStream(bytes).pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Decompress deflate-raw bytes via DecompressionStream.
 * @private
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>|null} null when DecompressionStream is unavailable
 */
async function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') return null;
    const stream = bytesToStream(bytes).pipeThrough(new DecompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Encode a document into the share-link hash value (without the leading '#').
 * @param {string} title - Document title
 * @param {string} content - Markdown content
 * @returns {Promise<string>} Hash value like "s1.<base64url>"
 */
export async function encodeShareLink(title, content) {
    const json = JSON.stringify({ t: String(title ?? ''), c: String(content ?? '') });
    const bytes = new TextEncoder().encode(json);
    const compressed = await deflate(bytes);
    if (compressed && compressed.length < bytes.length) {
        return `${PREFIX}1.${bytesToBase64Url(compressed)}`;
    }
    return `${PREFIX}0.${bytesToBase64Url(bytes)}`;
}

/**
 * Decode a share-link hash value back into a document.
 * Accepts the full hash ("#s1.abcd" or "#s=1.abcd") or the bare value.
 * @param {string} value - Hash or hash value
 * @returns {Promise<{title: string, content: string}|null>} Parsed document, or null on any error
 */
export async function decodeShareLink(value) {
    try {
        if (typeof value !== 'string') return null;
        let raw = value.trim();
        if (raw.startsWith('#')) raw = raw.slice(1);
        if (raw.startsWith(`${PREFIX}=`)) raw = raw.slice(2);
        // Accepted forms after stripping: "s<version>.<payload>" with version 0 or 1
        const match = raw.match(/^s([01])\.(.+)$/);
        if (!match) return null;
        const version = match[1];
        const payload = match[2];
        if (!payload) return null;

        let json;
        if (version === '1') {
            const inflated = await inflate(base64UrlToBytes(payload));
            if (!inflated) return null;
            json = new TextDecoder().decode(inflated);
        } else if (version === '0') {
            json = new TextDecoder().decode(base64UrlToBytes(payload));
        } else {
            return null;
        }

        const doc = JSON.parse(json);
        if (typeof doc?.c !== 'string') return null;
        return { title: typeof doc.t === 'string' ? doc.t : '', content: doc.c };
    } catch {
        return null;
    }
}

/**
 * Build a complete shareable URL for the current page.
 * @param {string} baseUrl - Origin + path (e.g. location.origin + location.pathname)
 * @param {string} title - Document title
 * @param {string} content - Markdown content
 * @returns {Promise<string>} Full shareable URL
 */
export async function buildShareUrl(baseUrl, title, content) {
    const hashValue = await encodeShareLink(title, content);
    return `${baseUrl}#${PREFIX}=${hashValue}`;
}

export default {
    SHARE_LINK_MAX_URL_LENGTH,
    encodeShareLink,
    decodeShareLink,
    buildShareUrl
};
