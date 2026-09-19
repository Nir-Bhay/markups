/**
 * Tests for import guards (Phase 4.3): extension allowlist, URL scheme gate,
 * remote size cap. importFile's happy path needs FileReader; rejection paths
 * return before any I/O and are fully covered here.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { importManager } from '../features/import/index.js';
import { eventBus, EVENTS } from '../utils/eventBus.js';

function collectToasts() {
    const messages = [];
    const off = eventBus.on(EVENTS.TOAST_SHOW, (data) => messages.push(data));
    return { messages, off };
}

describe('features/import guards (Phase 4.3)', () => {
    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects non-allowlisted extensions without reading', () => {
        const { messages, off } = collectToasts();
        importManager.importFile({ name: 'evil.exe', size: 100 });
        off();
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('error');
        expect(messages[0].message).toMatch(/not a supported type/);
    });

    it('accepts allowlisted extensions case-insensitively (size gate next)', () => {
        const { messages, off } = collectToasts();
        // 6 MB .MD passes the type gate, fails the size gate — proves order.
        importManager.importFile({ name: 'BIG.MD', size: 6 * 1024 * 1024 });
        off();
        expect(messages).toHaveLength(1);
        expect(messages[0].message).toMatch(/too large/);
    });

    it('rejects non-http(s) URLs without fetching', async () => {
        const { messages, off } = collectToasts();
        await importManager.importFromURL('javascript:alert(1)');
        await importManager.importFromURL('file:///etc/passwd');
        off();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(messages).toHaveLength(2);
        expect(messages[0].message).toMatch(/Only http\(s\)/);
    });

    it('rejects oversized remote content', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            headers: { get: () => null },
            text: async () => 'x'.repeat(6 * 1024 * 1024)
        });
        const { messages, off } = collectToasts();
        await importManager.importFromURL('https://example.com/big.md');
        off();
        expect(messages.some((m) => m.type === 'error')).toBe(true);
    });
});
