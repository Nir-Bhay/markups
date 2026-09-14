import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchEmojis } from '../features/toolbar/constants.js';

const { editor } = vi.hoisted(() => ({
    editor: {
        getSelection: () => ({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1,
        }),
        executeEdits: vi.fn(),
        focus: vi.fn(),
    },
}));

vi.mock('../core/editor/index.js', () => ({
    editorService: {
        getEditor: () => editor,
    },
}));

import { insertTable } from '../features/toolbar/utils.js';

describe('toolbar table, color, and emoji contracts', () => {
    beforeEach(() => editor.executeEdits.mockClear());

    it('searches emoji by named suggestions across categories', () => {
        expect(searchEmojis('smile')).toContain('😄');
        expect(searchEmojis('does-not-exist')).toEqual([]);
    });

    it('keeps table insertion bounded and supports header-label preference', () => {
        insertTable(2, 2, { includeHeader: false });
        const inserted = editor.executeEdits.mock.calls[0][1][0].text;
        expect(inserted).toContain('| Cell 1 | Cell 2 |');
        expect(inserted.split('\n')).toHaveLength(5);
    });
});
