import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { extractMarkdownStats } from '../utils/markdown-stats.js';

const mainJs = readFileSync(resolve(import.meta.dirname, '../main.js'), 'utf8');
const markdownIndex = readFileSync(resolve(import.meta.dirname, '../core/markdown/index.js'), 'utf8');
const markdownStats = readFileSync(resolve(import.meta.dirname, '../utils/markdown-stats.js'), 'utf8');

describe('unified word count logic (M5)', () => {
    it('main.js uses the shared Markdown stats helper', () => {
        const updateStatsBlock = mainJs.match(
            /const updateStats = \(rawText\) => \{[\s\S]*?extractMarkdownStats\(text\);/
        );
        expect(updateStatsBlock).not.toBeNull();
        expect(updateStatsBlock[0]).toContain('extractMarkdownStats(text)');
    });

    it('markdown/index.js extractStats delegates to the shared helper', () => {
        const extractStatsBlock = markdownIndex.match(
            /extractStats\(markdown\) \{[\s\S]*?return extractMarkdownStats\(markdown\);/
        );
        expect(extractStatsBlock).not.toBeNull();
    });

    it('the shared helper strips Markdown symbols before counting words', () => {
        expect(markdownStats).toContain(".replace(/[#*_~`]/g, '')");
    });

    it('the shared helper strips code blocks and inline code before word counting', () => {
        expect(markdownStats).toContain(".replace(/```[\\s\\S]*?```/g, '')");
        expect(markdownStats).toContain(".replace(/`[^`]*`/g, '')");
    });

    it('word count treats markdown-heading text as words, not symbols', () => {
        // Simulate what updateStats does now with markdown stripping
        const text = '# Hello World\n\nThis is **bold** text with `code` and [a link](url).';
        const words = extractMarkdownStats(text).words;
        // "# Hello World\n\nThis is bold text with code and a link." => 10 words
        expect(words).toBe(10);
    });
});
