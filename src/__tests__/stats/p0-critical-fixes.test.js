// Regression tests for P0 critical fixes:
//  1. stats/index.js — syntax error in dispose()
//  2. goals, linter, shortcuts — debug fetch blocks
//  3. goals, fullscreen, typewriter, tabs — memory leak in dispose()
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Monaco + editor service before any feature module imports them.
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
    default: {
        editor: {
            create: vi.fn(() => ({})),
            setTheme: vi.fn(),
            setModelMarkers: vi.fn(),
            MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 }
        },
        MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 },
        languages: { register: vi.fn() }
    },
    editor: {
        create: vi.fn(() => ({})),
        setTheme: vi.fn(),
        setModelMarkers: vi.fn(),
        MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 }
    },
    MarkerSeverity: { Hint: 1, Info: 2, Warning: 4, Error: 8 }
}));
vi.mock('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution', () => ({}));

// Stub global.fetch so any leftover debug fetch would be caught by these tests.
const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
global.fetch = fetchSpy;

describe('P0-1: stats module loads + dispose() works', () => {
    beforeEach(() => {
        vi.resetModules();
        fetchSpy.mockClear();
    });

    it('module imports without syntax error', async () => {
        // Increased timeout for batch runs; passes in isolation in ~4.5s
        const mod = await import('../../features/stats/index.js');
        expect(mod.statsManager).toBeDefined();
        expect(typeof mod.statsManager.dispose).toBe('function');
    }, 10000);

    it('dispose() does not throw and clears state', async () => {
        const mod = await import('../../features/stats/index.js');
        const inst = mod.statsManager;
        inst.initialized = true;
        inst.subscriptions = { dispose: vi.fn() };
        expect(() => inst.dispose()).not.toThrow();
        expect(inst.initialized).toBe(false);
        expect(inst.stats).toEqual({
            words: 0,
            characters: 0,
            charactersNoSpaces: 0,
            lines: 0,
            paragraphs: 0,
            readingTime: 0
        });
    });

    it('dispose() always calls subscriptions.dispose()', async () => {
        const mod = await import('../../features/stats/index.js');
        const inst = mod.statsManager;
        const subDispose = vi.fn();
        inst.subscriptions = { dispose: subDispose };
        inst.dispose();
        expect(subDispose).toHaveBeenCalledOnce();
    });
});

describe('P0-2: no debug fetch() calls in production code', () => {
    beforeEach(() => {
        vi.resetModules();
        fetchSpy.mockClear();
    });

    it('goals module does not call fetch on import', async () => {
        await import('../../features/goals/index.js');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('linter module does not call fetch on import', async () => {
        await import('../../features/linter/index.js');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('shortcuts module does not call fetch on import', async () => {
        await import('../../services/shortcuts/index.js');
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe('P0-3: dispose() always detaches subscriptions (memory-leak fix)', () => {
    beforeEach(() => vi.resetModules());

    it('goals: subscriptions.dispose() runs even when updateInterval is null', async () => {
        const { goalsManager } = await import('../../features/goals/index.js');
        const sub = { dispose: vi.fn() };
        goalsManager.subscriptions = sub;
        goalsManager.updateInterval = null;
        goalsManager.dispose();
        expect(sub.dispose).toHaveBeenCalled();
    });

    it('fullscreen: subscriptions.dispose() runs even when isEnabled is false', async () => {
        const mod = await import('../../features/fullscreen/index.js');
        const inst = mod.fullscreenManager || mod.default;
        if (!inst) throw new Error('fullscreenManager not exported');
        const sub = { dispose: vi.fn() };
        inst.subscriptions = sub;
        inst.isEnabled = false;
        if (typeof inst.dispose === 'function') {
            inst.dispose();
            expect(sub.dispose).toHaveBeenCalled();
        }
    });

    it('typewriter: subscriptions.dispose() runs even when cursorListener is null', async () => {
        const mod = await import('../../features/typewriter/index.js');
        const inst = mod.typewriterManager || mod.default;
        if (!inst) throw new Error('typewriterManager not exported');
        const sub = { dispose: vi.fn() };
        inst.subscriptions = sub;
        inst.cursorListener = null;
        if (typeof inst.dispose === 'function') {
            inst.dispose();
            expect(sub.dispose).toHaveBeenCalled();
        }
    });

    it('tabs: subscriptions.dispose() runs even when _saveTimeout is null', async () => {
        const mod = await import('../../features/tabs/index.js');
        const inst = mod.tabsManager || mod.default;
        if (!inst) throw new Error('tabsManager not exported');
        const sub = { dispose: vi.fn() };
        inst.subscriptions = sub;
        inst._saveTimeout = null;
        if (typeof inst.dispose === 'function') {
            inst.dispose();
            expect(sub.dispose).toHaveBeenCalled();
        }
    });
});
