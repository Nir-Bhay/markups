import { describe, expect, it } from 'vitest';
import {
    escapeHtml,
    sanitizeMarkdownAlt,
    sanitizePreviewHtml
} from '../utils/sanitize.js';
import { safeBase64FromArrayBuffer } from '../utils/file.js';

describe('G1 XSS/escape/btoa security fixes', () => {
    // H2: aria-label with unescaped heading text
    it('escapeHtml neutralizes quotes and markup for safe attribute interpolation', () => {
        const plainText = 'Foo "bar" <script>baz</script>';
        const safe = escapeHtml(plainText);
        expect(safe).toBe('Foo &quot;bar&quot; &lt;script&gt;baz&lt;/script&gt;');
        const attr = `aria-label="Link to ${safe}"`;
        expect(attr).not.toContain('"bar"');
        expect(attr).not.toContain('<script>');
        expect(attr).toContain('aria-label="Link to Foo &quot;bar&quot;');
    });

    // H3: TOC innerHTML sanitized
    it('sanitizePreviewHtml strips dangerous event handlers from TOC item text', () => {
        const dangerous = '<img src=x onerror=alert(1)>';
        const clean = sanitizePreviewHtml(dangerous);
        expect(clean).not.toContain('onerror');
        // Simulate the TOC injection point
        const tocLink = `<a href="#x" class="toc-link">${clean}</a>`;
        expect(tocLink).not.toContain('onerror');
    });

    // M1: image renderer unescaped attributes
    it('escapeHtml prevents attribute breakout in image src/alt/title', () => {
        const src = 'http://x.com/x" onerror="alert(1)';
        const alt = 'alt" onmouseover=alert(2)';
        const title = 'title><script>alert(3)</script>';
        const attrs = `src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" title="${escapeHtml(title)}"`;
        // The attacker payload cannot break out of the attribute value
        expect(attrs).not.toContain('" onerror="alert(1)"');
        expect(attrs).not.toContain('" onmouseover=alert(2)"');
        expect(attrs).not.toContain('><script>');
        // Safe content is preserved
        expect(attrs).toContain('src="http://x.com/x&quot; onerror=&quot;alert(1)"');
    });

    // M3: safeBase64 handles large buffers without throwing
    it('safeBase64FromArrayBuffer does not throw on a >2 MB buffer', () => {
        const size = 3 * 1024 * 1024; // 3 MB
        const buffer = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            buffer[i] = i & 0xff;
        }
        // safeBase64FromArrayBuffer is sync; verify it returns a data URL
        // and that the length is correct for the input size (base64 encodes
        // every 3 bytes as 4 characters, plus data URL prefix).
        const result = safeBase64FromArrayBuffer(buffer, 'image/png');
        expect(result).toMatch(/^data:image\/png;base64,/);
        const expectedBase64Length = Math.ceil(size / 3) * 4;
        // Strip the data URL prefix and verify the base64 body length matches.
        const base64Body = result.replace(/^data:image\/png;base64,/, '');
        expect(base64Body.length).toBe(expectedBase64Length);
    });

    // M2: markdown alt text sanitized
    it('sanitizeMarkdownAlt escapes characters that break inline image syntax', () => {
        const dirty = 'file]name](bad';
        const clean = sanitizeMarkdownAlt(dirty);
        // The helper uses markdown-style backslash escapes (not removal).
        // After escaping, each dangerous character is preceded by a backslash
        // so `![clean](url)` is parsed correctly by a markdown engine.
        expect(clean).toBe('file\\]name\\]\\(bad');
        const markdown = `![${clean}](http://example.com/img.png)`;
        // The full markdown starts with `![`, contains `](http://...)`, and the
        // URL after the closing paren is untouched.
        expect(markdown.startsWith('![')).toBe(true);
        expect(markdown).toContain('](http://example.com/img.png)');
        // The escaped sequence `\]` appears in the alt text (proof the escape
        // happened), but no unescaped `]` exists between `![` and `](`.
        const altSegment = markdown.slice(2, markdown.indexOf(']('));
        expect(altSegment).toContain('\\]');
        // Every `]` in the alt segment must be escaped (preceded by `\`).
        const bareBrackets = altSegment.replace(/\\]/g, '');
        expect(bareBrackets).not.toContain(']');
        expect(bareBrackets).not.toContain(')');
    });

    // L10: print title sanitized
    it('escapeHtml neutralizes markup injected into print document title', () => {
        const title = 'My <script>alert("xss")</script> "Doc"';
        const safe = escapeHtml(title);
        const html = `<title>${safe}</title>`;
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('"Doc"');
        expect(html).toContain('&lt;script&gt;');
        expect(html).toContain('<title>My ');
    });
});
