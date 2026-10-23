import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ create: vi.fn(), markers: vi.fn() }));
vi.mock('../features/spellcheck/dictionary.js', () => ({ createDictionary: mocks.create }));
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
    editor: { setModelMarkers: mocks.markers, getModelMarkers: () => [] }
}));

beforeEach(() => {
    vi.resetModules();
    mocks.create.mockReset();
    mocks.markers.mockClear();
    localStorage.clear();
    vi.stubGlobal('requestIdleCallback', (callback) => callback());
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
});

describe('optional spellcheck dictionary loading', () => {
    it('shares initialization and reuses the loaded dictionary', async () => {
        const dictionary = { check: () => true };
        mocks.create.mockReturnValue(dictionary);
        const { loadDictionary } = await import('../features/spellcheck/index.js');
        const first = loadDictionary();
        const second = loadDictionary();
        expect(first).toBe(second);
        expect(await first).toBe(dictionary);
        expect(await loadDictionary()).toBe(dictionary);
        expect(mocks.create).toHaveBeenCalledOnce();
    });

    it('retries a failed initialization instead of retaining a rejected promise', async () => {
        const dictionary = { check: () => true };
        mocks.create.mockImplementationOnce(() => { throw new Error('initialization failed'); })
            .mockReturnValueOnce(dictionary);
        const { loadDictionary } = await import('../features/spellcheck/index.js');
        await expect(loadDictionary()).rejects.toThrow('initialization failed');
        await expect(loadDictionary()).resolves.toBe(dictionary);
        expect(mocks.create).toHaveBeenCalledTimes(2);
    });

    it('does not initialize when disabled, but schedules loading on toggle-on', async () => {
        vi.useFakeTimers();
        localStorage.setItem('markups-spellcheck', 'off');
        mocks.create.mockReturnValue({ check: () => true });
        const { setupSpellcheck, toggleSpellcheck } = await import('../features/spellcheck/index.js');
        setupSpellcheck({ onDidChangeModelContent: vi.fn(), getModel: () => null });
        await vi.advanceTimersByTimeAsync(500);
        expect(mocks.create).not.toHaveBeenCalled();
        toggleSpellcheck();
        await vi.advanceTimersByTimeAsync(500);
        await vi.dynamicImportSettled();
        expect(mocks.create).toHaveBeenCalledOnce();
    });
});
