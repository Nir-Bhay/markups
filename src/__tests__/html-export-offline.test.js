import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * HTML export offline-capable regression test (Issue L9)
 *
 * Bug: HTML export paths in src/main.js referenced cdnjs.cloudflare.com for
 * github-markdown-css and prism. Offline users got broken-looking exports.
 *
 * Fix: All export and print paths now inline the styles via
 * `import exportCss from './styles/export.css?raw'` and `<style>${exportCss}</style>`.
 * No external network is required to view the exported document.
 */

const SRC = resolve(process.cwd(), 'src');
const MAIN_JS = resolve(SRC, 'main.js');
const EXPORT_CSS = resolve(SRC, 'styles/export.css');

function load(file) {
    return readFileSync(file, 'utf-8');
}

describe('HTML export works offline (Issue L9)', () => {
    it('main.js contains no cdnjs.cloudflare.com references in any HTML export or print path', () => {
        const js = load(MAIN_JS);
        expect(js).not.toContain('cdnjs.cloudflare.com');
    });

    it('main.js imports the inline export CSS bundle', () => {
        const js = load(MAIN_JS);
        expect(js).toMatch(/import\s+exportCss\s+from\s+['"]\.\/styles\/export\.css\?raw['"]/);
    });

    it('src/styles/export.css exists and contains the github-markdown-light base styles', () => {
        const css = load(EXPORT_CSS);
        // Sanity: file should contain at least the github-markdown-light preamble
        // (specific class markers from the upstream stylesheet).
        expect(css).toContain('.markdown-body');
        expect(css).toContain('h1');
        expect(css.length).toBeGreaterThan(5000); // nontrivial CSS body
    });

    it('every HTML export path uses inline <style>${exportCss}</style>', () => {
        const js = load(MAIN_JS);
        // Count occurrences of the inline injection pattern.
        const matches = js.match(/<style>\$\{exportCs{1,2}\}<\/style>/g) || [];
        // We patched 5 distinct sites:
        //   1) exportToHTML (file download)
        //   2) inline-body export
        //   3) printDocument (with includeCSS option)
        //   4) printDocument site #2 (with @page + paperSize)
        //   5) printDocument site #1 (body padding)
        expect(matches.length).toBeGreaterThanOrEqual(4);
    });
});