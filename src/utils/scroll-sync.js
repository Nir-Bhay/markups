/**
 * Scroll Sync Utilities
 * Bidirectional editor ↔ preview sync with direction-aware echo locking
 * and block-aligned mapping for tighter section sync (Issue #39).
 * @module utils/scroll-sync
 */

import { eventBus, EVENTS } from './eventBus.js';

/** Ignore reverse-sync echoes while the driving pane is still settling. */
const ECHO_LOCK_MS = 120;
/** Coalesce expensive DOM rebuilds (MutationObserver / resize storms). */
const REBUILD_DEBOUNCE_MS = 120;

/**
 * Enforce monotonic non-decreasing positions for an anchor coordinate, so
 * segment interpolation can never produce a backwards jump ("halt then jump")
 * when a few source-line annotations resolve out of order. (Issue #39)
 * @param {{[key:string]:number}[]} anchors
 * @param {string} key
 */
export function clampMonotonic(anchors, key) {
    if (!anchors || !anchors.length) return anchors;
    let prev = -Infinity;
    for (const a of anchors) {
        const v = Number(a[key]);
        if (Number.isFinite(v)) {
            if (v < prev) a[key] = prev;
            else prev = v;
        }
    }
    return anchors;
}

/**
 * Locate the [a, b] segment bracketing `value` on `key` and the local progress.
 * Pure + testable. (Issue #39)
 * @param {number} value
 * @param {string} key - 'editorTop' | 'previewTop'
 * @param {{[key:string]:number}[]} anchors
 * @returns {{ a: any, b: any, t: number }|null}
 */
export function findAnchorSegment(value, key, anchors = []) {
    if (!anchors.length) return null;
    if (value <= anchors[0][key]) {
        return { a: anchors[0], b: anchors[Math.min(1, anchors.length - 1)], t: 0 };
    }
    let lo = 0;
    let hi = anchors.length - 1;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (anchors[mid][key] <= value) lo = mid;
        else hi = mid - 1;
    }
    const a = anchors[lo];
    const b = anchors[Math.min(lo + 1, anchors.length - 1)];

    // Value is at or past the last anchor: full travel reached.
    if (lo === anchors.length - 1 && value >= a[key]) {
        return { a, b: a, t: 1 };
    }

    if (a[key] === b[key]) {
        return { a, b, t: 0 };
    }
    const t = (value - a[key]) / (b[key] - a[key]);
    return { a, b, t: Math.max(0, Math.min(1, t)) };
}

/**
 * ScrollSync class
 * Maps Monaco pixel scroll ↔ preview [data-source-line] anchors.
 * Within a block segment, progress is mapped by local height ratio so tall
 * tables/images don't leave the paired pane stuck on the previous section.
 */
class ScrollSync {
    constructor() {
        this.enabled = false;
        /** @type {'editor'|'preview'|null} */
        this.syncSource = null;
        this.editor = null;
        this.preview = null;
        this.contentRoot = null;
        /** @type {{ line: number, previewTop: number, editorTop: number, el?: Element|null }[]} */
        this.anchors = [];
        this.cleanupFunctions = [];
        this._echoUnlockTimer = null;
        this._rebuildTimer = null;
        this._rebuildRaf = null;
        this._editorRaf = null;
        this._previewRaf = null;
        this._userScrolling = false;
        this._userScrollIdleTimer = null;
        this.onPreviewScrollExtra = null;
    }

    /**
     * @param {Object} editor - Monaco editor instance
     * @param {HTMLElement} preview - Scrollable preview wrapper
     * @param {Object} [options]
     * @param {HTMLElement} [options.contentRoot]
     * @param {Function} [options.onPreviewScroll]
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
        this.scheduleRebuildAnchors();
        eventBus.emit(EVENTS.MODE_CHANGED, { scrollSync: true });
    }

    disable() {
        this.enabled = false;
        this._clearEchoLock();
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
        if (this.enabled) {
            this.scheduleRebuildAnchors();
        } else {
            this._clearEchoLock();
        }
    }

    /**
     * Rebuild line ↔ preview/editor offset map from [data-source-line] elements.
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
        elements.forEach((el) => {
            const line = parseInt(el.getAttribute('data-source-line'), 10);
            if (isNaN(line) || line < 1) return;

            if (el.tagName === 'LI' && el.parentElement?.closest('[data-source-line]')) {
                const parentBlock = el.parentElement.closest('ul, ol');
                if (parentBlock?.hasAttribute('data-source-line')) return;
            }

            const top = el.getBoundingClientRect().top - previewRect.top + scrollTop;
            anchors.push({
                line,
                previewTop: Math.max(0, top),
                editorTop: this._editorTopForLine(line),
                el
            });
        });

        const seen = new Map();
        anchors.forEach((a) => {
            const prev = seen.get(a.line);
            if (!prev || a.previewTop < prev.previewTop) {
                seen.set(a.line, a);
            }
        });

        this.anchors = Array.from(seen.values()).sort((a, b) => {
            if (a.line !== b.line) return a.line - b.line;
            return a.previewTop - b.previewTop;
        });

        if (this.anchors.length > 0) {
            const model = this.editor.getModel();
            const lineCount = model
                ? model.getLineCount()
                : this.anchors[this.anchors.length - 1].line;

            const previewMax = this._previewMaxScroll();
            const editorMax = this._editorMaxScroll();

            // Monaco's getTopForLineNumber() can report positions PAST the
            // editor's real scroll range (the trailing blank area / viewport
            // slack). Any anchor pinned that high is unreachable, so the sync
            // mapping stalls short of the preview bottom and the final section
            // (credit) never appears. (Issue #39)
            //   → Clamp every real anchor's editorTop to the actual scroll max.
            for (const a of this.anchors) {
                if (a.editorTop > editorMax && editorMax > 0) {
                    a.editorTop = editorMax;
                }
            }

            // End control point = (editorMax, previewMax): parking the editor at
            // the bottom of its scroll bar must land the preview at its bottom.
            this.anchors.push({
                line: Math.max(1, lineCount),
                previewTop: Math.max(0, previewMax),
                editorTop: Math.max(0, editorMax),
                el: null
            });

            // Re-sort by editorTop so the binary-search in findAnchorSegment is
            // valid, then guarantee monotonic non-decreasing positions in both
            // coordinates so interpolation never jumps backwards. (Issue #39)
            this.anchors.sort((a, b) => a.editorTop - b.editorTop || a.previewTop - b.previewTop);
            clampMonotonic(this.anchors, 'editorTop');
            clampMonotonic(this.anchors, 'previewTop');
        }
    }

    /** Schedule rebuild soon (coalesced). Skipped while user is actively scrolling. */
    scheduleRebuildAnchors() {
        if (this._userScrolling) return;

        if (this._rebuildTimer) clearTimeout(this._rebuildTimer);
        this._rebuildTimer = setTimeout(() => {
            this._rebuildTimer = null;
            if (this._rebuildRaf) cancelAnimationFrame(this._rebuildRaf);
            this._rebuildRaf = requestAnimationFrame(() => {
                this._rebuildRaf = null;
                if (!this._userScrolling) {
                    this.rebuildAnchors();
                }
            });
        }, REBUILD_DEBOUNCE_MS);
    }

    setupEventListeners() {
        if (!this.editor || !this.preview) return;

        const markUserScrolling = () => {
            this._userScrolling = true;
            if (this._userScrollIdleTimer) clearTimeout(this._userScrollIdleTimer);
            this._userScrollIdleTimer = setTimeout(() => {
                this._userScrolling = false;
                this._userScrollIdleTimer = null;
                this.rebuildAnchors();
            }, ECHO_LOCK_MS + 40);
        };

        const editorScrollHandler = this.editor.onDidScrollChange((e) => {
            if (e && e.scrollTopChanged === false) return;
            markUserScrolling();

            if (!this.enabled) return;
            if (this.syncSource === 'preview') return;

            if (this._editorRaf) cancelAnimationFrame(this._editorRaf);
            this._editorRaf = requestAnimationFrame(() => {
                this._editorRaf = null;
                this.syncEditorToPreview();
            });
        });
        this.cleanupFunctions.push(() => editorScrollHandler.dispose());

        const previewScrollHandler = () => {
            markUserScrolling();

            if (typeof this.onPreviewScrollExtra === 'function') {
                this.onPreviewScrollExtra();
            }

            if (!this.enabled) return;
            if (this.syncSource === 'editor') return;

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

        if ('onscrollend' in window) {
            const onScrollEnd = () => {
                if (!this.enabled || this.syncSource) return;
                this.rebuildAnchors();
            };
            this.preview.addEventListener('scrollend', onScrollEnd, { passive: true });
            this.cleanupFunctions.push(() => {
                this.preview.removeEventListener('scrollend', onScrollEnd);
            });
        }

        const detailsToggleHandler = (e) => {
            if (e.target && e.target.tagName === 'DETAILS') {
                this.scheduleRebuildAnchors();
            }
        };
        this.preview.addEventListener('toggle', detailsToggleHandler, true);
        this.cleanupFunctions.push(() => {
            this.preview.removeEventListener('toggle', detailsToggleHandler, true);
        });

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => this.scheduleRebuildAnchors());
            const observeTarget = this.contentRoot || this.preview;
            ro.observe(observeTarget);
            this.cleanupFunctions.push(() => ro.disconnect());
        }

        if (typeof this.editor.onDidLayoutChange === 'function') {
            const layoutDisposable = this.editor.onDidLayoutChange(() => {
                this.scheduleRebuildAnchors();
            });
            this.cleanupFunctions.push(() => layoutDisposable.dispose());
        }
        if (typeof this.editor.onDidContentSizeChange === 'function') {
            const sizeDisposable = this.editor.onDidContentSizeChange(() => {
                this.scheduleRebuildAnchors();
            });
            this.cleanupFunctions.push(() => sizeDisposable.dispose());
        }

        if (typeof document !== 'undefined' && document.fonts) {
            document.fonts.ready.then(() => this.scheduleRebuildAnchors()).catch(() => {});
        }

        if (typeof MutationObserver !== 'undefined') {
            const mo = new MutationObserver(() => this.scheduleRebuildAnchors());
            const observeTarget = this.contentRoot || this.preview;
            mo.observe(observeTarget, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
            this.cleanupFunctions.push(() => mo.disconnect());
        }
    }

    syncEditorToPreview() {
        if (!this.editor || !this.preview) return;
        if (this.anchors.length < 2) return;

        this._beginSync('editor');

        const edScrollTop = this.editor.getScrollTop();
        const targetY = this._clamp(
            this._previewTopForEditorScroll(edScrollTop),
            0,
            this._previewMaxScroll()
        );
        const topLine = this._lineForEditorScroll(edScrollTop);

        if (Math.abs(this.preview.scrollTop - targetY) > 0.5) {
            this.preview.scrollTop = targetY;
        }

        this._endSync();
        eventBus.emit(EVENTS.SCROLL_SYNC_PREVIEW, { line: topLine, y: targetY });
    }

    syncPreviewToEditor() {
        if (!this.editor || !this.preview) return;
        if (this.anchors.length < 2) return;

        this._beginSync('preview');

        const pvScrollTop = this.preview.scrollTop;
        const edTop = this._clamp(
            this._editorTopForPreviewScroll(pvScrollTop),
            0,
            this._editorMaxScroll()
        );
        const line = this._lineForPreviewTop(pvScrollTop);

        if (Math.abs(this.editor.getScrollTop() - edTop) > 0.5) {
            this.editor.setScrollTop(edTop);
        }

        this._endSync();
        eventBus.emit(EVENTS.SCROLL_SYNC_EDITOR, { line, y: edTop });
    }

    scrollToTop() {
        this._beginSync('editor');
        this.editor?.setScrollTop(0);
        if (this.preview) this.preview.scrollTop = 0;
        this._endSync();
    }

    scrollToRatio(ratio) {
        const r = Math.min(1, Math.max(0, ratio));
        this._beginSync('editor');
        if (this.editor) {
            this.editor.setScrollTop(this._editorMaxScroll() * r);
        }
        if (this.preview) {
            this.preview.scrollTop = this._previewMaxScroll() * r;
        }
        this._endSync();
    }

    destroy() {
        this._clearEchoLock();
        if (this._rebuildTimer) clearTimeout(this._rebuildTimer);
        if (this._rebuildRaf) cancelAnimationFrame(this._rebuildRaf);
        if (this._editorRaf) cancelAnimationFrame(this._editorRaf);
        if (this._previewRaf) cancelAnimationFrame(this._previewRaf);
        if (this._userScrollIdleTimer) clearTimeout(this._userScrollIdleTimer);
        this.cleanupFunctions.forEach((cleanup) => cleanup());
        this.cleanupFunctions = [];
        this.editor = null;
        this.preview = null;
        this.contentRoot = null;
        this.anchors = [];
        this.onPreviewScrollExtra = null;
        this.syncSource = null;
        this._userScrolling = false;
    }

    // ─── Internals ───────────────────────────────────────────

    _beginSync(source) {
        this.syncSource = source;
        if (this._echoUnlockTimer) clearTimeout(this._echoUnlockTimer);
    }

    _endSync() {
        if (this._echoUnlockTimer) clearTimeout(this._echoUnlockTimer);
        this._echoUnlockTimer = setTimeout(() => {
            this.syncSource = null;
            this._echoUnlockTimer = null;
        }, ECHO_LOCK_MS);
    }

    _clearEchoLock() {
        if (this._echoUnlockTimer) clearTimeout(this._echoUnlockTimer);
        this._echoUnlockTimer = null;
        this.syncSource = null;
    }

    _clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    _previewMaxScroll() {
        if (!this.preview) return 0;
        return Math.max(0, this.preview.scrollHeight - this.preview.clientHeight);
    }

    _editorMaxScroll() {
        if (!this.editor) return 0;
        try {
            const height = this.editor.getLayoutInfo?.()?.height ?? 0;
            return Math.max(0, (this.editor.getScrollHeight?.() ?? 0) - height);
        } catch {
            return 0;
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
     * Find segment by editorTop / previewTop. Delegates to the pure, testable
     * `findAnchorSegment` against the live anchor map.
     */
    _findAnchorSegment(value, key) {
        return findAnchorSegment(value, key, this.anchors);
    }

    /**
     * Editor → preview: map by segment, but when the editor is parked within a
     * small tolerance of a block start, snap the preview to that block's top.
     * The tolerance is tiny so smooth tracking never "halts" mid-scroll.
     */
    _previewTopForEditorScroll(editorScrollTop) {
        const seg = this._findAnchorSegment(editorScrollTop, 'editorTop');
        if (!seg) return 0;

        const { a, b, t } = seg;

        // Soft snap only when effectively parked on the block start (Issue #39:
        // a wider snap held the preview while the editor kept scrolling, then
        // jumped once it passed the boundary).
        if (Math.abs(editorScrollTop - a.editorTop) <= 4) {
            return a.previewTop;
        }

        return a.previewTop + t * (b.previewTop - a.previewTop);
    }

    _editorTopForPreviewScroll(previewTop) {
        const seg = this._findAnchorSegment(previewTop, 'previewTop');
        if (!seg) return 0;

        const { a, b, t } = seg;

        if (Math.abs(previewTop - a.previewTop) <= 4) {
            return a.editorTop;
        }

        return a.editorTop + t * (b.editorTop - a.editorTop);
    }

    _lineForEditorScroll(editorScrollTop) {
        const seg = this._findAnchorSegment(editorScrollTop, 'editorTop');
        if (!seg) return 1;
        return seg.a.line + seg.t * (seg.b.line - seg.a.line);
    }

    _lineForPreviewTop(previewTop) {
        const seg = this._findAnchorSegment(previewTop, 'previewTop');
        if (!seg) return 1;
        return seg.a.line + seg.t * (seg.b.line - seg.a.line);
    }
}

export const scrollSync = new ScrollSync();
export default scrollSync;
