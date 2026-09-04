import Storehouse from '../utils/storehouse-compat.js';

describe('Storehouse compatibility shim', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('stores and retrieves values using the legacy key format', () => {
        Storehouse.setItem('markups', 'theme', 'dark');

        expect(Storehouse.getItem('markups', 'theme')).toBe('dark');
    });
});
