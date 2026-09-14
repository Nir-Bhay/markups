import { beforeEach, describe, expect, it } from 'vitest';
import {
    applyToolbarDensity,
    resetToolbarDensityForTests,
} from '../features/toolbar/density.js';

describe('responsive toolbar density', () => {
    beforeEach(() => {
        resetToolbarDensityForTests();
        document.body.innerHTML = `
            <div id="toolbar">
                <div class="toolbar-group toolbar-tools-group"></div>
                <span class="toolbar-secondary-divider"></span>
                <div class="toolbar-group toolbar-modes-group"></div>
                <div class="toolbar-group toolbar-extras-group"></div>
                <button id="toolbar-density-toggle"></button>
            </div>
    `;
    });

    it('hides secondary groups in compact mode and exposes them when expanded', () => {
        const toolbar = document.getElementById('toolbar');
        const trigger = document.getElementById('toolbar-density-toggle');

        applyToolbarDensity('compact', { persist: false });
        expect(toolbar.classList.contains('toolbar-compact')).toBe(true);
        expect(document.querySelector('.toolbar-tools-group').classList.contains('toolbar-density-hidden')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        applyToolbarDensity('expanded', { persist: false });
        expect(toolbar.classList.contains('toolbar-expanded')).toBe(true);
        expect(document.querySelector('.toolbar-tools-group').classList.contains('toolbar-density-hidden')).toBe(false);
        expect(trigger.getAttribute('aria-label')).toBe('Collapse toolbar');
    });
});
