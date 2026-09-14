/**
 * Command palette (restored) — fuzzy file switcher plus command runner.
 * Core matching is DOM-free so tests import it without jsdom. The overlay
 * manager binds to `Ctrl/Cmd+P` (free: link owns Ctrl+K, snippets own
 * Ctrl+Shift+P) and reuses toolbar catalog entries plus injected commands.
 * @module features/command-palette
 */

import { escapeHtml } from '../../utils/escape-html.js';
import { EXTRA_SLASH_COMMANDS } from '../toolbar/catalog.js';

/**
 * Subsequence fuzzy match: returns a score (higher is better) or -1.
 * @param {string} text
 * @param {string} query
 * @returns {number}
 */
export function fuzzyScore(text, query) {
    const t = String(text || '').toLowerCase();
    const q = String(query || '').toLowerCase().trim();
    if (!q) return 0;
    let score = 0;
    let ti = 0;
    let consecutive = 0;
    for (let qi = 0; qi < q.length; qi++) {
        const found = t.indexOf(q[qi], ti);
        if (found === -1) return -1;
        if (found === ti) {
            consecutive++;
            score += 2 + consecutive;
        } else {
            consecutive = 0;
            // Word-boundary bonus keeps "fs" matching "Focus Mode" well.
            if (found === 0 || /[\s\-_/]/.test(t[found - 1])) score += 2;
            else score += 1;
        }
        // Prefix bonus.
        if (qi === 0 && found === 0) score += 3;
        ti = found + 1;
    }
    return score;
}

/**
 * Filter palette items by query, best match first.
 * @param {Array<{ id: string, label: string, keywords?: string[], kind: 'file'|'command' }>} items
 * @param {string} query
 * @param {{ limit?: number }} [options]
 */
export function filterPalette(items, query, options = {}) {
    const limit = options.limit ?? 12;
    const q = String(query || '').trim();
    if (!q) return items.slice(0, limit);
    return items
        .map((item) => {
            const hay = [item.label, item.id, ...(item.keywords || [])].join(' ');
            return { item, score: fuzzyScore(hay, q) };
        })
        .filter(r => r.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.item);
}

/**
 * Build palette items from slash-catalog commands plus vault files.
 * @param {Array<{ id: number|string, title: string }>} files
 * @param {Array<{ id: string, label: string, keywords?: string[], run: () => void }>} extraCommands
 */
export function buildPaletteItems(files = [], extraCommands = []) {
    const commands = [
        ...EXTRA_SLASH_COMMANDS.map(c => ({
            id: `cmd:${c.id}`, label: c.label, keywords: c.keywords, kind: 'command', run: null, insert: c.insert
        })),
        ...extraCommands.map(c => ({ ...c, kind: 'command' }))
    ];
    const fileItems = files.map(f => ({
        id: `file:${f.id}`, label: f.title || 'Untitled', keywords: ['file', 'open', 'switch'],
        kind: 'file', noteId: f.id, run: null
    }));
    return [...fileItems, ...commands];
}

class PaletteManager {
    static instance = null;

    constructor() {
        if (PaletteManager.instance) return PaletteManager.instance;
        this.overlay = null;
        this.input = null;
        this.list = null;
        this.items = [];
        this.filtered = [];
        this.selected = 0;
        this.commands = [];
        this.getFiles = null;
        this.onExecute = null;
        this._boundKeyDown = null;
        this.initialized = false;
        PaletteManager.instance = this;
    }

    initialize(options = {}) {
        if (this.initialized) return;
        this.commands = options.commands || [];
        this.getFiles = options.getFiles || null;
        this.onExecute = options.onExecute || null;
        this._boundKeyDown = (e) => {
            const mod = e.ctrlKey || e.metaKey;
            if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.toggle();
                return;
            }
            if (!this.isOpen()) return;
            if (e.key === 'Escape') this.hide();
            else if (e.key === 'ArrowDown') { e.preventDefault(); this._move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); this._move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); this._runSelected(); }
        };
        document.addEventListener('keydown', this._boundKeyDown);
        this.initialized = true;
    }

    isOpen() {
        return !!this.overlay && !this.overlay.hidden;
    }

    async toggle() {
        if (this.isOpen()) this.hide();
        else await this.show();
    }

    async show() {
        this._ensureOverlay();
        const files = this.getFiles ? await this.getFiles() : [];
        this.items = buildPaletteItems(files, this.commands);
        this._render('');
        this.overlay.hidden = false;
        this.input.value = '';
        this.input.focus();
    }

    hide() {
        if (this.overlay) this.overlay.hidden = true;
    }

    _ensureOverlay() {
        if (this.overlay) return;
        const overlay = document.createElement('div');
        overlay.className = 'cmd-palette-overlay';
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="cmd-palette" role="dialog" aria-modal="true" aria-label="Command palette">
                <input type="text" class="cmd-palette-input" placeholder="Type a command or file…" aria-label="Command palette input" autocomplete="off" />
                <div class="cmd-palette-list" role="listbox"></div>
            </div>`;
        document.body.appendChild(overlay);
        this.overlay = overlay;
        this.input = overlay.querySelector('.cmd-palette-input');
        this.list = overlay.querySelector('.cmd-palette-list');
        this.input.addEventListener('input', () => this._render(this.input.value));
        this.list.addEventListener('click', (e) => {
            const el = e.target.closest('[data-idx]');
            if (!el) return;
            this.selected = Number(el.dataset.idx);
            this._runSelected();
        });
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) this.hide();
        });
    }

    _render(query) {
        this.filtered = filterPalette(this.items, query);
        this.selected = 0;
        this.list.innerHTML = this.filtered.map((item, idx) => `
            <div class="cmd-palette-item${idx === this.selected ? ' selected' : ''}" role="option"
                aria-selected="${idx === this.selected}" data-idx="${idx}">
                <span class="cmd-palette-kind">${item.kind}</span>
                <span class="cmd-palette-label">${escapeHtml(item.label)}</span>
            </div>`).join('') || '<div class="cmd-palette-empty">No matches</div>';
    }

    _move(delta) {
        if (!this.filtered.length) return;
        this.selected = (this.selected + delta + this.filtered.length) % this.filtered.length;
        this.list.querySelectorAll('.cmd-palette-item').forEach((el, idx) => {
            el.classList.toggle('selected', idx === this.selected);
            el.setAttribute('aria-selected', String(idx === this.selected));
        });
        this.list.querySelector('.cmd-palette-item.selected')?.scrollIntoView({ block: 'nearest' });
    }

    _runSelected() {
        const item = this.filtered[this.selected];
        if (!item) return;
        this.hide();
        if (typeof item.run === 'function') item.run();
        else if (this.onExecute) this.onExecute(item);
    }

    dispose() {
        if (this._boundKeyDown) {
            document.removeEventListener('keydown', this._boundKeyDown);
            this._boundKeyDown = null;
        }
        this.overlay?.remove();
        this.overlay = null;
        this.initialized = false;
        PaletteManager.instance = null;
    }
}

export const paletteManager = new PaletteManager();
export { PaletteManager };
export default paletteManager;
