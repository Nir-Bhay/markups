import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

// Exercise the actual production callback without booting Monaco or duplicating its logic.
const main = readFileSync('src/main.js', 'utf8');
const start = main.indexOf('const applyMarkdownFromPreviewEdit =');
const end = main.indexOf('const setupLivePreviewEdit =', start);
if (start < 0 || end < 0) throw new Error('Production preview callback was not found');
const source = main.slice(start, end);

function harness(throws = false) {
    const context = {
        editor: {
            getValue: () => 'old',
            getModel: () => ({ getFullModelRange: () => ({}) }),
            executeEdits: vi.fn(() => { if (throws) throw new Error('edit failed'); })
        },
        isApplyingPreviewEdit: false, hasEdited: false,
        setHasEdited: vi.fn(), updateStats: vi.fn(), trackEditorStartOnce: vi.fn()
    };
    runInNewContext(source + '\nglobalThis.apply = applyMarkdownFromPreviewEdit;', context);
    return context;
}

describe('document-mode activation', () => {
    it('tracks a deliberate changed preview edit after the editor update succeeds', () => {
        const context = harness();
        context.apply('new');
        expect(context.editor.executeEdits).toHaveBeenCalledOnce();
        expect(context.trackEditorStartOnce).toHaveBeenCalledOnce();
        expect(context.isApplyingPreviewEdit).toBe(false);
        expect(context.updateStats).toHaveBeenCalledWith('new');
    });

    it('does not activate passive, invalid or unavailable-editor callbacks', () => {
        const context = harness();
        context.apply('old');
        context.apply(null);
        context.editor = null;
        context.apply('new');
        expect(context.trackEditorStartOnce).not.toHaveBeenCalled();
    });

    it('resets the applying flag without reporting success when editor update throws', () => {
        const context = harness(true);
        expect(() => context.apply('new')).toThrow('edit failed');
        expect(context.isApplyingPreviewEdit).toBe(false);
        expect(context.trackEditorStartOnce).not.toHaveBeenCalled();
        expect(context.setHasEdited).not.toHaveBeenCalled();
    });
});
