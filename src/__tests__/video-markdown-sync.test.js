import { describe, expect, it } from 'vitest';
import {
  getVideoOccurrenceIndex,
  updateVideoAttributesInMarkdownOccurrence,
} from '../features/video-controls/markdown-sync.js';

function formatBlock(attrs = {}) {
  const parts = [];
  if (attrs.width) parts.push(`width=${attrs.width}`);
  if (attrs.align) parts.push(`align=${attrs.align}`);
  return parts.length ? `{video ${parts.join(' ')}}` : '';
}

describe('updateVideoAttributesInMarkdownOccurrence', () => {
  it('updates only the middle video on a shared line', () => {
    const line = 'https://example.com/a.mp4 https://example.com/b.mp4 https://example.com/c.mp4';
    const next = updateVideoAttributesInMarkdownOccurrence(
      line,
      'https://example.com/b.mp4',
      { width: '50%', align: 'right' },
      {},
      formatBlock
    );
    expect((next.match(/\{video/g) || []).length).toBe(1);
    expect(next).toContain('b.mp4 {video width=50% align=right}');
    expect(next).not.toMatch(/a\.mp4 \{video/);
    expect(next).not.toMatch(/c\.mp4 \{video/);
  });

  it('updates the second duplicate URL when occurrenceIndex is 1', () => {
    const line = 'https://example.com/a.mp4 https://example.com/a.mp4 https://example.com/b.mp4';
    const next = updateVideoAttributesInMarkdownOccurrence(
      line,
      'https://example.com/a.mp4',
      { width: '25%' },
      { occurrenceIndex: 1 },
      formatBlock
    );
    expect((next.match(/\{video/g) || []).length).toBe(1);
    expect(next).toBe(
      'https://example.com/a.mp4 https://example.com/a.mp4 {video width=25%} https://example.com/b.mp4'
    );
  });

  it('does not touch sibling GIF markdown images on the same line', () => {
    const line = '![gif-a](https://cdn.example/a.gif) https://example.com/clip.mp4 ![gif-b](https://cdn.example/b.gif)';
    const next = updateVideoAttributesInMarkdownOccurrence(
      line,
      'https://example.com/clip.mp4',
      { width: '50%' },
      {},
      formatBlock
    );
    expect((next.match(/\{video/g) || []).length).toBe(1);
    expect(next).toContain('clip.mp4 {video width=50%}');
    expect(next).not.toContain('.gif) {video');
  });
});

describe('getVideoOccurrenceIndex', () => {
  it('returns DOM-order occurrence among duplicate video URLs', () => {
    document.body.innerHTML = `
      <article id="output">
        <div class="preview-video" data-video-url="https://example.com/a.mp4"></div>
        <div class="preview-video" data-video-url="https://example.com/a.mp4"></div>
        <div class="preview-video" data-video-url="https://example.com/b.mp4"></div>
      </article>
    `;
    const root = document.getElementById('output');
    const videos = [...root.querySelectorAll('.preview-video')];
    expect(getVideoOccurrenceIndex(root, videos[0])).toBe(0);
    expect(getVideoOccurrenceIndex(root, videos[1])).toBe(1);
    expect(getVideoOccurrenceIndex(root, videos[2])).toBe(0);
    document.body.innerHTML = '';
  });
});
