import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const indexHtml = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8');
const premiumCss = readFileSync(resolve(import.meta.dirname, '../../public/css/premium-ui.css'), 'utf8');

describe('skip navigation link (L11)', () => {
    it('skip-nav link exists in index.html before the header', () => {
        const skipLinkMatch = indexHtml.match(
            /<a\s+href="#editor"\s+class="skip-nav-link"\s+id="skip-nav-link"\s*>Skip to editor<\/a>/
        );
        expect(skipLinkMatch).not.toBeNull();
    });

    it('skip-nav link appears before the header element', () => {
        const skipLinkIdx = indexHtml.indexOf('skip-nav-link');
        const headerIdx = indexHtml.indexOf('<header class="premium-header"');
        expect(skipLinkIdx).toBeGreaterThanOrEqual(0);
        expect(headerIdx).toBeGreaterThanOrEqual(0);
        expect(skipLinkIdx).toBeLessThan(headerIdx);
    });

    it('premium-ui.css has visually-hidden / focus-visible styles for .skip-nav-link', () => {
        const hasSkipNavStyles = premiumCss.includes('.skip-nav-link');
        const hasFocusStyles = premiumCss.includes('.skip-nav-link:focus');
        expect(hasSkipNavStyles).toBe(true);
        expect(hasFocusStyles).toBe(true);
    });

    it('the #editor target element exists in index.html', () => {
        const hasEditor = indexHtml.includes('id="editor"');
        expect(hasEditor).toBe(true);
    });
});
