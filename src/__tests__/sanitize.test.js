import { describe, expect, it } from 'vitest';
import { fallbackSanitizeHtml, sanitizePreviewHtml } from '../utils/sanitize.js';

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
        expect(sanitized).toContain('rel="noopener noreferrer"');
        expect(sanitized).toContain('<video');
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('data-secret');
        expect(sanitized).not.toContain('style=');
    });

    it('removes forbidden tag contents in fallback-only mode', () => {
        const sanitized = fallbackSanitizeHtml('<p>ok</p><script>alert(1)</script><iframe src="x">bad</iframe>');

        expect(sanitized).toContain('<p>ok</p>');
        expect(sanitized).not.toContain('alert(1)');
        expect(sanitized).not.toContain('bad');
        expect(sanitized).not.toContain('<iframe');
    });
});
