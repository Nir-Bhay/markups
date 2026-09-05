import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const mainJs = readFileSync(resolve(import.meta.dirname, '../main.js'), 'utf8');

describe('mermaid diagram accessible names (L12)', () => {
    it('mermaid divs get role="img"', () => {
        const hasRoleImg = /div\.setAttribute\(['"]role['"],\s*['"]img['"]\)/.test(mainJs);
        expect(hasRoleImg).toBe(true);
    });

    it('mermaid divs get aria-label="Diagram"', () => {
        const hasAriaLabel = /div\.setAttribute\(['"]aria-label['"],\s*['"]Diagram['"]\)/.test(mainJs);
        expect(hasAriaLabel).toBe(true);
    });

    it('aria-label is set on the same element that receives role="img"', () => {
        // Both setAttribute calls should appear in the mermaid block context
        const mermaidBlock = mainJs.match(
            /div\.className = 'mermaid';[\s\S]*?pre\.replaceWith\(div\)/
        );
        expect(mermaidBlock).not.toBeNull();
        const block = mermaidBlock[0];
        expect(block).toContain(`setAttribute('role', 'img')`);
        expect(block).toContain(`setAttribute('aria-label', 'Diagram')`);
    });
});
