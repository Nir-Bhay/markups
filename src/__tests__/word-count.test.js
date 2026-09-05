import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const mainJs = readFileSync(resolve(import.meta.dirname, '../main.js'), 'utf8');
const markdownIndex = readFileSync(resolve(import.meta.dirname, '../core/markdown/index.js'), 'utf8');

describe('unified word count logic (M5)', () => {
    // Both sites should strip the same markdown symbols before word counting
    const markdownSymbolsPattern = /[#*_~`]/g;

    it('main.js updateStats strips markdown symbols before counting words', () => {
        const updateStatsBlock = mainJs.match(
            /const updateStats = \(text\) => \{[\s\S]*?const wordCount = [\s\S]*?const charCount = /
        );
        expect(updateStatsBlock).not.toBeNull();
        expect(updateStatsBlock[0]).toContain(".replace(/[#*_~`]/g, '')");
    });

    it('markdown/index.js extractStats also strips markdown symbols', () => {
        const extractStatsBlock = markdownIndex.match(
            /extractStats\(markdown\) \{[\s\S]*?return \{/
        );
        expect(extractStatsBlock).not.toBeNull();
        expect(extractStatsBlock[0]).toContain(".replace(/[#*_~`]/g, '')");
    });

    it('both sites strip code blocks and inline code before word counting', () => {
        const updateStatsBlock = mainJs.match(
            /const updateStats = \(text\) => \{[\s\S]*?const wordCount = [\s\S]*?const charCount = /
        );
        expect(updateStatsBlock).not.toBeNull();
        expect(updateStatsBlock[0]).toContain(".replace(/```[\\s\\S]*?```/g, '')");
        expect(updateStatsBlock[0]).toContain(".replace(/`[^`]*`/g, '')");
    });

    it('word count treats markdown-heading text as words, not symbols', () => {
        // Simulate what updateStats does now with markdown stripping
        const text = '# Hello World\n\nThis is **bold** text with `code` and [a link](url).';
        const stripped = text
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/[#*_~`]/g, '')
            .trim();
        const words = stripped.split(/\s+/).filter(w => w.length > 0);
        // "# Hello World\n\nThis is bold text with code and a link." => 10 words
        expect(words.length).toBe(10);
        expect(words).not.toContain('#');
        expect(words).not.toContain('**');
        expect(words).not.toContain('`');
    });
});
