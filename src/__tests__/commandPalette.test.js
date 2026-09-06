/**
 * Command Palette tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to mock DOM for these tests since they import DOM-modifying modules.
// Use jsdom environment (configured in vitest.config.js).

describe('Command Palette registry', () => {
    let COMMANDS;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import('../features/command-palette/registry.js');
        COMMANDS = mod.COMMANDS;
    });

    it('exports at least 15 commands', () => {
        expect(Array.isArray(COMMANDS)).toBe(true);
        expect(COMMANDS.length).toBeGreaterThanOrEqual(15);
    });

    it('each command has required fields', () => {
        COMMANDS.forEach((cmd) => {
            expect(typeof cmd.id).toBe('string');
            expect(typeof cmd.label).toBe('string');
            expect(typeof cmd.group).toBe('string');
            expect(typeof cmd.action).toBe('function');
        });
    });

    it('has duplicate-free ids', () => {
        const ids = COMMANDS.map((c) => c.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('includes expected command labels', () => {
        const labels = COMMANDS.map((c) => c.label.toLowerCase());
        const expected = [
            'export as pdf',
            'export as html',
            'toggle dark mode',
            'open settings',
            'new tab',
            'close tab',
            'toggle word wrap',
            'toggle typewriter',
            'toggle focus mode',
            'toggle fullscreen',
            'toggle minimap',
            'open templates',
            'open snippets',
            'open search',
            'insert date'
        ];
        expected.forEach((exp) => {
            expect(labels).toContain(exp);
        });
    });
});

describe('Command Palette UI', () => {
    let render, open, close, dispose, COMMANDS;

    beforeEach(async () => {
        vi.resetModules();
        const mod = await import('../features/command-palette/ui.js');
        render = mod.render;
        open = mod.open;
        close = mod.close;
        dispose = mod.dispose;
    });

    it('renders a modal into document.body', () => {
        render();
        const modal = document.querySelector('.command-palette-modal');
        expect(modal).not.toBeNull();
        dispose();
    });

    it('opens and closes without throwing', async () => {
        const ui = await import('../features/command-palette/ui.js');
        ui.render();
        expect(() => ui.open()).not.toThrow();
        expect(() => ui.close()).not.toThrow();
        expect(() => ui.dispose()).not.toThrow();
    });
});
