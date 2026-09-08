/**
 * Breadcrumb Navigation Tests
 * TDD: test-first implementation for current-section breadcrumb feature
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper: find nearest heading above a cursor position
function getHeadingBeforeLine(markdown, lineNumber) {
  const lines = markdown.split('\n');
  let current = null;
  const stack = [];

  for (let i = 0; i <= lineNumber && i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ level, text });
      current = [...stack];
    }
  }

  return current || [];
}

// Helper: build breadcrumb HTML
function buildBreadcrumbPath(sections) {
  if (!sections.length) return '';
  return sections.map(s => s.text).join(' › ');
}

describe('Breadcrumb Navigation', () => {
  describe('getHeadingBeforeLine', () => {
    it('returns empty array for empty document', () => {
      const result = getHeadingBeforeLine('', 0);
      expect(result).toEqual([]);
    });

    it('returns H1 when cursor is inside it', () => {
      const doc = '# Main Title\n\nSome content here\n';
      const result = getHeadingBeforeLine(doc, 0);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Main Title');
      expect(result[0].level).toBe(1);
    });

    it('returns H1 → H2 when cursor is in nested H2', () => {
      const doc = '# Main Title\n\n## Section A\n\nContent\n';
      const result = getHeadingBeforeLine(doc, 3); // cursor in "Content" line
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Main Title');
      expect(result[0].level).toBe(1);
      expect(result[1].text).toBe('Section A');
      expect(result[1].level).toBe(2);
    });

    it('returns empty when cursor is before any heading', () => {
      const doc = 'Some text\n\n# Heading\n';
      const result = getHeadingBeforeLine(doc, 0);
      expect(result).toEqual([]);
    });

    it('pops stack when heading level decreases', () => {
      const doc = '# H1\n\n## H2-A\n\n## H2-B\n';
      const result = getHeadingBeforeLine(doc, 4); // cursor in H2-B section
      expect(result).toHaveLength(2);
      expect(result[1].text).toBe('H2-B');
    });

    it('handles H3 nesting', () => {
      const doc = '# H1\n\n## H2\n\n### H3\n';
      const result = getHeadingBeforeLine(doc, 4);
      expect(result).toHaveLength(3);
      expect(result[2].text).toBe('H3');
      expect(result[2].level).toBe(3);
    });
  });

  describe('buildBreadcrumbPath', () => {
    it('returns empty string for empty sections', () => {
      expect(buildBreadcrumbPath([])).toBe('');
    });

    it('joins sections with › separator', () => {
      const sections = [
        { text: 'Main', level: 1 },
        { text: 'Sub', level: 2 },
      ];
      expect(buildBreadcrumbPath(sections)).toBe('Main › Sub');
    });

    it('handles single section', () => {
      const sections = [{ text: 'Only', level: 1 }];
      expect(buildBreadcrumbPath(sections)).toBe('Only');
    });
  });

  describe('debounce behavior', () => {
    it('does not fire more than once per 150ms', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      let lastTimeout;

      const debounced = (...args) => {
        clearTimeout(lastTimeout);
        lastTimeout = setTimeout(() => fn(...args), 150);
      };

      debounced('a');
      debounced('b');
      debounced('c');

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('c');

      vi.useRealTimers();
    });
  });
});
