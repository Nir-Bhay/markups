/**
 * Image resize UI helpers (toasts, snap guides)
 * @module features/image-resize/ui
 */

import { CONFIG } from './constants.js';

export class ToastManager {
    constructor() {
        this._container = null;
    }

    _ensureContainer() {
        if (this._container && document.body.contains(this._container)) return;
        this._container = document.createElement('div');
        this._container.id = 'image-resize-toast-container';
        this._container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    `;
        document.body.appendChild(this._container);
    }

    show(message, type = 'info') {
        this._ensureContainer();

        const colors = {
            info: { bg: '#6366f1', icon: 'ℹ' },
            success: { bg: '#22c55e', icon: '✓' },
            warning: { bg: '#eab308', icon: '⚠' },
            error: { bg: '#ef4444', icon: '✕' },
        };

        const c = colors[type] || colors.info;

        const toast = document.createElement('div');
        toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: ${c.bg};
      color: #fff;
      border-radius: 8px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      pointer-events: auto;
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      max-width: 340px;
    `;
        toast.innerHTML = `<span style="font-size:16px;line-height:1">${c.icon}</span><span>${message}</span>`;
        toast.addEventListener('click', () => this._dismiss(toast));

        this._container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0) scale(1)';
        });

        // Auto dismiss
        setTimeout(() => this._dismiss(toast), CONFIG.toastDuration);
    }

    _dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(16px) scale(0.95)';
        setTimeout(() => toast.remove(), 300);
    }
}

export const toast = new ToastManager();

/* ═══════════════════════════════════════════════════════════════════
   SECTION 5 ── SNAP GUIDELINES ENGINE
   ═══════════════════════════════════════════════════════════════════ */

export class SnapGuides {
    constructor() {
        this._guides = [];
    }

    getSnapTargets(containerRect) {
        const cw = containerRect.width;
        return [
            { value: Math.round(cw * 0.25), label: '25%' },
            { value: Math.round(cw * 0.33), label: '33%' },
            { value: Math.round(cw * 0.50), label: '50%' },
            { value: Math.round(cw * 0.66), label: '66%' },
            { value: Math.round(cw * 0.75), label: '75%' },
            { value: Math.round(cw), label: '100%' },
        ];
    }

    snap(value, targets, threshold = CONFIG.snapThreshold) {
        for (const t of targets) {
            if (Math.abs(value - t.value) <= threshold) {
                return { snapped: true, value: t.value, label: t.label };
            }
        }
        return { snapped: false, value, label: null };
    }

    showGuide(x, containerRect, label) {
        this.clearGuides();
        const guide = document.createElement('div');
        guide.className = 'ir-snap-guide';
        guide.style.cssText = `
      position: fixed;
      top: ${containerRect.top}px;
      left: ${containerRect.left + x}px;
      width: 1px;
      height: ${containerRect.height}px;
      background: #6366f1;
      opacity: 0.6;
      z-index: 10005;
      pointer-events: none;
      transition: opacity 0.15s;
    `;

        if (label) {
            const tag = document.createElement('span');
            tag.style.cssText = `
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        background: #6366f1;
        color: #fff;
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 10px;
        font-family: monospace;
        white-space: nowrap;
      `;
            tag.textContent = label;
            guide.appendChild(tag);
        }

        document.body.appendChild(guide);
        this._guides.push(guide);
    }

    clearGuides() {
        this._guides.forEach(g => g.remove());
        this._guides = [];
    }
}
