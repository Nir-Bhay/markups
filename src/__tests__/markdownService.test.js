import { describe, it, expect, beforeAll } from 'vitest';
import { markdownService, MarkdownService } from '../core/markdown/index.js';

describe('MarkdownService', () => {
    beforeAll(() => {
        markdownService.initialize({ mermaidEnabled: false });
    });

    it('renders GitHub-style footnotes with the installed marked-footnote default export', () => {
        const html = markdownService.parse('Text with a footnote.[^1]\n\n[^1]: Footnote body');

        expect(html).toContain('Footnote body');
        expect(html).toMatch(/footnote/i);
    });

    it('sanitizes dangerous HTML while preserving safe links', () => {
        const html = markdownService.parse('[safe](https://example.com)\n\n<script>alert("xss")</script><img src=x onerror="alert(1)">');

        expect(html).toContain('href="https://example.com"');
        expect(html).not.toContain('<script');
        expect(html).not.toContain('onerror');
    });

    it('renders KaTeX math without throwing', () => {
        const html = markdownService.parse('Inline math $x^2$ works.');

        expect(html).toContain('katex');
        expect(html).toContain('x');
    });

    it('embeds video URLs during modular render post-processing', async () => {
        const container = document.createElement('article');

        await markdownService.render('https://example.com/demo.mp4', container, { renderMermaid: false });

        expect(container.querySelector('video')?.getAttribute('src')).toBe('https://example.com/demo.mp4');
    });

    it('normalizes Prism language aliases case-insensitively', () => {
        expect(MarkdownService.resolvePrismLanguage('XML')).toBe('xml');
        expect(MarkdownService.resolvePrismLanguage('Xml')).toBe('xml');
        expect(MarkdownService.resolvePrismLanguage('unknown-language')).toBe('plaintext');
    });

    it('highlights XML tags, attributes, and character entity references (Issue #42)', () => {
        const lower = markdownService.parse(
            '```xml\n<Sid Name="test" Timing="4" Flag="1" Condition="a &gt; 0 &amp; b" />\n```'
        );
        const upper = markdownService.parse(
            '```XML\n<Sid Name="test" Timing="4" Flag="1" Condition="a &gt; 0 &amp; b" />\n```'
        );

        for (const html of [lower, upper]) {
            expect(html).toMatch(/class="language-xml"/i);
            expect(html).toContain('token tag');
            expect(html).toContain('token attr-name');
            expect(html).toContain('token entity');
            expect(html).toContain('Sid');
            expect(html).toContain('Name');
        }
    });

    it('highlights INI sections, keys, and values (Issue #44)', () => {
        const html = markdownService.parse(
            '```ini\n[DEFAULT]\nhost = localhost\nport = 8080\n# comment line\n```'
        );

        expect(html).toMatch(/class="language-ini"/i);
        // Prism INI grammar: section-name → selector, key → attr-name, value → attr-value
        // Actual rendered classes: token section-name selector, token key attr-name, token value attr-value
        expect(html).toContain('token section-name selector'); // [DEFAULT] section header
        expect(html).toContain('token key attr-name');         // host / port keys
        expect(html).toContain('token value attr-value');      // values
        expect(html).toContain('DEFAULT');
        expect(html).toContain('localhost');
    });
});
