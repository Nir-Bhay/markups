import { describe, it, expect } from 'vitest';
import { fuzzyScore, filterPalette, buildPaletteItems } from '../features/command-palette/index.js';

const ITEMS = [
    { id: 'cmd:focus', label: 'Focus Mode', keywords: ['focus'], kind: 'command' },
    { id: 'file:1', label: 'Atlas Guide', keywords: ['file'], kind: 'file' }
];

describe('features/command-palette core', () => {
    it('scores prefix and word-boundary matches higher', () => {
        expect(fuzzyScore('Focus Mode', 'foc')).toBeGreaterThan(fuzzyScore('Office Work', 'foc'));
        expect(fuzzyScore('Anything', '')).toBe(0);
        expect(fuzzyScore('Atlas', 'zzz')).toBe(-1);
    });

    it('filters best-first and caps results', () => {
        const out = filterPalette(ITEMS, 'foc');
        expect(out[0].id).toBe('cmd:focus');
        expect(filterPalette(ITEMS, 'zzz')).toEqual([]);
        expect(filterPalette(ITEMS, '', { limit: 1 })).toHaveLength(1);
    });

    it('builds file items before commands', () => {
        const items = buildPaletteItems([{ id: 7, title: 'Notes' }], []);
        expect(items[0]).toMatchObject({ kind: 'file', noteId: 7 });
        expect(items.some(i => i.kind === 'command')).toBe(true);
    });
});
