/**
 * Integration test: search panel escapes user-controlled search/replace terms
 * in innerHTML before insertion.
 */

import { escapeHtml } from '../utils/escape-html.js';

describe('SearchManager innerHTML escaping', () => {
    /** Build the search panel innerHTML the same way render() does, with a given term. */
    function buildSearchHtml(searchTerm, replaceTerm, showReplace = true) {
        const term = searchTerm ?? '';
        const rterm = replaceTerm ?? '';
        return `
            <div class="search-panel">
                <div class="search-row">
                    <div class="search-input-wrapper">
                        <input type="text"
                               class="search-input"
                               placeholder="Search..."
                               value="${escapeHtml(term)}">
                        <span class="search-count"></span>
                    </div>
                </div>
                ${showReplace ? `
                <div class="replace-row">
                    <input type="text"
                           class="replace-input"
                           placeholder="Replace with..."
                           value="${escapeHtml(rterm)}">
                    <button class="replace-btn" data-action="replace">Replace</button>
                </div>
                ` : ''}
            </div>
        `;
    }

    it('does not leak raw <script> through searchTerm into innerHTML', () => {
        const html = buildSearchHtml('<script>alert(1)</script>');
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });

    it('does not leak onerror attribute via searchTerm', () => {
        const html = buildSearchHtml('" onerror="alert(1)"');
        expect(html).not.toContain('onerror=alert');
        expect(html).toContain('&quot;');
    });

    it('does not leak raw <script> through replaceTerm into innerHTML', () => {
        const html = buildSearchHtml('safe', '<script>alert(2)</script>');
        expect(html).not.toContain('<script>alert(2)</script>');
        expect(html).toContain('&lt;script&gt;alert(2)&lt;&#x2F;script&gt;');
    });

    it('handles null searchTerm without throwing', () => {
        expect(() => buildSearchHtml(null)).not.toThrow();
        const html = buildSearchHtml(null);
        expect(html).toContain('value=""');
    });

    it('handles undefined replaceTerm without throwing', () => {
        expect(() => buildSearchHtml('foo', undefined)).not.toThrow();
    });
});
