/**
 * ImageResizeManager — core resize / overlay / markdown sync logic
 * @module features/image-resize/core
 */

import {
  CONFIG,
  SIZE_PRESETS,
  SHADOW_PRESETS,
  BORDER_RADIUS_PRESETS,
  FILTER_PRESETS,
  KEYBOARD_SHORTCUTS,
  SHIFT_MULTIPLIER,
} from './constants.js';
import { HistoryStack } from './history.js';
import { toast, SnapGuides } from './ui.js';
import {
  clamp,
  debounce,
  throttle,
  formatBytes,
  escapeRegex,
} from './utils.js';

export class ImageResizeManager {
    constructor() {
        // ── State ──
        this.initialized = false;
        this.activeImage = null;
        this.activeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.aspectRatio = 1;
        this.lockAspect = true;
        this.resizeOverlay = null;
        this.editor = null;
        this.ghostOutline = null;
        this.contextMenu = null;

        // ── Sub-systems ──
        this.history = new HistoryStack();
        this.snapGuides = new SnapGuides();

        // ── Image state tracking ──
        this._imageStates = new WeakMap();

        // ── Bound handlers (for clean removal) ──
        this._boundOnMouseMove = throttle(this._onMouseMove.bind(this), 16);
        this._boundOnMouseUp = this._onMouseUp.bind(this);
        this._boundOnTouchMove = throttle(this._onTouchMove.bind(this), 16);
        this._boundOnTouchEnd = this._onTouchEnd.bind(this);
        this._boundOnKeyDown = this._onKeyDown.bind(this);
        this._boundOnScroll = debounce(this._onScrollOrResize.bind(this), 60);
        this._boundOnResize = debounce(this._onScrollOrResize.bind(this), 100);

        // ── Observer ──
        this._mutationObserver = null;
        this._hoverTimer = null;
    }

    /* ─────────────────────────────────────────────────────────────────
       6a. INITIALISATION
       ───────────────────────────────────────────────────────────────── */

    /**
     * Initialize the image resize feature
     * @param {Object} options - Configuration options
     * @param {Object} options.editor - Monaco editor instance
     */
    initialize(options = {}) {
        if (this.initialized) return;

        this.editor = options.editor || window.editor;
        this._injectStyles();
        this._setupEventListeners();
        this._setupMutationObserver();

        this.initialized = true;
        console.log('[ImageResize v2] ✓ Feature initialized');
    }

    /* ─────────────────────────────────────────────────────────────────
       6b. STYLE INJECTION
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _injectStyles() {
        document.getElementById('image-resize-styles-v2')?.remove();
        if (document.getElementById('image-resize-styles-v3')) return;

        const s = document.createElement('style');
        s.id = 'image-resize-styles-v3';
        s.textContent = `
      /* ── Base Image Behaviour ── */
      .markdown-body img[data-loaded="true"] {
        cursor: pointer;
        transition: outline 0.2s ease, filter 0.3s ease,
                    border-radius 0.3s ease, box-shadow 0.3s ease,
                    opacity 0.3s ease, transform 0.3s ease;
      }

      .markdown-body img[data-loaded="true"]:hover {
        outline: 2px solid rgba(99, 102, 241, 0.5);
        outline-offset: 3px;
      }

      .markdown-body img.image-resizing {
        outline: none !important;
      }

      /* ── Marching-ants selection animation ── */
      @keyframes ir-marching-ants {
        0%   { stroke-dashoffset: 0;  }
        100% { stroke-dashoffset: -20; }
      }

      /* ── Resize Overlay ── */
      .ir-overlay {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        border-radius: 2px;
      }

      .ir-overlay svg.ir-selection-border {
        position: absolute;
        inset: -2px;
        width: calc(100% + 4px);
        height: calc(100% + 4px);
        pointer-events: none;
      }

      .ir-overlay svg.ir-selection-border rect {
        fill: none;
        stroke: #6366f1;
        stroke-width: 2;
        stroke-dasharray: 6 4;
        animation: ir-marching-ants 0.6s linear infinite;
      }

      /* ── Ghost Outline ── */
      .ir-ghost-outline {
        position: fixed;
        border: 1px dashed rgba(99,102,241,0.35);
        background: rgba(99,102,241,0.04);
        pointer-events: none;
        z-index: 9999;
        border-radius: 2px;
        transition: none;
      }

      /* ── Resize Handles ── */
      .ir-handle {
        position: absolute;
        width: ${CONFIG.handleSize}px;
        height: ${CONFIG.handleSize}px;
        background: #fff;
        border: 2.5px solid #6366f1;
        border-radius: 50%;
        pointer-events: auto;
        z-index: 10001;
        box-shadow: 0 1px 5px rgba(0,0,0,0.22);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }

      .ir-handle:hover,
      .ir-handle:active {
        transform: scale(1.35);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.2);
      }

      .ir-handle.nw { top: -6px;  left: -6px;  cursor: nw-resize; }
      .ir-handle.ne { top: -6px;  right: -6px; cursor: ne-resize; }
      .ir-handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
      .ir-handle.se { bottom: -6px; right: -6px; cursor: se-resize; }
      .ir-handle.n  { top: -6px;  left: 50%; transform: translateX(-50%); cursor: n-resize; }
      .ir-handle.s  { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
      .ir-handle.w  { top: 50%; left: -6px;  transform: translateY(-50%); cursor: w-resize; }
      .ir-handle.e  { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }

      .ir-handle.n:hover, .ir-handle.s:hover { transform: translateX(-50%) scale(1.35); }
      .ir-handle.w:hover, .ir-handle.e:hover { transform: translateY(-50%) scale(1.35); }

      /* ── Size Badge ── */
      .ir-size-badge {
        position: absolute;
        bottom: -32px;
        left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #334155;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
        z-index: 10002;
        display: flex;
        align-items: center;
        gap: 6px;
        border: 1px solid rgba(15, 23, 42, 0.1);
      }

      .ir-size-badge .ir-zoom-pct {
        color: #5865f2;
        font-weight: 600;
      }

      .ir-toolbar {
        position: absolute;
        bottom: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2px;
        background: #ffffff;
        backdrop-filter: blur(14px) saturate(180%);
        -webkit-backdrop-filter: blur(14px) saturate(180%);
        padding: 5px 7px;
        border-radius: 10px;
        box-shadow: 0 8px 28px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.08);
        pointer-events: auto;
        z-index: 10003;
        width: max-content;
        max-width: 95vw;
        flex-wrap: wrap;
      }

      .ir-toolbar button {
        background: transparent;
        border: none;
        color: #475569;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        line-height: 1;
        transition: background 0.12s, color 0.12s, transform 0.1s;
        white-space: nowrap;
        position: relative;
      }

      .ir-toolbar button:hover {
        background: rgba(88, 101, 242, 0.1);
        color: #4338ca;
      }

      .ir-toolbar button:active {
        transform: scale(0.93);
      }

      .ir-toolbar button.active {
        background: #5865f2;
        color: #fff;
      }

      .ir-toolbar button[disabled] {
        opacity: 0.35;
        pointer-events: none;
      }

      .ir-toolbar .ir-sep {
        width: 1px;
        height: 18px;
        background: rgba(15, 23, 42, 0.12);
        margin: 0 3px;
        flex-shrink: 0;
      }

      /* ── Toolbar Tooltip ── */
      .ir-toolbar button[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        color: #e2e8f0;
        padding: 4px 8px;
        border-radius: 5px;
        font-size: 10px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10004;
        border: 1px solid rgba(255,255,255,0.08);
      }

      /* ── Dropdown Menus ── */
      .ir-dropdown {
        position: absolute;
        top: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-radius: 10px;
        padding: 6px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.08);
        z-index: 10010;
        min-width: 150px;
        pointer-events: auto;
        display: none;
      }

      .ir-dropdown.visible {
        display: block;
        animation: ir-dropdown-in 0.18s ease;
      }

      @keyframes ir-dropdown-in {
        from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }

      .ir-dropdown-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 6px;
        cursor: pointer;
        color: #334155;
        font-size: 12px;
        transition: background 0.12s;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
      }

      .ir-dropdown-item:hover {
        background: rgba(88, 101, 242, 0.1);
      }

      .ir-dropdown-item .ir-dd-icon {
        width: 20px;
        text-align: center;
        flex-shrink: 0;
        font-size: 14px;
      }

      /* ── Context Menu ── */
      .ir-context-menu {
        position: fixed;
        background: #ffffff;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-radius: 10px;
        padding: 6px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.08);
        z-index: 10020;
        min-width: 180px;
        animation: ir-dropdown-in 0.15s ease;
      }

      .ir-context-menu .ir-ctx-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        color: #334155;
        font-size: 12px;
        transition: background 0.12s;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
      }

      .ir-context-menu .ir-ctx-item:hover {
        background: rgba(88, 101, 242, 0.1);
      }

      .ir-context-menu .ir-ctx-item .ir-ctx-icon {
        width: 18px;
        text-align: center;
        font-size: 13px;
      }

      .ir-context-menu .ir-ctx-item .ir-ctx-shortcut {
        margin-left: auto;
        color: #64748b;
        font-size: 10px;
        font-family: monospace;
      }

      .ir-context-menu .ir-ctx-sep {
        height: 1px;
        background: rgba(255,255,255,0.08);
        margin: 4px 8px;
      }

      /* ── Custom Size Dialog ── */
      .ir-dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.35);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: ir-fade-in 0.2s ease;
      }

      @keyframes ir-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      .ir-dialog {
        background: #ffffff;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.08);
        width: 320px;
        max-width: 90vw;
        animation: ir-dialog-in 0.25s ease;
      }

      @keyframes ir-dialog-in {
        from { opacity: 0; transform: scale(0.92) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      .ir-dialog h3 {
        margin: 0 0 16px;
        color: #0f172a;
        font-size: 15px;
        font-weight: 600;
      }

      .ir-dialog label {
        display: block;
        color: #64748b;
        font-size: 11px;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .ir-dialog input[type="number"] {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 8px;
        background: #f8fafc;
        color: #0f172a;
        font-size: 14px;
        font-family: monospace;
        outline: none;
        transition: border-color 0.15s;
        box-sizing: border-box;
      }

      .ir-dialog input[type="number"]:focus {
        border-color: #5865f2;
        background: #ffffff;
      }

      .ir-dialog .ir-dialog-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        align-items: end;
      }

      .ir-dialog .ir-dialog-row > div { flex: 1; }

      .ir-dialog .ir-lock-btn {
        padding: 8px;
        background: rgba(88, 101, 242, 0.08);
        border: 1px solid rgba(88, 101, 242, 0.25);
        border-radius: 8px;
        color: #5865f2;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: background 0.15s;
        flex-shrink: 0;
        margin-bottom: 0;
      }

      .ir-dialog .ir-lock-btn:hover {
        background: rgba(88, 101, 242, 0.14);
      }

      .ir-dialog .ir-lock-btn.locked {
        color: #4338ca;
        background: rgba(88, 101, 242, 0.16);
        border-color: #5865f2;
      }

      .ir-dialog .ir-dialog-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .ir-dialog .ir-dialog-actions button {
        padding: 8px 18px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.12s, transform 0.1s;
      }

      .ir-dialog .ir-dialog-actions button:active { transform: scale(0.95); }

      .ir-dialog .ir-btn-cancel {
        background: #f1f5f9;
        color: #475569;
      }

      .ir-dialog .ir-btn-cancel:hover {
        background: #e2e8f0;
      }

      .ir-dialog .ir-btn-apply {
        background: #5865f2;
        color: #fff;
      }

      .ir-dialog .ir-btn-apply:hover {
        background: #4752c4;
      }

      /* ── Info Panel ── */
      .ir-info-panel {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: #ffffff;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-radius: 10px;
        padding: 14px 18px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.08);
        z-index: 10003;
        min-width: 200px;
        pointer-events: auto;
        animation: ir-dropdown-in 0.18s ease;
      }

      .ir-info-panel table {
        width: 100%;
        border-collapse: collapse;
      }

      .ir-info-panel td {
        padding: 3px 0;
        font-size: 11px;
        color: #64748b;
        vertical-align: top;
      }

      .ir-info-panel td:first-child {
        font-weight: 600;
        color: #475569;
        padding-right: 14px;
        white-space: nowrap;
      }

      .ir-info-panel td:last-child {
        color: #0f172a;
        font-family: monospace;
        font-size: 11px;
      }

      /* ── Opacity Slider ── */
      .ir-slider-container {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
      }

      .ir-slider-container label {
        font-size: 11px;
        color: #64748b;
        min-width: 50px;
      }

      .ir-slider-container input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        flex: 1;
        height: 4px;
        background: rgba(15, 23, 42, 0.12);
        border-radius: 4px;
        outline: none;
      }

      .ir-slider-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #6366f1;
        border: 2px solid #fff;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      }

      .ir-slider-container .ir-slider-val {
        font-size: 11px;
        color: #5865f2;
        font-family: monospace;
        min-width: 32px;
        text-align: right;
      }

      /* ── Animations ── */
      @keyframes ir-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
        50%      { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
      }

      .ir-handle-pulse {
        animation: ir-pulse 1.5s ease infinite;
      }
    `;
        document.head.appendChild(s);
    }

    /* ─────────────────────────────────────────────────────────────────
       6c. EVENT LISTENER SETUP
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _setupEventListeners() {
        const preview = document.getElementById('output');
        if (!preview) {
            console.warn('[ImageResize v2] Preview container #output not found');
            return;
        }

        // ── Hover tooltip on images ──
        let _hoverTooltip = null;
        this._hoverTimer = null;

        const _showHoverTooltip = (img, x, y) => {
            _clearHoverTooltip();
            const natW = img.naturalWidth || '?';
            const natH = img.naturalHeight || '?';
            const curW = Math.round(img.offsetWidth);
            const curH = Math.round(img.offsetHeight);
            const src = img.getAttribute('src') || '';
            let fileType = 'image';
            if (src.startsWith('data:image/')) {
                fileType = src.split(';')[0].replace('data:image/', '').toUpperCase();
            } else {
                const ext = src.split('.').pop().split(/[?#]/)[0].toUpperCase();
                if (ext && ext.length <= 5) fileType = ext;
            }

            const tip = document.createElement('div');
            tip.id = 'ir-hover-tip';
            tip.style.cssText = `
              position: fixed;
              left: ${x + 14}px;
              top: ${y + 14}px;
              background: #ffffff;
              backdrop-filter: blur(12px);
              color: #334155;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 11px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.08);
              pointer-events: none;
              z-index: 10030;
              line-height: 1.6;
              animation: ir-fade-in 0.15s ease;
              max-width: 220px;
            `;
            tip.innerHTML = [
                `<span style="color:#64748b;font-size:10px;letter-spacing:.04em;text-transform:uppercase">${fileType}</span>`,
                `<div style="margin-top:4px"><span style="color:#5865f2;font-weight:600">${curW} × ${curH}</span><span style="color:#94a3b8"> px (display)</span></div>`,
                natW !== '?' ? `<div style="color:#94a3b8">${natW} × ${natH} natural</div>` : '',
            ].join('');

            document.body.appendChild(tip);
            _hoverTooltip = tip;

            // Keep tooltip in viewport
            requestAnimationFrame(() => {
                if (!tip.isConnected) return;
                const r = tip.getBoundingClientRect();
                if (r.right > window.innerWidth - 8) {
                    tip.style.left = `${x - r.width - 14}px`;
                }
                if (r.bottom > window.innerHeight - 8) {
                    tip.style.top = `${y - r.height - 14}px`;
                }
            });
        };

        const _clearHoverTooltip = () => {
            clearTimeout(this._hoverTimer);
            this._hoverTimer = null;
            if (_hoverTooltip) {
                _hoverTooltip.remove();
                _hoverTooltip = null;
            }
        };

        preview.addEventListener('mousemove', (e) => {
            const img = e.target.closest('img[data-loaded]');
            if (!img || this.activeImage === img) { _clearHoverTooltip(); return; }
            // Re-position tooltip to follow cursor lightly
            if (_hoverTooltip) {
                _hoverTooltip.style.left = `${e.clientX + 14}px`;
                _hoverTooltip.style.top  = `${e.clientY + 14}px`;
            } else {
                this._hoverTimer = setTimeout(() => _showHoverTooltip(img, e.clientX, e.clientY), 350);
            }
        });

        preview.addEventListener('mouseleave', _clearHoverTooltip);

        // Click on image to select
        preview.addEventListener('click', (e) => {
            const img = e.target.closest('img[data-loaded]');
            if (img) {
                e.preventDefault();
                e.stopPropagation();
                _clearHoverTooltip();
                this._selectImage(img);
            }
        });

        // Double-click to open custom size dialog
        preview.addEventListener('dblclick', (e) => {
            const img = e.target.closest('img[data-loaded]');
            if (img) {
                e.preventDefault();
                e.stopPropagation();
                this._selectImage(img);
                this._openCustomSizeDialog();
            }
        });

        // Context menu on images
        preview.addEventListener('contextmenu', (e) => {
            const img = e.target.closest('img[data-loaded]');
            if (img) {
                e.preventDefault();
                e.stopPropagation();
                _clearHoverTooltip();
                this._selectImage(img);
                this._showContextMenu(e.clientX, e.clientY);
            }
        });

        // Click outside to deselect
        document.addEventListener('click', (e) => {
            // Close context menu
            if (this.contextMenu && !e.target.closest('.ir-context-menu')) {
                this._closeContextMenu();
            }

            // Close dropdowns
            if (!e.target.closest('.ir-dropdown') && !e.target.closest('.ir-toolbar button')) {
                this._closeAllDropdowns();
            }

            // Deselect image
            if (this.activeImage &&
                !e.target.closest('.ir-overlay') &&
                !e.target.closest('.ir-context-menu') &&
                !e.target.closest('.ir-dialog-backdrop') &&
                !e.target.closest('img[data-loaded]')) {
                this._deselectImage();
            }
        });

        // Mouse & touch handlers
        document.addEventListener('mousemove', this._boundOnMouseMove);
        document.addEventListener('mouseup', this._boundOnMouseUp);
        document.addEventListener('touchmove', this._boundOnTouchMove, { passive: false });
        document.addEventListener('touchend', this._boundOnTouchEnd);

        // Keyboard
        document.addEventListener('keydown', this._boundOnKeyDown);

        // Scroll & resize → reposition overlay
        const outputEl = document.getElementById('output');
        if (outputEl) {
            outputEl.addEventListener('scroll', this._boundOnScroll);
        }
        window.addEventListener('scroll', this._boundOnScroll, true);
        window.addEventListener('resize', this._boundOnResize);
    }

    /* ─────────────────────────────────────────────────────────────────
       6d. MUTATION OBSERVER (DOM SAFETY)
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _setupMutationObserver() {
        const preview = document.getElementById('output');
        if (!preview) return;

        this._mutationObserver = new MutationObserver((_mutations) => {
            if (!this.activeImage) return;

            // Check if our active image was removed from DOM
            if (!document.body.contains(this.activeImage)) {
                this._deselectImage();
                return;
            }

            // Reposition overlay if DOM changed
            if (this.resizeOverlay && !this.activeHandle) {
                this._repositionOverlay();
            }
        });

        this._mutationObserver.observe(preview, {
            childList: true,
            subtree: true,
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       6e. IMAGE SELECTION / DESELECTION
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _selectImage(img) {
        if (this.activeImage && this.activeImage !== img) {
            this._deselectImage();
        }

        this.activeImage = img;
        img.classList.add('image-resizing');

        // Save initial state for undo
        this._saveState(img);

        // Create overlay
        this._createResizeOverlay(img);
    }

    /** @private */
    _deselectImage() {
        if (this.activeImage) {
            this.activeImage.classList.remove('image-resizing');
            this.activeImage = null;
        }
        this._removeResizeOverlay();
        this._removeGhostOutline();
        this._closeContextMenu();
        this.snapGuides.clearGuides();
    }

    /* ─────────────────────────────────────────────────────────────────
       6f. STATE MANAGEMENT (for undo/redo)
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _saveState(img) {
        const state = {
            width: img.style.width || '',
            height: img.style.height || '',
            filter: img.style.filter || '',
            borderRadius: img.style.borderRadius || '',
            boxShadow: img.style.boxShadow || '',
            opacity: img.style.opacity || '',
            transform: img.style.transform || '',
        };
        this.history.push(state);
    }

    /** @private */
    _applyState(img, state) {
        if (!img || !state) return;
        img.style.width = state.width;
        img.style.height = state.height;
        img.style.filter = state.filter;
        img.style.borderRadius = state.borderRadius;
        img.style.boxShadow = state.boxShadow;
        img.style.opacity = state.opacity;
        img.style.transform = state.transform;
    }

    /** @private */
    _undo() {
        if (!this.activeImage || !this.history.canUndo) return;
        const state = this.history.undo();
        if (state) {
            this._applyState(this.activeImage, state);
            this._repositionOverlay();
            toast.show('Undo', 'info');
        }
    }

    /** @private */
    _redo() {
        if (!this.activeImage || !this.history.canRedo) return;
        const state = this.history.redo();
        if (state) {
            this._applyState(this.activeImage, state);
            this._repositionOverlay();
            toast.show('Redo', 'info');
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6g. OVERLAY CREATION
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _createResizeOverlay(img) {
        this._removeResizeOverlay();

        const rect = img.getBoundingClientRect();

        const overlay = document.createElement('div');
        overlay.className = 'ir-overlay';
        overlay.style.cssText = `
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;

        // ── Marching-ants SVG border ──
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('ir-selection-border');
        svg.setAttribute('preserveAspectRatio', 'none');
        const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgRect.setAttribute('x', '1');
        svgRect.setAttribute('y', '1');
        svgRect.setAttribute('width', 'calc(100% - 2px)');
        svgRect.setAttribute('height', 'calc(100% - 2px)');
        svgRect.setAttribute('rx', '2');
        svg.appendChild(svgRect);
        overlay.appendChild(svg);

        // ── Resize handles ──
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `ir-handle ${pos}`;
            handle.dataset.handle = pos;
            // Pulse animation on corner handles
            if (['nw', 'ne', 'sw', 'se'].includes(pos)) {
                handle.classList.add('ir-handle-pulse');
            }
            handle.addEventListener('mousedown', (e) => this._onHandleMouseDown(e, pos));
            handle.addEventListener('touchstart', (e) => this._onHandleTouchStart(e, pos), { passive: false });
            overlay.appendChild(handle);
        });

        // ── Size badge ──
        const badge = document.createElement('div');
        badge.className = 'ir-size-badge';
        const zoomPct = img.naturalWidth > 0
            ? Math.round((rect.width / img.naturalWidth) * 100)
            : 100;
        badge.innerHTML = `
      ${Math.round(rect.width)} × ${Math.round(rect.height)}
      <span class="ir-zoom-pct">${zoomPct}%</span>
    `;
        overlay.appendChild(badge);

        // ── Toolbar ──
        const toolbar = this._createToolbar(img);
        overlay.appendChild(toolbar);

        document.body.appendChild(overlay);
        this.resizeOverlay = overlay;
        this._positionImageToolbar();
    }

    /** @private */
    _removeResizeOverlay() {
        if (this.resizeOverlay) {
            this.resizeOverlay.remove();
            this.resizeOverlay = null;
        }
    }

    /**
     * Keep the floating image toolbar below the app header/formatting bar.
     * Prefer above the image; flip below when there isn't enough room.
     * @private
     */
    _getChromeBottom() {
        let bottom = 8;
        const header = document.querySelector('.premium-header');
        const formatBar = document.querySelector('.premium-toolbar');
        if (header) bottom = Math.max(bottom, header.getBoundingClientRect().bottom);
        if (formatBar) {
            const rect = formatBar.getBoundingClientRect();
            if (rect.height > 0) bottom = Math.max(bottom, rect.bottom);
        }
        return bottom + 8;
    }

    /** @private */
    _positionImageToolbar() {
        const toolbar = this.resizeOverlay?.querySelector('.ir-toolbar');
        if (!toolbar || !this.resizeOverlay) return;

        const chromeBottom = this._getChromeBottom();
        const overlayRect = this.resizeOverlay.getBoundingClientRect();
        const gap = 12;
        const toolbarHeight = toolbar.offsetHeight || 40;
        const spaceAbove = overlayRect.top - chromeBottom;

        if (spaceAbove >= toolbarHeight + gap) {
            toolbar.style.top = 'auto';
            toolbar.style.bottom = `calc(100% + ${gap}px)`;
            toolbar.dataset.placement = 'above';
        } else {
            toolbar.style.bottom = 'auto';
            toolbar.style.top = `calc(100% + ${gap}px)`;
            toolbar.dataset.placement = 'below';
        }
    }

    /** @private */
    _repositionOverlay() {
        if (!this.resizeOverlay || !this.activeImage) return;
        const rect = this.activeImage.getBoundingClientRect();
        this.resizeOverlay.style.top = `${rect.top}px`;
        this.resizeOverlay.style.left = `${rect.left}px`;
        this.resizeOverlay.style.width = `${rect.width}px`;
        this.resizeOverlay.style.height = `${rect.height}px`;
        this._updateSizeBadge(rect.width, rect.height);
        this._positionImageToolbar();
    }

    /* ─────────────────────────────────────────────────────────────────
       6h. GHOST OUTLINE (shows original size)
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _showGhostOutline() {
        if (!this.activeImage || this.ghostOutline) return;
        const rect = this.activeImage.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'ir-ghost-outline';
        ghost.style.cssText = `
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${this.startWidth}px;
      height: ${this.startHeight}px;
    `;
        document.body.appendChild(ghost);
        this.ghostOutline = ghost;
    }

    /** @private */
    _removeGhostOutline() {
        if (this.ghostOutline) {
            this.ghostOutline.remove();
            this.ghostOutline = null;
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6i. TOOLBAR CREATION
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _createToolbar(img) {
        const toolbar = document.createElement('div');
        toolbar.className = 'ir-toolbar';

        // Helper
        const addBtn = (icon, tooltip, onClick, extraClass = '') => {
            const btn = document.createElement('button');
            btn.innerHTML = icon;
            btn.setAttribute('data-tooltip', tooltip);
            if (extraClass) btn.className = extraClass;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                onClick(e, btn);
            });
            toolbar.appendChild(btn);
            return btn;
        };

        const addSep = () => {
            const sep = document.createElement('div');
            sep.className = 'ir-sep';
            toolbar.appendChild(sep);
        };

        // SVG icon helpers
        const svgIcon = (paths, vb = '0 0 24 24') =>
            `<svg width="13" height="13" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">${paths}</svg>`;

        const ICONS = {
            undo:       svgIcon('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>'),
            redo:       svgIcon('<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>'),
            alignL:     svgIcon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>'),
            alignC:     svgIcon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
            alignR:     svgIcon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>'),
            lock:       svgIcon('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
            unlock:     svgIcon('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
            resize:     svgIcon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'),
            filter:     svgIcon('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
            shadow:     svgIcon('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
            corners:    svgIcon('<rect x="3" y="3" width="18" height="18" rx="4"/>'),
            rotateCW:   svgIcon('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
            rotateCCW:  svgIcon('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
            flipH:      svgIcon('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
            flipV:      svgIcon('<polyline points="23 7 19 3 15 7"/><path d="M13 21h2a4 4 0 0 0 4-4V3"/><polyline points="1 17 5 21 9 17"/><path d="M11 3H9a4 4 0 0 0-4 4v14"/>'),
            edit:       svgIcon('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
            reset:      svgIcon('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>'),
            info:       svgIcon('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
            copy:       svgIcon('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
            download:   svgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        };

        // ── Undo / Redo ──
        addBtn(ICONS.undo, 'Undo (Ctrl+Z)', () => this._undo());
        addBtn(ICONS.redo, 'Redo (Ctrl+Y)', () => this._redo());

        addSep();

        // ── Alignment ──
        addBtn(ICONS.alignL, 'Align Left', () => this._setAlignment(img, 'left'));
        addBtn(ICONS.alignC, 'Center', () => this._setAlignment(img, 'center'));
        addBtn(ICONS.alignR, 'Align Right', () => this._setAlignment(img, 'right'));

        addSep();

        // ── Aspect Lock Toggle ──
        const lockBtn = addBtn(this.lockAspect ? ICONS.lock : ICONS.unlock,
            'Toggle Aspect Lock',
            (e, btn) => {
                this.lockAspect = !this.lockAspect;
                btn.innerHTML = this.lockAspect ? ICONS.lock : ICONS.unlock;
                toast.show(this.lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked', 'info');
            }
        );
        if (this.lockAspect) lockBtn.classList.add('active');

        addSep();

        // ── Size Presets (Dropdown) ──
        const presetsWrapper = document.createElement('div');
        presetsWrapper.style.position = 'relative';
        const presetsBtn = document.createElement('button');
        presetsBtn.innerHTML = ICONS.resize;
        presetsBtn.setAttribute('data-tooltip', 'Size Presets');
        presetsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown(presetsDropdown);
        });
        presetsWrapper.appendChild(presetsBtn);

        const presetsDropdown = this._createPresetsDropdown(img);
        presetsWrapper.appendChild(presetsDropdown);
        toolbar.appendChild(presetsWrapper);

        // ── Filters (Dropdown) ──
        const filterWrapper = document.createElement('div');
        filterWrapper.style.position = 'relative';
        const filterBtn = document.createElement('button');
        filterBtn.innerHTML = ICONS.filter;
        filterBtn.setAttribute('data-tooltip', 'Filters');
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown(filterDropdown);
        });
        filterWrapper.appendChild(filterBtn);

        const filterDropdown = this._createFilterDropdown(img);
        filterWrapper.appendChild(filterDropdown);
        toolbar.appendChild(filterWrapper);

        // ── Shadow Presets (Dropdown) ──
        const shadowWrapper = document.createElement('div');
        shadowWrapper.style.position = 'relative';
        const shadowBtn = document.createElement('button');
        shadowBtn.innerHTML = ICONS.shadow;
        shadowBtn.setAttribute('data-tooltip', 'Shadow');
        shadowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown(shadowDropdown);
        });
        shadowWrapper.appendChild(shadowBtn);

        const shadowDropdown = this._createShadowDropdown(img);
        shadowWrapper.appendChild(shadowDropdown);
        toolbar.appendChild(shadowWrapper);

        // ── Border Radius (Dropdown) ──
        const radiusWrapper = document.createElement('div');
        radiusWrapper.style.position = 'relative';
        const radiusBtn = document.createElement('button');
        radiusBtn.innerHTML = ICONS.corners;
        radiusBtn.setAttribute('data-tooltip', 'Corners');
        radiusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown(radiusDropdown);
        });
        radiusWrapper.appendChild(radiusBtn);

        const radiusDropdown = this._createRadiusDropdown(img);
        radiusWrapper.appendChild(radiusDropdown);
        toolbar.appendChild(radiusWrapper);

        addSep();

        // ── Rotate / Flip ──
        addBtn(ICONS.rotateCW,  'Rotate 90° CW',     () => this._rotate(img, 90));
        addBtn(ICONS.rotateCCW, 'Rotate 90° CCW',    () => this._rotate(img, -90));
        addBtn(ICONS.flipH,     'Flip Horizontal',   () => this._flip(img, 'horizontal'));
        addBtn(ICONS.flipV,     'Flip Vertical',     () => this._flip(img, 'vertical'));

        addSep();

        // ── Custom Size ──
        addBtn(ICONS.edit,     'Custom Size (Dbl-click image)', () => this._openCustomSizeDialog());

        // ── Reset ──
        addBtn(ICONS.reset,    'Reset All (Ctrl+0)', () => this._resetAll(img));

        addSep();

        // ── Info ──
        addBtn(ICONS.info,     'Image Info', (e, btn) => this._toggleInfoPanel(img, btn));

        // ── Copy / Download ──
        addBtn(ICONS.copy,     'Copy Image',  () => this._copyImage(img));
        addBtn(ICONS.download, 'Download',    () => this._downloadImage(img));

        return toolbar;
    }

    /* ─────────────────────────────────────────────────────────────────
       6j. DROPDOWN FACTORIES
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _createPresetsDropdown(img) {
        const dd = document.createElement('div');
        dd.className = 'ir-dropdown';

        SIZE_PRESETS.forEach(preset => {
            const item = document.createElement('button');
            item.className = 'ir-dropdown-item';
            item.innerHTML = `<span class="ir-dd-icon">${preset.icon}</span>${preset.label}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (preset.pct) {
                    this._setPercentWidth(img, preset.pct);
                } else {
                    this._setFixedWidth(img, preset.width);
                }
                dd.classList.remove('visible');
            });
            dd.appendChild(item);
        });

        return dd;
    }

    /** @private */
    _createFilterDropdown(img) {
        const dd = document.createElement('div');
        dd.className = 'ir-dropdown';

        FILTER_PRESETS.forEach(preset => {
            const item = document.createElement('button');
            item.className = 'ir-dropdown-item';
            item.innerHTML = `<span class="ir-dd-icon">${preset.icon}</span>${preset.label}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this._saveState(img);
                img.style.filter = preset.value === 'none' ? '' : preset.value;
                this._updateMarkdownSource(img);
                toast.show(`Filter: ${preset.label}`, 'success');
                dd.classList.remove('visible');
            });
            dd.appendChild(item);
        });

        // Opacity slider
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'ir-slider-container';
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = 'Opacity';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '10';
        slider.max = '100';
        slider.value = Math.round((parseFloat(img.style.opacity) || 1) * 100);
        const sliderVal = document.createElement('span');
        sliderVal.className = 'ir-slider-val';
        sliderVal.textContent = slider.value + '%';

        slider.addEventListener('input', (e) => {
            e.stopPropagation();
            const v = parseInt(slider.value);
            img.style.opacity = v / 100;
            sliderVal.textContent = v + '%';
        });
        slider.addEventListener('change', () => {
            this._saveState(img);
            this._updateMarkdownSource(img);
        });

        sliderContainer.appendChild(sliderLabel);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(sliderVal);
        dd.appendChild(sliderContainer);

        return dd;
    }

    /** @private */
    _createShadowDropdown(img) {
        const dd = document.createElement('div');
        dd.className = 'ir-dropdown';

        SHADOW_PRESETS.forEach(preset => {
            const item = document.createElement('button');
            item.className = 'ir-dropdown-item';
            item.innerHTML = `<span class="ir-dd-icon">${preset.icon}</span>${preset.label}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this._saveState(img);
                img.style.boxShadow = preset.value === 'none' ? '' : preset.value;
                this._updateMarkdownSource(img);
                toast.show(`Shadow: ${preset.label}`, 'success');
                dd.classList.remove('visible');
            });
            dd.appendChild(item);
        });

        return dd;
    }

    /** @private */
    _createRadiusDropdown(img) {
        const dd = document.createElement('div');
        dd.className = 'ir-dropdown';

        BORDER_RADIUS_PRESETS.forEach(preset => {
            const item = document.createElement('button');
            item.className = 'ir-dropdown-item';
            item.innerHTML = `<span class="ir-dd-icon">${preset.icon}</span>${preset.label}`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this._saveState(img);
                img.style.borderRadius = preset.value === '0' ? '' : preset.value;
                this._updateMarkdownSource(img);
                toast.show(`Corners: ${preset.label}`, 'success');
                dd.classList.remove('visible');
            });
            dd.appendChild(item);
        });

        return dd;
    }

    /** @private */
    _toggleDropdown(dropdown) {
        // Close all others first
        document.querySelectorAll('.ir-dropdown.visible').forEach(d => {
            if (d !== dropdown) d.classList.remove('visible');
        });
        dropdown.classList.toggle('visible');
    }

    /** @private */
    _closeAllDropdowns() {
        document.querySelectorAll('.ir-dropdown.visible').forEach(d => {
            d.classList.remove('visible');
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       6k. CONTEXT MENU
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _showContextMenu(x, y) {
        this._closeContextMenu();

        const img = this.activeImage;
        if (!img) return;

        const menu = document.createElement('div');
        menu.className = 'ir-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const items = [
            { icon: '✏️', label: 'Custom Size…', shortcut: 'DblClick', action: () => this._openCustomSizeDialog() },
            { icon: '↺', label: 'Reset All', shortcut: 'Ctrl+0', action: () => this._resetAll(img) },
            null, // separator
            { icon: '↶', label: 'Undo', shortcut: 'Ctrl+Z', action: () => this._undo() },
            { icon: '↷', label: 'Redo', shortcut: 'Ctrl+Y', action: () => this._redo() },
            null,
            { icon: '◧', label: 'Align Left', shortcut: '', action: () => this._setAlignment(img, 'left') },
            { icon: '◫', label: 'Center', shortcut: '', action: () => this._setAlignment(img, 'center') },
            { icon: '◨', label: 'Align Right', shortcut: '', action: () => this._setAlignment(img, 'right') },
            null,
            { icon: '½', label: 'Set 50% Width', shortcut: '', action: () => this._setPercentWidth(img, 50) },
            { icon: '▣', label: 'Set 100% Width', shortcut: '', action: () => this._setPercentWidth(img, 100) },
            null,
            { icon: '📋', label: 'Copy Image', shortcut: '', action: () => this._copyImage(img) },
            { icon: '💾', label: 'Download Image', shortcut: '', action: () => this._downloadImage(img) },
            { icon: 'ℹ', label: 'Image Info', shortcut: '', action: () => this._showInfoPanelStandalone(img) },
        ];

        items.forEach(item => {
            if (item === null) {
                const sep = document.createElement('div');
                sep.className = 'ir-ctx-sep';
                menu.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.className = 'ir-ctx-item';
            btn.innerHTML = `
        <span class="ir-ctx-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.shortcut ? `<span class="ir-ctx-shortcut">${item.shortcut}</span>` : ''}
      `;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._closeContextMenu();
                item.action();
            });
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        this.contextMenu = menu;

        // Adjust if off-screen
        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                menu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
            }
            if (menuRect.bottom > window.innerHeight) {
                menu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
            }
        });
    }

    /** @private */
    _closeContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6l. CUSTOM SIZE DIALOG
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _openCustomSizeDialog() {
        const img = this.activeImage;
        if (!img) return;

        // Close any existing dialog
        const existingDialog = document.querySelector('.ir-dialog-backdrop');
        if (existingDialog) existingDialog.remove();

        const currentWidth = Math.round(img.offsetWidth);
        const currentHeight = Math.round(img.offsetHeight);
        const natWidth = img.naturalWidth || currentWidth;
        const natHeight = img.naturalHeight || currentHeight;
        const ar = natWidth / natHeight;
        let dialogLock = this.lockAspect;

        const backdrop = document.createElement('div');
        backdrop.className = 'ir-dialog-backdrop';

        const dialog = document.createElement('div');
        dialog.className = 'ir-dialog';
        dialog.innerHTML = `
      <h3>📐 Custom Image Size</h3>
      <div style="font-size:11px; color:#64748b; margin-bottom:14px;">
        Original: ${natWidth} × ${natHeight}px
      </div>
      <div class="ir-dialog-row">
        <div>
          <label>Width (px)</label>
          <input type="number" id="ir-dlg-width" value="${currentWidth}" min="${CONFIG.minWidth}" max="${CONFIG.maxWidth}" />
        </div>
        <button class="ir-lock-btn ${dialogLock ? 'locked' : ''}" id="ir-dlg-lock" title="Toggle aspect ratio lock">
          ${dialogLock ? '🔗' : '🔓'}
        </button>
        <div>
          <label>Height (px)</label>
          <input type="number" id="ir-dlg-height" value="${currentHeight}" min="${CONFIG.minHeight}" max="${CONFIG.maxHeight}" />
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        <button class="ir-preset-chip" data-pct="25">25%</button>
        <button class="ir-preset-chip" data-pct="33">33%</button>
        <button class="ir-preset-chip" data-pct="50">50%</button>
        <button class="ir-preset-chip" data-pct="75">75%</button>
        <button class="ir-preset-chip" data-pct="100">100%</button>
        <button class="ir-preset-chip" data-w="150">Thumb</button>
        <button class="ir-preset-chip" data-w="320">Small</button>
        <button class="ir-preset-chip" data-w="640">Medium</button>
        <button class="ir-preset-chip" data-w="960">Large</button>
      </div>
      <div class="ir-dialog-actions">
        <button class="ir-btn-cancel">Cancel</button>
        <button class="ir-btn-apply">Apply</button>
      </div>
    `;

        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);

        // Add chip styles inline
        dialog.querySelectorAll('.ir-preset-chip').forEach(chip => {
            chip.style.cssText = `
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: #f8fafc;
        color: #475569;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.12s, border-color 0.12s, color 0.12s;
      `;
            chip.addEventListener('mouseenter', () => {
                chip.style.background = 'rgba(88, 101, 242, 0.1)';
                chip.style.borderColor = '#5865f2';
                chip.style.color = '#4338ca';
            });
            chip.addEventListener('mouseleave', () => {
                chip.style.background = '#f8fafc';
                chip.style.borderColor = 'rgba(15, 23, 42, 0.12)';
                chip.style.color = '#475569';
            });
        });

        const widthInput = dialog.querySelector('#ir-dlg-width');
        const heightInput = dialog.querySelector('#ir-dlg-height');
        const lockBtn = dialog.querySelector('#ir-dlg-lock');

        // Lock toggle
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dialogLock = !dialogLock;
            lockBtn.classList.toggle('locked', dialogLock);
            lockBtn.innerHTML = dialogLock ? '🔗' : '🔓';
        });

        // Width change → update height if locked
        widthInput.addEventListener('input', () => {
            if (dialogLock) {
                const w = parseInt(widthInput.value) || 1;
                heightInput.value = Math.round(w / ar);
            }
        });

        // Height change → update width if locked
        heightInput.addEventListener('input', () => {
            if (dialogLock) {
                const h = parseInt(heightInput.value) || 1;
                widthInput.value = Math.round(h * ar);
            }
        });

        // Preset chips
        dialog.querySelectorAll('.ir-preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                const pct = chip.dataset.pct;
                const w = chip.dataset.w;

                if (pct) {
                    const container = img.closest('.markdown-body');
                    const containerWidth = container
                        ? container.clientWidth - 48
                        : window.innerWidth - 100;
                    const newW = Math.round((containerWidth * parseInt(pct)) / 100);
                    widthInput.value = newW;
                    heightInput.value = Math.round(newW / ar);
                } else if (w) {
                    const newW = parseInt(w);
                    widthInput.value = newW;
                    heightInput.value = Math.round(newW / ar);
                }
            });
        });

        // Cancel
        dialog.querySelector('.ir-btn-cancel').addEventListener('click', (e) => {
            e.stopPropagation();
            backdrop.remove();
        });

        // Apply
        dialog.querySelector('.ir-btn-apply').addEventListener('click', (e) => {
            e.stopPropagation();
            const newW = clamp(parseInt(widthInput.value) || currentWidth, CONFIG.minWidth, CONFIG.maxWidth);
            const newH = clamp(parseInt(heightInput.value) || currentHeight, CONFIG.minHeight, CONFIG.maxHeight);

            this._saveState(img);
            img.style.width = `${newW}px`;
            img.style.height = `${newH}px`;
            this._updateMarkdownSource(img);
            this._repositionOverlay();
            toast.show(`Resized to ${newW} × ${newH}`, 'success');
            backdrop.remove();
        });

        // Click backdrop to close
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
            }
        });

        // Escape to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                backdrop.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Focus width input
        requestAnimationFrame(() => {
            widthInput.focus();
            widthInput.select();
        });
    }

    /* ─────────────────────────────────────────────────────────────────
       6m. INFO PANEL
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _toggleInfoPanel(img, _triggerBtn) {
        const existing = this.resizeOverlay?.querySelector('.ir-info-panel');
        if (existing) {
            existing.remove();
            return;
        }
        this._showInfoPanelInOverlay(img);
    }

    /** @private */
    _showInfoPanelInOverlay(img) {
        if (!this.resizeOverlay) return;

        // Remove if already showing
        const existing = this.resizeOverlay.querySelector('.ir-info-panel');
        if (existing) { existing.remove(); return; }

        const panel = this._buildInfoPanel(img);
        this.resizeOverlay.appendChild(panel);
    }

    /** @private - standalone (from context menu) */
    _showInfoPanelStandalone(img) {
        if (!this.resizeOverlay) {
            this._selectImage(img);
        }
        this._showInfoPanelInOverlay(img);
    }

    /** @private */
    _buildInfoPanel(img) {
        const panel = document.createElement('div');
        panel.className = 'ir-info-panel';

        const natW = img.naturalWidth || '?';
        const natH = img.naturalHeight || '?';
        const curW = Math.round(img.offsetWidth);
        const curH = Math.round(img.offsetHeight);
        const zoomPct = img.naturalWidth > 0
            ? Math.round((curW / img.naturalWidth) * 100) + '%'
            : 'N/A';

        const src = img.getAttribute('src') || '';
        let srcDisplay = src;
        if (src.startsWith('data:')) {
            const mimeMatch = src.match(/^data:([^;]+)/);
            const mime = mimeMatch ? mimeMatch[1] : 'unknown';
            const sizeEst = Math.round((src.length * 3) / 4);
            srcDisplay = `Base64 (${mime}, ~${formatBytes(sizeEst)})`;
        } else if (src.length > 60) {
            srcDisplay = '…' + src.slice(-55);
        }

        const filter = img.style.filter || 'None';
        const shadow = img.style.boxShadow || 'None';
        const radius = img.style.borderRadius || '0';
        const opacity = img.style.opacity ? Math.round(parseFloat(img.style.opacity) * 100) + '%' : '100%';
        const transform = img.style.transform || 'None';

        panel.innerHTML = `
      <table>
        <tr><td>Original</td><td>${natW} × ${natH} px</td></tr>
        <tr><td>Current</td><td>${curW} × ${curH} px</td></tr>
        <tr><td>Zoom</td><td>${zoomPct}</td></tr>
        <tr><td>Aspect</td><td>${natW && natH ? (natW / natH).toFixed(3) : 'N/A'}</td></tr>
        <tr><td>Source</td><td style="word-break:break-all;max-width:160px;">${srcDisplay}</td></tr>
        <tr><td>Filter</td><td>${filter}</td></tr>
        <tr><td>Shadow</td><td style="max-width:140px;word-break:break-all;">${shadow}</td></tr>
        <tr><td>Corners</td><td>${radius}</td></tr>
        <tr><td>Opacity</td><td>${opacity}</td></tr>
        <tr><td>Transform</td><td>${transform}</td></tr>
      </table>
    `;

        return panel;
    }

    /* ─────────────────────────────────────────────────────────────────
       6n. IMAGE OPERATIONS
       ───────────────────────────────────────────────────────────────── */

    /** Set fixed pixel width maintaining aspect ratio */
    _setFixedWidth(img, width) {
        const ar = (img.naturalWidth && img.naturalHeight)
            ? img.naturalWidth / img.naturalHeight
            : img.offsetWidth / img.offsetHeight;
        const newW = clamp(width, CONFIG.minWidth, CONFIG.maxWidth);
        const newH = Math.round(newW / ar);

        this._saveState(img);
        img.style.width = `${newW}px`;
        img.style.height = `${newH}px`;
        this._updateMarkdownSource(img);
        this._repositionOverlay();
        toast.show(`Size: ${newW} × ${newH}`, 'success');
    }

    /** Set percentage width of container */
    _setPercentWidth(img, percent) {
        const container = img.closest('.markdown-body');
        if (!container) return;

        const containerWidth = container.clientWidth - 48;
        const newWidth = Math.round((containerWidth * percent) / 100);
        const ar = (img.naturalWidth && img.naturalHeight)
            ? img.naturalWidth / img.naturalHeight
            : img.offsetWidth / img.offsetHeight;
        const newHeight = Math.round(newWidth / ar);

        this._saveState(img);
        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
        this._updateMarkdownSource(img);
        this._repositionOverlay();
        toast.show(`${percent}% → ${newWidth} × ${newHeight}`, 'success');
    }

    /** Set image alignment */
    _setAlignment(img, alignment) {
        this._saveState(img);
        img.setAttribute('align', alignment);

        // Visual feedback in preview
        img.style.display = 'block';
        switch (alignment) {
            case 'left':
                img.style.marginLeft = '0';
                img.style.marginRight = 'auto';
                break;
            case 'center':
                img.style.marginLeft = 'auto';
                img.style.marginRight = 'auto';
                break;
            case 'right':
                img.style.marginLeft = 'auto';
                img.style.marginRight = '0';
                break;
        }

        this._updateMarkdownSource(img);
        this._repositionOverlay();
        toast.show(`Align: ${alignment}`, 'info');
    }

    /** Rotate image */
    _rotate(img, degrees) {
        this._saveState(img);

        const current = img.style.transform || '';
        const rotateMatch = current.match(/rotate\((-?\d+)deg\)/);
        const currentDeg = rotateMatch ? parseInt(rotateMatch[1]) : 0;
        const newDeg = (currentDeg + degrees) % 360;

        let newTransform = current.replace(/rotate\(-?\d+deg\)\s*/g, '').trim();
        if (newDeg !== 0) {
            newTransform = `rotate(${newDeg}deg) ${newTransform}`.trim();
        }

        img.style.transform = newTransform || '';
        this._updateMarkdownSource(img);
        this._repositionOverlay();
        toast.show(`Rotate: ${newDeg}°`, 'info');
    }

    /** Flip image */
    _flip(img, direction) {
        this._saveState(img);

        const current = img.style.transform || '';
        const prop = direction === 'horizontal' ? 'scaleX' : 'scaleY';
        const regex = new RegExp(`${prop}\\((-?1)\\)`);
        const match = current.match(regex);

        let newTransform;
        if (match) {
            const currentVal = parseInt(match[1]);
            const newVal = currentVal === 1 ? -1 : 1;
            if (newVal === 1) {
                newTransform = current.replace(regex, '').trim();
            } else {
                newTransform = current.replace(regex, `${prop}(${newVal})`);
            }
        } else {
            newTransform = `${current} ${prop}(-1)`.trim();
        }

        img.style.transform = newTransform || '';
        this._updateMarkdownSource(img);
        toast.show(`Flip ${direction}`, 'info');
    }

    /** Reset all modifications */
    _resetAll(img) {
        this._saveState(img);

        img.style.width = '';
        img.style.height = '';
        img.style.filter = '';
        img.style.borderRadius = '';
        img.style.boxShadow = '';
        img.style.opacity = '';
        img.style.transform = '';
        img.style.display = '';
        img.style.marginLeft = '';
        img.style.marginRight = '';
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.removeAttribute('align');

        this._updateMarkdownSource(img);
        this._createResizeOverlay(img);
        toast.show('Reset to original', 'success');
    }

    /** Copy image to clipboard */
    async _copyImage(img) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.show('Failed to copy image', 'error');
                    return;
                }
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    toast.show('Image copied to clipboard', 'success');
                } catch (_err) {
                    // Fallback: copy src URL
                    try {
                        await navigator.clipboard.writeText(img.src);
                        toast.show('Image URL copied', 'success');
                    } catch (_err2) {
                        toast.show('Copy failed', 'error');
                    }
                }
            }, 'image/png');
        } catch (_e) {
            toast.show('Copy failed: ' + _e.message, 'error');
        }
    }

    /** Download image */
    _downloadImage(img) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const link = document.createElement('a');
            link.download = `image_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.show('Download started', 'success');
        } catch (_e) {
            // Fallback for cross-origin images
            const link = document.createElement('a');
            link.download = `image_${Date.now()}`;
            link.href = img.src;
            link.target = '_blank';
            link.click();
            toast.show('Download started (fallback)', 'info');
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6o. RESIZE HANDLE EVENTS
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _onHandleMouseDown(e, handle) {
        e.preventDefault();
        e.stopPropagation();

        this.activeHandle = handle;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.activeImage.offsetWidth;
        this.startHeight = this.activeImage.offsetHeight;
        this.aspectRatio = this.startWidth / this.startHeight;

        // Save state before resize starts
        this._saveState(this.activeImage);

        // Show ghost outline of original size
        this._showGhostOutline();

        document.body.style.cursor = `${handle}-resize`;
        document.body.style.userSelect = 'none';
    }

    /** @private */
    _onHandleTouchStart(e, handle) {
        e.preventDefault();
        const touch = e.touches[0];

        this.activeHandle = handle;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startWidth = this.activeImage.offsetWidth;
        this.startHeight = this.activeImage.offsetHeight;
        this.aspectRatio = this.startWidth / this.startHeight;

        this._saveState(this.activeImage);
        this._showGhostOutline();
    }

    /* ─────────────────────────────────────────────────────────────────
       6p. RESIZE LOGIC
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _onMouseMove(e) {
        if (!this.activeHandle || !this.activeImage) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;
        const freeResize = e.shiftKey ? !this.lockAspect : this.lockAspect === false;

        this._resize(deltaX, deltaY, freeResize);
    }

    /** @private */
    _onTouchMove(e) {
        if (!this.activeHandle || !this.activeImage) return;

        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.startX;
        const deltaY = touch.clientY - this.startY;

        this._resize(deltaX, deltaY, false);
    }

    /** @private */
    _resize(deltaX, deltaY, freeResize) {
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        const handle = this.activeHandle;

        // Calculate new dimensions based on handle direction
        if (handle.includes('e')) newWidth = this.startWidth + deltaX;
        if (handle.includes('w')) newWidth = this.startWidth - deltaX;
        if (handle.includes('s')) newHeight = this.startHeight + deltaY;
        if (handle.includes('n')) newHeight = this.startHeight - deltaY;

        // Maintain aspect ratio for corner handles (default: locked)
        const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle);
        if (!freeResize && isCorner) {
            const widthDelta = Math.abs(newWidth - this.startWidth);
            const heightDelta = Math.abs(newHeight - this.startHeight);

            if (widthDelta > heightDelta) {
                newHeight = newWidth / this.aspectRatio;
            } else {
                newWidth = newHeight * this.aspectRatio;
            }
        }

        // Clamp to min/max
        newWidth = clamp(newWidth, CONFIG.minWidth, CONFIG.maxWidth);
        newHeight = clamp(newHeight, CONFIG.minHeight, CONFIG.maxHeight);

        // ── Snap-to-grid ──
        const container = this.activeImage.closest('.markdown-body');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const snapTargets = this.snapGuides.getSnapTargets(containerRect);
            const snapResult = this.snapGuides.snap(newWidth, snapTargets);

            if (snapResult.snapped) {
                newWidth = snapResult.value;
                if (!freeResize && isCorner) {
                    newHeight = newWidth / this.aspectRatio;
                }
                this.snapGuides.showGuide(newWidth, containerRect, snapResult.label);
            } else {
                this.snapGuides.clearGuides();
            }
        }

        // Apply to image
        this.activeImage.style.width = `${Math.round(newWidth)}px`;
        this.activeImage.style.height = `${Math.round(newHeight)}px`;

        // Update overlay
        this._updateOverlay(newWidth, newHeight);
    }

    /** @private */
    _updateOverlay(width, height) {
        if (!this.resizeOverlay || !this.activeImage) return;

        const rect = this.activeImage.getBoundingClientRect();

        this.resizeOverlay.style.top = `${rect.top}px`;
        this.resizeOverlay.style.left = `${rect.left}px`;
        this.resizeOverlay.style.width = `${width}px`;
        this.resizeOverlay.style.height = `${height}px`;

        this._updateSizeBadge(width, height);
    }

    /** @private */
    _updateSizeBadge(width, height) {
        if (!this.resizeOverlay || !this.activeImage) return;

        const badge = this.resizeOverlay.querySelector('.ir-size-badge');
        if (badge) {
            const zoomPct = this.activeImage.naturalWidth > 0
                ? Math.round((width / this.activeImage.naturalWidth) * 100)
                : 100;
            badge.innerHTML = `
        ${Math.round(width)} × ${Math.round(height)}
        <span class="ir-zoom-pct">${zoomPct}%</span>
      `;
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6q. RESIZE FINISH
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _onMouseUp(_e) {
        if (this.activeHandle) {
            this._finishResize();
        }
    }

    /** @private */
    _onTouchEnd(_e) {
        if (this.activeHandle) {
            this._finishResize();
        }
    }

    /** @private */
    _finishResize() {
        if (this.activeImage) {
            const width = Math.round(this.activeImage.offsetWidth);
            const height = Math.round(this.activeImage.offsetHeight);

            // Update markdown source
            this._updateMarkdownSource(this.activeImage);

            // Refresh overlay
            this._createResizeOverlay(this.activeImage);

            toast.show(`${width} × ${height}`, 'success');
        }

        this.activeHandle = null;
        this._removeGhostOutline();
        this.snapGuides.clearGuides();
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    /* ─────────────────────────────────────────────────────────────────
       6r. KEYBOARD HANDLING
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _onKeyDown(e) {
        // Escape to deselect
        if (e.key === 'Escape' && this.activeImage) {
            this._deselectImage();
            return;
        }

        // Don't intercept if dialog is open
        if (document.querySelector('.ir-dialog-backdrop')) return;

        // Don't intercept if user is typing in an input
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return;
        }

        // Ctrl+Z / Ctrl+Y for undo/redo
        if (this.activeImage && e.ctrlKey && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            this._undo();
            return;
        }
        if (this.activeImage && e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
            e.preventDefault();
            this._redo();
            return;
        }

        // Ctrl+0 to reset
        if (this.activeImage && e.ctrlKey && e.key === '0') {
            e.preventDefault();
            this._resetAll(this.activeImage);
            return;
        }

        // Arrow keys for pixel-level resize
        if (this.activeImage && KEYBOARD_SHORTCUTS[e.key]) {
            e.preventDefault();
            const shortcut = KEYBOARD_SHORTCUTS[e.key];
            const multiplier = e.shiftKey ? SHIFT_MULTIPLIER : 1;

            const dw = shortcut.dw * multiplier;
            const dh = shortcut.dh * multiplier;

            const curW = this.activeImage.offsetWidth;
            const curH = this.activeImage.offsetHeight;
            const ar = curW / curH;

            let newW = clamp(curW + dw, CONFIG.minWidth, CONFIG.maxWidth);
            let newH = clamp(curH + dh, CONFIG.minHeight, CONFIG.maxHeight);

            // Maintain aspect ratio if locked and only one dimension changed
            if (this.lockAspect) {
                if (dw !== 0 && dh === 0) {
                    newH = Math.round(newW / ar);
                } else if (dh !== 0 && dw === 0) {
                    newW = Math.round(newH * ar);
                }
            }

            this._saveState(this.activeImage);
            this.activeImage.style.width = `${newW}px`;
            this.activeImage.style.height = `${newH}px`;
            this._updateMarkdownSource(this.activeImage);
            this._repositionOverlay();
            return;
        }

        // Delete key to remove image size (reset)
        if (this.activeImage && e.key === 'Delete') {
            e.preventDefault();
            this._resetAll(this.activeImage);
            return;
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6s. SCROLL & RESIZE HANDLERS
       ───────────────────────────────────────────────────────────────── */

    /** @private */
    _onScrollOrResize() {
        if (this.activeImage && this.resizeOverlay && !this.activeHandle) {
            this._repositionOverlay();
        }
    }

    /* ─────────────────────────────────────────────────────────────────
       6t. MARKDOWN SOURCE UPDATE
       ───────────────────────────────────────────────────────────────── */

    /**
     * Collect the current persisted state from an image element
     * @param {HTMLImageElement} img - Image element
     * @returns {Object} Serializable image state
     * @private
     */
    _collectPersistedState(img) {
        const state = {};

        const width = parseInt(img.style.width || img.getAttribute('width') || '', 10);
        if (!Number.isNaN(width) && width > 0) {
            state.width = width;
        }

        const height = parseInt(img.style.height || img.getAttribute('height') || '', 10);
        if (!Number.isNaN(height) && height > 0) {
            state.height = height;
        }

        const align = img.getAttribute('align') || '';
        if (align) {
            state.align = align;
        }

        const filter = img.style.filter || '';
        if (filter) {
            state.filter = filter;
        }

        const borderRadius = img.style.borderRadius || '';
        if (borderRadius) {
            state.borderRadius = borderRadius;
        }

        const boxShadow = img.style.boxShadow || '';
        if (boxShadow) {
            state.boxShadow = boxShadow;
        }

        const opacity = parseFloat(img.style.opacity || '');
        if (!Number.isNaN(opacity) && opacity !== 1) {
            state.opacity = opacity;
        }

        const transform = img.style.transform || '';
        if (transform) {
            state.transform = transform;
        }

        return state;
    }

    /**
     * Encode image state for markdown storage
     * @param {Object} state - Serializable image state
     * @returns {string}
     * @private
     */
    _encodePersistedState(state) {
        return Object.keys(state || {}).length > 0
            ? encodeURIComponent(JSON.stringify(state))
            : '';
    }

    /**
     * Build the markdown attribute block for persisted image state
     * @param {Object} state - Serializable image state
     * @returns {string}
     * @private
     */
    _buildAttrString(state) {
        const encoded = this._encodePersistedState(state);
        return encoded ? `{data-ir=${encoded}}` : '';
    }

    /**
     * Update the markdown source with the current image state
     * @param {HTMLImageElement} img - Image element
     * @private
     */
    _updateMarkdownSource(img) {
        if (!this.editor) {
            console.warn('[ImageResize v2] Editor not available');
            return;
        }

        const domSrc = img.getAttribute('src') || '';
        const originalSrc = img.dataset.originalSrc || domSrc;
        const indexStr = img.dataset.irIndex;
        const state = this._collectPersistedState(img);
        const encodedState = this._encodePersistedState(state);
        const attrStr = this._buildAttrString(state);
        const content = this.editor.getValue();
        let newContent = content;
        let found = false;

        // Strategy 1: Data-Index Exact Match
        if (indexStr !== undefined) {
            const targetIndex = parseInt(indexStr, 10);
            const pattern = /!\[([^\]]*)\]\(([^)]+)\)\s*(?:\{[^}]*\})?/g;
            let currentIdx = 0;
            
            newContent = content.replace(pattern, (match, altText, src) => {
                if (currentIdx === targetIndex) {
                    found = true;
                    return `![${altText}](${src})${attrStr}`;
                }
                currentIdx++;
                return match;
            });
        }

        // Strategy 2: Fallback by originalUrl
        if (!found && originalSrc && !originalSrc.startsWith('data:')) {
            const escapedSrc = escapeRegex(originalSrc);
            try {
                const mdPattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedSrc}\\)\\s*(?:\\{[^}]*\\})?`, 'g');
                if (mdPattern.test(content)) {
                    found = true;
                    newContent = content.replace(
                        new RegExp(mdPattern.source, 'g'),
                        (match, altText) => {
                            return `![${altText}](${originalSrc})${attrStr}`;
                        }
                    );
                }
            } catch (e) {
                console.warn('[ImageResize v2] Regex error (MD):', e);
            }
        }

        // Strategy 3: HTML tag fallback
        if (!found && originalSrc && !originalSrc.startsWith('data:') && originalSrc.length < 500) {
            try {
                const escapedSrc = escapeRegex(originalSrc);
                const htmlPattern = new RegExp(`<img([^>]*)src=["']${escapedSrc}["']([^>]*)>`, 'gi');
                if (htmlPattern.test(content)) {
                    found = true;
                    newContent = content.replace(
                        new RegExp(htmlPattern.source, 'gi'),
                        (match) => {
                            let result = match;
                            result = this._updateHtmlAttribute(result, 'width', state.width || null);
                            result = this._updateHtmlAttribute(result, 'height', state.height || null);
                            result = this._updateHtmlAttribute(result, 'align', state.align || null);
                            result = this._updateHtmlAttribute(result, 'data-ir', encodedState || null);
                            return result;
                        }
                    );
                }
            } catch (e) {
                console.warn('[ImageResize v2] Regex error (HTML):', e);
            }
        }

        if (found && newContent !== content) {
            const position = this.editor.getPosition();
            const scrollTop = this.editor.getScrollTop();
            this.editor.setValue(newContent);
            if (position) {
                this.editor.setPosition(position);
                this.editor.setScrollTop(scrollTop);
            }
        }
    }

    _updateHtmlAttribute(html, attr, value) {
        if (value === null) {
            return html.replace(new RegExp(`\\s*${attr}=["'][^"']*["']`, 'gi'), '');
        }
        if (value) {
            const pattern = new RegExp(`${attr}=["'][^"']*["']`, 'gi');
            if (pattern.test(html)) {
                return html.replace(pattern, `${attr}="${value}"`);
            } else {
                return html.replace(/<img/i, `<img ${attr}="${value}"`);
            }
        }
        return html;
    }

    /* ─────────────────────────────────────────────────────────────────
       6u. CLEANUP
       ───────────────────────────────────────────────────────────────── */

    /**
     * Destroy and clean up the feature completely
     */
    destroy() {
        this._deselectImage();
        this._closeContextMenu();
        this._closeAllDropdowns();
        this.snapGuides.clearGuides();

        // Clear pending hover tooltip timer
        if (this._hoverTimer) {
            clearTimeout(this._hoverTimer);
            this._hoverTimer = null;
        }
        const tip = document.getElementById('ir-hover-tip');
        if (tip) tip.remove();

        // Remove event listeners
        document.removeEventListener('mousemove', this._boundOnMouseMove);
        document.removeEventListener('mouseup', this._boundOnMouseUp);
        document.removeEventListener('touchmove', this._boundOnTouchMove);
        document.removeEventListener('touchend', this._boundOnTouchEnd);
        document.removeEventListener('keydown', this._boundOnKeyDown);
        window.removeEventListener('scroll', this._boundOnScroll, true);
        window.removeEventListener('resize', this._boundOnResize);

        const outputEl = document.getElementById('output');
        if (outputEl) {
            outputEl.removeEventListener('scroll', this._boundOnScroll);
        }

        // Disconnect mutation observer
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }

        // Remove injected styles
        document.getElementById('image-resize-styles-v2')?.remove();
        document.getElementById('image-resize-styles-v3')?.remove();

        // Remove toast container
        const toastContainer = document.getElementById('image-resize-toast-container');
        if (toastContainer) toastContainer.remove();

        // Clear history
        this.history.clear();

        this.initialized = false;
        console.log('[ImageResize v2] ✓ Feature destroyed and cleaned up');
    }
}
