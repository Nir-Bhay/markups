import { beforeEach, describe, expect, it, vi } from 'vitest';

const { editor } = vi.hoisted(() => ({
    editor: {
        updateOptions: vi.fn(),
        layout: vi.fn(),
        focus: vi.fn(),
    },
}));

vi.mock('../core/editor/index.js', () => ({
    editorService: {
        getEditor: () => editor,
        focus: () => editor.focus(),
    },
}));

import { FocusManager } from '../features/focus/index.js';

describe('FocusManager', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <button id="focus-button"></button>
            <div id="focus-dock" hidden>
                <button id="focus-zoom-out"></button>
                <button id="focus-zoom-reset"></button>
                <button id="focus-zoom-in"></button>
                <button id="focus-exit"></button>
            </div>
        `;
        document.body.className = '';
        editor.updateOptions.mockClear();
        editor.layout.mockClear();
        editor.focus.mockClear();
    });

    it('focuses the editor only and clamps zoom controls', () => {
        const manager = new FocusManager();
        manager.initialize('#focus-button');
        manager.enable();

        expect(document.body.classList.contains('focus-mode')).toBe(true);
        expect(document.getElementById('focus-dock').hidden).toBe(false);
        expect(document.getElementById('focus-button').getAttribute('aria-pressed')).toBe('true');
        expect(editor.focus).toHaveBeenCalled();

        expect(manager.setZoom(999)).toBe(32);
        expect(manager.setZoom(1)).toBe(10);
        expect(editor.updateOptions).toHaveBeenCalledWith({ fontSize: 10 });

        manager.disable();
        expect(document.body.classList.contains('focus-mode')).toBe(false);
        expect(document.getElementById('focus-dock').hidden).toBe(true);
        expect(document.getElementById('focus-button').getAttribute('aria-pressed')).toBe('false');
    });
});
