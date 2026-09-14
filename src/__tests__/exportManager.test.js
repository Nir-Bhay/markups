import { describe, it, expect, vi } from 'vitest';
import { exportManager } from '../services/export/index.js';
import { markdownToPlainText } from '../services/export/txt.js';

describe('services/export manager wiring (reuse, not rebuild)', () => {
    it('exposes docx, txt, and print alongside pdf/html/markdown', () => {
        for (const fn of ['toPDF', 'toHTML', 'toMarkdown', 'toDocx', 'toTxt', 'print', 'copyAsHTML']) {
            expect(typeof exportManager[fn], fn).toBe('function');
        }
    });

    it('toTxt returns the canonical converter output', async () => {
        const md = '# Hi\nSome **bold** text.';
        const out = await exportManager.toTxt(md, 'hi.txt', { wordWrap: false });
        expect(out).toBe(markdownToPlainText(md, { wordWrap: false }));
        expect(URL.revokeObjectURL).toBeDefined();
    });

    it('print returns false when popups are blocked', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValueOnce(null);
        try {
            expect(await exportManager.print('# Hi', 'doc')).toBe(false);
        } finally {
            open.mockRestore();
        }
    });
});
