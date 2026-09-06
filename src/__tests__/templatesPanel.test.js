/**
 * Integration test: templates panel escapes user-controlled template name/description
 * in innerHTML before insertion.
 */

import { escapeHtml } from '../utils/escape-html.js';

describe('TemplatesManager innerHTML escaping', () => {
    /** Build template card HTML the same way render() does. */
    function buildTemplateCard(template) {
        return `
            <div class="template-card" data-id="${template.id}">
                <div class="template-info">
                    <span class="template-name">${escapeHtml(template.name)}</span>
                    <span class="template-desc">${escapeHtml(template.description || '')}</span>
                </div>
            </div>
        `;
    }

    it('does not leak raw <script> through template.name', () => {
        const html = buildTemplateCard({ id: '1', name: '<script>alert(1)</script>', description: '' });
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
    });

    it('does not leak onerror attribute via template.name', () => {
        const html = buildTemplateCard({ id: '2', name: '" onmouseover="alert(1)"', description: '' });
        // Quotes and equals are escaped, so the attribute cannot be injected
        expect(html).toContain('&quot;');
        expect(html).toContain('&#x3D;');
    });

    it('escapes HTML in template.description', () => {
        const html = buildTemplateCard({ id: '3', name: 'Safe', description: '<img src=x onerror=alert(1)>' });
        expect(html).not.toContain('<img');
        expect(html).toContain('&lt;img');
    });

    it('escapes XSS in both name and description together', () => {
        const html = buildTemplateCard({
            id: '4',
            name: '<b>bold</b>',
            description: '<i>italic</i><script>steal()</script>'
        });
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>');
        expect(html).not.toContain('<i>');
        expect(html).toContain('&lt;b&gt;bold&lt;&#x2F;b&gt;');
        expect(html).toContain('&lt;i&gt;italic&lt;&#x2F;i&gt;');
    });

    it('handles null/undefined name gracefully', () => {
        expect(() => buildTemplateCard({ id: '5', name: null, description: 'desc' })).not.toThrow();
        expect(() => buildTemplateCard({ id: '6', name: undefined, description: 'desc' })).not.toThrow();
    });
});
