import { describe, it, expect } from 'vitest';
import {
    base64UrlEncode,
    base64UrlDecode,
    buildPayload,
    parsePayload,
    encodeDocToHash,
    decodeHashToDoc,
    buildShareUrl,
    readIncomingShare,
    MAX_SHARE_URL_CHARS,
    MAX_INFLATE_BYTES
} from '../services/share/linkShare.js';

describe('services/share/linkShare', () => {
    it('round-trips base64url without padding', () => {
        const bytes = new Uint8Array([1, 2, 250, 255, 0, 72]);
        expect(base64UrlDecode(base64UrlEncode(bytes))).toEqual(bytes);
    });

    it('round-trips a markdown doc through hash encode/decode', async () => {
        const hash = await encodeDocToHash('# Hello\nSome **bold** text', 'MyDoc');
        expect(hash.startsWith('s=')).toBe(true);
        const doc = await decodeHashToDoc(hash);
        expect(doc.markdown).toContain('# Hello');
        expect(doc.title).toBe('MyDoc');
    });

    it('rejects malformed hashes', async () => {
        expect(await decodeHashToDoc('s=!!!')).toBeNull();
        expect(await decodeHashToDoc('x=abc')).toBeNull();
        expect(parsePayload('not-json')).toBeNull();
        expect(parsePayload(JSON.stringify({ t: 'no-md' }))).toBeNull();
    });

    it('builds a share URL and guards oversized docs', async () => {
        const small = await buildShareUrl('hello', 'doc', 'https://markups.dev/');
        expect(small.tooLarge).toBe(false);
        expect(small.url.startsWith('https://markups.dev/#s=')).toBe(true);
        expect(small.url.length).toBeLessThanOrEqual(MAX_SHARE_URL_CHARS);

        const incoming = await readIncomingShare(`#${(await encodeDocToHash('hi', 't'))}`);
        expect(incoming.markdown).toBe('hi');

        const big = await buildShareUrl('x'.repeat(200 * 1024), 'big', 'https://markups.dev/');
        expect(big.tooLarge).toBe(true);
        expect(big.reason).toMatch(/file share/i);
    });

    it('payload builder caps title length', () => {
        const payload = JSON.parse(buildPayload('md', 't'.repeat(500)));
        expect(payload.t.length).toBeLessThanOrEqual(200);
        expect(payload.v).toBe(1);
    });

    it('rejects decompressed payloads over the inflate safety cap', async () => {
        const hash = await encodeDocToHash('x'.repeat(MAX_INFLATE_BYTES + 2048), 'bomb');
        await expect(decodeHashToDoc(hash)).rejects.toThrow(/too large to open safely/i);
    });
});
