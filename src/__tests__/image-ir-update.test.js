import { describe, expect, it } from 'vitest';
import {
  applyImageStateToMarkdown,
  mapDomImagesToMarkdownIndices,
  updateHtmlAttribute,
} from '../features/image-resize/markdown-sync.js';

const ATTR = '{data-ir=%7B%22width%22%3A440%2C%22height%22%3A214%7D}';

const THREE = [
  '![Simple image](https://images.unsplash.com/photo-1?w=1200)',
  '![Image with long alternate text that should wrap carefully](https://images.unsplash.com/photo-2?w=1600)',
  '[![Linked image](https://images.unsplash.com/photo-3?w=1200)](https://example.com)',
].join(' ');

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

describe('applyImageStateToMarkdown isolation', () => {
  it('updates only index 0 and never bleeds into following images', () => {
    const { content, found, strategy } = applyImageStateToMarkdown(THREE, {
      index: 0,
      attrStr: ATTR,
    });
    expect(found).toBe(true);
    expect(strategy).toBe('index');
    expect(count(content, ATTR)).toBe(1);
    expect(content).toContain(`photo-1?w=1200) ${ATTR}`);
    expect(content).not.toContain(`photo-2?w=1600) ${ATTR}`);
    expect(content).not.toContain(`photo-3?w=1200) ${ATTR}`);
  });

  it('updates only the middle image when index is 1', () => {
    const { content, found } = applyImageStateToMarkdown(THREE, {
      index: 1,
      attrStr: ATTR,
    });
    expect(found).toBe(true);
    expect(count(content, ATTR)).toBe(1);
    expect(content).toContain(`photo-2?w=1600) ${ATTR}`);
    expect(content).not.toContain(`photo-1?w=1200) ${ATTR}`);
  });

  it('updates only the linked image when index is 2', () => {
    const { content, found } = applyImageStateToMarkdown(THREE, {
      index: 2,
      attrStr: ATTR,
    });
    expect(found).toBe(true);
    expect(count(content, ATTR)).toBe(1);
    expect(content).toContain(`photo-3?w=1200) ${ATTR}`);
  });

  it('falls back to unique src without touching other images', () => {
    const { content, found, strategy } = applyImageStateToMarkdown(THREE, {
      src: 'https://images.unsplash.com/photo-2?w=1600',
      attrStr: ATTR,
    });
    expect(found).toBe(true);
    expect(strategy).toBe('src');
    expect(count(content, ATTR)).toBe(1);
  });

  it('updates only one GIF among siblings on the same line', () => {
    const gifs = '![a](https://cdn.example/1.gif) ![b](https://cdn.example/2.gif) ![c](https://cdn.example/3.gif)';
    const { content, found } = applyImageStateToMarkdown(gifs, { index: 1, attrStr: ATTR });
    expect(found).toBe(true);
    expect(count(content, ATTR)).toBe(1);
    expect(content).toContain('2.gif) {data-ir=');
    expect(content).not.toContain('1.gif) {data-ir=');
    expect(content).not.toContain('3.gif) {data-ir=');
  });

  it('updates only the selected HTML gif when two share a src', () => {
    const html = '<img src="https://cdn.example/a.gif" width="100"><img src="https://cdn.example/a.gif" width="100">';
    const { content, found, strategy } = applyImageStateToMarkdown(html, {
      src: 'https://cdn.example/a.gif',
      width: 220,
      htmlOccurrenceIndex: 1,
    });
    expect(found).toBe(true);
    expect(strategy).toBe('html');
    expect(content).toBe(
      '<img src="https://cdn.example/a.gif" width="100"><img src="https://cdn.example/a.gif" width="220">'
    );
  });
});

describe('mapDomImagesToMarkdownIndices', () => {
  it('skips html-only imgs so markdown indices stay aligned', () => {
    const mdSrcs = [
      'https://images.unsplash.com/photo-1?w=1200',
      'https://images.unsplash.com/photo-2?w=1600',
      'https://images.unsplash.com/photo-3?w=1200',
    ];
    const dom = [
      { src: mdSrcs[0] },
      { src: mdSrcs[1] },
      { src: mdSrcs[2] },
      { src: 'https://cdn.example/html-only.png', isHtmlOnly: true },
      { src: 'https://cdn.example/picture-fallback.png', isHtmlOnly: true },
    ];
    expect(mapDomImagesToMarkdownIndices(mdSrcs, dom)).toEqual([0, 1, 2, null, null]);
  });

  it('does not let a colliding-URL picture steal markdown irIndex', () => {
    const mdSrcs = [
      'https://images.unsplash.com/photo-1?w=1200',
      'https://images.unsplash.com/photo-2?w=1600',
      'https://images.unsplash.com/photo-3?w=1200',
    ];
    const dom = [
      { src: mdSrcs[0], isHtmlOnly: true },
      { src: mdSrcs[0] },
      { src: mdSrcs[1] },
      { src: mdSrcs[2] },
      { src: mdSrcs[2], isHtmlOnly: true },
    ];
    expect(mapDomImagesToMarkdownIndices(mdSrcs, dom)).toEqual([null, 0, 1, 2, null]);
  });
});

describe('updateHtmlAttribute', () => {
  it('replaces an existing width attr even after a global regex test', () => {
    const html = '<img width="100" src="https://cdn.example/a.gif">';
    expect(updateHtmlAttribute(html, 'width', 200)).toBe(
      '<img width="200" src="https://cdn.example/a.gif">'
    );
  });
});
