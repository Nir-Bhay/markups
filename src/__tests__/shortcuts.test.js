import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShortcutsManager, DEFAULT_SHORTCUTS } from '../services/shortcuts/index.js';

describe('services/shortcuts defaults', () => {
    it('ships zero conflicting default combos', () => {
        const seen = new Map();
        for (const [action, s] of Object.entries(DEFAULT_SHORTCUTS)) {
            const key = `${!!s.ctrl}+${!!s.shift}+${!!s.alt}+${String(s.key).toLowerCase()}`;
            expect(seen.has(key), `${action} conflicts with ${seen.get(key)}`).toBe(false);
            seen.set(key, action);
        }
    });

    it('keeps link on Ctrl+K and moves reset to Ctrl+Shift+K', () => {
        expect(DEFAULT_SHORTCUTS.link).toMatchObject({ key: 'k', ctrl: true });
        expect(DEFAULT_SHORTCUTS.reset.shift).toBe(true);
    });

    it('setShortcut still rejects new conflicts', () => {
        ShortcutsManager.instance = null;
        const manager = new ShortcutsManager();
        expect(() => manager.setShortcut('cycleTheme', { key: 'k', ctrl: true })).toThrow(/conflicts/);
    });
});

describe('services/shortcuts dispose', () => {
    it('removes the keydown listener it added', () => {
        ShortcutsManager.instance = null;
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const manager = new ShortcutsManager();
        manager.initialize();
        const bound = manager._boundKeyDown;
        expect(bound).toBeTruthy();
        expect(add).toHaveBeenCalledWith('keydown', bound);
        manager.dispose();
        expect(remove).toHaveBeenCalledWith('keydown', bound);
        add.mockRestore();
        remove.mockRestore();
    });
});
