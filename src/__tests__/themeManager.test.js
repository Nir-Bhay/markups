import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../core/storage/keys.js';
import { storageService } from '../core/storage/index.js';
import { ThemeManager, THEMES } from '../ui/theme/index.js';

describe('ThemeManager persisted preference handling', () => {
    let originalMatchMedia;
    let manager;

    beforeEach(() => {
        localStorage.clear();
        document.body.classList.remove('dark-mode');
        document.body.innerHTML = '';
        originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));
        ThemeManager.instance = null;
        manager = new ThemeManager();
    });

    afterEach(() => {
        if (originalMatchMedia) {
            window.matchMedia = originalMatchMedia;
        } else {
            delete window.matchMedia;
        }
    });

    it('falls back to system when a saved value belongs to another theme namespace', () => {
        storageService.set(STORAGE_KEYS.APP_THEME, 'vs');

        expect(() => manager.initialize()).not.toThrow();
        expect(manager.getTheme()).toBe(THEMES.SYSTEM);
        expect(document.documentElement.dataset.theme).toBe(THEMES.LIGHT);
    });

    it('keeps rendering if an unsupported runtime value is encountered', () => {
        manager.currentTheme = 'vs';

        expect(() => manager._applyTheme()).not.toThrow();
        expect(document.documentElement.dataset.theme).toBe(THEMES.LIGHT);
    });

    it('applies the dark-mode stylesheet scope when dark is selected', () => {
        storageService.set(STORAGE_KEYS.APP_THEME, THEMES.DARK);

        manager.initialize();

        expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    it('lets the modular theme button switch from dark to light', () => {
        document.body.innerHTML = '<button id="dark-mode-toggle" type="button"></button>';
        storageService.set(STORAGE_KEYS.APP_THEME, THEMES.DARK);

        manager.initialize();
        const button = document.getElementById('dark-mode-toggle');
        expect(button.getAttribute('aria-pressed')).toBe('true');

        button.click();

        expect(manager.getTheme()).toBe(THEMES.LIGHT);
        expect(document.body.classList.contains('dark-mode')).toBe(false);
        expect(document.documentElement.dataset.theme).toBe(THEMES.LIGHT);
        expect(button.getAttribute('aria-pressed')).toBe('false');
    });
});
