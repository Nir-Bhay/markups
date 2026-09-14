import { describe, expect, it } from 'vitest';
import { createLineDiff } from '../features/ai-writer/diff.js';

describe('AI writer line diff', () => {
    it('keeps unchanged lines and marks additions/removals', () => {
        expect(createLineDiff('# Title\nOld text', '# Title\nNew text')).toEqual([
            { type: 'same', text: '# Title' },
            { type: 'removed', text: 'Old text' },
            { type: 'added', text: 'New text' }
        ]);
    });

    it('handles empty sides', () => {
        expect(createLineDiff('', 'Added')).toEqual([
            { type: 'removed', text: '' },
            { type: 'added', text: 'Added' }
        ]);
    });
});
