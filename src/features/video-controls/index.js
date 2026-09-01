/**
 * Video preview controls
 * Adds lightweight size/alignment editing for embedded preview videos.
 * @module features/video-controls
 */

import { debounce } from '../../utils/debounce.js';
import { positionMediaPopover } from '../../utils/media-popover-position.js';
import { normalizeVideoUrl } from '../../utils/video-embed.js';

const VIDEO_ATTR_RE = /\{\s*(?:video\s+)?([^}]*)\}/i;
const WIDTH_RE = /(?:^|\s)width\s*=\s*([\w.%/-]+)/i;
const ALIGN_RE = /(?:^|\s)align\s*=\s*(left|center|right)/i;
const DATE_RE = /(?:^|\s)date\s*=\s*([^\s}]+)/i;
const CAPTION_RE = /(?:^|\s)caption\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/i;
const ROTATE_RE = /(?:^|\s)rotate\s*=\s*(-?\d+)\b/i;
const FLIP_RE = /(?:^|\s)flip\s*=\s*(h|v|hv)\b/i;
const SHADOW_RE = /(?:^|\s)shadow\s*=\s*(none|sm|md|lg)\b/i;
const RADIUS_RE = /(?:^|\s)radius\s*=\s*(\d+)\b/i;
const VALID_WIDTH_RE = /^(?:[1-9]\d?|100)%$|^(?:1[2-9]\d|[2-9]\d{2}|1[0-5]\d{2}|1600)px$/;
const DEFAULT_ATTRS = { width: '100%', align: 'center' };
const VIDEO_MODE_ATTR = 'data-video-mode';
const VIDEO_MODE_RE = /(?:^|\s)(?:video\s+)?mode\s*=\s*(embed|link|smart)\b/i;
const SHADOW_STEPS = ['none', 'sm', 'md', 'lg'];
const RADIUS_STEPS = [0, 8, 16, 24];
const SHADOW_CSS = {
    none: '',
    sm: '0 2px 8px rgba(15, 23, 42, 0.12)',
    md: '0 8px 24px rgba(15, 23, 42, 0.18)',
    lg: '0 16px 40px rgba(15, 23, 42, 0.24)'
};

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

function normalizeFlip(flip) {
    const value = String(flip || '').trim().toLowerCase();
    return ['h', 'v', 'hv'].includes(value) ? value : '';
}

function normalizeShadow(shadow) {
    const value = String(shadow || '').trim().toLowerCase();
    return SHADOW_STEPS.includes(value) ? value : '';
}

function normalizeRadius(radius) {
    const n = Number(radius);
    return Number.isFinite(n) && n >= 0 ? Math.min(48, Math.round(n)) : 0;
}

function normalizeRotate(rotate) {
    const n = Number(rotate);
    if (!Number.isFinite(n)) return 0;
    // Keep in -360..360, snap to multiples of 90 for toolbar UX.
    return ((Math.round(n / 90) * 90) % 360 + 360) % 360;
}

function normalizeCaption(caption) {
    return String(caption || '').trim().replace(/\s+/g, ' ');
}

function formatCaptionToken(caption) {
    const value = normalizeCaption(caption);
    if (!value) return '';
    if (/[\s"'}]/.test(value)) return `caption="${value.replace(/"/g, '')}"`;
    return `caption=${value}`;
}

function hasStyleAttrs(attrs = {}) {
    return Boolean(
        attrs.mode || attrs.width || attrs.align || attrs.date || attrs.caption ||
        attrs.flip || attrs.shadow || attrs.rotate || attrs.radius
    );
}

export function parseVideoAttributeText(text = '') {
    const source = String(text || '').replace(/^video\s+/i, '').trim();
    const modeMatch = source.match(VIDEO_MODE_RE);
    const dateMatch = source.match(DATE_RE);
    const captionMatch = source.match(CAPTION_RE);
    const attrs = {
        width: normalizeWidth(source.match(WIDTH_RE)?.[1] || ''),
        align: normalizeAlign(source.match(ALIGN_RE)?.[1] || '')
    };
    if (modeMatch?.[1]) {
        attrs.mode = modeMatch[1].toLowerCase();
    }
    if (dateMatch?.[1]) {
        attrs.date = String(dateMatch[1]).trim();
    }
    const caption = normalizeCaption(captionMatch?.[1] || captionMatch?.[2] || captionMatch?.[3] || '');
    if (caption) {
        attrs.caption = caption;
    }
    const flip = normalizeFlip(source.match(FLIP_RE)?.[1] || '');
    if (flip) attrs.flip = flip;
    const shadow = normalizeShadow(source.match(SHADOW_RE)?.[1] || '');
    if (shadow && shadow !== 'none') attrs.shadow = shadow;
    const rotate = normalizeRotate(source.match(ROTATE_RE)?.[1] || 0);
    if (rotate) attrs.rotate = rotate;
    const radius = normalizeRadius(source.match(RADIUS_RE)?.[1] || 0);
    if (radius) attrs.radius = radius;
    return attrs;
}

export function parseVideoAttributesFromMarkdown(markdown = '') {
    const map = new Map();
    const source = String(markdown || '');

    const remember = (url, attrsText) => {
        const normalizedUrl = normalizeVideoUrl(url);
        if (!normalizedUrl) return;
        const attrs = parseVideoAttributeText(attrsText);
        if (hasStyleAttrs(attrs)) {
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
    const mode = ['embed', 'link', 'smart'].includes(String(attrs.mode || '').toLowerCase())
        ? String(attrs.mode).toLowerCase()
        : '';
    const date = String(attrs.date || '').trim();
    const captionToken = formatCaptionToken(attrs.caption);
    const flip = normalizeFlip(attrs.flip);
    const shadow = normalizeShadow(attrs.shadow);
    const rotate = normalizeRotate(attrs.rotate);
    const radius = normalizeRadius(attrs.radius);
    const parts = [];

    if (mode && mode !== 'smart') parts.push(`mode=${mode}`);
    if (width && width !== DEFAULT_ATTRS.width) parts.push(`width=${width}`);
    if (align && align !== DEFAULT_ATTRS.align) parts.push(`align=${align}`);
    if (flip) parts.push(`flip=${flip}`);
    if (shadow && shadow !== 'none') parts.push(`shadow=${shadow}`);
    if (rotate) parts.push(`rotate=${rotate}`);
    if (radius) parts.push(`radius=${radius}`);
    if (date) parts.push(`date=${date}`);
    if (captionToken) parts.push(captionToken);

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
    const mode = ['embed', 'link', 'smart'].includes(String(attrs.mode || '').toLowerCase())
        ? String(attrs.mode).toLowerCase()
        : 'smart';
    const date = String(attrs.date || '').trim();
    const caption = normalizeCaption(attrs.caption);
    const flip = normalizeFlip(attrs.flip);
    const shadow = normalizeShadow(attrs.shadow) || 'none';
    const rotate = normalizeRotate(attrs.rotate);
    const radius = normalizeRadius(attrs.radius);

    el.dataset.videoWidth = width;
    el.dataset.videoAlign = align;
    el.dataset.videoMode = mode;
    el.dataset.videoDate = date;
    el.dataset.videoCaption = caption;
    el.dataset.videoFlip = flip;
    el.dataset.videoShadow = shadow;
    el.dataset.videoRotate = String(rotate);
    el.dataset.videoRadius = String(radius);
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

    const visual = el.querySelector('.preview-video-frame') || el.querySelector('video') || el;
    const transforms = [];
    if (flip.includes('h')) transforms.push('scaleX(-1)');
    if (flip.includes('v')) transforms.push('scaleY(-1)');
    if (rotate) transforms.push(`rotate(${rotate}deg)`);
    visual.style.transform = transforms.length ? transforms.join(' ') : '';
    visual.style.transformOrigin = 'center center';
    visual.style.boxShadow = SHADOW_CSS[shadow] || '';
    visual.style.borderRadius = radius ? `${radius}px` : '';
    if (radius) visual.style.overflow = 'hidden';

    let captionEl = el.querySelector('.preview-video-caption');
    if (caption) {
        if (!captionEl) {
            captionEl = document.createElement('div');
            captionEl.className = 'preview-video-caption';
            el.appendChild(captionEl);
        }
        captionEl.textContent = caption;
    } else if (captionEl) {
        captionEl.remove();
    }

    let dateEl = el.querySelector('.preview-video-date');
    if (date) {
        if (!dateEl) {
            dateEl = document.createElement('div');
            dateEl.className = 'preview-video-date';
            el.appendChild(dateEl);
        }
        dateEl.textContent = date;
    } else if (dateEl) {
        dateEl.remove();
    }
}

function getAttrsFromElement(el) {
    return {
        mode: String(el?.dataset?.videoMode || 'smart'),
        width: normalizeWidth(el?.dataset?.videoWidth) || DEFAULT_ATTRS.width,
        align: normalizeAlign(el?.dataset?.videoAlign) || DEFAULT_ATTRS.align,
        date: String(el?.dataset?.videoDate || '').trim(),
        caption: normalizeCaption(el?.dataset?.videoCaption || ''),
        flip: normalizeFlip(el?.dataset?.videoFlip || ''),
        shadow: normalizeShadow(el?.dataset?.videoShadow || '') || 'none',
        rotate: normalizeRotate(el?.dataset?.videoRotate || 0),
        radius: normalizeRadius(el?.dataset?.videoRadius || 0)
    };
}

function toggleFlip(current, axis) {
    const set = new Set(String(current || '').split('').filter((c) => c === 'h' || c === 'v'));
    if (set.has(axis)) set.delete(axis);
    else set.add(axis);
    const next = `${set.has('h') ? 'h' : ''}${set.has('v') ? 'v' : ''}`;
    return next || '';
}

function cycleShadow(current) {
    const idx = SHADOW_STEPS.indexOf(normalizeShadow(current) || 'none');
    return SHADOW_STEPS[(idx + 1) % SHADOW_STEPS.length];
}

function cycleRadius(current) {
    const value = normalizeRadius(current);
    const idx = RADIUS_STEPS.indexOf(value);
    return RADIUS_STEPS[idx >= 0 ? (idx + 1) % RADIUS_STEPS.length : 0];
}

/** Build markdown for a preview video node, preserving layout attrs. */
export function serializeVideoMarkdown(el) {
    if (!el) return '';
    let url = String(el.dataset?.videoUrl || '').trim();
    if (!url) {
        const video = el.querySelector('video[src]');
        url = video?.getAttribute('src') || '';
    }
    if (!url) {
        const iframe = el.querySelector('iframe[src]');
        const src = iframe?.getAttribute('src') || '';
        const youtube = src.match(/youtube(?:-nocookie)?\.com\/embed\/([^/?#]+)/i);
        if (youtube) url = `https://youtu.be/${decodeURIComponent(youtube[1])}`;
        else {
            const vimeo = src.match(/player\.vimeo\.com\/video\/([^/?#]+)/i);
            if (vimeo) url = `https://vimeo.com/${decodeURIComponent(vimeo[1])}`;
            else url = src;
        }
    }
    if (!url) return '';
    const block = formatVideoAttributeBlock(getAttrsFromElement(el));
    return block ? `${url} ${block}\n\n` : `${url}\n\n`;
}

export class VideoControlsController {
    constructor({ output, getMarkdown, onMarkdownChange, showToast } = {}) {
        this.output = typeof output === 'string' ? document.querySelector(output) : output;
        this.getMarkdown = getMarkdown;
        this.onMarkdownChange = onMarkdownChange;
        this.showToast = showToast;
        this.activeVideo = null;
        this.toolbar = null;
        // Element that had keyboard focus right before the popover opened.
        // Restored on hide() so Escape / close returns the user to where they were
        // (improves keyboard / screen-reader navigation — a11y M2).
        this._returnFocusTo = null;
        this._handleClick = this._handleClick.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handleDateInput = this._handleDateInput.bind(this);
        this._handleCaptionInput = this._handleCaptionInput.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleResize = debounce(() => this._positionToolbar(), 80);
    }

    initialize() {
        if (!this.output) return;
        this._ensureToolbar();
        this.output.addEventListener('click', this._handleClick);
        document.addEventListener('click', this._handleDocumentClick, true);
        document.addEventListener('keydown', this._handleKeydown);
        window.addEventListener('resize', this._handleResize);
        window.addEventListener('scroll', this._handleResize, true);
        this.toolbar?.addEventListener('input', this._handleDateInput);
        this.toolbar?.addEventListener('input', this._handleCaptionInput);
        this.refresh(this.output);
    }

    refresh(output = this.output) {
        if (output) this.output = output;
        if (!this.output) return;

        const attrsByUrl = parseVideoAttributesFromMarkdown(this.getMarkdown?.() || '');
        this.output.querySelectorAll('.preview-video[data-video-url]').forEach((video) => {
            const url = normalizeVideoUrl(video.dataset.videoUrl);
            applyVideoPresentation(video, attrsByUrl.get(url) || DEFAULT_ATTRS);
            this._ensureHitbox(video);
        });

        if (this.activeVideo && !document.body.contains(this.activeVideo)) {
            this.hide();
        } else {
            this._positionToolbar();
        }
    }

    _ensureHitbox(video) {
        if (!video?.classList.contains('preview-video--embed')) return;

        let frame = video.querySelector('.preview-video-frame');
        if (!frame) {
            frame = document.createElement('div');
            frame.className = 'preview-video-frame';
            const iframe = video.querySelector('iframe');
            if (iframe) frame.appendChild(iframe);
            video.insertBefore(frame, video.firstChild);
        }

        let hitbox = frame.querySelector('.preview-video-hitbox') || video.querySelector('.preview-video-hitbox');
        if (!hitbox) {
            hitbox = document.createElement('button');
            hitbox.type = 'button';
            hitbox.className = 'preview-video-hitbox';
            hitbox.setAttribute('aria-label', 'Select video to edit layout');
            hitbox.title = 'Click to edit video layout';
            frame.appendChild(hitbox);
        } else if (hitbox.parentElement !== frame) {
            frame.appendChild(hitbox);
        }

        let editBtn = video.querySelector('.preview-video-edit-btn');
        if (!editBtn) {
            editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'preview-video-edit-btn';
            editBtn.setAttribute('aria-label', 'Edit video layout');
            editBtn.title = 'Edit video';
            editBtn.textContent = 'Edit';
            video.appendChild(editBtn);
        }

        const playing = video.classList.contains('preview-video--playing');
        hitbox.hidden = playing;
        // Edit chip is only needed after Play unlocks the iframe.
        editBtn.hidden = !playing;
    }

    _setPlaying(video, playing) {
        if (!video) return;
        video.classList.toggle('preview-video--playing', Boolean(playing));
        const hitbox = video.querySelector('.preview-video-hitbox');
        if (hitbox) hitbox.hidden = Boolean(playing);
        const editBtn = video.querySelector('.preview-video-edit-btn');
        if (editBtn) editBtn.hidden = !playing;
    }

    _ensureToolbar() {
        if (this.toolbar && document.body.contains(this.toolbar)) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'video-layout-bar video-controls-popover hidden';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Video controls');
        toolbar.innerHTML = `
            <div class="video-layout-row">
                <div class="video-layout-group" role="group" aria-label="Behavior">
                    <button type="button" data-video-mode="smart" data-tooltip="Smart" aria-label="Smart embed video when appropriate">Smart</button>
                    <button type="button" data-video-mode="embed" data-tooltip="Embed" aria-label="Always embed video">Embed</button>
                    <button type="button" data-video-mode="link" data-tooltip="Link" aria-label="Keep as link">Link</button>
                </div>
                <span class="video-layout-sep" aria-hidden="true"></span>
                <div class="video-layout-group" role="group" aria-label="Size">
                    <button type="button" data-video-width="25%" data-tooltip="25%" aria-label="Set video width to 25 percent">25%</button>
                    <button type="button" data-video-width="50%" data-tooltip="50%" aria-label="Set video width to 50 percent">50%</button>
                    <button type="button" data-video-width="75%" data-tooltip="75%" aria-label="Set video width to 75 percent">75%</button>
                    <button type="button" data-video-width="100%" data-tooltip="100%" aria-label="Set video width to 100 percent">100%</button>
                </div>
                <span class="video-layout-sep" aria-hidden="true"></span>
                <div class="video-layout-group" role="group" aria-label="Align">
                    <button type="button" data-video-align="left" data-tooltip="Align left" aria-label="Align video left">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                    </button>
                    <button type="button" data-video-align="center" data-tooltip="Align center" aria-label="Align video center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                    </button>
                    <button type="button" data-video-align="right" data-tooltip="Align right" aria-label="Align video right">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                    </button>
                </div>
                <span class="video-layout-sep" aria-hidden="true"></span>
                <div class="video-layout-group" role="group" aria-label="Direction">
                    <button type="button" data-video-action="flip-h" data-tooltip="Flip left / right" aria-label="Flip video horizontally">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    </button>
                    <button type="button" data-video-action="flip-v" data-tooltip="Flip up / down" aria-label="Flip video vertically">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 7 19 3 15 7"/><path d="M13 21h2a4 4 0 0 0 4-4V3"/><polyline points="1 17 5 21 9 17"/><path d="M11 3H9a4 4 0 0 0-4 4v14"/></svg>
                    </button>
                    <button type="button" data-video-action="rotate-left" data-tooltip="Rotate left" aria-label="Rotate video left">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    </button>
                    <button type="button" data-video-action="rotate-right" data-tooltip="Rotate right" aria-label="Rotate video right">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    </button>
                </div>
                <span class="video-layout-sep" aria-hidden="true"></span>
                <div class="video-layout-group" role="group" aria-label="Style">
                    <button type="button" data-video-action="shadow" data-tooltip="Shadow" aria-label="Cycle video shadow">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    </button>
                    <button type="button" data-video-action="radius" data-tooltip="Corners" aria-label="Cycle video corner radius">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>
                    </button>
                    <button type="button" data-video-action="reset-style" data-tooltip="Reset style" aria-label="Reset video style">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
                    </button>
                </div>
                <span class="video-layout-sep" aria-hidden="true"></span>
                <div class="video-layout-group" role="group" aria-label="Playback">
                    <button type="button" class="video-controls-play" data-video-action="play" data-tooltip="Play" aria-label="Play video in preview">Play</button>
                    <button type="button" class="video-controls-edit" data-video-action="edit" data-tooltip="Edit layout" aria-label="Keep editing video layout">Edit</button>
                    <button type="button" class="video-layout-more" data-video-action="details" data-tooltip="Date &amp; caption" aria-label="Toggle date and caption" aria-expanded="false">⋯</button>
                </div>
                <button type="button" class="video-layout-close" data-video-action="close" data-tooltip="Close" aria-label="Close video controls">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>
                </button>
            </div>
            <div class="video-layout-details" hidden>
                <label class="video-layout-field">
                    <span>Date</span>
                    <input type="date" class="video-controls-date" aria-label="Set video date" />
                    <button type="button" class="video-controls-date-clear" aria-label="Clear video date">Clear</button>
                </label>
                <label class="video-layout-field video-layout-field--grow">
                    <span>Caption</span>
                    <input type="text" class="video-controls-caption" placeholder="Optional caption" aria-label="Set video caption" maxlength="120" />
                    <button type="button" class="video-controls-caption-clear" aria-label="Clear video caption">Clear</button>
                </label>
            </div>
        `;
        toolbar.addEventListener('click', (event) => this._handleToolbarClick(event));
        toolbar.addEventListener('keydown', (event) => this._handleToolbarKeydown(event));
        document.body.appendChild(toolbar);
        this.toolbar = toolbar;
    }

    _getToolbarButtons() {
        return Array.from(this.toolbar?.querySelectorAll('button') ?? []);
    }

    _handleToolbarKeydown(event) {
        const buttons = this._getToolbarButtons();
        const index = buttons.indexOf(document.activeElement);
        if (index < 0) return;

        let nextIndex = -1;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = (index + 1) % buttons.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = buttons.length - 1;
        }

        if (nextIndex >= 0 && nextIndex !== index) {
            event.preventDefault();
            buttons[nextIndex]?.focus();
        }
    }

    _handleClick(event) {
        const editBtn = event.target.closest?.('.preview-video-edit-btn');
        if (editBtn) {
            const video = editBtn.closest('.preview-video');
            if (!video || !this.output?.contains(video)) return;
            event.preventDefault();
            this.show(video);
            return;
        }

        const target = event.target.closest?.('.preview-video');
        if (!target || !this.output?.contains(target)) return;
        // While unlocked for playback, ignore wrapper clicks so YouTube can play.
        if (target.classList.contains('preview-video--playing') && !event.target.closest('.preview-video-hitbox')) {
            return;
        }
        this.show(target);
    }

    _handleDocumentClick(event) {
        if (!this.toolbar || this.toolbar.classList.contains('hidden')) return;
        if (this.toolbar.contains(event.target) || this.activeVideo?.contains(event.target)) return;
        this.hide();
    }

    _handleKeydown(event) {
        if (event.key === 'Escape' && this.toolbar && !this.toolbar.classList.contains('hidden')) {
            this.hide();
        }
    }

    show(video) {
        // a11y M2: remember where keyboard focus was so we can return it on close.
        this._returnFocusTo = document.activeElement;
        this.activeVideo?.classList.remove('preview-video--selected');
        this.activeVideo = video;
        this.activeVideo.classList.add('preview-video--selected');
        // Selecting a video returns to edit mode (overlay catches clicks again).
        this._setPlaying(this.activeVideo, false);
        this._syncToolbarState();
        const attrs = getAttrsFromElement(this.activeVideo);
        this._setDetailsOpen(Boolean(attrs.date || attrs.caption));
        this.toolbar?.classList.remove('hidden');
        requestAnimationFrame(() => this._positionToolbar());
    }

    hide() {
        if (this.activeVideo) {
            this.activeVideo.classList.remove('preview-video--selected');
            // If user unlocked Play, keep player interactive after toolbar closes.
            if (this.activeVideo.classList.contains('preview-video--playing')) {
                const editBtn = this.activeVideo.querySelector('.preview-video-edit-btn');
                if (editBtn) editBtn.hidden = false;
            }
        }
        this.activeVideo = null;
        this.toolbar?.classList.add('hidden');
        // a11y M2: return focus to the element that opened the popover.
        if (this._returnFocusTo && typeof this._returnFocusTo.focus === 'function') {
            try { this._returnFocusTo.focus(); } catch (_) { /* ignore stale element */ }
            this._returnFocusTo = null;
        }
        this._setDetailsOpen(false);
    }

    _setDetailsOpen(open) {
        const details = this.toolbar?.querySelector('.video-layout-details');
        const toggle = this.toolbar?.querySelector('[data-video-action="details"]');
        if (!details || !toggle) return;
        details.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.classList.toggle('active', open);
    }

    _handleToolbarClick(event) {
        const button = event.target.closest('button');
        if (!button || !this.activeVideo) return;

        const action = button.dataset.videoAction;
        if (action === 'close') {
            this.hide();
            return;
        }
        if (action === 'details') {
            const details = this.toolbar?.querySelector('.video-layout-details');
            this._setDetailsOpen(Boolean(details?.hidden));
            requestAnimationFrame(() => this._positionToolbar());
            return;
        }
        if (action === 'play') {
            this._setPlaying(this.activeVideo, true);
            this.showToast?.('Video unlocked — click Play on the player', 'info', 1800);
            this._syncToolbarState();
            return;
        }
        if (action === 'edit') {
            this._setPlaying(this.activeVideo, false);
            this._syncToolbarState();
            return;
        }

        const current = getAttrsFromElement(this.activeVideo);
        const next = { ...current };

        if (action === 'flip-h') {
            next.flip = toggleFlip(current.flip, 'h');
        } else if (action === 'flip-v') {
            next.flip = toggleFlip(current.flip, 'v');
        } else if (action === 'rotate-left') {
            next.rotate = normalizeRotate(current.rotate - 90);
        } else if (action === 'rotate-right') {
            next.rotate = normalizeRotate(current.rotate + 90);
        } else if (action === 'shadow') {
            next.shadow = cycleShadow(current.shadow);
        } else if (action === 'radius') {
            next.radius = cycleRadius(current.radius);
        } else if (action === 'reset-style') {
            next.flip = '';
            next.shadow = 'none';
            next.rotate = 0;
            next.radius = 0;
        } else {
            if (button.dataset.videoWidth) next.width = button.dataset.videoWidth;
            if (button.dataset.videoAlign) next.align = button.dataset.videoAlign;
            if (button.dataset.videoMode) next.mode = button.dataset.videoMode;
            if (button.classList.contains('video-controls-date-clear')) next.date = '';
            if (button.classList.contains('video-controls-caption-clear')) next.caption = '';
        }

        applyVideoPresentation(this.activeVideo, next);
        this._syncToolbarState();
        this._positionToolbar();
        this._persist(next);
    }

    _handleDateInput(event) {
        if (!this.activeVideo || !event.target.classList.contains('video-controls-date')) return;
        const date = String(event.target.value || '').trim();
        const next = { ...getAttrsFromElement(this.activeVideo), date };
        applyVideoPresentation(this.activeVideo, next);
        this._syncToolbarState();
        this._positionToolbar();
        this._persist(next);
    }

    _handleCaptionInput(event) {
        if (!this.activeVideo || !event.target.classList.contains('video-controls-caption')) return;
        const caption = normalizeCaption(event.target.value);
        const next = { ...getAttrsFromElement(this.activeVideo), caption };
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
        const dateInput = this.toolbar.querySelector('.video-controls-date');
        if (dateInput) {
            dateInput.value = attrs.date || '';
        }
        const captionInput = this.toolbar.querySelector('.video-controls-caption');
        if (captionInput && document.activeElement !== captionInput) {
            captionInput.value = attrs.caption || '';
        }
        const isPlaying = this.activeVideo.classList.contains('preview-video--playing');
        this.toolbar.querySelectorAll('button').forEach((button) => {
            const action = button.dataset.videoAction;
            if (action === 'details' || action === 'close' || action === 'reset-style') return;
            const active =
                (button.dataset.videoWidth && button.dataset.videoWidth === attrs.width) ||
                (button.dataset.videoAlign && button.dataset.videoAlign === attrs.align) ||
                (button.dataset.videoMode && button.dataset.videoMode === attrs.mode) ||
                (action === 'play' && isPlaying) ||
                (action === 'edit' && !isPlaying) ||
                (action === 'flip-h' && attrs.flip.includes('h')) ||
                (action === 'flip-v' && attrs.flip.includes('v')) ||
                (action === 'shadow' && attrs.shadow && attrs.shadow !== 'none') ||
                (action === 'radius' && attrs.radius > 0) ||
                ((action === 'rotate-left' || action === 'rotate-right') && attrs.rotate > 0);
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    _positionToolbar() {
        if (!this.toolbar || !this.activeVideo || this.toolbar.classList.contains('hidden')) return;
        positionMediaPopover(this.toolbar, this.activeVideo, { prefer: 'above', gap: 10 });
    }

    dispose() {
        this.output?.removeEventListener('click', this._handleClick);
        document.removeEventListener('click', this._handleDocumentClick, true);
        document.removeEventListener('keydown', this._handleKeydown);
        this.toolbar?.removeEventListener('input', this._handleDateInput);
        this.toolbar?.removeEventListener('input', this._handleCaptionInput);
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
    serializeVideoMarkdown,
    updateVideoAttributesInMarkdown
};
