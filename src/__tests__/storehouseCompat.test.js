// Regression tests for utils/storehouse-compat.js — the localStorage/sessionStorage
// shim that replaces storehouse-js. Guards the MD5 key hashing (storage-key byte
// compatibility with the original library) and the setItem/getItem round trip,
// which previously threw at init ("r is not iterable") and aborted app bootstrap.
import { describe, it, expect, beforeEach } from 'vitest';

import Storehouse from '../utils/storehouse-compat.js';

describe('utils/storehouse-compat', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it('round-trips a value through setItem/getItem', () => {
        Storehouse.setItem('ns', 'k', { hello: 'world' });
        expect(Storehouse.getItem('ns', 'k')).toEqual({ hello: 'world' });
    });

    it('returns undefined for missing keys', () => {
        expect(Storehouse.getItem('ns', 'missing')).toBeUndefined();
    });

    it('deleteItem removes the stored value', () => {
        Storehouse.setItem('ns', 'k', 'v');
        Storehouse.deleteItem('ns', 'k');
        expect(Storehouse.getItem('ns', 'k')).toBeUndefined();
    });

    it('expired entries are dropped on read', () => {
        const soon = new Date(Date.now() - 1000);
        Storehouse.setItem('ns', 'expired', 'v', soon);
        expect(Storehouse.getItem('ns', 'expired')).toBeUndefined();
    });

    it('hashes keys with the standard MD5 of `${namespace}-${key}`', () => {
        // Reference values computed with an independent MD5 implementation. If the
        // shim ever deviates, pre-existing storehouse-js data becomes unreadable.
        const cases = [
            ['com.markdownlivepreview', 'toc_sidebar_visible', '7aefc34c73e12c131d2852aebbae9e21'],
            ['com.markdownlivepreview', 'last_state', '27cf344e7411b69e8a80b95a99c321e7'],
            ['ns1', 'key1', '4e8fe84c0a03dc10b49a507c3fb1fe9e'],
            ['', '', '336d5ebc5436534e61d16e63ddfca327'] // MD5 of "-"
        ];
        for (const [namespace, key, expected] of cases) {
            Storehouse.setItem(namespace, key, 'v');
            let writtenKey = null;
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                if (k && !k.startsWith('vitest_')) {
                    writtenKey = k;
                    break;
                }
            }
            expect(writtenKey).toBeTruthy();
            expect(writtenKey).toBe(expected);
            sessionStorage.clear();
        }
    });

    it('getInstance exposes the namespace-scoped API', () => {
        const store = Storehouse.getInstance('scoped');
        store.setItem('k', 42);
        expect(store.getItem('k')).toBe(42);
        expect(Storehouse.getItem('scoped', 'k')).toBe(42);
    });
});
