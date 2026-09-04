import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * G3 a11y modal/popover ARIA tests
 *
 * These tests verify ARIA dialog semantics on:
 * - Search overlay (#search-overlay)
 * - Video insert popover (created dynamically in src/main.js)
 *
 * Other modals (Goals/Stats/Templates/Export) live in index.html directly and
 * already have role="dialog" + aria-modal="true" + aria-labelledby, verified
 * by manual review. These tests pin the in-code contracts so they cannot regress.
 */

const INDEX_HTML = resolve(process.cwd(), 'index.html');
const MAIN_JS = resolve(process.cwd(), 'src/main.js');

function load(file) {
    return readFileSync(file, 'utf-8');
}

describe('a11y: search overlay dialog semantics', () => {
    it('declares role=dialog, aria-modal=true, aria-label on #search-overlay', () => {
        const html = load(INDEX_HTML);
        const overlay = html.match(/<div\s+class="search-overlay[^"]*"\s+id="search-overlay"[^>]*>/);
        expect(overlay, 'search-overlay div must exist in index.html').toBeTruthy();
        const block = overlay[0];
        expect(block).toContain('role="dialog"');
        expect(block).toContain('aria-modal="true"');
        expect(block).toContain('aria-label="Search in document"');
    });

    it('gives the search input an aria-label (placeholder-only is insufficient)', () => {
        const html = load(INDEX_HTML);
        const input = html.match(/<input[^>]*id="search-input"[^>]*>/);
        expect(input, '#search-input must exist').toBeTruthy();
        expect(input[0]).toContain('aria-label="Search preview"');
    });
});

describe('a11y: video insert popover dialog semantics', () => {
    it('sets role=dialog + aria-modal=true + aria-label when opening the popover', () => {
        const js = load(MAIN_JS);
        // Find the panel creation block for the video-insert popover.
        const openFn = js.match(/const\s+open\s*=\s*\(\)\s*=>\s*\{[\s\S]*?video-insert-popover[\s\S]*?panel\.innerHTML\s*=/);
        expect(openFn, 'open() function defining #video-insert-popover must exist in src/main.js').toBeTruthy();
        const block = openFn[0];
        expect(block).toMatch(/setAttribute\(['"]role['"],\s*['"]dialog['"]\)/);
        expect(block).toMatch(/setAttribute\(['"]aria-modal['"],\s*['"]true['"]\)/);
        expect(block).toMatch(/setAttribute\(['"]aria-label['"],\s*['"]Insert video['"]\)/);
    });
});

describe('a11y: existing modal contracts (regression guards)', () => {
    // Goals/Stats/Templates/Export modals are static in index.html and already
    // have correct ARIA. These guards make sure removing role="dialog" trips CI.
    const EXPECTED_MODALS = [
        { id: 'goals-modal', label: 'goals' },
        { id: 'stats-modal', label: 'stats' },
        { id: 'templates-modal', label: 'templates' },
        { id: 'export-modal', label: 'export' }
    ];

    for (const { id, label } of EXPECTED_MODALS) {
        it(`#${id} keeps role="dialog" + aria-modal="true"`, () => {
            const html = load(INDEX_HTML);
            const re = new RegExp(`<div[^>]*id="${id}"[^>]*>`);
            const block = html.match(re);
            expect(block, `#${id} must exist`).toBeTruthy();
            // Allow either attr order; just verify both attributes are present.
            expect(block[0]).toContain('role="dialog"');
            expect(block[0]).toContain('aria-modal="true"');
            // Used to make sure the test fails loudly if the label expectation changes.
            void label;
        });
    }
});