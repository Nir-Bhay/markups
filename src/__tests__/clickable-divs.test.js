import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const mainJs = readFileSync(resolve(import.meta.dirname, '../main.js'), 'utf8');

describe('clickable divs a11y (H4)', () => {
    it('template cards are buttons, not divs', () => {
        const templateCardDiv = mainJs.match(
            /const\s+card\s*=\s*document\.createElement\(['"]div['"]\);\s*\n\s*card\.className\s*=\s*['"]template-card['"]/
        );
        expect(templateCardDiv).toBeNull();
    });

    it('template cards have type="button"', () => {
        const hasTypeButton = mainJs.includes(
            "card.type = 'button';"
        );
        expect(hasTypeButton).toBe(true);
    });

    it('lint items are buttons, not divs', () => {
        const lintItemDiv = mainJs.match(
            /const\s+item\s*=\s*document\.createElement\(['"]div['"]\);\s*\n\s*item\.className\s*=\s*['"]lint-item['"]/
        );
        expect(lintItemDiv).toBeNull();
    });

    it('lint items have type="button"', () => {
        const hasTypeButton = mainJs.includes(
            "item.type = 'button';"
        );
        expect(hasTypeButton).toBe(true);
    });

    it('template card button supports Enter and Space via native button behavior', () => {
        // Since we use <button>, Enter/Space dispatch click automatically — no extra keydown handler needed.
        const hasKeydownOnCard = /card\.addEventListener\(['"]keydown['"]/.test(mainJs);
        expect(hasKeydownOnCard).toBe(false);
    });
});
