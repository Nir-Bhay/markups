import { describe, it, expect, vi } from 'vitest';
import { uploadLargeDocAsLink, PASTE_MAX_BYTES, classifyPasteError } from '../services/share/pasteFallback.js';

describe('services/share/pasteFallback', () => {
    it('uploads through paste.rs when it succeeds', async () => {
        const fetchFn = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'https://paste.rs/abc123\n'
        });
        const result = await uploadLargeDocAsLink('# hello', { fetchFn });
        expect(result).toEqual({ url: 'https://paste.rs/abc123', provider: 'paste.rs' });
        expect(fetchFn).toHaveBeenCalledOnce();
    });

    it('falls back to 0x0.st when paste.rs fails', async () => {
        const fetchFn = vi.fn()
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValueOnce({ ok: true, text: async () => 'https://0x0.st/xyz.md\n' });
        const result = await uploadLargeDocAsLink('# hello', { fetchFn });
        expect(result.provider).toBe('0x0.st');
        expect(result.url).toBe('https://0x0.st/xyz.md');
    });

    it('rejects empty docs and oversized docs', async () => {
        const fetchFn = vi.fn();
        await expect(uploadLargeDocAsLink('   ', { fetchFn })).rejects.toThrow(/Nothing to upload/);
        await expect(uploadLargeDocAsLink('x'.repeat(PASTE_MAX_BYTES + 1), { fetchFn })).rejects.toThrow(/5 MB/);
        expect(fetchFn).not.toHaveBeenCalled();
    });

    it('classifies CORS/network failures as a file-share fallback', () => {
        expect(classifyPasteError(new TypeError('Failed to fetch'))).toMatch(/CORS/i);
        expect(classifyPasteError({ name: 'AbortError', message: 'aborted' })).toMatch(/timed out/i);
    });

    it('surfaces a CORS fallback when both paste hosts fail to fetch', async () => {
        const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(uploadLargeDocAsLink('# hello', { fetchFn })).rejects.toThrow(/CORS|file share/i);
    });
});
