/**
 * Test Setup — fake-indexeddb for Dexie.js testing in Node
 */
import 'fake-indexeddb/auto';

// Polyfill localStorage only when it is unavailable or throws a security error.
// This avoids failures like:
//   SecurityError: Cannot initialize local storage without a `--localstorage-file` path
let localStorageAvailable = false;
try {
    localStorageAvailable = typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function';
} catch {
    localStorageAvailable = false;
}

if (!localStorageAvailable) {
    const storage = new Map();
    const localStorageProxy = {
        getItem(key) {
            return storage.has(key) ? storage.get(key) : null;
        },
        setItem(key, value) {
            storage.set(key, String(value));
        },
        removeItem(key) {
            storage.delete(key);
        },
        clear() {
            storage.clear();
        },
        get length() {
            return storage.size;
        },
        key(index) {
            return [...storage.keys()][index] ?? null;
        }
    };
    globalThis.localStorage = localStorageProxy;
}

// KaTeX warns in quirks mode. Give the DOM an HTML5 document shell so
// rendering-related tests run under browser-like standards mode.
if (typeof document !== 'undefined') {
    if (document.compatMode !== 'CSS1Compat') {
        document.open();
        document.write('<!doctype html><html><head></head><body></body></html>');
        document.close();
    }

    if (document.compatMode !== 'CSS1Compat') {
        Object.defineProperty(document, 'compatMode', {
            value: 'CSS1Compat',
            configurable: true
        });
    }
}
