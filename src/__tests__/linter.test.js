// Tests for features/linter/index.js — rule detection, severity accounting,
// and manager plumbing. The rules are regex-heavy, so false positives and
// false negatives here show up directly in the issues panel.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinterManager, SEVERITY } from '../features/linter/index.js';

describe('features/linter — rule detection', () => {
    let linter;

    beforeEach(() => {
        linter = new LinterManager();
        linter.dispose(); // reset the singleton before grabbing a fresh instance
        linter = new LinterManager();
    });

    afterEach(() => linter.dispose());

    const issues = (content) => linter.lint(content);

    it('flags multiple H1 headings', () => {
        const h1 = issues('# One\n# Two').filter(i => i.ruleId === 'multiple-h1');
        expect(h1).toHaveLength(1);
        expect(h1[0]).toMatchObject({ line: 2, severity: SEVERITY.WARNING });
    });

    it('flags heading level jumps but not smooth increments', () => {
        const jumps = issues('# One\n## Two\n### Three\n##### Five')
            .filter(i => i.ruleId === 'heading-increment');
        expect(jumps).toHaveLength(1);
        expect(jumps[0]).toMatchObject({ line: 4, severity: SEVERITY.WARNING });
        expect(jumps[0].message).toContain('H3 to H5');
    });

    it('flags trailing whitespace (3+ chars) as info', () => {
        const ts = issues('text   \nmore').filter(i => i.ruleId === 'trailing-spaces');
        expect(ts).toHaveLength(1);
        expect(ts[0]).toMatchObject({ line: 1, severity: SEVERITY.INFO });
    });

    it('flags empty link URLs as errors', () => {
        const el = issues('[click]() and [x](   ) and [ok](https://a.com)')
            .filter(i => i.ruleId === 'empty-links');
        expect(el).toHaveLength(2);
        expect(el.every(i => i.severity === SEVERITY.ERROR)).toBe(true);
    });

    it('flags images missing alt text as warnings', () => {
        const ea = issues('![](a.png) ![ ](b.png) ![alt](c.png)')
            .filter(i => i.ruleId === 'empty-alt-text');
        expect(ea).toHaveLength(2);
        expect(ea[0]).toMatchObject({ line: 1, severity: SEVERITY.WARNING });
    });

    it('flags unbalanced brackets and unclosed link parens', () => {
        const ub = issues('[unclosed\n[balanced]\nbroken](url')
            .filter(i => i.ruleId === 'unbalanced-brackets');
        // Line 3 is reported twice: once for the bracket count, once for the
        // link parenthesis that never closes.
        expect(ub.map(i => i.line)).toEqual([1, 3, 3]);
        expect(ub[1].message).toContain('Unbalanced square brackets');
        expect(ub[2].message).toContain('Unclosed link parenthesis');
    });

    it('flags duplicate links as info with the first-use line', () => {
        const dl = issues('[a](https://x.com)\n[b](https://x.com)')
            .filter(i => i.ruleId === 'duplicate-links');
        expect(dl).toHaveLength(1);
        expect(dl[0]).toMatchObject({ line: 2, severity: SEVERITY.INFO });
        expect(dl[0].message).toContain('first used on line 1');
    });

    it('flags long lines but skips table rows', () => {
        const long = 'x'.repeat(121);
        const ll = issues('| ' + long + '\n' + long).filter(i => i.ruleId === 'long-lines');
        expect(ll).toHaveLength(1);
        expect(ll[0]).toMatchObject({ line: 2 });
    });

    it('flags fenced code blocks without a language specifier', () => {
        const fc = issues('```\ncode\n```\n```js\nmore')
            .filter(i => i.ruleId === 'fenced-code-language');
        expect(fc).toHaveLength(2);
        expect(fc.map(i => i.line)).toEqual([1, 3]);
    });
});

describe('features/linter — manager plumbing', () => {
    let linter;

    beforeEach(() => {
        linter = new LinterManager();
        linter.dispose();
        linter = new LinterManager();
    });

    afterEach(() => linter.dispose());

    it('sorts issues by line number across rules', () => {
        const out = linter.lint('[e]()\n# H1\n# H2\n```');
        expect(out.map(i => i.line)).toEqual([1, 3, 4]);
    });

    it('enriches issues with rule metadata and severity', () => {
        const [issue] = linter.lint('[e]()');
        expect(issue).toMatchObject({ ruleId: 'empty-links', severity: SEVERITY.ERROR });
        expect(typeof issue.ruleName).toBe('string');
        expect(issue.message).toContain('Empty link URL');
    });

    it('produces counts by severity', () => {
        linter.lint('[e]()\n# H1\n# H2\n```');
        expect(linter.getIssueCounts()).toEqual({ error: 1, warning: 1, info: 1, total: 3 });
        expect(linter.getIssuesBySeverity(SEVERITY.ERROR)).toHaveLength(1);
        expect(linter.getIssuesBySeverity('bogus')).toHaveLength(0);
    });

    it('clears issues for empty content', () => {
        linter.lint('[e]()');
        expect(linter.getIssueCounts().total).toBeGreaterThan(0);
        expect(linter.lint('')).toEqual([]);
        expect(linter.getIssueCounts().total).toBe(0);
    });

    it('disableRule stops a rule and enableRule restores it', () => {
        linter.disableRule('multiple-h1');
        expect(linter.lint('# A\n# B').some(i => i.ruleId === 'multiple-h1')).toBe(false);
        linter.enableRule('multiple-h1');
        expect(linter.lint('# A\n# B').some(i => i.ruleId === 'multiple-h1')).toBe(true);
    });

    it('disable() clears issues and toggle() flips the enabled flag', () => {
        linter.lint('# A\n# B');
        expect(linter.getIssueCounts().total).toBeGreaterThan(0);
        linter.disable();
        expect(linter.getIssues()).toEqual([]);
        expect(linter.enabled).toBe(false);
        linter.toggle();
        expect(linter.enabled).toBe(true);
    });

    it('addRule rejects invalid rules and lints custom rules as warnings', () => {
        linter.addRule({});
        linter.addRule({
            id: 'custom',
            check: (lines) => lines.map((_, i) => ({ line: i + 1, message: 'custom hit' }))
        });
        const custom = linter.lint('a\nb').filter(i => i.ruleId === 'custom');
        expect(custom).toHaveLength(2);
        expect(custom[0].severity).toBe(SEVERITY.WARNING);
    });
});
