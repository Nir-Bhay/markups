/**
 * Pure markdown writeback helpers for image-resize persistence.
 * @module features/image-resize/markdown-sync
 */

/**
 * Escape a string for safe embedding in a RegExp source.
 * @param {string} value
 * @returns {string}
 */
export function escapeRegexSrc(value) {
    const text = String(value || '');
    if (!text || text.length > 1000) return '';
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply persisted image state to exactly one markdown/HTML image occurrence.
 * Primary key is markdown image index (0-based among `![...](...)` only).
 * Falls back to exact src match, then HTML <img src>.
 *
 * @param {string} content
 * @param {{ index?: number|null, src?: string, attrStr?: string, encodedState?: string, width?: number|null, height?: number|null, align?: string|null }} opts
 * @returns {{ content: string, found: boolean, strategy: string|null }}
 */
export function applyImageStateToMarkdown(content, opts = {}) {
    const source = String(content ?? '');
    const attrStr = opts.attrStr ? String(opts.attrStr).trim() : '';
    const attrSuffix = attrStr ? ` ${attrStr}` : '';
    const encodedState = opts.encodedState ? String(opts.encodedState) : '';
    const imgSrc = opts.src ? String(opts.src) : '';
    const targetIndex = Number.isInteger(opts.index) && opts.index >= 0 ? opts.index : null;

    let found = false;
    let strategy = null;
    let next = source;

    // Strategy 1: exact markdown-image index (must increment on every match)
    if (targetIndex !== null) {
        const pattern = /!\[([^\]]*)\]\(([^)]+)\)\s*(?:\{[^}]*\})?/g;
        let currentIdx = 0;
        next = source.replace(pattern, (match, altText, src) => {
            if (currentIdx === targetIndex) {
                found = true;
                strategy = 'index';
                currentIdx += 1;
                return `![${altText}](${src})${attrSuffix}`;
            }
            currentIdx += 1;
            return match;
        });
    }

    // Strategy 2: exact markdown src (single URL — replace all identical srcs only when unique intent)
    if (!found && imgSrc && !imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:')) {
        const escapedSrc = escapeRegexSrc(imgSrc);
        if (escapedSrc) {
            try {
                const mdPattern = new RegExp(
                    `!\\[([^\\]]*)\\]\\(${escapedSrc}\\)\\s*(?:\\{[^}]*\\})?`,
                    'g'
                );
                const matches = source.match(mdPattern);
                if (matches && matches.length === 1) {
                    found = true;
                    strategy = 'src';
                    next = source.replace(
                        new RegExp(mdPattern.source, 'g'),
                        (_match, altText) => `![${altText}](${imgSrc})${attrSuffix}`
                    );
                } else if (matches && matches.length > 1 && targetIndex !== null) {
                    // Duplicate URLs: fall through — index strategy should have handled it
                }
            } catch {
                // ignore invalid pattern
            }
        }
    }

    // Strategy 3: HTML <img> (first unique src, or occurrenceIndex among duplicates)
    if (!found && imgSrc && !imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:') && imgSrc.length < 500) {
        const escapedSrc = escapeRegexSrc(imgSrc);
        if (escapedSrc) {
            try {
                const htmlPattern = new RegExp(`<img\\b([^>]*?)\\bsrc=["']${escapedSrc}["']([^>]*)>`, 'gi');
                const htmlMatches = source.match(htmlPattern) || [];
                htmlPattern.lastIndex = 0;
                const htmlOccurrence = Number.isInteger(opts.htmlOccurrenceIndex) && opts.htmlOccurrenceIndex >= 0
                    ? opts.htmlOccurrenceIndex
                    : 0;
                if (htmlMatches.length > 0 && htmlOccurrence < htmlMatches.length) {
                    found = true;
                    strategy = 'html';
                    let htmlIdx = 0;
                    next = source.replace(htmlPattern, (match) => {
                        if (htmlIdx !== htmlOccurrence) {
                            htmlIdx += 1;
                            return match;
                        }
                        htmlIdx += 1;
                        let result = match;
                        result = updateHtmlAttribute(result, 'width', opts.width ?? null);
                        result = updateHtmlAttribute(result, 'height', opts.height ?? null);
                        result = updateHtmlAttribute(result, 'align', opts.align ?? null);
                        result = updateHtmlAttribute(result, 'data-ir', encodedState || null);
                        return result;
                    });
                }
            } catch {
                // ignore
            }
        }
    }

    return { content: found ? next : source, found, strategy };
}

/**
 * @param {string} html
 * @param {string} attr
 * @param {string|number|null} value
 * @returns {string}
 */
export function updateHtmlAttribute(html, attr, value) {
    if (value === null || value === undefined || value === '') {
        return html.replace(new RegExp(`\\s*${attr}=["'][^"']*["']`, 'gi'), '');
    }
    const pattern = new RegExp(`${attr}=["'][^"']*["']`, 'i');
    if (pattern.test(html)) {
        return html.replace(new RegExp(`${attr}=["'][^"']*["']`, 'i'), `${attr}="${value}"`);
    }
    return html.replace(/<img/i, `<img ${attr}="${value}"`);
}

/**
 * Preview images that must not consume markdown `![...](...)` indices.
 * Video fallbacks, mermaid, and <picture> sources can share Unsplash/GIF URLs
 * with nearby markdown images and would otherwise steal irIndex.
 *
 * @param {Element|null} img
 * @returns {boolean}
 */
export function isNonMarkdownPreviewImage(img) {
    if (!img || typeof img.closest !== 'function') return false;
    if (img.closest('.preview-video, .mermaid, .katex')) return true;
    if (img.closest('picture')) return true;
    // Markdown image renderer only emits src/alt/title. Width/height HTML
    // attributes mean this node came from raw HTML (or a later HTML writeback).
    if (img.hasAttribute('width') || img.hasAttribute('height')) return true;
    return false;
}

/**
 * Count previous HTML-only preview images that share this src.
 * @param {Element} img
 * @returns {number}
 */
export function getHtmlImageOccurrenceIndex(img) {
    if (!img) return 0;
    const src = String(img.getAttribute('src') || img.dataset?.originalSrc || '').trim();
    const root = img.closest('#output') || img.ownerDocument || document;
    let count = 0;
    for (const node of root.querySelectorAll('img')) {
        if (node === img) return count;
        if (!isNonMarkdownPreviewImage(node)) continue;
        const nodeSrc = String(node.getAttribute('src') || node.dataset?.originalSrc || '').trim();
        if (nodeSrc && src && nodeSrc === src) count += 1;
    }
    return 0;
}

/**
 * Pair preview <img> nodes to markdown `![...](...)` entries by order,
 * skipping DOM images that are clearly not from markdown image syntax
 * when a stable originalSrc hint is absent and src is not in the MD list.
 *
 * @param {string[]} markdownSrcs - src values from markdown images in order
 * @param {{ src?: string, originalSrc?: string, isHtmlOnly?: boolean }[]} domImages
 * @returns {(number|null)[]} md index per DOM image (null = not a markdown image)
 */
export function mapDomImagesToMarkdownIndices(markdownSrcs, domImages) {
    const result = new Array(domImages.length).fill(null);
    let mdCursor = 0;
    const mdList = Array.isArray(markdownSrcs) ? markdownSrcs : [];

    for (let i = 0; i < domImages.length; i += 1) {
        const dom = domImages[i] || {};
        if (dom.isHtmlOnly) continue;

        const hint = String(dom.originalSrc || '').trim();
        const src = String(dom.src || '').trim();

        // Prefer exact match against remaining markdown srcs
        let matched = -1;
        for (let j = mdCursor; j < mdList.length; j += 1) {
            const mdSrc = String(mdList[j] || '');
            if (hint && (hint === mdSrc || srcEndsWith(src, mdSrc) || srcEndsWith(hint, mdSrc))) {
                matched = j;
                break;
            }
            if (!hint && src && (src === mdSrc || srcEndsWith(src, mdSrc))) {
                matched = j;
                break;
            }
        }

        if (matched >= 0) {
            result[i] = matched;
            mdCursor = matched + 1;
            continue;
        }

        // Sequential fallback for resolved/data URLs still belonging to MD stream
        if (mdCursor < mdList.length && !dom.isHtmlOnly) {
            // Only consume sequential slot when this looks like a content image
            // (has alt handling left to caller). Skip obvious non-md if src is http
            // and never appears in markdown list.
            const appearsInMd = mdList.some((mdSrc) => src && (src === mdSrc || srcEndsWith(src, mdSrc)));
            if (hint || appearsInMd || !src || src.startsWith('data:') || src.startsWith('blob:')) {
                result[i] = mdCursor;
                mdCursor += 1;
            }
        }
    }

    return result;
}

function srcEndsWith(full, part) {
    if (!full || !part) return false;
    return full === part || full.endsWith(part) || part.endsWith(full);
}
