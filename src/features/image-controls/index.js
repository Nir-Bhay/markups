/**
 * Image preview presentation
 * Applies Markdown image layout attrs in preview. Editing UI lives in image-resize
 * (the floating ir-toolbar) — this module no longer shows a second layout popover.
 * @module features/image-controls
 */

import { debounce } from '../../utils/debounce.js';

const DEFAULT_ATTRS = { width: '100%', align: 'center', mode: 'smart' };
const IMAGE_MODE_RE = /(?:^|\s)mode\s*=\s*(embed|link|smart)\b/i;
const WIDTH_RE = /(?:^|\s)width\s*=\s*([\w.%/-]+)/i;
const ALIGN_RE = /(?:^|\s)align\s*=\s*(left|center|right)/i;
const VALID_WIDTH_RE = /^(?:[1-9]\d?|100)%$|^(?:1[2-9]\d|[2-9]\d{2}|1[0-5]\d{2}|1600)px$/;

function normalizeWidth(width) {
    const value = String(width || '').trim().toLowerCase();
    if (!value) return '';
    if (/^\d+$/.test(value)) return `${Math.max(10, Math.min(100, Number(value)))}%`;
    return VALID_WIDTH_RE.test(value) ? value : '';
}

function normalizeAlign(align) {
    const value = String(align || '').trim().toLowerCase();
    return ['left', 'center', 'right'].includes(value) ? value : '';
}

function parseImageAttributeText(text = '') {
    const source = String(text || '').replace(/^image\s+/i, '').trim();
    const modeMatch = source.match(IMAGE_MODE_RE);
    const attrs = {
        width: normalizeWidth(source.match(WIDTH_RE)?.[1] || ''),
        align: normalizeAlign(source.match(ALIGN_RE)?.[1] || '')
    };
    if (modeMatch?.[1]) {
        attrs.mode = modeMatch[1].toLowerCase();
    }
    return attrs;
}

export function parseImageAttributesFromMarkdown(markdown = '') {
    const map = new Map();
    const source = String(markdown || '');

    const remember = (url, alt, attrsText) => {
        const normalizedUrl = String(url || '').trim();
        if (!normalizedUrl) return;
        const attrs = parseImageAttributeText(attrsText);
        if (attrs.mode || attrs.width || attrs.align) {
            map.set(normalizedUrl, { ...attrs, alt: String(alt || '').trim() });
        }
    };

    const linked = /!\[([^\]]*)\]\(([^)\s]+)\)\s*\{\s*(?:image\s+)?([^}\n]*)\}/g;
    let match;
    while ((match = linked.exec(source)) !== null) {
        remember(match[2], match[1], match[3]);
    }

    const bare = /https?:\/\/[^\s<>()]+\s*\{\s*(?:image\s+)?([^}\n]*)\}/g;
    while ((match = bare.exec(source)) !== null) {
        remember(match[1], '', match[2]);
    }

    return map;
}

export function formatImageAttributeBlock(attrs = {}) {
    const width = normalizeWidth(attrs.width);
    const align = normalizeAlign(attrs.align);
    const mode = ['embed', 'link', 'smart'].includes(String(attrs.mode || '').toLowerCase())
        ? String(attrs.mode).toLowerCase()
        : '';
    const parts = [];

    if (mode && mode !== 'smart') parts.push(`mode=${mode}`);
    if (width && width !== DEFAULT_ATTRS.width) parts.push(`width=${width}`);
    if (align && align !== DEFAULT_ATTRS.align) parts.push(`align=${align}`);

    return parts.length > 0 ? `{image ${parts.join(' ')}}` : '';
}

export function updateImageAttributesInMarkdown(markdown, url, attrs = {}) {
    const normalizedTarget = String(url || '').trim();
    if (!normalizedTarget) return markdown;

    const block = formatImageAttributeBlock(attrs);
    const replacementSuffix = block ? ` ${block}` : '';
    const source = String(markdown || '');
    let replaced = false;

    const replaceIfMatch = (full, foundUrl, existingAttrs = '') => {
        if (replaced || String(foundUrl || '').trim() !== normalizedTarget) return full;
        replaced = true;
        return full.replace(existingAttrs || '', '').trimEnd() + replacementSuffix;
    };

    const linked = source.replace(/(!?\[[^\]]*\]\(([^)\s]+)\))(\s*\{[^}\n]*\})?/g, (full, linkPart, foundUrl, existingAttrs = '') => {
        if (replaced || String(foundUrl || '').trim() !== normalizedTarget) return full;
        replaced = true;
        return `${linkPart}${replacementSuffix}`;
    });
    if (replaced) return linked;

    const bare = source.replace(/(https?:\/\/[^\s<>()]+)(\s*\{[^}\n]*\})?/g, (full, foundUrl, existingAttrs = '') =>
        replaceIfMatch(full, foundUrl, existingAttrs)
    );
    if (replaced) return bare;

    return source;
}

export function applyImagePresentation(el, attrs = {}) {
    if (!el) return;
    const width = normalizeWidth(attrs.width) || DEFAULT_ATTRS.width;
    const align = normalizeAlign(attrs.align) || DEFAULT_ATTRS.align;
    const mode = ['embed', 'link', 'smart'].includes(String(attrs.mode || '').toLowerCase())
        ? String(attrs.mode).toLowerCase()
        : 'smart';

    el.dataset.imageWidth = width;
    el.dataset.imageAlign = align;
    el.dataset.imageMode = mode;
    el.style.width = width;
    el.style.maxWidth = '100%';
    el.style.height = 'auto';
    el.classList.remove('preview-image--align-left', 'preview-image--align-center', 'preview-image--align-right');
    el.classList.add(`preview-image--align-${align}`);

    if (align === 'left') {
        el.style.marginLeft = '0';
        el.style.marginRight = 'auto';
    } else if (align === 'right') {
        el.style.marginLeft = 'auto';
        el.style.marginRight = '0';
    } else {
        el.style.marginLeft = 'auto';
        el.style.marginRight = 'auto';
    }
}

/**
 * Marks preview images and applies layout attrs from Markdown.
 * No floating layout popover — image editing uses image-resize ir-toolbar.
 */
export class ImageControlsController {
    constructor({ output, getMarkdown } = {}) {
        this.output = typeof output === 'string' ? document.querySelector(output) : output;
        this.getMarkdown = getMarkdown;
        this._handleResize = debounce(() => {}, 80);
    }

    initialize() {
        if (!this.output) return;
        this.refresh(this.output);
    }

    refresh(output = this.output) {
        if (output) this.output = output;
        if (!this.output) return;

        this._preparePreviewImages();

        const attrsByUrl = parseImageAttributesFromMarkdown(this.getMarkdown?.() || '');
        this.output.querySelectorAll('.preview-image[data-image-url]').forEach((image) => {
            const url = String(image.dataset.imageUrl || '').trim();
            applyImagePresentation(image, attrsByUrl.get(url) || DEFAULT_ATTRS);
        });
    }

    _preparePreviewImages() {
        this.output.querySelectorAll('img[src]').forEach((img) => {
            if (img.closest('.preview-video')) return;
            const stableUrl = String(
                img.dataset.originalSrc ||
                img.getAttribute('data-original-src') ||
                ''
            ).trim();
            const fallbackUrl = String(img.getAttribute('src') || '').trim();
            const url = (stableUrl && !stableUrl.startsWith('data:') && !stableUrl.startsWith('blob:'))
                ? stableUrl
                : (fallbackUrl.startsWith('data:') || fallbackUrl.startsWith('blob:') ? '' : fallbackUrl);
            if (!url || url.startsWith('data:image/svg')) return;
            img.classList.add('preview-image');
            if (!img.dataset.imageUrl || img.dataset.imageUrl.startsWith('data:') || img.dataset.imageUrl.startsWith('blob:')) {
                img.dataset.imageUrl = url;
            }
        });
    }

    hide() {}

    dispose() {
        this.output = null;
    }
}

export function initImageControls(options) {
    const controller = new ImageControlsController(options);
    controller.initialize();
    return controller;
}

export default {
    ImageControlsController,
    applyImagePresentation,
    initImageControls,
    parseImageAttributesFromMarkdown,
    updateImageAttributesInMarkdown,
    formatImageAttributeBlock
};
