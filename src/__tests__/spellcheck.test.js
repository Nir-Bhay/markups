import { describe, expect, it } from 'vitest';
import { collectSpellTargets } from '../features/spellcheck/engine.js';

describe('collectSpellTargets', () => {
    it('finds misspelled-looking words with editor columns', () => {
        const targets = collectSpellTargets('teh recieve');
        expect(targets.map((t) => t.word)).toEqual(['teh', 'recieve']);
        expect(targets[0]).toMatchObject({ line: 1, startColumn: 1, endColumn: 4 });
        expect(targets[1]).toMatchObject({ line: 1, startColumn: 5, endColumn: 12 });
    });

    it('skips fenced code, inline code, and urls', () => {
        const text = [
            'hello',
            '```',
            'teh',
            '```',
            'see `recieve` and https://example.com/spelingg',
            '[label](https://example.com/worlld)'
        ].join('\n');
        const words = collectSpellTargets(text).map((t) => t.word);
        expect(words).toContain('hello');
        expect(words).toContain('see');
        expect(words).toContain('and');
        expect(words).toContain('label');
        expect(words).not.toContain('teh');
        expect(words).not.toContain('recieve');
        expect(words).not.toContain('spelingg');
        expect(words).not.toContain('worlld');
    });
});
