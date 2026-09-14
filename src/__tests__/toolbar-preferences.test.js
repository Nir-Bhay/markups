import { beforeEach, describe, expect, it } from 'vitest';
import { ToolbarPreferences } from '../features/toolbar/preferences.js';

describe('ToolbarPreferences', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('persists versioned visibility and density preferences', () => {
        const prefs = new ToolbarPreferences();
        prefs.setHiddenButtons(['tools', 'tools', 'modes']);
        prefs.setDensity('expanded');

        const reloaded = new ToolbarPreferences();
        expect(reloaded.hiddenButtons).toEqual(['tools', 'modes']);
        expect(reloaded.density).toBe('expanded');
        expect(reloaded.version).toBe(2);
    });

    it('falls back safely and resets to the default layout', () => {
        localStorage.setItem('markups_toolbar_prefs', '{bad json');
        const prefs = new ToolbarPreferences();
        expect(prefs.hiddenButtons).toEqual([]);
        expect(prefs.density).toBe('auto');

        prefs.setHiddenButtons(['tools']);
        prefs.resetToolbar();
        expect(prefs.hiddenButtons).toEqual([]);
        expect(prefs.density).toBe('auto');
    });
});
