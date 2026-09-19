/**
 * Video markdown writeback helpers — occurrence-aware updates.
 * @module features/video-controls/markdown-sync
 */

import { normalizeVideoUrl } from '../../utils/video-embed.js';

const LINKED_VIDEO_RE = /(!?\[[^\]]*\]\(([^)\s]+)\))(\s*\{[^}\n]*\})?/g;
const BARE_VIDEO_RE = /(https?:\/\/[^\s<>()]+)(\s*\{[^}\n]*\})?/g;

/**
 * @param {string} markdown
 * @param {string} url
 * @param {Object} attrs
 * @param {{ occurrenceIndex?: number|null }} [options]
 * @param {(attrs?: Object) => string} formatBlock
 * @returns {string}
 */
export function updateVideoAttributesInMarkdownOccurrence(
  markdown,
  url,
  attrs,
  options,
  formatBlock
) {
  const normalizedTarget = normalizeVideoUrl(url);
  if (!normalizedTarget) return markdown;

  const block = formatBlock(attrs);
  const replacementSuffix = block ? ` ${block}` : '';
  const source = String(markdown || '');
  const occurrenceIndex = Number.isInteger(options?.occurrenceIndex) && options.occurrenceIndex >= 0
    ? options.occurrenceIndex
    : null;

  let replaced = false;
  let urlMatchCursor = 0;

  const replaceIfMatch = (full, foundUrl, existingAttrs = '') => {
    if (normalizeVideoUrl(foundUrl) !== normalizedTarget) return full;

    if (occurrenceIndex !== null) {
      if (urlMatchCursor !== occurrenceIndex) {
        urlMatchCursor += 1;
        return full;
      }
      urlMatchCursor += 1;
      replaced = true;
      return full.replace(existingAttrs || '', '').trimEnd() + replacementSuffix;
    }

    if (replaced) return full;
    replaced = true;
    return full.replace(existingAttrs || '', '').trimEnd() + replacementSuffix;
  };

  const linked = source.replace(LINKED_VIDEO_RE, (full, _linkPart, foundUrl, existingAttrs = '') =>
    replaceIfMatch(full, foundUrl, existingAttrs)
  );
  if (replaced) return linked;

  return source.replace(BARE_VIDEO_RE, (full, foundUrl, existingAttrs = '') =>
    replaceIfMatch(full, foundUrl, existingAttrs)
  );
}

/**
 * Count how many preview videos share the same URL before `video` in DOM order.
 * @param {ParentNode|null} root
 * @param {Element|null} video
 * @returns {number}
 */
export function getVideoOccurrenceIndex(root, video) {
  if (!root || !video) return 0;
  const targetUrl = normalizeVideoUrl(video.dataset?.videoUrl || '');
  if (!targetUrl) return 0;

  let count = 0;
  for (const node of root.querySelectorAll('.preview-video[data-video-url]')) {
    if (node === video) return count;
    if (normalizeVideoUrl(node.dataset.videoUrl) === targetUrl) count += 1;
  }
  return 0;
}
