import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const mainJs = readFileSync(resolve(import.meta.dirname, '../main.js'), 'utf8');

describe('copy button aria-live announcement (L13)', () => {
    it('copy button contains an aria-live="polite" status region', () => {
        const hasLiveRegion = /copyStatus\.setAttribute\(['"]aria-live['"],\s*['"]polite['"]\)/.test(mainJs);
        expect(hasLiveRegion).toBe(true);
    });

    it('aria-live region starts empty (no initial text)', () => {
        // copyStatus.textContent is not set until click; initial state is empty
        const statusInitMatch = mainJs.match(
            /copyStatus\s*=\s*document\.createElement\(['"]span['"]\);[^]*?copyBtn\.appendChild\(copyStatus\);/s
        );
        expect(statusInitMatch).not.toBeNull();
        const block = statusInitMatch[0];
        // Ensure no textContent assignment between creation and append
        const textContentAssignments = block.match(/copyStatus\.textContent\s*=/g) || [];
        expect(textContentAssignments.length).toBe(0);
    });

    it('copy status text is updated in the live region on success and failure', () => {
        const hasCopiedStatus = /copyStatus\.textContent\s*=\s*['"]Copied!['"]/.test(mainJs);
        const hasFailedStatus = /copyStatus\.textContent\s*=\s*['"]Failed['"]/.test(mainJs);
        const hasResetStatus = /copyStatus\.textContent\s*=\s*['"]['"]/.test(mainJs);
        expect(hasCopiedStatus).toBe(true);
        expect(hasFailedStatus).toBe(true);
        expect(hasResetStatus).toBe(true);
    });
});
