import { describe, it, expect } from 'vitest';
import {
    encodeShareLink,
    decodeShareLink,
    buildShareUrl,
    SHARE_LINK_MAX_URL_LENGTH
} from '../utils/share-link.js';

describe('share-link', () => {
    it('roundtrips title and content', async () => {
        const hash = await encodeShareLink('My Doc', '# Hello\n\nWorld');
        const decoded = await decodeShareLink(hash);
        expect(decoded).not.toBeNull();
        expect(decoded.title).toBe('My Doc');
        expect(decoded.content).toBe('# Hello\n\nWorld');
    });

    it('roundtrips empty content and empty title', async () => {
        const hash = await encodeShareLink('', '');
        const decoded = await decodeShareLink(hash);
        expect(decoded).not.toBeNull();
        expect(decoded.title).toBe('');
        expect(decoded.content).toBe('');
    });

    it('roundtrips unicode content', async () => {
        const content = '# 标题\n\n- héllo wörld ✨\n\\$E=mc^2$';
        const hash = await encodeShareLink('文档', content);
        const decoded = await decodeShareLink(hash);
        expect(decoded.content).toBe(content);
        expect(decoded.title).toBe('文档');
    });

    it('produces a compressed s1 payload for repetitive content', async () => {
        const hash = await encodeShareLink('Big', 'Lorem ipsum dolor sit amet. '.repeat(200));
        expect(hash.startsWith('s1.')).toBe(true);
        const decoded = await decodeShareLink(hash);
        expect(decoded.content).toBe('Lorem ipsum dolor sit amet. '.repeat(200));
    });

    it('falls back to s0 payload when CompressionStream is unavailable', async () => {
        const original = globalThis.CompressionStream;
        // @ts-ignore - intentionally remove global for the fallback test
        delete globalThis.CompressionStream;
        try {
            const hash = await encodeShareLink('T', 'plain content');
            expect(hash.startsWith('s0.')).toBe(true);
            const decoded = await decodeShareLink(hash);
            expect(decoded.title).toBe('T');
            expect(decoded.content).toBe('plain content');
        } finally {
            globalThis.CompressionStream = original;
        }
    });

    it('decodes an s0 payload when DecompressionStream is unavailable', async () => {
        const hash = await encodeShareLink('T', 'plain content');
        expect(hash.startsWith('s0.')).toBe(true);
        const original = globalThis.DecompressionStream;
        // @ts-ignore - intentionally remove global for the fallback test
        delete globalThis.DecompressionStream;
        try {
            const decoded = await decodeShareLink(hash);
            expect(decoded).not.toBeNull();
            expect(decoded.content).toBe('plain content');
        } finally {
            globalThis.DecompressionStream = original;
        }
    });

    it('accepts a full hash with # and s= prefix', async () => {
        const hash = await encodeShareLink('A', 'B');
        for (const wrapped of [`#${hash}`, `#s=${hash}`]) {
            const decoded = await decodeShareLink(wrapped);
            expect(decoded?.content).toBe('B');
        }
    });

    it('returns null for corrupt input', async () => {
        expect(await decodeShareLink('#s1.!!!not-base64!!!')).toBeNull();
        expect(await decodeShareLink('#s9.AAAA')).toBeNull();
        expect(await decodeShareLink('#s1.')).toBeNull();
        expect(await decodeShareLink('garbage')).toBeNull();
        expect(await decodeShareLink('')).toBeNull();
        expect(await decodeShareLink(null)).toBeNull();
        expect(await decodeShareLink(undefined)).toBeNull();
    });

    it('returns null for s1 payload when DecompressionStream is unavailable', async () => {
        const hash = await encodeShareLink('T', 'compressed content'.repeat(10));
        expect(hash.startsWith('s1.')).toBe(true);
        const original = globalThis.DecompressionStream;
        // @ts-ignore - intentionally remove global for the fallback test
        delete globalThis.DecompressionStream;
        try {
            expect(await decodeShareLink(hash)).toBeNull();
        } finally {
            globalThis.DecompressionStream = original;
        }
    });

    it('buildShareUrl appends the hash to a base URL', async () => {
        const url = await buildShareUrl('https://markups.vercel.app/', 'T', 'C');
        expect(url.startsWith('https://markups.vercel.app/#s=s')).toBe(true);
        const decoded = await decodeShareLink(url.slice(url.indexOf('#')));
        expect(decoded.content).toBe('C');
    });

    it('exposes a sane max URL length constant', () => {
        expect(SHARE_LINK_MAX_URL_LENGTH).toBeGreaterThan(0);
    });
});
