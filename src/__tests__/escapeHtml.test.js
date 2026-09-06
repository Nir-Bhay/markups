/**
 * Unit tests for src/utils/escape-html.js
 */

import { escapeHtml } from '../utils/escape-html.js';

describe('escapeHtml', () => {
    // Basic escapes
    it('escapes angle brackets', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes double quotes', () => {
        expect(escapeHtml('"onerror"')).toBe('&quot;onerror&quot;');
    });

    it('escapes single quotes', () => {
        expect(escapeHtml("'apos'")).toBe('&#39;apos&#39;');
    });

    it('escapes ampersand', () => {
        expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    });

    // Null/undefined handling
    it('returns empty string for null', () => {
        expect(escapeHtml(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
        expect(escapeHtml(undefined)).toBe('');
    });

    // Numbers pass through
    it('coerces numbers to string', () => {
        expect(escapeHtml(123)).toBe('123');
    });

    // Complex attack vector
    it('escapes img onerror payload', () => {
        expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;');
    });

    // Defense-in-depth characters
    it('escapes backticks', () => {
        expect(escapeHtml('`backtick`')).toBe('&#x60;backtick&#x60;');
    });

    it('escapes slashes', () => {
        expect(escapeHtml('a/b/c')).toBe('a&#x2F;b&#x2F;c');
    });

    it('escapes equals signs', () => {
        expect(escapeHtml('a=b')).toBe('a&#x3D;b');
    });

    // Mixed characters
    it('escapes a fully dangerous attribute value', () => {
        expect(escapeHtml('"><script>alert(1)</script>')).toBe('&quot;&gt;&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });

    // Empty string stays empty
    it('returns empty string for empty input', () => {
        expect(escapeHtml('')).toBe('');
    });

    // Boolean coercion
    it('coerces booleans to string', () => {
        expect(escapeHtml(true)).toBe('true');
        expect(escapeHtml(false)).toBe('false');
    });
});
