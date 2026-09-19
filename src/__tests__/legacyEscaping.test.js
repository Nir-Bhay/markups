import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Legacy main.js innerHTML escaping pins.
 *
 * main.js is too side-effectful to import in jsdom, so these tests assert on
 * source: every user-content interpolation into innerHTML must go through
 * escapeHtml. Trusted static icons (emoji/SVG glyphs from internal catalogs)
 * are intentionally left raw and documented here.
 */

const MAIN_JS = resolve(process.cwd(), 'src/main.js');

function load() {
    return readFileSync(MAIN_JS, 'utf-8');
}

describe('legacy main.js escaping', () => {
    it('escapes linter rule names and descriptions (document-derived content)', () => {
        const js = load();
        expect(js).toMatch(/escapeHtml\(issue\.ruleNames\[1\] \|\| issue\.ruleNames\[0\]\)/);
        expect(js).toMatch(/escapeHtml\(issue\.errorDescription\)/);
    });

    it('escapes template titles and descriptions', () => {
        const js = load();
        expect(js).toMatch(/escapeHtml\(template\.title\)/);
        expect(js).toMatch(/escapeHtml\(template\.description\)/);
    });

    it('escapes snippet titles and callout labels', () => {
        const js = load();
        expect(js).toMatch(/escapeHtml\(snippet\.title\)/);
        expect(js).toMatch(/escapeHtml\(label\)/);
    });

    it('escapes tab titles (stored-XSS guard)', () => {
        const js = load();
        expect(js).toMatch(/escapeHtml\(doc\.title \|\| 'Untitled'\)/);
    });
});
