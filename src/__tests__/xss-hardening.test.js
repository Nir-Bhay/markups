import { describe, it, expect } from 'vitest';
import {
    sanitizePreviewHtml,
    ensurePreviewLinksOpenInNewTab,
    shouldOpenPreviewLinkInNewTab
} from '../utils/sanitize.js';

describe('XSS hardening for Markups preview policy', () => {
    it('blocks javascript: URLs (lowercase)', () => {
        const html = '<a href="javascript:alert(1)">click</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('javascript:');
    });

    it('blocks javascript: URLs with HTML entity encoding', () => {
        // &#x73; = "s" → java&#x73;cript: = javascript:
        const html = '<a href="java&#x73;cript:alert(1)">click</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('java');
        expect(clean).not.toContain('alert');
    });

    it('blocks vbscript: URLs', () => {
        const html = '<a href="vbscript:msgbox(1)">x</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('vbscript:');
    });

    it('blocks data:text/html URLs', () => {
        const html = '<a href="data:text/html,<script>alert(1)</script>">y</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('data:text/html');
    });

    it('strips raw <video> tags from author markdown', () => {
        const html = '<video controls src="https://x.com/v.mp4"></video>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('<video');
    });

    it('strips raw <iframe> tags from author markdown', () => {
        const html = '<iframe src="https://evil.com"></iframe>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('<iframe');
    });

    it('strips data-* attributes (ALLOW_DATA_ATTR: false)', () => {
        const html = '<a href="x" data-evil="payload">link</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).not.toContain('data-evil');
    });

    it('allows in-page anchor links (#heading)', () => {
        const html = '<a href="#section">jump</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).toContain('href="#section"');
        expect(clean).not.toContain('target="_blank"');
    });

    it('opens external http/https links in a new tab', () => {
        const html = '<a href="https://example.com">external</a>';
        const clean = sanitizePreviewHtml(html);
        expect(clean).toContain('target="_blank"');
        expect(clean).toContain('rel="noopener noreferrer"');
    });
});
