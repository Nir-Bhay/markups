import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canNativeShareFiles, toShareFile, shareFileOrDownload } from '../services/share/fileShare.js';

describe('services/share/fileShare', () => {
    const originalNavigator = globalThis.navigator;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true });
        vi.restoreAllMocks();
    });

    it('builds a markdown File with safe filename', () => {
        const file = toShareFile({ content: '# hi', filename: 'notes' });
        expect(file.name).toBe('notes.md');
        expect(file.size).toBeGreaterThan(0);
    });

    it('reports no native share when API is missing', () => {
        Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
        expect(canNativeShareFiles(null)).toBe(false);
    });

    it('uses web-share when available', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(globalThis, 'navigator', {
            value: { share, canShare: () => true },
            configurable: true
        });
        const result = await shareFileOrDownload({ content: 'hello', filename: 'doc.md' });
        expect(result.method).toBe('web-share');
        expect(share).toHaveBeenCalledOnce();
    });

    it('falls back to download when native share is unavailable', async () => {
        Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
        const createObjectURL = vi.fn(() => 'blob:mock');
        const revokeObjectURL = vi.fn();
        globalThis.URL.createObjectURL = createObjectURL;
        globalThis.URL.revokeObjectURL = revokeObjectURL;
        const click = vi.fn();
        const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
        const createElement = vi.spyOn(document, 'createElement').mockImplementation(() => ({ click, set href(v) {}, set download(v) {} }));

        const result = await shareFileOrDownload({ content: 'hello', filename: 'doc.md' });
        expect(result.method).toBe('download');
        expect(click).toHaveBeenCalled();

        createElement.mockRestore();
        appendChild.mockRestore();
        removeChild.mockRestore();
    });
});
