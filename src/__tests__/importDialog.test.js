import { describe, it, expect, vi } from 'vitest';
import { extractShareHash, encodeDocToHash, decodeHashToDoc } from '../services/share/linkShare.js';
import { isHttpUrl, fetchUrlText } from '../features/import/dialog.js';

describe('import dialog helpers', () => {
    it('extracts a share hash from full URLs, bare hashes and raw values', async () => {
        const hash = await encodeDocToHash('# hello', 'Doc');
        expect(extractShareHash(`https://markups.dev/${''}#${hash}`)).toBe(hash);
        expect(extractShareHash(`#${hash}`)).toBe(hash);
        expect(extractShareHash(hash)).toBe(hash);
        expect(extractShareHash('https://example.com/page')).toBeNull();
        expect(extractShareHash('')).toBeNull();
        expect(extractShareHash('s=')).toBeNull();
    });

    it('round-trips a pasted share link into markdown', async () => {
        const hash = await encodeDocToHash('# pasted', 'Pasted');
        const doc = await decodeHashToDoc(extractShareHash(`https://markups.dev/#${hash}`));
        expect(doc.markdown).toBe('# pasted');
        expect(doc.title).toBe('Pasted');
    });

    it('accepts only http(s) URLs', () => {
        expect(isHttpUrl('https://paste.rs/abc')).toBe(true);
        expect(isHttpUrl('http://0x0.st/x.md')).toBe(true);
        expect(isHttpUrl('javascript:alert(1)')).toBe(false);
        expect(isHttpUrl('data:text/plain,hi')).toBe(false);
        expect(isHttpUrl('not a url')).toBe(false);
    });

    it('fetches text with size guards', async () => {
        const okFetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => null },
            text: async () => '# remote'
        });
        await expect(fetchUrlText('https://example.com/doc.md', { fetchFn: okFetch })).resolves.toBe('# remote');

        const bigFetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: { get: (name) => (name === 'content-length' ? String(6 * 1024 * 1024) : null) },
            text: async () => 'x'
        });
        await expect(fetchUrlText('https://example.com/big.md', { fetchFn: bigFetch })).rejects.toThrow(/too large/i);

        await expect(fetchUrlText('javascript:alert(1)', { fetchFn: okFetch })).rejects.toThrow(/http\(s\)/);
    });
});
