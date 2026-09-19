import { describe, expect, it, vi } from 'vitest';
import Storehouse from '../utils/storehouse-compat.js';

describe('Storehouse compatibility layer', () => {
    it('reports a failed persistent write instead of hiding quota errors', () => {
        const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            const error = new Error('Quota exceeded');
            error.name = 'QuotaExceededError';
            throw error;
        });

        try {
            expect(Storehouse.setItem('test', 'document', { content: 'draft' }, new Date(2099, 1, 1))).toBe(false);
        } finally {
            setItem.mockRestore();
        }
    });

    it('reports successful persistent writes', () => {
        expect(Storehouse.setItem('test', 'document', { content: 'draft' }, new Date(2099, 1, 1))).toBe(true);
    });
});
