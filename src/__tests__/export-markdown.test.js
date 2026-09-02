// Tests for services/export/markdown.js — pure logic, no DOM/Monaco.
// Covers: line-ending normalization, trailing whitespace, final newline, format.
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownExporter, markdownExporter } from '../services/export/markdown.js';

describe('services/export/markdown — pure logic', () => {
    let exporter;

    beforeEach(() => {
        exporter = new MarkdownExporter();
    });

    it('normalizes CRLF and CR to LF', () => {
        const input = 'line1\r\nline2\rline3\nline4';
        const out = exporter.export(input);
        expect(out).toBe('line1\nline2\nline3\nline4\n');
    });

    it('trims trailing whitespace on each line but preserves interior spaces', () => {
        const input = 'a   \n  b c  \nc';
        const out = exporter.export(input);
        expect(out).toBe('a\n  b c\nc\n');
    });

    it('ensures final newline (idempotent)', () => {
        expect(exporter.export('hello')).toBe('hello\n');
        expect(exporter.export('hello\n')).toBe('hello\n');
        expect(exporter.export('hello\n\n')).toBe('hello\n\n');
    });

    it('preserves content when all options disabled', () => {
        const input = 'a\r\nb   ';
        const out = exporter.export(input, {
            normalizeLineEndings: false,
            trimTrailingWhitespace: false,
            ensureFinalNewline: false
        });
        expect(out).toBe('a\r\nb   ');
    });

    it('singleton instance is exported and is MarkdownExporter', () => {
        expect(markdownExporter).toBeInstanceOf(MarkdownExporter);
        expect(typeof markdownExporter.export).toBe('function');
    });
});
