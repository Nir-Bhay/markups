// Tests for services/export/txt.js — the single canonical TXT converter (Phase 3.2).
import { describe, it, expect } from 'vitest';
import { markdownToPlainText, txtExporter, TXT_WARN_BYTES } from '../services/export/txt.js';

describe('services/export/txt — markdownToPlainText', () => {
    it('uppercases headings and strips inline markup', () => {
        const out = markdownToPlainText('# Hello\nSome **bold** and *italic* text.');
        expect(out).toContain('HELLO');
        expect(out).toContain('Some bold and italic text.');
        expect(out).not.toContain('**');
    });

    it('preserves code blocks as [CODE] instead of deleting them', () => {
        const out = markdownToPlainText('```js\nconst a = 1;\n```');
        expect(out).toContain('[CODE: js]');
        expect(out).toContain('const a = 1;');
    });

    it('keeps link URLs and image placeholders', () => {
        const out = markdownToPlainText('[docs](https://x.dev) and ![alt](pic.png)');
        expect(out).toContain('docs (https://x.dev)');
        expect(out).toContain('[Image: alt]');
    });

    it('wraps long lines at 80 columns unless disabled', () => {
        const long = 'word '.repeat(30).trim();
        const wrapped = markdownToPlainText(long, { wordWrap: true });
        expect(Math.max(...wrapped.split('\n').map((l) => l.length))).toBeLessThanOrEqual(80);
        const raw = markdownToPlainText(long, { wordWrap: false });
        expect(raw.split('\n')).toHaveLength(1);
    });

    it('prepends a header block with word count when requested', () => {
        const out = markdownToPlainText('# T\none two three', {
            includeFrontmatter: true, title: 'MyDoc', dateStr: '2026-09-08'
        });
        expect(out).toContain('Document: MyDoc');
        expect(out).toContain('Date: 2026-09-08');
        expect(out).toContain('Words:');
        expect(out.indexOf('Document:')).toBeLessThan(out.indexOf('T\n'));
    });

    it('is deterministic: same input, same output (preview === download)', () => {
        const md = '# H\n- a\n- b\n\n> quote\n\n[Docs](https://x.dev)\n\n```py\nprint(1)\n```';
        const opts = { wordWrap: true, includeFrontmatter: true, title: 'd', dateStr: '2026-01-01' };
        expect(markdownToPlainText(md, opts)).toBe(markdownToPlainText(md, opts));
        expect(txtExporter.convert(md, opts)).toBe(markdownToPlainText(md, opts));
    });

    it('exports sane size-guard constants', () => {
        expect(TXT_WARN_BYTES).toBe(10 * 1024 * 1024);
    });
});
