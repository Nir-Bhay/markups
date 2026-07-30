import { describe, expect, it } from 'vitest';
import {
    ensurePreviewLinksOpenInNewTab,
    fallbackSanitizeHtml,
    sanitizePreviewHtml,
    shouldOpenPreviewLinkInNewTab
} from '../utils/sanitize.js';

describe('shared preview sanitizer', () => {
    it('strips dangerous tags and attributes while preserving safe preview markup', () => {
        const html = [
            '<p><a href="https://example.com" target="_blank">safe</a></p>',
            '<script>alert(1)</script>',
            '<img src="x" onerror="alert(1)" data-secret="1" style="color:red">',
            '<video controls src="https://example.com/demo.mp4"></video>'
        ].join('');

        const sanitized = sanitizePreviewHtml(html);

        expect(sanitized).toContain('href="https://example.com"');
        expect(sanitized).toContain('target="_blank"');
        expect(sanitized).toContain('rel="noopener noreferrer"');
        expect(sanitized).toContain('<video');
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('data-secret');
        expect(sanitized).not.toContain('style=');
    });

    it('forces external links to open in a new tab', () => {
        const sanitized = sanitizePreviewHtml('<p><a href="https://example.com/docs">docs</a></p>');
        expect(sanitized).toContain('target="_blank"');
        expect(sanitized).toContain('rel="noopener noreferrer"');
    });

    it('keeps in-page hash anchors on the same page', () => {
        const sanitized = sanitizePreviewHtml('<p><a href="#section-c">jump</a></p>');
        expect(sanitized).toContain('href="#section-c"');
        expect(sanitized).not.toContain('target="_blank"');
    });

    it('removes forbidden tag contents in fallback-only mode', () => {
        const sanitized = fallbackSanitizeHtml('<p>ok</p><script>alert(1)</script><iframe src="x">bad</iframe>');

        expect(sanitized).toContain('<p>ok</p>');
        expect(sanitized).not.toContain('alert(1)');
        expect(sanitized).not.toContain('bad');
        expect(sanitized).not.toContain('<iframe');
    });

    it('classifies which preview hrefs should open in a new tab', () => {
        expect(shouldOpenPreviewLinkInNewTab('https://example.com')).toBe(true);
        expect(shouldOpenPreviewLinkInNewTab('http://example.com/a')).toBe(true);
        expect(shouldOpenPreviewLinkInNewTab('/relative/path')).toBe(true);
        expect(shouldOpenPreviewLinkInNewTab('#heading')).toBe(false);
        expect(shouldOpenPreviewLinkInNewTab('javascript:alert(1)')).toBe(false);
    });

    it('applies new-tab targets on a rendered preview root', () => {
        const root = document.createElement('div');
        root.innerHTML = `
            <a href="https://example.com/video">video</a>
            <a href="#local">local</a>
            <a href="https://github.com/user-attachments/assets/abc">asset</a>
        `;
        ensurePreviewLinksOpenInNewTab(root);

        const [external, local, asset] = root.querySelectorAll('a');
        expect(external.getAttribute('target')).toBe('_blank');
        expect(external.getAttribute('rel')).toContain('noopener');
        expect(local.getAttribute('target')).toBeNull();
        expect(asset.getAttribute('target')).toBe('_blank');
    });
});
