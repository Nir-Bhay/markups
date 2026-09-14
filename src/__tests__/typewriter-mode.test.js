import { beforeEach, describe, expect, it, vi } from 'vitest';

const { editor } = vi.hoisted(() => ({
    editor: {
        getPosition: () => ({ lineNumber: 4 }),
        revealLineInCenter: vi.fn(),
        onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    },
}));

vi.mock('../core/editor/index.js', () => ({
    editorService: {
        getEditor: () => editor,
    },
}));

import { TypewriterManager } from '../features/typewriter/index.js';

describe('TypewriterManager', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button id="typewriter-button"></button>';
        editor.revealLineInCenter.mockClear();
        editor.onDidChangeCursorPosition.mockClear();
    });

    it('explains and toggles the active-line centering behavior once', () => {
        const manager = new TypewriterManager();
        manager.initialize('#typewriter-button');
        manager.enable();

        const button = document.getElementById('typewriter-button');
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Exit Typewriter Mode');
        expect(button.dataset.tooltipDescription).toContain('active line');
        expect(editor.revealLineInCenter).toHaveBeenCalledWith(4);
        expect(editor.onDidChangeCursorPosition).toHaveBeenCalledTimes(1);

        manager.disable();
        expect(button.getAttribute('aria-pressed')).toBe('false');
    });
});
