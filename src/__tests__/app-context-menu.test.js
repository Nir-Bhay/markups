// Tests for features/app-context-menu/index.js — DOM lifecycle, no Monaco.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Lightweight mock for clipboard/utils that this module imports.
vi.mock('../../utils/clipboard.js', () => ({
    copyToClipboard: vi.fn(),
    readFromClipboard: vi.fn(() => Promise.resolve(''))
}));

import { AppContextMenuManager } from '../features/app-context-menu/index.js';

describe('features/app-context-menu', () => {
    let manager;

    beforeEach(() => {
        vi.resetModules();
        manager = new AppContextMenuManager();
    });

    it('is a singleton', () => {
        const again = new AppContextMenuManager();
        expect(again).toBe(manager);
    });

    it('initialize() creates menu element and sets aria-hidden', () => {
        manager.initialize();
        expect(manager.menu).not.toBeNull();
        expect(manager.menu.className).toBe('app-context-menu');
        expect(manager.menu.getAttribute('aria-hidden')).toBe('true');
        expect(manager.menu.hidden).toBe(true);
        expect(manager.initialized).toBe(true);
    });

    it('initialize() is idempotent', () => {
        manager.initialize();
        const first = manager.menu;
        manager.initialize();
        expect(manager.menu).toBe(first);
    });

    it('dispose() closes and resets initialized flag', () => {
        manager.initialize();
        manager.dispose();
        expect(manager.initialized).toBe(false);
    });
});
