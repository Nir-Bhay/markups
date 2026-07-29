/**
 * Test Setup — fake-indexeddb for Dexie.js testing in Node
 */
import 'fake-indexeddb/auto';

// KaTeX warns in quirks mode. Give happy-dom an HTML5 document shell so
// rendering-related tests run under browser-like standards mode.
if (typeof document !== 'undefined') {
    if (document.compatMode !== 'CSS1Compat') {
        document.open();
        document.write('<!doctype html><html><head></head><body></body></html>');
        document.close();
    }

    // happy-dom can still report BackCompat after document.write(). KaTeX only needs
    // the standards-mode signal for tests, so normalize it when the property is configurable.
    if (document.compatMode !== 'CSS1Compat') {
        Object.defineProperty(document, 'compatMode', {
            value: 'CSS1Compat',
            configurable: true
        });
    }
}
