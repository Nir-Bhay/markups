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
});
