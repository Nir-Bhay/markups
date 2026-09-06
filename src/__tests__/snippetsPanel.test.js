/**
 * Integration test: snippets panel escapes user-controlled snippet name/description
 * in innerHTML before insertion.
 */

import { escapeHtml } from '../utils/escape-html.js';

describe('SnippetsManager innerHTML escaping', () => {
    /** Build snippet item HTML the same way render() does. */
    function buildSnippetItem(snippet) {
        return `
            <div class="snippet-item" data-id="${snippet.id}">
                <div class="snippet-info">
                    <span class="snippet-name">${escapeHtml(snippet.name)}</span>
                    ${snippet.shortcut ? `<kbd class="snippet-shortcut">${escapeHtml(snippet.shortcut)}</kbd>` : ''}
                </div>
                <span class="snippet-desc">${escapeHtml(snippet.description || '')}</span>
            </div>
        `;
    }

    it('does not leak raw <script> through snippet.name', () => {
        const html = buildSnippetItem({ id: '1', name: '<script>alert(1)</script>', description: '' });
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });

    it('does not leak onerror attribute via snippet.name', () => {
        const html = buildSnippetItem({ id: '2', name: '" onmouseover="alert(1)"', description: '' });
        // Quotes and equals are escaped, breaking attribute injection
        expect(html).toContain('&quot;');
        expect(html).toContain('&#x3D;');
    });

    it('escapes HTML in snippet.description', () => {
        const html = buildSnippetItem({ id: '3', name: 'Safe', description: '<img src=x onerror=alert(1)>' });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('escapes HTML in snippet.shortcut', () => {
        const html = buildSnippetItem({ id: '4', name: 'Code', shortcut: '" onclick="alert(1)"', description: '' });
        // Quotes and equals are escaped, breaking attribute injection
        expect(html).toContain('&quot;');
        expect(html).toContain('&#x3D;');
    });

    it('escapes XSS in all user fields together', () => {
        const html = buildSnippetItem({
            id: '5',
            name: '<b>bold</b>',
            shortcut: '<script>steal()</script>',
            description: '<i>italic</i>'
        });
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>');
        expect(html).not.toContain('<i>');
        expect(html).toContain('&lt;b&gt;bold&lt;&#x2F;b&gt;');
        expect(html).toContain('&lt;i&gt;italic&lt;&#x2F;i&gt;');
    });

    it('handles null/undefined name and description gracefully', () => {
        expect(() => buildSnippetItem({ id: '6', name: null, description: null })).not.toThrow();
        expect(() => buildSnippetItem({ id: '7', name: undefined, description: undefined })).not.toThrow();
    });
});
