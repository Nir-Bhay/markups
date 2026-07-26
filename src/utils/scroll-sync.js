/**
 * Scroll Sync Utilities
 * Pure anchor-based synchronization between Monaco editor and preview
 * Uses data-source-line attributes on preview elements for pixel-accurate sync
 * (Fixes delay, cuts, and drift on long docs — Issue #39)
 * @module utils/scroll-sync
 */

import { eventBus, EVENTS } from './eventBus.js';

/**
 * ScrollSync class
 * Bidirectional sync using editor pixel positions ↔ preview data-source-line elements
 */
class ScrollSync {
    constructor() {
        this.enabled = false;
        this.isSyncing = false;
        this.editor = null;
        this.preview = null; // scrollable container (.preview-wrapper)
        this.contentRoot = null; // #output (rendered markdown)
        this.anchors = []; // [{ line, previewTop }] sorted by line
        this.cleanupFunctions = [];
        this._syncTimeout = null;
        this._rebuildRaf = null;
        this._editorRaf = null;
        this._previewRaf = null;
        this.onPreviewScrollExtra = null; // optional callback (outline UI)
    }

    /**
     * @param {Object} editor - Monaco editor instance
     * @param {HTMLElement} preview - Scrollable preview wrapper
     * @param {Object} [options]
     * @param {HTMLElement} [options.contentRoot] - Rendered markdown root (#output)
     * @param {Function} [options.onPreviewScroll] - Extra preview scroll hook
     */
    initialize(editor, preview, options = {}) {
        this.destroy();
        this.editor = editor;
        this.preview = preview;
        this.contentRoot = options.contentRoot || preview?.querySelector('#output') || preview;
        this.onPreviewScrollExtra = options.onPreviewScroll || null;
        this.setupEventListeners();
        this.rebuildAnchors();
    }

    enable() {
        this.enabled = true;
        eventBus.emit(EVENTS.MODE_CHANGED, { scrollSync: true });
    }

    disable() {
        this.enabled = false;
        eventBus.emit(EVENTS.MODE_CHANGED, { scrollSync: false });
    }

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
    }

    /**
     * Rebuild line ↔ preview offset map from [data-source-line] elements.
     * Call after every preview render and when <details> open/close.
     */
    rebuildAnchors() {
        if (!this.editor || !this.preview) {
            this.anchors = [];
            return;
        }

        const root = this.contentRoot || this.preview;
        const elements = root.querySelectorAll('[data-source-line]');
        if (elements.length === 0) {
            this.anchors = [];
            return;
        }

        const previewRect = this.preview.getBoundingClientRect();
        const scrollTop = this.preview.scrollTop;

        const anchors = [];
        elements.forEach(el => {
            const line = parseInt(el.getAttribute('data-source-line'), 10);
            if (isNaN(line) || line < 1) return;

            const top = el.getBoundingClientRect().top - previewRect.top + scrollTop;
            anchors.push({ line, previewTop: Math.max(0, top) });
        });

        // Dedupe by line (keep first/lowest previewTop for each line)
        const seen = new Map();
        anchors.forEach(a => {
            if (!seen.has(a.line) || a.previewTop < seen.get(a.line)) {
                seen.set(a.line, a.previewTop);
            }
        });

        this.anchors = Array.from(seen.entries())
            .map(([line, previewTop]) => ({ line, previewTop }))
            .sort((a, b) => a.line - b.line);

        // Add end anchor (last line ↔ bottom of content)
        if (this.anchors.length > 0) {
            const model = this.editor.getModel();
            const lineCount = model ? model.getLineCount() : this.anchors[this.anchors.length - 1].line;
            const contentHeight = Math.max(
                this.preview.scrollHeight,
                root.scrollHeight || 0
            );
            this.anchors.push({
                line: Math.max(1, lineCount),
                previewTop: Math.max(0, contentHeight)
            });
        }
    }

    /** Schedule rebuild on next frame (coalesce rapid updates) */
    scheduleRebuildAnchors() {
        if (this._rebuildRaf) cancelAnimationFrame(this._rebuildRaf);
        this._rebuildRaf = requestAnimationFrame(() => {
            this._rebuildRaf = null;
            this.rebuildAnchors();
        });
    }

    setupEventListeners() {
        if (!this.editor || !this.preview) return;

        // Editor scroll → preview sync (rAF-throttled)
        const editorScrollHandler = this.editor.onDidScrollChange(() => {
            if (!this.enabled || this.isSyncing) return;
            if (this._editorRaf) cancelAnimationFrame(this._editorRaf);
            this._editorRaf = requestAnimationFrame(() => {
                this._editorRaf = null;
                this.syncEditorToPreview();
            });
        });
        this.cleanupFunctions.push(() => editorScrollHandler.dispose());

        // Preview scroll → editor sync (rAF-throttled)
        const previewScrollHandler = () => {
            if (typeof this.onPreviewScrollExtra === 'function') {
                this.onPreviewScrollExtra();
            }
            if (!this.enabled || this.isSyncing) return;
            if (this._previewRaf) cancelAnimationFrame(this._previewRaf);
            this._previewRaf = requestAnimationFrame(() => {
                this._previewRaf = null;
                this.syncPreviewToEditor();
            });
        };
        this.preview.addEventListener('scroll', previewScrollHandler, { passive: true });
        this.cleanupFunctions.push(() => {
            this.preview.removeEventListener('scroll', previewScrollHandler);
        });

        // Issue #39: collapsed <details> change preview height → rebuild map
        const detailsToggleHandler = (e) => {
            if (e.target && e.target.tagName === 'DETAILS') {
                this.scheduleRebuildAnchors();
            }
        };
        this.preview.addEventListener('toggle', detailsToggleHandler, true);
        this.cleanupFunctions.push(() => {
            this.preview.removeEventListener('toggle', detailsToggleHandler, true);
        });

        // Rebuild when preview content size changes (images, mermaid, etc.)
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => this.scheduleRebuildAnchors());
            const observeTarget = this.contentRoot || this.preview;
            ro.observe(observeTarget);
            this.cleanupFunctions.push(() => ro.disconnect());
        }
    }

    /**
     * Editor → preview using pure anchor-based sync.
     * Maps editor pixel position to preview pixel position via anchor map.
     */
    syncEditorToPreview() {
        if (!this.editor || !this.preview) return;
        if (this.anchors.length < 2) return;

        this._beginSync();

        const edScrollTop = this.editor.getScrollTop();
        const topLine = this._getEditorTopLine();
        const lineTop = this.editor.getTopForLineNumber(topLine);
        const lineHeight = this._getLineHeight();
        const subLineRatio = Math.max(0, Math.min(1, (edScrollTop - lineTop) / lineHeight));

        const targetY = this._previewTopForEditorPosition(topLine, subLineRatio);

        this.preview.scrollTop = targetY;

        this._endSync();
        eventBus.emit(EVENTS.SCROLL_SYNC_PREVIEW, { line: topLine, y: targetY });
    }

    /**
     * Preview → editor using pure anchor-based sync.
     */
    syncPreviewToEditor() {
        if (!this.editor || !this.preview) return;
        if (this.anchors.length < 2) return;

        this._beginSync();

        const pvScrollTop = this.preview.scrollTop;
        const line = this._lineForPreviewTop(pvScrollTop);
        const edTop = this._editorTopForLine(line);

        this.editor.setScrollTop(edTop);

        this._endSync();
        eventBus.emit(EVENTS.SCROLL_SYNC_EDITOR, { line, y: edTop });
    }

    scrollToTop() {
        this._beginSync();
        this.editor?.setScrollTop(0);
        if (this.preview) this.preview.scrollTop = 0;
        this._endSync();
    }

    scrollToRatio(ratio) {
        const r = Math.min(1, Math.max(0, ratio));
        this._beginSync();
        if (this.editor) {
            const max = Math.max(0, this.editor.getScrollHeight() - this.editor.getLayoutInfo().height);
            this.editor.setScrollTop(max * r);
        }
        if (this.preview) {
            const max = Math.max(0, this.preview.scrollHeight - this.preview.clientHeight);
            this.preview.scrollTop = max * r;
        }
        this._endSync();
    }

    destroy() {
        if (this._syncTimeout) clearTimeout(this._syncTimeout);
        if (this._rebuildRaf) cancelAnimationFrame(this._rebuildRaf);
        if (this._editorRaf) cancelAnimationFrame(this._editorRaf);
        if (this._previewRaf) cancelAnimationFrame(this._previewRaf);
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
        this.editor = null;
        this.preview = null;
        this.contentRoot = null;
        this.anchors = [];
        this.onPreviewScrollExtra = null;
    }

    // ─── Internals ───────────────────────────────────────────

    _beginSync() {
        this.isSyncing = true;
        if (this._syncTimeout) clearTimeout(this._syncTimeout);
    }

    _endSync() {
        this._syncTimeout = setTimeout(() => {
            this.isSyncing = false;
            this._syncTimeout = null;
        }, 80);
    }

    /** Get the line number at the top of the editor viewport (binary search) */
    _getEditorTopLine() {
        const model = this.editor.getModel();
        if (!model) return 1;

        const scrollTop = this.editor.getScrollTop();
        let lo = 1;
        let hi = model.getLineCount();
        while (lo < hi) {
            const mid = Math.floor((lo + hi + 1) / 2);
            const top = this.editor.getTopForLineNumber(mid);
            if (top <= scrollTop + 1) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    _getLineHeight() {
        try {
            return this.editor.getOption?.(58) ?? // EditorOption.lineHeight
                this.editor.getOption?.('lineHeight') ??
                20;
        } catch {
            return 20;
        }
    }

    _editorTopForLine(line) {
        try {
            return this.editor.getTopForLineNumber(Math.max(1, Math.floor(line)));
        } catch {
            return 0;
        }
    }

    /**
     * Given an editor line + sub-line ratio, return the ideal preview scrollTop.
     * Uses anchor map with pixel-accurate interpolation.
     */
    _previewTopForEditorPosition(line, subLineRatio) {
        const anchors = this.anchors;
        if (anchors.length === 0) return 0;

        // Find the segment containing this line
        let i = 0;
        while (i < anchors.length - 1 && anchors[i + 1].line <= line) i++;

        const a = anchors[i];
        const b = anchors[Math.min(i + 1, anchors.length - 1)];
        if (a.line === b.line) return a.previewTop;

        // Interpolate: line position + sub-line pixel ratio
        const lineFraction = (line - a.line) / (b.line - a.line);
        const pixelFraction = lineFraction + (subLineRatio / (b.line - a.line));
        const t = Math.max(0, Math.min(1, pixelFraction));
        return a.previewTop + t * (b.previewTop - a.previewTop);
    }

    /**
     * Given a preview scrollTop, return the ideal editor line number.
     */
    _lineForPreviewTop(previewTop) {
        const anchors = this.anchors;
        if (anchors.length === 0) return 1;
        if (previewTop <= anchors[0].previewTop) return anchors[0].line;

        let i = 0;
        while (
            i < anchors.length - 1 &&
            anchors[i + 1].previewTop <= previewTop
        ) {
            i++;
        }

        const a = anchors[i];
        const b = anchors[Math.min(i + 1, anchors.length - 1)];
        if (a.previewTop === b.previewTop) return a.line;

        const t = (previewTop - a.previewTop) / (b.previewTop - a.previewTop);
        return a.line + t * (b.line - a.line);
    }
}

export const scrollSync = new ScrollSync();
export default scrollSync;
