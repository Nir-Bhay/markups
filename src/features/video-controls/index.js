/**
 * Video preview controls
 * Adds lightweight size/alignment editing for embedded preview videos.
 * @module features/video-controls
 */

import { debounce } from '../../utils/debounce.js';
import { normalizeVideoUrl } from '../../utils/video-embed.js';

const VIDEO_ATTR_RE = /\{\s*(?:video\s+)?([^}]*)\}/i;
const WIDTH_RE = /(?:^|\s)width\s*=\s*([\w.%/-]+)/i;
const ALIGN_RE = /(?:^|\s)align\s*=\s*(left|center|right)/i;
const VALID_WIDTH_RE = /^(?:[1-9]\d?|100)%$|^(?:1[2-9]\d|[2-9]\d{2}|1[0-5]\d{2}|1600)px$/;
const DEFAULT_ATTRS = { width: '100%', align: 'center' };

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

export function parseVideoAttributeText(text = '') {
    const source = String(text || '').replace(/^video\s+/i, '').trim();
    return {
        width: normalizeWidth(source.match(WIDTH_RE)?.[1] || ''),
        align: normalizeAlign(source.match(ALIGN_RE)?.[1] || '')
    };
}

export function parseVideoAttributesFromMarkdown(markdown = '') {
    const map = new Map();
    const source = String(markdown || '');

    const remember = (url, attrsText) => {
        const normalizedUrl = normalizeVideoUrl(url);
        if (!normalizedUrl) return;
        const attrs = parseVideoAttributeText(attrsText);
        if (attrs.width || attrs.align) {
            map.set(normalizedUrl, attrs);
        }
    };

    const linked = /!?\[[^\]]*\]\(([^)\s]+)\)\s*\{\s*(?:video\s+)?([^}\n]*)\}/g;
    let match;
    while ((match = linked.exec(source)) !== null) {
        remember(match[1], match[2]);
    }

    const bare = /(https?:\/\/[^\s<>()]+)\s*\{\s*(?:video\s+)?([^}\n]*)\}/g;
    while ((match = bare.exec(source)) !== null) {
        remember(match[1], match[2]);
    }

    return map;
}

function formatVideoAttributeBlock(attrs = {}) {
    const width = normalizeWidth(attrs.width);
    const align = normalizeAlign(attrs.align);
    const parts = [];

    if (width && width !== DEFAULT_ATTRS.width) parts.push(`width=${width}`);
    if (align && align !== DEFAULT_ATTRS.align) parts.push(`align=${align}`);

    return parts.length > 0 ? `{video ${parts.join(' ')}}` : '';
}

export function updateVideoAttributesInMarkdown(markdown, url, attrs = {}) {
    const normalizedTarget = normalizeVideoUrl(url);
    if (!normalizedTarget) return markdown;

    const block = formatVideoAttributeBlock(attrs);
    const replacementSuffix = block ? ` ${block}` : '';
    const source = String(markdown || '');
    let replaced = false;

    const replaceIfMatch = (full, foundUrl, existingAttrs = '') => {
        if (replaced || normalizeVideoUrl(foundUrl) !== normalizedTarget) return full;
        replaced = true;
        return full.replace(existingAttrs || '', '').trimEnd() + replacementSuffix;
    };

    const linked = source.replace(/(!?\[[^\]]*\]\(([^)\s]+)\))(\s*\{[^}\n]*\})?/g, (full, linkPart, foundUrl, existingAttrs = '') => {
        if (replaced || normalizeVideoUrl(foundUrl) !== normalizedTarget) return full;
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

export function applyVideoPresentation(el, attrs = {}) {
    if (!el) return;
    const width = normalizeWidth(attrs.width) || DEFAULT_ATTRS.width;
    const align = normalizeAlign(attrs.align) || DEFAULT_ATTRS.align;

    el.dataset.videoWidth = width;
    el.dataset.videoAlign = align;
    el.style.width = width;
    el.style.maxWidth = '100%';
    el.style.marginLeft = '';
    el.style.marginRight = '';

    el.classList.remove('preview-video--align-left', 'preview-video--align-center', 'preview-video--align-right');
    el.classList.add(`preview-video--align-${align}`);

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

function getAttrsFromElement(el) {
    return {
        width: normalizeWidth(el?.dataset?.videoWidth) || DEFAULT_ATTRS.width,
        align: normalizeAlign(el?.dataset?.videoAlign) || DEFAULT_ATTRS.align
    };
}

export class VideoControlsController {
    constructor({ output, getMarkdown, onMarkdownChange, showToast } = {}) {
        this.output = typeof output === 'string' ? document.querySelector(output) : output;
        this.getMarkdown = getMarkdown;
        this.onMarkdownChange = onMarkdownChange;
        this.showToast = showToast;
        this.activeVideo = null;
        this.toolbar = null;
        this._handleClick = this._handleClick.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handleResize = debounce(() => this._positionToolbar(), 80);
    }

    initialize() {
        if (!this.output) return;
        this._ensureToolbar();
        this.output.addEventListener('click', this._handleClick);
        document.addEventListener('click', this._handleDocumentClick, true);
        window.addEventListener('resize', this._handleResize);
        window.addEventListener('scroll', this._handleResize, true);
        this.refresh(this.output);
    }

    refresh(output = this.output) {
        if (output) this.output = output;
        if (!this.output) return;

        const attrsByUrl = parseVideoAttributesFromMarkdown(this.getMarkdown?.() || '');
        this.output.querySelectorAll('.preview-video[data-video-url]').forEach((video) => {
            const url = normalizeVideoUrl(video.dataset.videoUrl);
            applyVideoPresentation(video, attrsByUrl.get(url) || DEFAULT_ATTRS);
        });

        if (this.activeVideo && !document.body.contains(this.activeVideo)) {
            this.hide();
        } else {
            this._positionToolbar();
        }
    }

    _ensureToolbar() {
        if (this.toolbar && document.body.contains(this.toolbar)) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'video-controls-popover hidden';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Video preview controls');
        toolbar.innerHTML = `
            <div class="video-controls-header">
                <span class="video-controls-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 4.75A1.75 1.75 0 0 1 3.75 3h8.5A1.75 1.75 0 0 1 14 4.75v6.5A1.75 1.75 0 0 1 12.25 13h-8.5A1.75 1.75 0 0 1 2 11.25v-6.5Zm1.75-.25a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-8.5Zm3 1.75 3 1.75-3 1.75v-3.5Z" />
                    </svg>
                </span>
                <span>
                    <strong>Video layout</strong>
                    <small>Saved into Markdown</small>
                </span>
            </div>
            <div class="video-controls-section" aria-label="Video size">
                <span class="video-controls-label">Size</span>
                <div class="video-controls-group">
                    <button type="button" data-video-width="25%" aria-label="Set video width to 25 percent">25%</button>
                    <button type="button" data-video-width="50%" aria-label="Set video width to 50 percent">50%</button>
                    <button type="button" data-video-width="75%" aria-label="Set video width to 75 percent">75%</button>
                    <button type="button" data-video-width="100%" aria-label="Set video width to 100 percent">100%</button>
                </div>
            </div>
            <span class="video-controls-divider" aria-hidden="true"></span>
            <div class="video-controls-section" aria-label="Video alignment">
                <span class="video-controls-label">Align</span>
                <div class="video-controls-group">
                    <button type="button" data-video-align="left" aria-label="Align video left">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="12" x2="12" y2="12"/></svg>
                        Left
                    </button>
                    <button type="button" data-video-align="center" aria-label="Align video center">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/></svg>
                        Center
                    </button>
                    <button type="button" data-video-align="right" aria-label="Align video right">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><line x1="2" y1="4" x2="14" y2="4"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="4" y1="12" x2="14" y2="12"/></svg>
                        Right
                    </button>
                </div>
            </div>
        `;
        toolbar.addEventListener('click', (event) => this._handleToolbarClick(event));
        document.body.appendChild(toolbar);
        this.toolbar = toolbar;
    }

    _handleClick(event) {
        const target = event.target.closest?.('.preview-video');
        if (!target || !this.output?.contains(target)) return;
        this.show(target);
    }

    _handleDocumentClick(event) {
        if (!this.toolbar || this.toolbar.classList.contains('hidden')) return;
        if (this.toolbar.contains(event.target) || this.activeVideo?.contains(event.target)) return;
        this.hide();
    }

    show(video) {
        this.activeVideo?.classList.remove('preview-video--selected');
        this.activeVideo = video;
        this.activeVideo.classList.add('preview-video--selected');
        this._syncToolbarState();
        this._positionToolbar();
        this.toolbar?.classList.remove('hidden');
    }

    hide() {
        this.activeVideo?.classList.remove('preview-video--selected');
        this.activeVideo = null;
        this.toolbar?.classList.add('hidden');
    }

    _handleToolbarClick(event) {
        const button = event.target.closest('button');
        if (!button || !this.activeVideo) return;

        const current = getAttrsFromElement(this.activeVideo);
        const next = { ...current };
        if (button.dataset.videoWidth) next.width = button.dataset.videoWidth;
        if (button.dataset.videoAlign) next.align = button.dataset.videoAlign;

        applyVideoPresentation(this.activeVideo, next);
        this._syncToolbarState();
        this._positionToolbar();
        this._persist(next);
    }

    _persist(attrs) {
        const markdown = this.getMarkdown?.();
        const url = this.activeVideo?.dataset?.videoUrl;
        if (typeof markdown !== 'string' || !url || !this.onMarkdownChange) return;

        const next = updateVideoAttributesInMarkdown(markdown, url, attrs);
        if (next !== markdown) {
            this.onMarkdownChange(next);
            this.showToast?.('Video layout updated', 'success', 1200);
        }
    }

    _syncToolbarState() {
        if (!this.toolbar || !this.activeVideo) return;
        const attrs = getAttrsFromElement(this.activeVideo);
        this.toolbar.querySelectorAll('button').forEach((button) => {
            const active = button.dataset.videoWidth === attrs.width || button.dataset.videoAlign === attrs.align;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    _positionToolbar() {
        if (!this.toolbar || !this.activeVideo || this.toolbar.classList.contains('hidden')) return;
        const rect = this.activeVideo.getBoundingClientRect();
        const toolbarRect = this.toolbar.getBoundingClientRect();
        const top = Math.max(12, rect.top - toolbarRect.height - 10);
        const left = Math.min(
            window.innerWidth - toolbarRect.width - 12,
            Math.max(12, rect.left + rect.width / 2 - toolbarRect.width / 2)
        );
        this.toolbar.style.top = `${top}px`;
        this.toolbar.style.left = `${left}px`;
    }

    dispose() {
        this.output?.removeEventListener('click', this._handleClick);
        document.removeEventListener('click', this._handleDocumentClick, true);
        window.removeEventListener('resize', this._handleResize);
        window.removeEventListener('scroll', this._handleResize, true);
        this.toolbar?.remove();
        this.toolbar = null;
        this.activeVideo = null;
    }
}

export function initVideoControls(options) {
    const controller = new VideoControlsController(options);
    controller.initialize();
    return controller;
}

export default {
    VideoControlsController,
    applyVideoPresentation,
    initVideoControls,
    parseVideoAttributesFromMarkdown,
    updateVideoAttributesInMarkdown
};
